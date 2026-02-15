-- ═══════════════════════════════════════════════════════════════
-- SALDIN - PERFORMANCE OPTIMIZATION (INDEXES)
-- ═══════════════════════════════════════════════════════════════
-- INSTRUÇÕES:
-- 1. Vá para o Supabase Dashboard > SQL Editor.
-- 2. Cole e execute este script.
-- 
-- ESTE SCRIPT IRÁ:
-- Criar índices para otimizar a ordenação e filtros das principais tabelas.
-- ═══════════════════════════════════════════════════════════════

-- 1. EXPENSES (Gastos)
-- Otimiza a lista principal (ordenada por data/criação)
CREATE INDEX IF NOT EXISTS idx_expenses_user_created_at ON public.expenses(user_id, created_at DESC);
-- Otimiza filtros por categoria
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
-- Otimiza joins com contas bancárias
CREATE INDEX IF NOT EXISTS idx_expenses_bank_account_id ON public.expenses(bank_account_id);

-- 2. INCOMES (Receitas)
-- Otimiza a lista principal e ordenação
CREATE INDEX IF NOT EXISTS idx_incomes_user_created_at ON public.incomes(user_id, created_at DESC);
-- Otimiza joins com contas bancárias
CREATE INDEX IF NOT EXISTS idx_incomes_bank_account_id ON public.incomes(bank_account_id);

-- 3. CREDIT CARD PURCHASES (Compras Cartão)
-- Otimiza filtros por categoria e ordenação por data de compra
CREATE INDEX IF NOT EXISTS idx_cc_purchases_category_id ON public.credit_card_purchases(category_id);
CREATE INDEX IF NOT EXISTS idx_cc_purchases_user_date ON public.credit_card_purchases(user_id, purchase_date DESC);

-- 4. CRYPTO TRANSACTIONS
-- Otimiza joins com contas bancárias
CREATE INDEX IF NOT EXISTS idx_crypto_tx_bank_account_id ON public.crypto_transactions(bank_account_id);

-- 5. GOALS (Metas)
-- Otimiza a lista de metas
CREATE INDEX IF NOT EXISTS idx_goals_user_target_date ON public.goals(user_id, target_date ASC);

-- 6. RECEIVABLES & DEBTS (Contas a Receber/Pagar)
-- Otimiza ordenação por vencimento
CREATE INDEX IF NOT EXISTS idx_receivables_user_due_date ON public.receivables(user_id, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_debts_user_due_date ON public.debts(user_id, due_date ASC);

-- Confirmation
SELECT 'Indexes created successfully' as status;
