
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWhatsAppStatus = (userId: string | undefined) => {
    return useQuery({
        queryKey: ["whatsapp-status", userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from("whatsapp_users")
                .select("phone_number, is_verified")
                .eq("user_id", userId)
                .eq("is_verified", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            return data ? {
                connected: data.is_verified,
                number: data.phone_number
            } : {
                connected: false,
                number: null
            };
        },
        enabled: !!userId
    });
};
