
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "./ai-service.ts";
import { processImage } from "./image-service.ts";
import { transcribeAudio } from "./audio-service.ts";
import { processTransaction, getBalance, getLastTransactions } from "./financial-service.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sendWhatsApp(phone: string, text: string, instanceName?: string): Promise<void> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.error("Evolution API URL or Key not set.");
        return;
    }
    try {
        const instance = instanceName || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "Saldin";
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
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
        console.log(`✅ WhatsApp sent to ${phone} (Instance: ${instance})`);
    } catch (e) {
        console.error("❌ Failed to send WhatsApp:", e);
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
        const phone = remoteJid.split("@")[0];
        const messageId = data.key.id;
        const messageType = data.messageType;

        // 1. Log Request & Deduplicate (Robust Time-Window Strategy)
        console.log("🚀 [WEBHOOK] Processing ID:", messageId, "From:", phone);

        const currentHash = getMessageHash(data);
        const minuteBucket = Math.floor(Date.now() / 60000); // 1-minute time window bucket
        const dedupKey = `${phone}_${currentHash}_${minuteBucket}`;

        console.log("🔒 Dedup Key:", dedupKey);

        const { data: logData, error: logError } = await supabaseAdmin
            .from("whatsapp_logs")
            .insert({
                phone_number: phone,
                message_content: JSON.stringify(data),
                message_type: messageType,
                processed: false,
                message_id: messageId,
                dedup_key: dedupKey
            })
            .select()
            .single();

        if (logError) {
            // Postgres unique violation code (23505)
            // Checks both message_id AND dedup_key constraints
            if (logError.code === "23505") {
                console.log("🔁 Duplicate message blocked by DB:", messageId || dedupKey);
                return new Response("Duplicate", { status: 200 });
            }
            console.error("❌ Failed to log message:", logError);
            // We continue processing if it's not a duplicate error, but log it.
        }

        if (logData) logId = logData.id;

        // 2. Lookup & Verify User
        // Handle Brazilian 9th digit variation (55 + DDD + 9 + 8 digits vs 55 + DDD + 8 digits)
        let phoneVariations = [phone];
        if (phone.startsWith("55") && phone.length === 13 && phone[4] === "9") {
            // It's a 13-digit number (55 + DDD + 9 + 8 digits), try the 12-digit version
            phoneVariations.push("55" + phone.substring(2, 4) + phone.substring(5));
        } else if (phone.startsWith("55") && phone.length === 12) {
            // It's a 12-digit number (55 + DDD + 8 digits), try the 13-digit version with '9'
            phoneVariations.push("55" + phone.substring(2, 4) + "9" + phone.substring(4));
        }

        const { data: userLink, error: userError } = await supabaseAdmin
            .from("whatsapp_users")
            .select("user_id, is_verified")
            .in("phone_number", phoneVariations)
            .order("is_verified", { ascending: false }) // Prioritize verified links
            .limit(1)
            .maybeSingle();

        if (userError || !userLink || !userLink.is_verified) {
            console.warn("❌ Unverified user:", phone);
            if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unverified" }).eq("id", logId);
            await sendWhatsApp(phone, "❌ Acesso não autorizado. Por favor, vincule seu WhatsApp no app Saldin primeiro.", instanceName);
            return new Response("Unauthorized", { status: 200 });
        }

        console.log("✅ User verified:", userLink.user_id);
        userId = userLink.user_id;

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
                await sendWhatsApp(phone, "❌ Erro ao processar áudio.", instanceName);
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
                await sendWhatsApp(phone, "❌ Erro ao analisar imagem.", instanceName);
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
                    await sendWhatsApp(phone, `💰 Seu saldo atual é: *${formatted}*`, instanceName);
                } catch (e) {
                    console.error("Cmd Saldo Error:", e);
                    await sendWhatsApp(phone, "❌ Erro ao consultar saldo.", instanceName);
                }
                return new Response("Command Executed", { status: 200 });
            }
            // EXTRATO
            if (normalizedCmd.match(/^\/?extrato$/)) {
                await sendExtrato(userId, phone, instanceName);
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
                await sendWhatsApp(phone, `💰 Seu saldo atual é: *${formatted}*`, instanceName);
            } catch (e) { console.error(e); await sendWhatsApp(phone, "❌ Erro ao consultar saldo.", instanceName); }
            return new Response("OK", { status: 200 });
        }

        if (intent.tipo === 'consulta_extrato') {
            await sendExtrato(userId, phone, instanceName);
            return new Response("OK", { status: 200 });
        }

        if (intent.status === "incompleto") {
            await sendWhatsApp(phone, "🤔 Não entendi direito. Poderia detalhar o valor e o que foi?\n\nExemplo: _Gastei 50 reais no almoço_", instanceName);
            return new Response("Incomplete intent", { status: 200 });
        }

        // 6. Map Category
        const categoryId = await getCategoryId(userId, intent.categoria_sugerida, intent.tipo === "receita" ? "income" : "expense");

        // 7. Execute Transaction
        console.log("💾 Processing transaction...");
        const result = await processTransaction({
            userId,
            type: intent.tipo === "receita" ? "income" : "expense",
            amount: intent.valor,
            description: intent.descricao,
            categoryId: categoryId || undefined,
        });

        // 8. Success Response
        const balance = result.new_balance;
        const isCard = result.is_credit_card;
        const destName = result.dest_name || "Conta";
        const emoji = intent.tipo === "receita" ? "💰" : (isCard ? "💳" : "💸");
        const tipoLabel = intent.tipo === "receita" ? "Receita" : (isCard ? "Gasto no Cartão" : "Gasto");
        const msg = `✅ *${tipoLabel} registrado!*\n\n${emoji} *Valor:* R$ ${intent.valor.toFixed(2)}\n📝 *Descrição:* ${intent.descricao}\n🏷️ *Categoria:* ${intent.categoria_sugerida}\n🏦 *Destino:* ${destName}\n\n📊 *Saldo Geral (Cofre):* R$ ${balance.toFixed(2)}`;

        await sendWhatsApp(phone, msg, instanceName);

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
