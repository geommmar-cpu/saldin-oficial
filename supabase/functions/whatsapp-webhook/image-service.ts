
// Image Processing Service (OCR & Vision) - Using OpenAI GPT-4o
// Handles download, manual decryption, and Vision Analysis
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

type MessageKey = {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
};

// --- CRYPTO HELPERS (Duplicated from audio-service for safety) ---

function base64ToUint8Array(base64: string): Uint8Array {
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const normalized = cleanBase64.replace(/[\r\n\s]/g, '');
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function deriveKeys(mediaKey: Uint8Array) {
    // HKDF-SHA256 for IMAGES
    const infoStr = "WhatsApp Image Keys";

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        mediaKey,
        "HKDF",
        false,
        ["deriveBits"]
    );

    const salt = new Uint8Array(32); // 32 null bytes
    const encoder = new TextEncoder();
    const info = encoder.encode(infoStr);

    // Derive 112 bytes
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: salt,
            info: info,
        },
        keyMaterial,
        112 * 8 // bits
    );

    const derived = new Uint8Array(derivedBits);

    // Split
    const iv = derived.slice(0, 16);
    const cipherKey = derived.slice(16, 48);
    const macKey = derived.slice(48, 80);

    return { iv, cipherKey, macKey };
}

async function decryptMedia(encBuffer: Uint8Array, mediaKey: string) {
    try {
        const mk = base64ToUint8Array(mediaKey);
        const { iv, cipherKey } = await deriveKeys(mk);

        // Remove MAC (last 10 bytes)
        const ciphertext = encBuffer.slice(0, -10);

        const key = await crypto.subtle.importKey(
            "raw",
            cipherKey,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: iv,
            },
            key,
            ciphertext
        );

        return decrypted;
    } catch (e) {
        console.error("Image Decryption error:", e);
        throw new Error("Falha na descriptografia da imagem.");
    }
}

// --- DOWNLOADER ---

async function downloadImageFromEvolution(messageInput: any): Promise<ArrayBuffer> {
    const errors: string[] = [];

    let fullPayload: any = {};
    if (messageInput && typeof messageInput === 'object') {
        if ('key' in messageInput && 'message' in messageInput) fullPayload = messageInput;
        else fullPayload = { message: messageInput, key: { id: "unknown" } };
    } else {
        throw new Error("Payload da imagem inválido (precisa ser objeto).");
    }

    console.log(`📥 Image Downloader initialized.`);

    // --- STRATEGY 0: MANUAL LOCAL DECRYPTION (Native Crypto) ---
    try {
        console.log("🛠️ Strategy 0: Manual Image Decryption...");
        const msgContent = fullPayload.message || fullPayload;

        // FIX: Check if msgContent itself has the keys (unwrapped)
        let imgMsg = msgContent.imageMessage || msgContent.documentMessage;
        if (!imgMsg && (msgContent.url || msgContent.directPath)) {
            imgMsg = msgContent;
        }

        if (imgMsg && imgMsg.url && imgMsg.mediaKey) {
            console.log("🔑 Image Keys found. Downloading encrypted file...", imgMsg.url);

            const encResp = await fetch(imgMsg.url);

            if (encResp.ok) {
                const encData = await encResp.arrayBuffer();
                console.log(`🔒 Encrypted size: ${encData.byteLength} bytes. Decrypting...`);

                const decBuffer = await decryptMedia(
                    new Uint8Array(encData),
                    imgMsg.mediaKey
                );

                console.log("🔓 Image Decryption Successful!");
                return decBuffer;
            } else {
                errors.push(`Download(${encResp.status})`);
            }
        } else {
            console.log("⚠️ No url/mediaKey in payload for Image");
            errors.push("No Keys found");
        }
    } catch (e) {
        console.error("Strat0 Image Fail:", e);
        errors.push(`Strat0(${e})`);
    }

    throw new Error(`Manual Image Decryption failed. Errs: ${errors.join(' | ')}`);
}

// --- VISION ANALYSIS ---

export interface FinancialIntent {
    tipo: "receita" | "gasto" | "duvida";
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    status: "ok" | "incompleto";
    conta_sugerida?: string;
}

export async function processImage(input: any): Promise<FinancialIntent> {
    let imageBuffer: ArrayBuffer | undefined;

    try {
        // 1. Download/Decrypt
        if (input instanceof ArrayBuffer) imageBuffer = input;
        else if (typeof input === 'object') {
            imageBuffer = await downloadImageFromEvolution(input);
        } else {
            throw new Error("Input de imagem inválido");
        }

        if (!imageBuffer || imageBuffer.byteLength === 0) throw new Error("Image buffer empty");

        // 2. Convert to Base64 for OpenAI
        const base64Image = btoa(
            new Uint8Array(imageBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("🤖 Analyzing Image with GPT-4o Vision...");

        const SYSTEM_PROMPT = `Você é o assistente financeiro visual do Saldin.
Analise a IMAGEM (comprovante, nota fiscal, recibo ou foto de produto) e extraia dados financeiros.

REGRAS:
1. Identifique o VALOR TOTAL pago.
2. Identifique o NOME do estabelecimento/pessoa (para Descrição).
3. Identifique a CATEGORIA (Alimentação, Transporte, Moradia, etc).
4. Se for comprovante de transferência, identifique o destinatário.

RETORNO (JSON):
{
  "tipo": "gasto" (ou "receita" se for comprovante de recebimento), 
  "valor": number, 
  "descricao": string (ex: "Almoço MC Donalds", "Uber"),
  "categoria_sugerida": string,
  "status": "ok" | "incompleto"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Mini supports vision and is cheaper
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise este comprovante financeiro:" },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ],
            max_tokens: 300,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Sem resposta do GPT Vision");

        console.log("✅ Vision Result:", content);
        const parsed = JSON.parse(content);
        return parsed as FinancialIntent;

    } catch (error) {
        console.error("❌ Image Processing Failed:", error);
        throw new Error(`Erro na análise de imagem: ${error instanceof Error ? error.message : String(error)}`);
    }
}
