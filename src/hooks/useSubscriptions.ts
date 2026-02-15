import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { Subscription, SubscriptionInsert, SubscriptionUpdate } from "@/types/subscription";
import { startOfMonth, format, parseISO, isAfter, isBefore, addDays } from "date-fns";

const db = supabase as any;

export const useSubscriptions = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["subscriptions", user?.id],
        queryFn: async () => {
            const { data, error } = await db
                .from("subscriptions")
                .select(`
          *,
          category:category_id(name, icon, color),
          card:card_id(card_name, last_four_digits),
          bank_account:bank_account_id(bank_name)
        `)
                .eq("active", true)
                .order("amount", { ascending: false });
            if (error) throw error;
            return (data || []) as (Subscription & {
                category?: any;
                card?: any;
                bank_account?: any
            })[];
        },
        enabled: !!user,
    });
};

export const useCreateSubscription = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (sub: SubscriptionInsert) => {
            if (!user) throw new Error("Não autenticado");
            const { data, error } = await db
                .from("subscriptions")
                .insert({ ...sub, user_id: user.id })
                .select()
                .single();
            if (error) throw error;
            return data as Subscription;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            toast.success("Assinatura cadastrada!");
        },
        onError: () => toast.error("Erro ao cadastrar assinatura"),
    });
};

export const useUpdateSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: SubscriptionUpdate) => {
            const { data, error } = await db
                .from("subscriptions")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Subscription;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            toast.success("Assinatura atualizada!");
        },
        onError: () => toast.error("Erro ao atualizar assinatura"),
    });
};

/**
 * Hook para processar gerações automáticas de assinaturas
 */
export const useSubscriptionAutoLauncher = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: subs } = useSubscriptions();

    const launch = async () => {
        if (!subs || !user) return;

        const today = new Date();
        const currentMonthStr = format(startOfMonth(today), "yyyy-MM-dd");

        for (const sub of subs) {
            if (sub.status !== 'active') continue;

            // Se já foi gerado este mês, pula
            if (sub.last_generated_date && sub.last_generated_date >= currentMonthStr) {
                continue;
            }

            // Se o dia de cobrança já passou ou é hoje (no mês atual)
            if (today.getDate() >= sub.billing_date) {
                try {
                    if (sub.card_id) {
                        // Lançar no cartão
                        await db.from("credit_card_purchases").insert({
                            user_id: user.id,
                            card_id: sub.card_id,
                            description: `Assinatura: ${sub.name}`,
                            total_amount: sub.amount,
                            purchase_date: format(today, "yyyy-MM-dd"),
                            total_installments: 1
                        });
                        // Nota: No mundo ideal, isso geraria as parcelas automaticamente via trigger no banco, 
                        // mas aqui seguimos a lógica do hook useCreateCreditCardPurchase.
                        // Para simplicidade, vamos atualizar apenas a sub aqui.
                    } else if (sub.bank_account_id) {
                        // Lançar na conta bancária
                        await db.from("expenses").insert({
                            user_id: user.id,
                            bank_account_id: sub.bank_account_id,
                            description: `Assinatura: ${sub.name}`,
                            amount: sub.amount,
                            date: format(today, "yyyy-MM-dd"),
                            category_id: sub.category_id,
                            status: 'confirmed'
                        });
                    }

                    // Marcar como gerada
                    await db
                        .from("subscriptions")
                        .update({ last_generated_date: currentMonthStr })
                        .eq("id", sub.id);

                } catch (err) {
                    console.error(`Falha ao processar assinatura ${sub.name}:`, err);
                }
            }
        }

        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["cc-purchases"] });
    };

    return { launch };
};
