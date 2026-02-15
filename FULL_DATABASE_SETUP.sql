-- ═══════════════════════════════════════════════════════════════
-- SALDIN - FULL DATABASE SETUP SCRIPT
-- ═══════════════════════════════════════════════════════════════
-- INSTRUÇÕES:
-- 1. Copie todo o conteúdo deste arquivo.
-- 2. Vá para o Supabase Dashboard > SQL Editor.
-- 3. Cole e execute (Run).
-- 
-- ESTE SCRIPT IRÁ:
-- 1. Limpar tabelas antigas (DROP) para evitar conflitos.
-- 2. Criar a estrutura base (Categorias, Despesas, Receitas...).
-- 3. Criar os módulos adicionais (Bancos, Cartões, Metas, Crypto).
-- ═══════════════════════════════════════════════════════════════

-- [PART 1] CLEANUP (Baseado na migration 20260203203036)
DROP TABLE IF EXISTS public.receivable_installments CASCADE;
DROP TABLE IF EXISTS public.receivables CASCADE;
DROP TABLE IF EXISTS public.debt_installments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.incomes CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.bank_transfers CASCADE;
DROP TABLE IF EXISTS public.credit_cards CASCADE;
DROP TABLE IF EXISTS public.credit_card_purchases CASCADE;
DROP TABLE IF EXISTS public.credit_card_installments CASCADE;
DROP TABLE IF EXISTS public.credit_card_statements CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.goal_transactions CASCADE;
DROP TABLE IF EXISTS public.crypto_wallets CASCADE;
DROP TABLE IF EXISTS public.crypto_transactions CASCADE;

-- Drop custom types/enums
DROP TYPE IF EXISTS public.alert_frequency CASCADE;
DROP TYPE IF EXISTS public.alert_type CASCADE;
DROP TYPE IF EXISTS public.debt_category CASCADE;
DROP TYPE IF EXISTS public.debt_status CASCADE;
DROP TYPE IF EXISTS public.debt_type CASCADE;
DROP TYPE IF EXISTS public.emotion_category CASCADE;
DROP TYPE IF EXISTS public.expense_category CASCADE;
DROP TYPE IF EXISTS public.expense_source CASCADE;
DROP TYPE IF EXISTS public.expense_status CASCADE;
DROP TYPE IF EXISTS public.expense_emotion CASCADE;
DROP TYPE IF EXISTS public.income_source CASCADE;
DROP TYPE IF EXISTS public.income_type CASCADE;
DROP TYPE IF EXISTS public.receivable_payment_type CASCADE;
DROP TYPE IF EXISTS public.receivable_status CASCADE;
DROP TYPE IF EXISTS public.record_source CASCADE;
DROP TYPE IF EXISTS public.bank_account_type CASCADE;
DROP TYPE IF EXISTS public.statement_status CASCADE;
DROP TYPE IF EXISTS public.installment_status CASCADE;
DROP TYPE IF EXISTS public.goal_status CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_initial_balance_income() CASCADE;
DROP FUNCTION IF EXISTS public.update_goals_updated_at() CASCADE;


-- [PART 2] CORE STRUCTURE (Baseado na migration 20260203210820)
-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  ai_name TEXT DEFAULT 'Luna',
  phone TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  crypto_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, ai_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', 'Luna');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIAS
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. GASTOS (EXPENSES)
CREATE TYPE public.expense_status AS ENUM ('pending', 'confirmed', 'deleted');
CREATE TYPE public.expense_emotion AS ENUM ('pilar', 'essencial', 'impulso');
CREATE TYPE public.expense_source AS ENUM ('manual', 'whatsapp', 'integration');

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emotion expense_emotion,
  status expense_status NOT NULL DEFAULT 'confirmed',
  source expense_source NOT NULL DEFAULT 'manual',
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installment_group_id UUID,
  installment_number INTEGER,
  total_installments INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- 4. RECEITAS (INCOMES)
CREATE TYPE public.income_type AS ENUM ('salary', 'freelance', 'investment', 'gift', 'other');

CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type income_type NOT NULL DEFAULT 'other',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incomes_user_date ON public.incomes(user_id, date DESC);
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own incomes" ON public.incomes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. DÍVIDAS (DEBTS)
CREATE TYPE public.debt_status AS ENUM ('active', 'paid', 'cancelled');

CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creditor_name TEXT NOT NULL,
  description TEXT,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date DATE,
  status debt_status NOT NULL DEFAULT 'active',
  is_installment BOOLEAN NOT NULL DEFAULT false,
  total_installments INTEGER,
  current_installment INTEGER,
  installment_amount NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own debts" ON public.debts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. VALORES A RECEBER
CREATE TYPE public.receivable_status AS ENUM ('pending', 'received', 'cancelled');

CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  debtor_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  status receivable_status NOT NULL DEFAULT 'pending',
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own receivables" ON public.receivables FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- [PART 3] BANK ACCOUNTS
CREATE TYPE public.bank_account_type AS ENUM ('checking', 'savings', 'payment', 'cash');

CREATE TABLE public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_key TEXT,
  account_type public.bank_account_type DEFAULT 'checking',
  initial_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  color TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transfers" ON public.bank_transfers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add bank_account_id to expenses/incomes
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);


-- [PART 4] CREDIT CARDS
CREATE TYPE public.statement_status AS ENUM ('open', 'closed', 'paid');
CREATE TYPE public.installment_status AS ENUM ('open', 'paid');

CREATE TABLE public.credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  card_brand TEXT,
  last_four_digits TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  color TEXT DEFAULT '#8B5CF6',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
ALTER TABLE public.credit_card_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own purchases" ON public.credit_card_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.credit_card_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.credit_card_purchases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference_month DATE NOT NULL,
  status public.installment_status DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_card_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own installments" ON public.credit_card_installments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.credit_card_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference_month DATE NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  status public.statement_status DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(card_id, reference_month)
);
ALTER TABLE public.credit_card_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own statements" ON public.credit_card_statements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- [PART 5] GOALS
CREATE TYPE goal_status AS ENUM ('in_progress', 'completed', 'paused');

CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    target_date DATE,
    color TEXT DEFAULT 'green',
    icon TEXT DEFAULT 'target',
    notes TEXT,
    status goal_status NOT NULL DEFAULT 'in_progress',
    is_personal BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.goal_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own goal transactions" ON public.goal_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- [PART 6] CRYPTO
CREATE TABLE public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(20,8) NOT NULL DEFAULT 0,
  display_currency TEXT NOT NULL DEFAULT 'BRL',
  last_price NUMERIC(18,2) DEFAULT 0,
  last_price_updated_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.crypto_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'adjustment')),
  quantity NUMERIC(20,8) NOT NULL,
  price_at_time NUMERIC(18,2),
  total_value NUMERIC(18,2),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own crypto" ON public.crypto_wallets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own crypto transactions" ON public.crypto_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- [PART 7] INITIAL BALANCE TRIGGER
ALTER TYPE public.income_type ADD VALUE IF NOT EXISTS 'initial_balance';

CREATE OR REPLACE FUNCTION public.create_initial_balance_income()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_balance > 0 THEN
    INSERT INTO public.incomes (user_id, description, amount, type, date, is_recurring, notes)
    VALUES (NEW.user_id, 'Saldo inicial - ' || COALESCE(NEW.bank_name, 'Conta'), NEW.current_balance, 'initial_balance', CURRENT_DATE, false, 'Receita gerada automaticamente.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initial_balance_income AFTER INSERT ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.create_initial_balance_income();

-- DONE!
