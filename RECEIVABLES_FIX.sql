-- ═══════════════════════════════════════════════════════════════
-- SALDIN - RECEIVABLES UPDATES (LOANS & INSTALLMENTS)
-- ═══════════════════════════════════════════════════════════════
-- INSTRUÇÕES:
-- 1. Vá para o Supabase Dashboard > SQL Editor.
-- 2. Cole e execute este script.
-- ═══════════════════════════════════════════════════════════════

-- Adicionar colunas necessárias à tabela de recebíveis (receivables)
ALTER TABLE public.receivables 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id),
ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES public.bank_accounts(id),
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_group_id UUID,
ADD COLUMN IF NOT EXISTS installment_number INTEGER,
ADD COLUMN IF NOT EXISTS total_installments INTEGER;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_receivables_bank_account ON public.receivables(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_receivables_source_account ON public.receivables(source_account_id);
CREATE INDEX IF NOT EXISTS idx_receivables_group_id ON public.receivables(installment_group_id);

-- Confirmação
SELECT 'Receivables table updated successfully' as status;
