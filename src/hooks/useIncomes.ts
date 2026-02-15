import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type IncomeRow = Tables<"incomes">;
export type IncomeInsert = TablesInsert<"incomes">;
export type IncomeUpdate = TablesUpdate<"incomes">;

const db = supabase as any;

export const useIncomes = (month?: number, year?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["incomes", user?.id, month, year],
    queryFn: async () => {
      if (!user) return [];

      let query = db
        .from("incomes")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply date filtering if month and year are provided
      if (month !== undefined && year !== undefined) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const nextYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 1 : month + 2;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        // Logic: Return if (is_recurring == true AND started before/on this month) OR (date is within range)
        query = query.or(`and(is_recurring.eq.true,date.lt.${endDate}),and(date.gte.${startDate},date.lt.${endDate})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching incomes:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useIncomeStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["income-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const monthStartStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
      const nextMonth = targetMonth === 11 ? 1 : targetMonth + 2;
      const monthEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      // Fetch non-recurring incomes for the specific month
      const { data: monthlyIncomes, error: monthlyError } = await supabase
        .from("incomes")
        .select("amount, type, is_recurring, date")
        .eq("is_recurring", false)
        .gte("date", monthStartStr)
        .lt("date", monthEndStr);

      if (monthlyError) {
        console.error("Error fetching monthly incomes:", monthlyError);
        throw monthlyError;
      }

      // Fetch recurring incomes that started before or during the target month
      const { data: recurringIncomes, error: recurringError } = await supabase
        .from("incomes")
        .select("amount, type, is_recurring, date")
        .eq("is_recurring", true)
        .lte("date", monthEndStr);

      if (recurringError) {
        console.error("Error fetching recurring incomes:", recurringError);
        throw recurringError;
      }

      const allIncomes = [...(monthlyIncomes || []), ...(recurringIncomes || [])];
      const total = allIncomes.reduce((acc, i) => acc + Number(i.amount), 0);

      const recurringTotal = (recurringIncomes || []).reduce((acc, i) => acc + Number(i.amount), 0);
      const variableTotal = (monthlyIncomes || []).reduce((acc, i) => acc + Number(i.amount), 0);

      return {
        total,
        fixedTotal: recurringTotal,
        variableTotal,
        count: allIncomes.length,
      };
    },
    enabled: !!user,
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const db = supabase as any;

  return useMutation({
    mutationFn: async (income: Omit<IncomeInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await db
        .from("incomes")
        .insert({
          ...income,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
    },
    onError: (error) => {
      console.error("Error creating income:", error);
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  const db = supabase as any;

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch income to check for bank_account_id (to reverse balance)
      const { data: income } = await db
        .from("incomes")
        .select("amount, bank_account_id")
        .eq("id", id)
        .maybeSingle();

      // Reverse bank balance before deleting
      if (income?.bank_account_id) {
        const { data: account } = await db
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", income.bank_account_id)
          .single();
        if (account) {
          await db
            .from("bank_accounts")
            .update({ current_balance: Number(account.current_balance) - Number(income.amount), updated_at: new Date().toISOString() })
            .eq("id", income.bank_account_id);
        }
      }

      const { error } = await db.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      toast.success("Receita removida!");
    },
    onError: (error) => {
      console.error("Error deleting income:", error);
      toast.error("Erro ao remover receita");
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: IncomeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("incomes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Receita atualizada!");
    },
    onError: (error) => {
      console.error("Error updating income:", error);
      toast.error("Erro ao atualizar receita");
    },
  });
};

export const useIncomeById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["income", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: income, error } = await db
        .from("incomes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching income:", error);
        throw error;
      }

      if (!income) return null;

      const enrichedIncome = { ...income } as any;

      if ((income as any).bank_account_id) {
        const { data: bankAcc } = await db
          .from("bank_accounts")
          .select("name, bank_name")
          .eq("id", (income as any).bank_account_id)
          .maybeSingle();
        if (bankAcc) enrichedIncome.bank_account = bankAcc;
      }

      return enrichedIncome;
    },
    enabled: !!user && !!id,
  });
};
