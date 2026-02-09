-- ============================================================
-- CRYPTO WALLETS MODULE - Saldin
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela de carteiras cripto
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_id TEXT NOT NULL,          -- CoinGecko ID (ex: bitcoin, ethereum)
  symbol TEXT NOT NULL,             -- BTC, ETH, USDT...
  name TEXT NOT NULL,               -- Bitcoin, Ethereum...
  quantity NUMERIC(20,8) NOT NULL DEFAULT 0,
  display_currency TEXT NOT NULL DEFAULT 'BRL', -- BRL ou USD
  last_price NUMERIC(18,2) DEFAULT 0,
  last_price_updated_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de transações cripto (aportes, resgates, ajustes)
CREATE TABLE IF NOT EXISTS public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.crypto_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'adjustment')),
  quantity NUMERIC(20,8) NOT NULL,
  price_at_time NUMERIC(18,2),      -- Cotação no momento da transação
  total_value NUMERIC(18,2),        -- Valor total em moeda fiat
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Policies crypto_wallets
CREATE POLICY "Users can view own crypto wallets"
  ON public.crypto_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crypto wallets"
  ON public.crypto_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto wallets"
  ON public.crypto_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crypto wallets"
  ON public.crypto_wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Policies crypto_transactions
CREATE POLICY "Users can view own crypto transactions"
  ON public.crypto_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crypto transactions"
  ON public.crypto_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crypto transactions"
  ON public.crypto_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user ON public.crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_wallet ON public.crypto_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user ON public.crypto_transactions(user_id);
