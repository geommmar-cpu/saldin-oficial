
// Audio Processing Service (Transcription)
// Updated with MANUAL DECRYPTION (Using Web Crypto API)
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

// --- CRYPTO HELPERS ---

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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    return base64ToUint8Array(base64).buffer;
}

async function deriveKeys(mediaKey: Uint8Array, type: 'audio' | 'image' | 'video' | 'document') {
    // HKDF-SHA256
    // Info string depends on type
    let infoStr = "WhatsApp Audio Keys";
    if (type === 'image') infoStr = "WhatsApp Image Keys";
    else if (type === 'video') infoStr = "WhatsApp Video Keys";
    else if (type === 'document') infoStr = "WhatsApp Document Keys";

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        mediaKey,
        "HKDF",
        false,
        ["deriveBits"]
    );

    const salt = new Uint8Array(32); // 32 null bytes usually
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

async function decryptMedia(encBuffer: Uint8Array, mediaKey: string, type: 'audio' | 'image') {
    try {
        const mk = base64ToUint8Array(mediaKey);
        const { iv, cipherKey } = await deriveKeys(mk, type);

        // Remove MAC (last 10 bytes)
        // Usually file is encData + mac.
        // But simply decrypting the body (minus 10) usually works.
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
        console.error("Decryption error:", e);
        throw new Error("Falha na descriptografia local.");
    }
}

// --- MAIN DOWNLOADER ---

async function downloadAudioFromEvolution(
    instanceName: string,
    messageInput: any, // Payload
    rawEvolutionUrl: string,
    evolutionKey: string
): Promise<ArrayBuffer> {
    const errors: string[] = [];
    const evolutionUrl = rawEvolutionUrl.replace(/\/$/, '');

    // Parse Input
    let fullPayload: any = {};
    if (messageInput && typeof messageInput === 'object') {
        if ('key' in messageInput && 'message' in messageInput) fullPayload = messageInput;
        else fullPayload = { key: { id: "unknown" }, message: messageInput };
        // Handles case where input IS the message object
    } else {
        // ID string only - cannot manually decrypt without keys!
        fullPayload = { key: { id: String(messageInput) } };
    }

    console.log(`📥 Downloader initialized.`);

    // --- STRATEGY 0: MANUAL LOCAL DECRYPTION (Native Crypto) ---
    // Requires: message.audioMessage.url AND message.audioMessage.mediaKey
    try {
        console.log("🛠️ Strategy 0: Manual Decryption...");
        // Locate audioMessage
        const msgContent = fullPayload.message || fullPayload;
        const audioMsg = msgContent.audioMessage || msgContent.documentMessage; // sometimes audio is document

        if (audioMsg && audioMsg.url && audioMsg.mediaKey) {
            console.log("🔑 Keys found. Downloading encrypted file...", audioMsg.url);

            // 1. Download .enc file
            // Note: Evolution headers might be needed if URL is internal? 
            // Usually WA URLs are public (mmg.whatsapp.net) but need User-Agent sometimes.
            // Evolution implies direct URL is usable.
            const encResp = await fetch(audioMsg.url, {
                // headers: { 'User-Agent': 'WhatsApp/2.2100.0' } // Fake UA just in case
            });

            if (encResp.ok) {
                const encData = await encResp.arrayBuffer();
                console.log(`🔒 Encrypted size: ${encData.byteLength} bytes. Decrypting...`);

                const decBuffer = await decryptMedia(
                    new Uint8Array(encData),
                    audioMsg.mediaKey,
                    'audio'
                );

                console.log("🔓 Decryption Successful!");
                return decBuffer;
            } else {
                errors.push(`Strat0(Download ${encResp.status})`);
            }
        } else {
            console.log("⚠️ No url/mediaKey in payload for Strat 0");
            // errors.push("Strat0(No Keys)"); 
            // Don't error, just verify log
        }
    } catch (e) {
        console.error("Strat0 Fail:", e);
        errors.push(`Strat0(${e})`);
    }

    // --- FALLBACK STRATEGY 1: /chat/base64FromMessage ---
    try {
        const endpoint = `${evolutionUrl}/chat/base64FromMessage/${instanceName}`;
        console.log(`Trying Strat 1: ${endpoint}`);
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: fullPayload, convertToMp4: false })
        });

        const contentType = resp.headers.get("content-type");

        if (resp.ok && contentType && contentType.includes("application/json")) {
            const data = await resp.json();
            if (data?.base64) return base64ToArrayBuffer(data.base64);
            else errors.push(`Strat1(No base64 field in JSON)`);
        } else {
            const text = await resp.text();
            console.error(`Strat1 Unexpected Response (${resp.status}): ${text.slice(0, 500)}`);
            errors.push(`Strat1(Status ${resp.status}, Body: ${text.slice(0, 50)}...)`);
        }
    } catch (e) { errors.push(`Strat1 Err: ${e}`); }

    throw new Error(`Manual Decryption & API failed. Errs: ${errors.join(' | ')}`);
}

// --- TRANSCRIPTION ---

export async function transcribeAudio(
    input: any,
    options?: { mimeType?: string; instanceName?: string; evolutionUrl?: string; evolutionKey?: string; }
): Promise<string> {
    let audioBuffer: ArrayBuffer | undefined;

    try {
        let mimeType = options?.mimeType || "audio/ogg";
        if (!options?.instanceName || !options?.evolutionUrl) throw new Error("Missing Config");

        if (input instanceof ArrayBuffer) audioBuffer = input;
        else if (typeof input === 'string') {
            if (input.startsWith('data:')) audioBuffer = base64ToArrayBuffer(input);
            else {
                // Try downloading even if just ID (will likely fail Strat 0, fall to Strat 1)
                audioBuffer = await downloadAudioFromEvolution(options.instanceName, input, options.evolutionUrl, options.evolutionKey!);
            }
        }
        else if (typeof input === 'object') {
            // Pass full object for manual decryption
            audioBuffer = await downloadAudioFromEvolution(options.instanceName, input, options.evolutionUrl, options.evolutionKey!);
        }

        if (!audioBuffer || audioBuffer.byteLength === 0) throw new Error("Empty Buffer");

        console.log(`🎤 Final Audio size: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB`);

        const file = new File([audioBuffer], "audio.ogg", { type: mimeType.split(';')[0] });
        const response = await openai.audio.transcriptions.create({
            file,
            model: "whisper-1",
            language: "pt",
            response_format: "text",
        });

        return typeof response === 'string' ? response : response.text;

    } catch (error) {
        console.error("Transcription Failed:", error);
        throw new Error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
}
