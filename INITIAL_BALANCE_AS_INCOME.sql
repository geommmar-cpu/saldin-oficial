-- ============================================================
-- SCRIPT: Registrar saldo inicial de contas bancárias como receita
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar novo tipo de receita ao enum
ALTER TYPE public.income_type ADD VALUE IF NOT EXISTS 'initial_balance';

-- 2. Criar trigger function que insere receita ao criar conta com saldo > 0
CREATE OR REPLACE FUNCTION public.create_initial_balance_income()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só cria receita se o saldo inicial for maior que zero
  IF NEW.current_balance > 0 THEN
    INSERT INTO public.incomes (
      user_id,
      description,
      amount,
      type,
      date,
      is_recurring,
      notes
    ) VALUES (
      NEW.user_id,
      'Saldo inicial - ' || COALESCE(NEW.name, 'Conta'),
      NEW.current_balance,
      'initial_balance',
      CURRENT_DATE,
      false,
      'Receita gerada automaticamente ao cadastrar conta com saldo inicial.'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Criar o trigger na tabela bank_accounts
DROP TRIGGER IF EXISTS trg_initial_balance_income ON public.bank_accounts;

CREATE TRIGGER trg_initial_balance_income
  AFTER INSERT ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_balance_income();

-- ============================================================
-- OPCIONAL: Gerar receitas retroativas para contas já existentes
-- que possuem saldo mas nunca tiveram receita inicial registrada.
-- Descomente e execute SE desejar corrigir dados antigos.
-- ============================================================

-- INSERT INTO public.incomes (user_id, description, amount, type, date, is_recurring, notes)
-- SELECT
--   ba.user_id,
--   'Saldo inicial - ' || COALESCE(ba.name, 'Conta'),
--   ba.current_balance,
--   'initial_balance',
--   COALESCE(ba.created_at::date, CURRENT_DATE),
--   false,
--   'Receita retroativa: saldo inicial da conta.'
-- FROM public.bank_accounts ba
-- WHERE ba.current_balance > 0
--   AND NOT EXISTS (
--     SELECT 1 FROM public.incomes i
--     WHERE i.user_id = ba.user_id
--       AND i.type = 'initial_balance'
--       AND i.description LIKE '%' || COALESCE(ba.name, 'Conta') || '%'
--   );
