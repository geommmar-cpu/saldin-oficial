
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
    transactionCode: string;
}

export async function processTransaction(data: TransactionData) {
    const { userId, type, amount, description, categoryId, bankAccountId, date, transactionCode } = data;
    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();

    try {
        let result;
        let error;

        // Note: Direct inserts to support transaction_code without altering existing RPC immediately.
        // We assume 'category_id' and 'bank_account_id' exist on tables based on usage in previous code,
        // even if initial migration file didn't show them (likely added in subsequent migrations).

        if (type === 'expense') {
            const payload: any = {
                user_id: userId,
                amount,
                description,
                source: 'whatsapp',
                status: 'confirmed', // Auto-confirm for WhatsApp
                confirmed_at: finalDate, // approximate
                transaction_code: transactionCode,
                created_at: finalDate
            };
            if (categoryId) payload.category_id = categoryId;
            if (bankAccountId) payload.bank_account_id = bankAccountId;

            const { data: exp, error: err } = await supabaseAdmin
                .from('expenses')
                .insert(payload)
                .select()
                .single();
            result = exp;
            error = err;
        } else {
            const payload: any = {
                user_id: userId,
                amount,
                description,
                type: 'variable', // Default to variable for WhatsApp
                source: 'whatsapp',
                transaction_code: transactionCode,
                created_at: finalDate,
                status: 'received' // Incomes are received
            };
            if (categoryId) payload.category_id = categoryId;
            if (bankAccountId) payload.bank_account_id = bankAccountId;

            const { data: inc, error: err } = await supabaseAdmin
                .from('incomes')
                .insert(payload)
                .select()
                .single();
            result = inc;
            error = err;
        }

        if (error) {
            console.error("DB Insert Error:", error);
            throw error;
        }

        // Update Bank Account Balance if linked
        if (bankAccountId) {
            const { data: acc } = await supabaseAdmin
                .from('bank_accounts')
                .select('current_balance')
                .eq('id', bankAccountId)
                .single();

            if (acc) {
                const currentBal = Number(acc.current_balance) || 0;
                const newBal = type === 'income' ? (currentBal + amount) : (currentBal - amount);

                await supabaseAdmin
                    .from('bank_accounts')
                    .update({ current_balance: newBal })
                    .eq('id', bankAccountId);
            }
        }

        // Calculate new balance
        const newBalance = await getBalance(userId);

        return {
            ...result,
            new_balance: newBalance,
            dest_name: "Conta",
            is_credit_card: false
        };

    } catch (err) {
        console.error("Financial Transaction Failed:", err);
        throw new Error("Erro ao registrar transação no banco.");
    }
}

export async function getBalance(userId: string): Promise<number> {
    // Use V2 which we will update to use Bank Accounts + Cash logic
    const { data, error } = await supabaseAdmin.rpc("calculate_liquid_balance_v2", {
        p_user_id: userId
    });

    if (error) {
        console.warn("Balance RPC failed, using manual fallback");
        // Fallback: Sum of Banks + Cash
        // 1. Get Bank Balances
        const { data: banks } = await supabaseAdmin.from('bank_accounts').select('current_balance').eq('user_id', userId).eq('active', true);
        const bankTotal = banks?.reduce((acc, b) => acc + Number(b.current_balance), 0) || 0;

        // 2. Get Cash Balance (Unlinked Transactions)
        // Note: This matches frontend "Saldo Livre" logic if we assume unlinked = cash
        // Incomes (Cash)
        const { data: inc } = await supabaseAdmin.from('incomes')
            .select('amount')
            .eq('user_id', userId)
            .is('bank_account_id', null)
            .is('deleted_at', null)
            .or('status.eq.received,status.eq.confirmed');

        // Expenses (Cash)
        const { data: exp } = await supabaseAdmin.from('expenses')
            .select('amount')
            .eq('user_id', userId)
            .is('bank_account_id', null)
            .is('deleted_at', null)
            .neq('status', 'deleted');

        const cashInc = inc?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
        const cashExp = exp?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        return bankTotal + cashInc - cashExp;
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

export async function getPreferredAccount(userId: string, method?: string): Promise<string | null> {
    // If method implies a bank transaction (Pix, Debit, Transfer), find a Checking Account
    if (method && ['pix', 'debito', 'transferencia', 'dinheiro', 'boleto'].includes(method.toLowerCase())) {

        // 1. Try to get the default income account (often used as main checking) from profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('wa_default_income_account_id, wa_default_expense_account_id')
            .eq('user_id', userId)
            .single();

        if (profile?.wa_default_expense_account_id) return profile.wa_default_expense_account_id;
        if (profile?.wa_default_income_account_id) return profile.wa_default_income_account_id;

        // 2. Fallback: Any active checking account
        const { data: acc } = await supabaseAdmin
            .from('bank_accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            // Prioritize checking, then wallet/others
            .order('account_type', { ascending: true })
            .limit(1)
            .maybeSingle();

        return acc?.id || null;
    }

    // For Credit, we return null so the RPC can pick the default card
    return null;
}
