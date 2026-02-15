import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ReceivableRow = Tables<"receivables">;
export type ReceivableInsert = TablesInsert<"receivables">;
export type ReceivableUpdate = TablesUpdate<"receivables">;

const db = supabase as any;

export const useReceivables = (status?: "pending" | "received" | "cancelled" | "all") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["receivables", user?.id, status],
    queryFn: async () => {
      if (!user) return [];

      let query = db
        .from("receivables")
        .select("*")
        .order("due_date", { ascending: true });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching receivables:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useReceivableStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["receivable-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 1);
      endOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await db
        .from("receivables")
        .select("amount, status, due_date")
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching receivable stats:", error);
        throw error;
      }

      const receivables = data || [];

      // Filter receivables for the selected month (by due_date)
      const receivablesInMonth = receivables.filter((r: any) => {
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        return dueDate >= startOfMonth && dueDate < endOfMonth;
      });

      const thisMonthAmount = receivablesInMonth.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
      const pendingCount = receivablesInMonth.length;

      // Total pending (all pending receivables)
      const totalPending = receivables.reduce((acc: number, r: any) => acc + Number(r.amount), 0);

      // Check for overdue items (due before the target month's start)
      const overdueItems = receivables.filter((r: any) => {
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        return dueDate < startOfMonth;
      });

      const overdueCount = overdueItems.length;
      const overdueAmount = overdueItems.reduce((acc: number, r: any) => acc + Number(r.amount), 0);

      return {
        totalPending,
        thisMonthAmount,
        pendingCount,
        overdueCount,
        overdueAmount,
      };
    },
    enabled: !!user,
  });
};

export const useCreateReceivable = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (receivableData: any) => {
      if (!user) throw new Error("Usuário não autenticado");

      const {
        type = "simple",
        source_account_id,
        bank_account_id,
        is_installment = false,
        total_installments = 1,
        ...baseData
      } = receivableData;

      const cleanBankAccountId = bank_account_id || null;
      const cleanSourceAccountId = source_account_id || null;

      if (type === "loan" && cleanSourceAccountId) {
        const { data: account, error: accountError } = await db
          .from("bank_accounts")
          .select("current_balance, bank_name")
          .eq("id", cleanSourceAccountId)
          .single();

        if (accountError) throw new Error(`Conta não encontrada: ${accountError.message}`);

        if (account) {
          const amount = Number(baseData.amount);
          if (Number(account.current_balance) < amount) {
            throw new Error(`Saldo insuficiente na conta ${account.bank_name}.`);
          }

          const { error: balanceError } = await db
            .from("bank_accounts")
            .update({
              current_balance: Number(account.current_balance) - amount,
              updated_at: new Date().toISOString()
            })
            .eq("id", cleanSourceAccountId);

          if (balanceError) throw new Error(`Erro ao atualizar saldo: ${balanceError.message}`);

          let { data: category } = await db
            .from("categories")
            .select("id")
            .eq("name", "Empréstimos concedidos")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!category) {
            const { data: newCat, error: catError } = await db
              .from("categories")
              .insert({
                name: "Empréstimos concedidos",
                type: "expense",
                icon: "Handshake",
                color: "#f59e0b",
                user_id: user.id
              })
              .select("id")
              .single();
            if (catError) throw new Error(`Erro ao criar categoria: ${catError.message}`);
            category = newCat;
          }

          const { error: expError } = await db
            .from("expenses")
            .insert({
              user_id: user.id,
              description: `Empréstimo concedido: ${baseData.debtor_name}`,
              amount: amount,
              date: format(new Date(), "yyyy-MM-dd"),
              category_id: category?.id,
              bank_account_id: cleanSourceAccountId,
              status: "confirmed",
              notes: baseData.notes || "Empréstimo automático"
            });
          if (expError) throw new Error(`Erro ao registrar gasto do empréstimo: ${expError.message}`);
        }
      }

      // UUID robusto para o grupo de parcelas
      const generateUUID = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
          return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const installment_group_id = is_installment ? generateUUID() : null;
      const amountPerInstallment = is_installment ? (Number(baseData.amount) / total_installments) : Number(baseData.amount);
      const baseDueDate = new Date(baseData.due_date);

      const recordsToInsert = [];
      for (let i = 0; i < total_installments; i++) {
        const dueDate = addMonths(baseDueDate, i);
        recordsToInsert.push({
          ...baseData,
          user_id: user.id,
          type,
          bank_account_id: cleanBankAccountId,
          source_account_id: type === "loan" ? cleanSourceAccountId : null,
          amount: amountPerInstallment,
          due_date: format(dueDate, "yyyy-MM-dd"),
          is_installment,
          installment_group_id: installment_group_id as any,
          installment_number: is_installment ? (i + 1) : null,
          total_installments: is_installment ? total_installments : null,
          status: "pending"
        });
      }

      const { data, error } = await db
        .from("receivables")
        .insert(recordsToInsert)
        .select();

      if (error) {
        console.error("Database Insert Error:", error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Valor a receber registrado!");
    },
    onError: (error) => {
      console.error("Error creating receivable:", error);
      toast.error("Erro ao registrar valor a receber");
    },
  });
};

export const useUpdateReceivable = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ReceivableUpdate & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Sanitizar IDs nas atualizações
      const sanitizedUpdates = { ...updates } as any;
      if (sanitizedUpdates.bank_account_id === "") sanitizedUpdates.bank_account_id = null;
      if (sanitizedUpdates.source_account_id === "") sanitizedUpdates.source_account_id = null;

      // 1. Obter dados atuais do recebível para saber o valor e a conta
      const { data: receivable } = await db
        .from("receivables")
        .select("*")
        .eq("id", id)
        .single();

      const isMarkingAsReceived = updates.status === "received" && receivable?.status !== "received";

      // 2. Se estiver marcando como recebido, processar impacto financeiro
      if (isMarkingAsReceived && receivable) {
        const bankAccountId = (updates as any).bank_account_id || receivable.bank_account_id;

        if (bankAccountId) {
          const amount = Number(receivable.amount);

          // Atualizar saldo do banco
          const { data: account } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", bankAccountId)
            .single();

          if (account) {
            await db
              .from("bank_accounts")
              .update({
                current_balance: Number(account.current_balance) + amount,
                updated_at: new Date().toISOString()
              })
              .eq("id", bankAccountId);

            // Criar registro de receita
            await db
              .from("incomes")
              .insert({
                user_id: user.id,
                description: `Recebimento: ${receivable.debtor_name}${receivable.installment_number ? ` (${receivable.installment_number}/${receivable.total_installments})` : ""}`,
                amount: amount,
                date: format(new Date(), "yyyy-MM-dd"),
                bank_account_id: bankAccountId,
                type: "other",
                notes: `Recebido de: ${receivable.debtor_name}`
              });
          }
        }
      }

      // 3. Atualizar o recebível
      const { data, error } = await db
        .from("receivables")
        .update(sanitizedUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      queryClient.invalidateQueries({ queryKey: ["receivable"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast.success("Valor atualizado!");
    },
    onError: (error) => {
      console.error("Error updating receivable:", error);
      toast.error("Erro ao atualizar valor");
    },
  });
};

export const useDeleteReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scope = "current", groupId, dueDate }: { id: string; scope?: "current" | "future" | "all"; groupId?: string; dueDate?: string }) => {
      let query = db.from("receivables").delete();

      if (scope === "all" && groupId) {
        query = query.eq("installment_group_id", groupId);
      } else if (scope === "future" && groupId && dueDate) {
        query = query.eq("installment_group_id", groupId).gte("due_date", dueDate);
      } else {
        query = query.eq("id", id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      queryClient.invalidateQueries({ queryKey: ["receivable"] });
      toast.success("Valor a receber removido!");
    },
    onError: (error) => {
      console.error("Error deleting receivable:", error);
      toast.error("Erro ao remover valor a receber");
    },
  });
};

export const useReceivableById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["receivable", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: receivable, error } = await db
        .from("receivables")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching receivable:", error);
        throw error;
      }

      if (!receivable) return null;

      // Manually fetch bank account names since relationships are missing in types
      const enrichedReceivable = { ...receivable } as any;

      if (receivable.bank_account_id) {
        const { data: bankAcc } = await db
          .from("bank_accounts")
          .select("name, bank_name")
          .eq("id", receivable.bank_account_id)
          .maybeSingle();
        if (bankAcc) enrichedReceivable.bank_account = bankAcc;
      }

      if (receivable.source_account_id) {
        const { data: sourceAcc } = await db
          .from("bank_accounts")
          .select("name, bank_name")
          .eq("id", receivable.source_account_id)
          .maybeSingle();
        if (sourceAcc) enrichedReceivable.source_account = sourceAcc;
      }

      return enrichedReceivable;
    },
    enabled: !!user && !!id,
  });
};
