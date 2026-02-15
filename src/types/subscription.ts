import { LucideIcon } from "lucide-react";

export type SubscriptionFrequency = "monthly" | "yearly" | "custom";
export type SubscriptionStatus = "active" | "cancelled";

export interface Subscription {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    billing_date: number; // 1-31
    frequency: SubscriptionFrequency;
    custom_frequency_days?: number;
    category_id?: string;
    card_id?: string;
    bank_account_id?: string;
    status: SubscriptionStatus;
    active: boolean;
    last_generated_date?: string | null;
    created_at: string;
    updated_at: string;
}

export type SubscriptionInsert = Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at" | "active">;
export type SubscriptionUpdate = Partial<SubscriptionInsert> & { id: string; active?: boolean };
