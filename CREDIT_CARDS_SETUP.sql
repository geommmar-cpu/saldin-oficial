-- =============================================
-- CARTÕES DE CRÉDITO - Setup SQL
-- Execute este SQL no console do Supabase
-- =============================================

-- 1. Enum para status da fatura
CREATE TYPE public.statement_status AS ENUM ('open', 'closed', 'paid');

-- 2. Enum para status da parcela
CREATE TYPE public.installment_status AS ENUM ('open', 'paid');

-- 3. Tabela: Cartões de Crédito
CREATE TABLE public.credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  card_brand TEXT, -- Visa, Mastercard, etc.
  last_four_digits TEXT, -- Últimos 4 dígitos
  credit_limit NUMERIC(12,2) DEFAULT 0,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  color TEXT DEFAULT '#8B5CF6', -- Cor do cartão na UI
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela: Compras no Cartão
CREATE TABLE public.credit_card_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  total_installments INTEGER NOT NULL DEFAULT 1,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela: Parcelas do Cartão
CREATE TABLE public.credit_card_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.credit_card_purchases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference_month DATE NOT NULL, -- Mês de referência (YYYY-MM-01)
  status public.installment_status DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela: Faturas do Cartão
CREATE TABLE public.credit_card_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference_month DATE NOT NULL, -- Mês de referência (YYYY-MM-01)
  total_amount NUMERIC(12,2) DEFAULT 0,
  status public.statement_status DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(card_id, reference_month)
);

-- 7. RLS Policies

-- credit_cards
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- credit_card_purchases
ALTER TABLE public.credit_card_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.credit_card_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.credit_card_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON public.credit_card_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- credit_card_installments
ALTER TABLE public.credit_card_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installments"
  ON public.credit_card_installments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installments"
  ON public.credit_card_installments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installments"
  ON public.credit_card_installments FOR UPDATE
  USING (auth.uid() = user_id);

-- credit_card_statements
ALTER TABLE public.credit_card_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statements"
  ON public.credit_card_statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statements"
  ON public.credit_card_statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statements"
  ON public.credit_card_statements FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Indexes
CREATE INDEX idx_credit_cards_user ON public.credit_cards(user_id);
CREATE INDEX idx_cc_purchases_card ON public.credit_card_purchases(card_id);
CREATE INDEX idx_cc_purchases_user ON public.credit_card_purchases(user_id);
CREATE INDEX idx_cc_installments_purchase ON public.credit_card_installments(purchase_id);
CREATE INDEX idx_cc_installments_month ON public.credit_card_installments(reference_month);
CREATE INDEX idx_cc_installments_user ON public.credit_card_installments(user_id);
CREATE INDEX idx_cc_statements_card_month ON public.credit_card_statements(card_id, reference_month);
