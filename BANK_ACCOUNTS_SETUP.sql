-- ═══════════════════════════════════════════════════════════════
-- SALDIN - Contas Bancárias (Bank Accounts Module)
-- Execute este script no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1) Tipo de conta bancária
CREATE TYPE public.bank_account_type AS ENUM ('checking', 'savings', 'payment');

-- 2) Tabela de contas bancárias
CREATE TABLE public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_key TEXT, -- matches BANK_THEMES key for branding
  account_type public.bank_account_type DEFAULT 'checking',
  initial_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  color TEXT, -- custom color override
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) RLS para contas bancárias
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank accounts"
  ON public.bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
  ON public.bank_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts"
  ON public.bank_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Tabela de transferências entre bancos
CREATE TABLE public.bank_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) RLS para transferências
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers"
  ON public.bank_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers"
  ON public.bank_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers"
  ON public.bank_transfers FOR DELETE
  USING (auth.uid() = user_id);

-- 6) Adicionar bank_account_id nas tabelas existentes (nullable para compatibilidade)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);

-- 7) Índices para performance
CREATE INDEX idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_transfers_user ON public.bank_transfers(user_id);
CREATE INDEX idx_bank_transfers_from ON public.bank_transfers(from_account_id);
CREATE INDEX idx_bank_transfers_to ON public.bank_transfers(to_account_id);
CREATE INDEX idx_expenses_bank ON public.expenses(bank_account_id);
CREATE INDEX idx_incomes_bank ON public.incomes(bank_account_id);
