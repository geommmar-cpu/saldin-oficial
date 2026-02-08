import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type {
  CreditCard,
  CreditCardInsert,
  CreditCardPurchase,
  CreditCardPurchaseInsert,
  CreditCardInstallment,
} from "@/types/creditCard";
import { addMonths, startOfMonth, format } from "date-fns";

// Helper to bypass typed supabase client for new tables
const db = supabase as any;

// ─── Cartões ────────────────────────────────────────────

export const useCreditCards = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credit-cards", user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("credit_cards")
        .select("*")
        .eq("active", true)
        .order("card_name");
      if (error) throw error;
      return (data || []) as CreditCard[];
    },
    enabled: !!user,
  });
};

export const useCreditCardById = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credit-card", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from("credit_cards")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as CreditCard | null;
    },
    enabled: !!user && !!id,
  });
};

export const useCreateCreditCard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (card: CreditCardInsert) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await db
        .from("credit_cards")
        .insert({ ...card, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Cartão cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar cartão"),
  });
};

export const useUpdateCreditCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreditCard> & { id: string }) => {
      const { data, error } = await db
        .from("credit_cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      toast.success("Cartão atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar cartão"),
  });
};

export const useDeleteCreditCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("credit_cards")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Cartão removido!");
    },
    onError: () => toast.error("Erro ao remover cartão"),
  });
};

// ─── Compras + Parcelas ─────────────────────────────────

export const useCreateCreditCardPurchase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (purchase: CreditCardPurchaseInsert) => {
      if (!user) throw new Error("Não autenticado");

      // 1. Criar a compra
      const { data: purchaseData, error: purchaseError } = await db
        .from("credit_card_purchases")
        .insert({
          ...purchase,
          user_id: user.id,
          total_installments: purchase.total_installments || 1,
        })
        .select()
        .single();
      if (purchaseError) throw purchaseError;

      const totalInstallments = purchase.total_installments || 1;
      const installmentAmount = Math.round((purchase.total_amount / totalInstallments) * 100) / 100;

      // 2. Criar as parcelas
      const purchaseDate = new Date(purchase.purchase_date || new Date());
      const installments = Array.from({ length: totalInstallments }, (_, i) => {
        const refMonth = startOfMonth(addMonths(purchaseDate, i));
        return {
          purchase_id: purchaseData.id,
          user_id: user.id,
          installment_number: i + 1,
          amount: i === totalInstallments - 1
            ? Math.round((purchase.total_amount - installmentAmount * (totalInstallments - 1)) * 100) / 100
            : installmentAmount,
          reference_month: format(refMonth, "yyyy-MM-dd"),
          status: "open",
        };
      });

      const { error: installError } = await db
        .from("credit_card_installments")
        .insert(installments);
      if (installError) throw installError;

      return purchaseData as CreditCardPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cc-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["cc-installments"] });
      queryClient.invalidateQueries({ queryKey: ["cc-statements"] });
      toast.success("Compra registrada no cartão!");
    },
    onError: (err) => {
      console.error("Error creating purchase:", err);
      toast.error("Erro ao registrar compra");
    },
  });
};

// ─── Parcelas do mês ────────────────────────────────────

export const useCardInstallmentsByMonth = (month: Date) => {
  const { user } = useAuth();
  const refMonth = format(startOfMonth(month), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["cc-installments", user?.id, refMonth],
    queryFn: async () => {
      // Fetch installments for the month
      const { data: installments, error } = await db
        .from("credit_card_installments")
        .select("*")
        .eq("reference_month", refMonth)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!installments || installments.length === 0) return [];

      // Fetch purchases for those installments
      const purchaseIds = [...new Set((installments as any[]).map((i: any) => i.purchase_id))];
      const { data: purchases, error: pErr } = await db
        .from("credit_card_purchases")
        .select("*")
        .in("id", purchaseIds);
      if (pErr) throw pErr;

      // Fetch cards for those purchases
      const cardIds = [...new Set((purchases as any[]).map((p: any) => p.card_id))];
      const { data: cards, error: cErr } = await db
        .from("credit_cards")
        .select("*")
        .in("id", cardIds);
      if (cErr) throw cErr;

      const purchaseMap = new Map((purchases as any[]).map((p: any) => [p.id, p]));
      const cardMap = new Map((cards as any[]).map((c: any) => [c.id, c]));

      return (installments as any[]).map((inst: any) => {
        const purchase = purchaseMap.get(inst.purchase_id);
        const card = purchase ? cardMap.get(purchase.card_id) : null;
        return { ...inst, purchase: { ...purchase, card } };
      }) as (CreditCardInstallment & {
        purchase: CreditCardPurchase & { card: CreditCard };
      })[];
    },
    enabled: !!user,
  });
};

// ─── Compras de um cartão ───────────────────────────────

export const usePurchasesByCard = (cardId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cc-purchases", cardId],
    queryFn: async () => {
      if (!cardId) return [];
      const { data, error } = await db
        .from("credit_card_purchases")
        .select("*")
        .eq("card_id", cardId)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CreditCardPurchase[];
    },
    enabled: !!user && !!cardId,
  });
};

// ─── Parcelas de um cartão por mês (fatura) ─────────────

export const useCardStatementData = (cardId: string | undefined, month: Date) => {
  const { user } = useAuth();
  const refMonth = format(startOfMonth(month), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["cc-statement-data", cardId, refMonth],
    queryFn: async () => {
      if (!cardId) return [];

      // Get all installments for this month
      const { data: installments, error } = await db
        .from("credit_card_installments")
        .select("*")
        .eq("reference_month", refMonth)
        .order("installment_number");
      if (error) throw error;

      if (!installments || installments.length === 0) return [];

      // Get purchases to filter by card
      const purchaseIds = [...new Set((installments as any[]).map((i: any) => i.purchase_id))];
      const { data: purchases, error: pErr } = await db
        .from("credit_card_purchases")
        .select("*")
        .in("id", purchaseIds)
        .eq("card_id", cardId);
      if (pErr) throw pErr;

      const purchaseMap = new Map((purchases as any[]).map((p: any) => [p.id, p]));

      // Filter installments that belong to this card's purchases
      return (installments as any[])
        .filter((inst: any) => purchaseMap.has(inst.purchase_id))
        .map((inst: any) => ({
          ...inst,
          purchase: purchaseMap.get(inst.purchase_id),
        })) as (CreditCardInstallment & { purchase: CreditCardPurchase })[];
    },
    enabled: !!user && !!cardId,
  });
};

// ─── Total usado por cartão (parcelas abertas) ──────────

export const useCardUsedLimit = (cardId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cc-used-limit", cardId],
    queryFn: async () => {
      if (!cardId) return 0;

      // Get all open installments
      const { data: installments, error } = await db
        .from("credit_card_installments")
        .select("amount, purchase_id")
        .eq("status", "open");
      if (error) throw error;

      if (!installments || installments.length === 0) return 0;

      // Get purchase IDs for this card
      const purchaseIds = [...new Set((installments as any[]).map((i: any) => i.purchase_id))];
      const { data: purchases, error: pErr } = await db
        .from("credit_card_purchases")
        .select("id")
        .in("id", purchaseIds)
        .eq("card_id", cardId);
      if (pErr) throw pErr;

      const validPurchaseIds = new Set((purchases as any[]).map((p: any) => p.id));

      return (installments as any[])
        .filter((i: any) => validPurchaseIds.has(i.purchase_id))
        .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    },
    enabled: !!user && !!cardId,
  });
};
