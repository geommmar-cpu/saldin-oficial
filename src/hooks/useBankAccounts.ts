import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type {
  BankAccount,
  BankAccountInsert,
  BankAccountUpdate,
  BankTransfer,
  BankTransferInsert,
} from "@/types/bankAccount";

// Helper to bypass typed client for new tables
const db = supabase as any;

// ─── Bank Accounts ──────────────────────────────────────

export const useBankAccounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("bank_accounts")
        .select("*")
        .eq("active", true)
        .order("bank_name");
      if (error) throw error;
      return (data || []) as BankAccount[];
    },
    enabled: !!user,
  });
};

export const useBankAccountById = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank-account", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from("bank_accounts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as BankAccount | null;
    },
    enabled: !!user && !!id,
  });
};

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (account: Omit<BankAccountInsert, "user_id">) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await db
        .from("bank_accounts")
        .insert({
          ...account,
          user_id: user.id,
          current_balance: account.initial_balance || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta bancária cadastrada!");
    },
    onError: () => toast.error("Erro ao cadastrar conta"),
  });
};

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: BankAccountUpdate & { id: string }) => {
      const { data, error } = await db
        .from("bank_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      toast.success("Conta atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar conta"),
  });
};

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("bank_accounts")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta removida!");
    },
    onError: () => toast.error("Erro ao remover conta"),
  });
};

// ─── Balance Updates ────────────────────────────────────

/** Update bank balance after an income/expense is created */
export const useUpdateBankBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, delta }: { accountId: string; delta: number }) => {
      // First get current balance
      const { data: account, error: fetchError } = await db
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", accountId)
        .single();
      if (fetchError) throw fetchError;

      const newBalance = Number(account.current_balance) + delta;
      const { error } = await db
        .from("bank_accounts")
        .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", accountId);
      if (error) throw error;
      return { accountId, newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
    },
  });
};

// ─── Bank Transfers ─────────────────────────────────────

export const useBankTransfers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank-transfers", user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("bank_transfers")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as BankTransfer[];
    },
    enabled: !!user,
  });
};

export const useCreateBankTransfer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transfer: Omit<BankTransferInsert, "user_id">) => {
      if (!user) throw new Error("Não autenticado");

      // 1. Check if source account has enough balance
      const { data: sourceAccount, error: fetchError } = await db
        .from("bank_accounts")
        .select("current_balance, bank_name")
        .eq("id", transfer.from_account_id)
        .single();

      if (fetchError) throw fetchError;
      if (!sourceAccount) throw new Error("Conta de origem não encontrada");

      if (Number(sourceAccount.current_balance) < Number(transfer.amount)) {
        throw new Error(`Erro: Saldo insuficiente na conta ${sourceAccount.bank_name}.`);
      }

      // 2. Create transfer record
      const { data, error } = await db
        .from("bank_transfers")
        .insert({ ...transfer, user_id: user.id })
        .select()
        .single();
      if (error) throw error;

      // 3. Update from_account balance (subtract)
      const { data: fromAcc, error: fromErr } = await db
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", transfer.from_account_id)
        .single();
      if (fromErr) throw fromErr;

      await db
        .from("bank_accounts")
        .update({
          current_balance: Number(fromAcc.current_balance) - transfer.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transfer.from_account_id);

      // 4. Update to_account balance (add)
      const { data: toAcc, error: toErr } = await db
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", transfer.to_account_id)
        .single();
      if (toErr) throw toErr;

      await db
        .from("bank_accounts")
        .update({
          current_balance: Number(toAcc.current_balance) + transfer.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transfer.to_account_id);

      return data as BankTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transfers"] });
      toast.success("Transferência realizada!");
    },
    onError: () => toast.error("Erro na transferência"),
  });
};

export const useDeleteBankTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: BankTransfer) => {
      // Reverse the balance changes
      const { data: fromAcc } = await db
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", transfer.from_account_id)
        .single();

      const { data: toAcc } = await db
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", transfer.to_account_id)
        .single();

      if (fromAcc) {
        await db
          .from("bank_accounts")
          .update({ current_balance: Number(fromAcc.current_balance) + transfer.amount })
          .eq("id", transfer.from_account_id);
      }

      if (toAcc) {
        await db
          .from("bank_accounts")
          .update({ current_balance: Number(toAcc.current_balance) - transfer.amount })
          .eq("id", transfer.to_account_id);
      }

      const { error } = await db
        .from("bank_transfers")
        .delete()
        .eq("id", transfer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transfers"] });
      toast.success("Transferência revertida!");
    },
    onError: () => toast.error("Erro ao reverter transferência"),
  });
};

// ─── Account History ────────────────────────────────────

export type AccountHistoryItem = {
  id: string;
  type: "income" | "expense" | "transfer_in" | "transfer_out";
  amount: number;
  description: string;
  date: string;
  category?: string;
  status: "pending" | "confirmed" | "completed";
};

export const useBankAccountHistory = (accountId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bank-history", accountId],
    queryFn: async () => {
      if (!accountId || !user) return [];

      // 1. Fetch Incomes
      const { data: incomes, error: incError } = await db
        .from("incomes")
        .select("*")
        .eq("bank_account_id", accountId)
        .order("date", { ascending: false });

      if (incError) throw incError;

      // 2. Fetch Expenses
      const { data: expenses, error: expError } = await db
        .from("expenses")
        .select("*, categories(name, icon, color)")
        .eq("bank_account_id", accountId) // Assuming column exists based on context
        .order("date", { ascending: false });

      if (expError) {
        // Fallback if column doesn't exist yet, just return empty for expenses
        console.warn("Could not fetch expenses for bank account:", expError);
      }

      // 3. Fetch Transfers Out
      const { data: transfersOut, error: trOutError } = await db
        .from("bank_transfers")
        .select("*, to:to_account_id(bank_name)")
        .eq("from_account_id", accountId);

      if (trOutError) throw trOutError;

      // 4. Fetch Transfers In
      const { data: transfersIn, error: trInError } = await db
        .from("bank_transfers")
        .select("*, from:from_account_id(bank_name)")
        .eq("to_account_id", accountId);

      if (trInError) throw trInError;

      // Combine and normalize
      const history: AccountHistoryItem[] = [];

      incomes?.forEach((inc: any) => {
        history.push({
          id: inc.id,
          type: "income",
          amount: Number(inc.amount),
          description: inc.description,
          date: inc.date,
          category: inc.type === 'salary' ? 'Salário' : 'Receita',
          status: "confirmed"
        });
      });

      expenses?.forEach((exp: any) => {
        history.push({
          id: exp.id,
          type: "expense",
          amount: Number(exp.amount),
          description: exp.description,
          date: exp.date,
          category: exp.categories?.name || "Despesa",
          status: exp.status === 'confirmed' ? 'confirmed' : 'pending'
        });
      });

      transfersOut?.forEach((tr: any) => {
        history.push({
          id: tr.id,
          type: "transfer_out",
          amount: Number(tr.amount),
          description: `Transferência para ${tr.to?.bank_name || 'Conta'}`,
          date: tr.date,
          category: "Transferência",
          status: "completed"
        });
      });

      transfersIn?.forEach((tr: any) => {
        history.push({
          id: tr.id,
          type: "transfer_in",
          amount: Number(tr.amount),
          description: `Recebido de ${tr.from?.bank_name || 'Conta'}`,
          date: tr.date,
          category: "Transferência",
          status: "completed"
        });
      });

      // Sort by date desc
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!accountId && !!user
  });
};
