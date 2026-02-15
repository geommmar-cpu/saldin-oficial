
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface TransactionData {
    userId: string;
    type: "expense" | "income";
    amount: number;
    description: string;
    categoryId?: string;
    bankAccountId?: string;
    date?: string; // YYYY-MM-DD
}

export async function processTransaction(data: TransactionData) {
    const { userId, type, amount, description, categoryId, bankAccountId, date } = data;

    try {
        const { data: result, error } = await supabaseAdmin.rpc("process_financial_transaction", {
            p_user_id: userId,
            p_type: type,
            p_amount: amount,
            p_description: description,
            p_category_id: categoryId || null,
            p_bank_account_id: bankAccountId || null,
            p_date: date || new Date().toISOString(),
            p_source: "whatsapp"
        });

        if (error) throw error;
        return result;

    } catch (err) {
        console.error("Financial Transaction Failed:", err);
        throw new Error("Erro ao registrar transação no banco.");
    }
}

export async function getBalance(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc("calculate_liquid_balance", {
        p_user_id: userId
    });

    if (error) {
        console.error("Get Balance Failed:", error);
        throw new Error("Erro ao consultar saldo.");
    }

    return Number(data) || 0;
}

export async function getLastTransactions(userId: string, limit = 5) {
    // Busca expenses e incomes recentes
    const { data: exp, error: errExp } = await supabaseAdmin
        .from('expenses')
        .select('amount, description, date, category_id')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    const { data: inc, error: errInc } = await supabaseAdmin
        .from('incomes')
        .select('amount, description, date, type') // Removed category_id, added type
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    if (errExp || errInc) {
        const msg = errExp?.message || errInc?.message || "Unknown DB Error";
        console.error("Get Transactions Failed:", msg);
        throw new Error(`DB Error: ${msg}`);
    }

    // Merge expenses and incomes
    const all = [
        ...(exp || []).map(e => ({ ...e, type: 'expense' })),
        ...(inc || []).map(i => ({ ...i, type: 'income' }))
    ];

    // Sort by date descending
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return all.slice(0, limit);
}
