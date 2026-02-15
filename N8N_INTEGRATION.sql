-- N8N INTEGRATION MIGRATION
-- This script adds necessary columns and tables to support the N8N workflows for:
-- 1. User Creation/Subscription (Hotmart/Asas)
-- 2. WhatsApp Validation
-- 3. Daily Reminders

-- 1. Enable extensions if not enabled
create extension if not exists "uuid-ossp";

-- 2. Update PROFILES table with new fields
-- We add columns to 'profiles' instead of 'users' (auth.users) because we can't easily modify auth.users columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS asas_customer_id TEXT, -- id_externo
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive', -- status_assinatura
ADD COLUMN IF NOT EXISTS subscription_plan TEXT, -- plano
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ, -- data_inicio
ADD COLUMN IF NOT EXISTS subscription_due_date TIMESTAMPTZ, -- data_vencimento
ADD COLUMN IF NOT EXISTS whatsapp_validated BOOLEAN DEFAULT false; -- whatsapp_validado

-- 3. Create SUBSCRIPTIONS table (Optional/History log of subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    amount DECIMAL(10, 2),
    status TEXT NOT NULL, -- active, canceled, etc
    next_due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Create REMINDERS table (For daily cron)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_date DATE NOT NULL, -- The date this reminder is for
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    last_sent TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and manage their own reminders
CREATE POLICY "Users can view own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_asas_id ON public.profiles(asas_customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date_status ON public.reminders(target_date, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 6. Helper Function to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_modtime ON public.subscriptions;
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for reminders
DROP TRIGGER IF EXISTS update_reminders_modtime ON public.reminders;
CREATE TRIGGER update_reminders_modtime BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
