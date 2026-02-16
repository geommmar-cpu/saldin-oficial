
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "./ai-service.ts";
import { processImage } from "./image-service.ts";
import { transcribeAudio } from "./audio-service.ts";
import { processTransaction, getBalance, getLastTransactions, getPreferredAccount } from "./financial-service.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sendWhatsApp(phone: string, text: string, instanceName?: string): Promise<void> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.error("❌ Evolution API URL or Key not set.");
        return;
    }
    try {
        const instance = instanceName || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "Saldin";
        const url = `${EVOLUTION_API_URL}/message/sendText/${instance}`;

        console.log(`📤 Sending WhatsApp to ${phone} via ${url}...`);

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": EVOLUTION_API_KEY
            },
            body: JSON.stringify({
                number: phone,
                text: text
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`❌ Evolution API Error (${resp.status}): ${errText}`);
        } else {
            const data = await resp.json();
            console.log(`✅ WhatsApp sent:`, data);
        }
    } catch (e) {
        console.error("❌ Failed to send WhatsApp (Network/Code Error):", e);
    }
}

async function getCategoryId(userId: string, categoryName: string, type: "income" | "expense"): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", categoryName)
        .eq("type", type)
        .single();

    if (data) return data.id;

    // Fallback: Busca categoria 'Outros'
    const { data: fallback } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", "%outros%")
        .eq("type", type)
        .limit(1)
        .single();

    return fallback?.id || null;
}

function getMessageHash(data: any): string {
    const msg = data?.message;
    if (!msg) return "";

    // Text content
    const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption;
    if (text) return String(text).trim();

    // Media unique ID (Base64 or Hex string usually)
    if (msg.audioMessage?.fileSha256) return String(msg.audioMessage.fileSha256);
    if (msg.imageMessage?.fileSha256) return String(msg.imageMessage.fileSha256);

    return "";
}

serve(async (req) => {
    const startTime = Date.now();
    let logId: string | null = null;
    let userId: string = "";
    let instanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME") || "Saldin";

    try {
        // 0. Initial Checks
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        const payload = await req.json();
        // console.log("📥 Raw Payload:", JSON.stringify(payload)); // Reduced noise

        const data = payload?.data;

        if (!data || !data.key || data.key.fromMe || data.key.remoteJid === "status@broadcast") {
            return new Response("Ignored", { status: 200 });
        }

        const remoteJid = data.key.remoteJid;
        const messageId = data.key.id;
        const messageType = data.messageType;

        // Check if it's a LID message (which ends in @lid) or Phone message (@s.whatsapp.net)
        const isLid = remoteJid.includes("@lid");
        const phoneOrLid = remoteJid.split("@")[0];

        // 1. Log Request & Deduplicate
        console.log("🚀 [WEBHOOK] Processing ID:", messageId, "From:", phoneOrLid, isLid ? "(LID)" : "(Phone)");

        // We rely on message_id (Hardware Idempotency) to catch webhook retries.
        // We removed 'dedupKey' (Content+Minute) because it blocked valid repeated commands (e.g. "Saldo" twice).

        const { data: logData, error: logError } = await supabaseAdmin
            .from("whatsapp_logs")
            .insert({
                phone_number: phoneOrLid,
                message_content: JSON.stringify(data),
                message_type: messageType,
                processed: false,
                message_id: messageId,
                dedup_key: null // Allow logs to just rely on message_id uniqueness
            })
            .select()
            .single();

        if (logError && logError.code === "23505") {
            console.log("🔁 Duplicate message blocked by DB:", messageId);
            return new Response("Duplicate", { status: 200 });
        }
        if (logData) logId = logData.id;

        // 2. Lookup & Verify User
        let userId = "";
        let phoneToSend = phoneOrLid; // Default to sender ID

        if (isLid) {
            // Try to find user by LID
            const { data: userByLid } = await supabaseAdmin
                .from("whatsapp_users")
                .select("user_id, phone_number, is_verified")
                .eq("lid", phoneOrLid)
                .maybeSingle();

            if (userByLid && userByLid.is_verified) {
                userId = userByLid.user_id;
                phoneToSend = userByLid.phone_number; // Send reply to real phone, not LID
                console.log(`✅ User identified by LID: ${phoneOrLid} -> ${phoneToSend}`);
            } else {
                console.warn(`❌ Unknown LID: ${phoneOrLid}`);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unknown LID" }).eq("id", logId);
                // Can't send message easily to unknown LID without phone mapping
                return new Response("Unauthorized LID", { status: 200 });
            }

        } else {
            // Standard Phone Lookup (Handle 9th digit variations)
            let phoneVariations = [phoneOrLid];
            if (phoneOrLid.startsWith("55") && phoneOrLid.length === 13 && phoneOrLid[4] === "9") {
                phoneVariations.push("55" + phoneOrLid.substring(2, 4) + phoneOrLid.substring(5));
            } else if (phoneOrLid.startsWith("55") && phoneOrLid.length === 12) {
                phoneVariations.push("55" + phoneOrLid.substring(2, 4) + "9" + phoneOrLid.substring(4));
            }

            const { data: userLink, error: userError } = await supabaseAdmin
                .from("whatsapp_users")
                .select("user_id, is_verified, lid")
                .in("phone_number", phoneVariations)
                .order("is_verified", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (userError || !userLink || !userLink.is_verified) {
                console.warn("❌ Unverified user:", phoneOrLid);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unverified" }).eq("id", logId);
                await sendWhatsApp(phoneOrLid, "❌ Acesso não autorizado. Por favor, vincule seu WhatsApp no app Saldin primeiro.", instanceName);
                return new Response("Unauthorized", { status: 200 });
            }

            userId = userLink.user_id;
            phoneToSend = phoneOrLid;

            // Update LID if present in payload and missing in DB
            const payloadLid = data.key.previousRemoteJid ? data.key.previousRemoteJid.split("@")[0] : null;
            if (payloadLid && (!userLink.lid || userLink.lid !== payloadLid)) {
                console.log(`ℹ️ Updating LID for user ${phoneOrLid}: ${payloadLid}`);
                await supabaseAdmin.from("whatsapp_users").update({ lid: payloadLid }).eq("user_id", userId);
            }
        }

        // 3. Process Content
        let textToAnalyze = "";

        let intent: any = null;

        if (messageType === "conversation" || messageType === "extendedTextMessage") {
            textToAnalyze = data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
            console.log("💬 Text:", textToAnalyze);
        }
        else if (messageType === "audioMessage") {
            console.log("🎤 Audio message received");
            try {
                const audioInput = data;
                const mimeType = data?.message?.audioMessage?.mimetype || "audio/ogg";

                textToAnalyze = await transcribeAudio(audioInput, {
                    mimeType,
                    instanceName,
                    evolutionUrl: EVOLUTION_API_URL,
                    evolutionKey: EVOLUTION_API_KEY,
                });
                console.log("✅ Audio transcribed:", textToAnalyze);
            } catch (err) {
                console.error("Audio error:", err);
                await sendWhatsApp(phoneToSend, "❌ Erro ao processar áudio.", instanceName);
                return new Response("Audio Error", { status: 200 });
            }
        }
        else if (messageType === "imageMessage") {
            console.log("🖼️ Image Processing (Vision)...");
            try {
                intent = await processImage(data?.message?.imageMessage);
                console.log("📊 Vision Result:", intent);
            } catch (err) {
                console.error("Image error:", err);
                await sendWhatsApp(phoneToSend, "❌ Erro ao analisar imagem.", instanceName);
                return new Response("Image Error", { status: 200 });
            }
        }

        // 3.1 COMMANDS HANDLING (Fast Path)
        const normalizedCmd = textToAnalyze?.toLowerCase().trim();

        if (!intent && normalizedCmd) {
            // SALDO
            if (normalizedCmd.match(/^\/?saldo$/)) {
                try {
                    const balance = await getBalance(userId);
                    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
                    await sendWhatsApp(phoneToSend, `💰 Seu saldo atual é: *${formatted}*`, instanceName);
                } catch (e) {
                    console.error("Cmd Saldo Error:", e);
                    await sendWhatsApp(phoneToSend, "❌ Erro ao consultar saldo.", instanceName);
                }
                return new Response("Command Executed", { status: 200 });
            }
            // EXTRATO
            if (normalizedCmd.match(/^\/?extrato$/)) {
                await sendExtrato(userId, phoneToSend, instanceName);
                return new Response("Command Executed", { status: 200 });
            }
        }

        if (!textToAnalyze && !intent) {
            return new Response("No content", { status: 200 });
        }

        // 4. AI Analysis (Text/Audio only)
        if (!intent && textToAnalyze) {
            console.log("🤖 Analyzing Text with AI:", textToAnalyze);
            intent = await analyzeText(textToAnalyze);
            console.log("📊 AI Result:", intent);
        }

        // Log Result
        if (logId && intent) {
            await supabaseAdmin.from("whatsapp_logs").update({
                processing_result: intent,
                processed: intent.status === "ok"
            }).eq("id", logId);
        }

        if (!intent) return new Response("No Intent", { status: 200 });

        // 5. Execute Intents
        if (intent.tipo === 'consulta_saldo') {
            try {
                const balance = await getBalance(userId);
                const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
                await sendWhatsApp(phoneToSend, `💰 Seu saldo atual é: *${formatted}*`, instanceName);
            } catch (e) { console.error(e); await sendWhatsApp(phoneToSend, "❌ Erro ao consultar saldo.", instanceName); }
            return new Response("OK", { status: 200 });
        }

        if (intent.tipo === 'consulta_extrato') {
            await sendExtrato(userId, phoneToSend, instanceName);
            return new Response("OK", { status: 200 });
        }

        if (intent.status === "incompleto") {
            await sendWhatsApp(phoneToSend, "🤔 Não entendi direito. Poderia detalhar o valor e o que foi?\n\nExemplo: _Gastei 50 reais no almoço_", instanceName);
            return new Response("Incomplete intent", { status: 200 });
        }

        // 6. Map Category
        const categoryId = await getCategoryId(userId, intent.categoria_sugerida, intent.tipo === "receita" ? "income" : "expense");

        // 7. Resolve Payment Method & Account
        const targetAccountId = await getPreferredAccount(userId, intent.metodo_pagamento);
        console.log(`💳 Method: ${intent.metodo_pagamento} -> Account ID: ${targetAccountId}`);

        // 8. Execute Transaction
        console.log("💾 Processing transaction...");
        const result = await processTransaction({
            userId,
            type: intent.tipo === "receita" ? "income" : "expense",
            amount: intent.valor,
            description: intent.descricao,
            categoryId: categoryId || undefined,
            bankAccountId: targetAccountId || undefined,
        });

        // 9. Success Response
        const balance = result.new_balance;
        const isCard = result.is_credit_card;
        const destName = result.dest_name || "Conta";
        const emoji = intent.tipo === "receita" ? "💰" : (isCard ? "💳" : "💸");
        const tipoLabel = intent.tipo === "receita" ? "Receita" : (isCard ? "Gasto no Cartão" : "Gasto");
        const msg = `✅ *${tipoLabel} registrado!*\n\n${emoji} *Valor:* R$ ${intent.valor.toFixed(2)}\n📝 *Descrição:* ${intent.descricao}\n🏷️ *Categoria:* ${intent.categoria_sugerida}\n🏦 *Destino:* ${destName}\n\n📊 *Saldo Geral (Cofre):* R$ ${balance.toFixed(2)}`;

        await sendWhatsApp(phoneToSend, msg, instanceName);

        const duration = Date.now() - startTime;
        return new Response(JSON.stringify({ success: true, duration }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (e) {
        const duration = Date.now() - startTime;
        console.error(`❌ [WEBHOOK] Error:`, e); // Check this log in dashboard if duplication persists

        // Suppress duplicate key error global logs if they somehow propagate here
        // (Though dedup logic should catch 23505 earlier)

        if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: String(e) }).eq("id", logId);

        return new Response(JSON.stringify({ error: String(e), duration }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});

// Helper for Extrato (Direct Query to avoid errors)
async function sendExtrato(userId: string, phone: string, instanceName: string) {
    try {
        const queryLimit = 5;
        // Expenses
        const { data: exps } = await supabaseAdmin
            .from('expenses')
            .select('amount, description, date, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(queryLimit);

        // Incomes
        const { data: incs } = await supabaseAdmin
            .from('incomes')
            .select('amount, description, date, type, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(queryLimit);

        const expsTyped = (exps || []).map((e: any) => ({ ...e, type: 'expense' }));
        const incsTyped = (incs || []).map((i: any) => ({ ...i, type: 'income' }));

        const trs = [...expsTyped, ...incsTyped]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, queryLimit);

        if (!trs || trs.length === 0) {
            await sendWhatsApp(phone, "📄 Nenhuma transação recente.", instanceName);
        } else {
            let msg = "📄 *Extrato (Últimas 5):*\n\n";
            trs.forEach((t: any) => {
                const valNum = Number(t.amount) || 0;
                const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valNum);
                const icon = t.type === 'income' ? '🟢' : '🔴';

                let dateStr = '?';
                let timeStr = '';

                try {
                    const d = new Date(t.created_at);
                    // Adjust to BRT (UTC-3) if needed, or use local string
                    dateStr = d.toLocaleDateString('pt-BR');
                    timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                } catch {
                    dateStr = String(t.date || '?');
                }

                msg += `${icon} *${t.description || 'Sem descrição'}*\n   ${val} em ${dateStr} às ${timeStr}\n\n`;
            });
            await sendWhatsApp(phone, msg, instanceName);
        }
    } catch (e) {
        console.error("Extrato Error:", e);
        const errMsg = e instanceof Error ? e.message : String(e);
        await sendWhatsApp(phone, `❌ Erro ao consultar extrato: ${errMsg}`, instanceName);
    }
}
