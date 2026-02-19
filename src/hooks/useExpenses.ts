import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ExpenseRow = Tables<"expenses">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type ExpenseUpdate = TablesUpdate<"expenses">;

const db = supabase as any;

export const useExpenses = (status?: "pending" | "confirmed" | "all", month?: number, year?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expenses", user?.id, status, month, year],
    queryFn: async () => {
      if (!user) return [];

      let query = db
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      } else {
        query = query.neq("status", "deleted");
      }

      // Apply date filtering if month and year are provided
      if (month !== undefined && year !== undefined) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const nextYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 1 : month + 2;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        // Logic: Return if (date is within range) OR (is_installment and started before this month)
        query = query.or(`and(date.gte.${startDate},date.lt.${endDate}),and(is_installment.eq.true,date.lt.${endDate})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useExpenseStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["expense-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_monthly_expenses_stats", {
        year_input: targetYear,
        month_input: targetMonth,
      });

      if (error) {
        console.error("Error fetching expense stats:", error);
        throw error;
      }

      // RPC returns an array (set of rows), even if it's just 1 row
      const stats = data?.[0] || {
        total: 0,
        impulse_total: 0,
        impulse_percentage: 0,
        count: 0,
      };

      return {
        total: Number(stats.total) || 0,
        impulseTotal: Number(stats.impulse_total) || 0,
        impulsePercentage: Number(stats.impulse_percentage) || 0,
        count: Number(stats.count) || 0,
      };
    },
    enabled: !!user,
  });
};

export const useExpensesByCategory = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["expenses-by-category", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return [];

      const monthStartStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
      const nextMonth = targetMonth === 11 ? 1 : targetMonth + 2;
      const monthEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      // Fetch expenses with category join
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          amount, 
          emotion,
          category_id,
          categories (
            name
          )
        `)
        .neq("status", "deleted")
        .or(`and(date.gte.${monthStartStr},date.lt.${monthEndStr}),and(is_installment.eq.true,date.lt.${monthEndStr})`);

      if (error) {
        console.error("Error fetching expenses by category:", error);
        throw error;
      }

      // Group by category but we need to handle virtual projection here too!
      // This is complicated because calculateBalances/Home.tsx does this in memory.
      // For simplicity, we'll let the component handle it if possible, 
      // but here we should follow the same logic as Home.tsx if we want accurate stats.
      return data || [];
    },
    enabled: !!user,
  });
};

export const usePendingExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-expenses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending expenses:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const expenseData = { ...expense } as any;
      const db = supabase as any;

      // Check for sufficient funds removed to allow overdraft (aligned with UI warning)
      // if (expenseData.bank_account_id && expenseData.status === "confirmed") { ... }

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      toast.success("Gasto registrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating expense:", error);
      toast.error("Erro ao registrar gasto");
    },
  });
};

export const useCreateBulkExpenses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expenses: Omit<ExpenseInsert, "user_id">[]) => {
      if (!user) throw new Error("Usuário não autenticado");

      const expensesWithUserId = expenses.map(expense => ({
        ...expense,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from("expenses")
        .insert(expensesWithUserId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      toast.success("Gastos registrados com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating bulk expenses:", error);
      toast.error("Erro ao registrar gastos");
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success("Gasto atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating expense:", error);
      toast.error("Erro ao atualizar gasto");
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const db = supabase as any;

  return useMutation({
    mutationFn: async ({ id, softDelete = false }: { id: string; softDelete?: boolean }) => {
      // Fetch expense to check for bank_account_id (to reverse balance)
      const { data: expense } = await db
        .from("expenses")
        .select("amount, bank_account_id")
        .eq("id", id)
        .maybeSingle();

      if (softDelete) {
        const { data, error } = await supabase
          .from("expenses")
          .update({ status: "deleted" })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        // Reverse bank balance
        if (expense?.bank_account_id) {
          const { data: account } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", expense.bank_account_id)
            .single();
          if (account) {
            await db
              .from("bank_accounts")
              .update({ current_balance: Number(account.current_balance) + Number(expense.amount), updated_at: new Date().toISOString() })
              .eq("id", expense.bank_account_id);
          }
        }
        return data;
      } else {
        // Reverse bank balance before deleting
        if (expense?.bank_account_id) {
          const { data: account } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", expense.bank_account_id)
            .single();
          if (account) {
            await db
              .from("bank_accounts")
              .update({ current_balance: Number(account.current_balance) + Number(expense.amount), updated_at: new Date().toISOString() })
              .eq("id", expense.bank_account_id);
          }
        }

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return { id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      toast.success("Gasto excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao excluir gasto");
    },
  });
};

export const useExpenseById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: expense, error } = await db
        .from("expenses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching expense:", error);
        throw error;
      }

      if (!expense) return null;

      const enrichedExpense = { ...expense } as any;

      if (expense.bank_account_id) {
        const { data: bankAcc } = await db
          .from("bank_accounts")
          .select("name, bank_name")
          .eq("id", expense.bank_account_id)
          .maybeSingle();
        if (bankAcc) enrichedExpense.bank_account = bankAcc;
      }

      return enrichedExpense;
    },
    enabled: !!user && !!id,
  });
};
