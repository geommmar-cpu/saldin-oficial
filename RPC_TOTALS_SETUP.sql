-- ═══════════════════════════════════════════════════════════════
-- SALDIN - PERFORMANCE OPTIMIZATION (RPC FUNCTIONS)
-- ═══════════════════════════════════════════════════════════════
-- INSTRUÇÕES:
-- 1. Vá para o Supabase Dashboard > SQL Editor.
-- 2. Cole e execute este script.
-- 
-- ESTE SCRIPT IRÁ:
-- Criar uma função segura (RPC) para calcular totais de gastos
-- diretamente no banco de dados, evitando baixar milhares de registros
-- para o frontend.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_monthly_expenses_stats(
  year_input INTEGER,
  month_input INTEGER
)
RETURNS TABLE (
  total NUMERIC,
  impulse_total NUMERIC,
  impulse_percentage INTEGER,
  count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  v_total NUMERIC;
  v_impulse_total NUMERIC;
  v_count INTEGER;
  v_confirmed_count INTEGER;
BEGIN
  -- Definir período (Mês/Ano)
  start_date := make_date(year_input, month_input + 1, 1);
  -- Lógica para o próximo mês (tratando dezembro)
  if month_input = 11 then
    end_date := make_date(year_input + 1, 1, 1);
  else
    end_date := make_date(year_input, month_input + 2, 1);
  end if;

  -- Calcular totais em uma única query rápida
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN emotion = 'impulso' THEN amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN emotion IS NOT NULL THEN 1 END)
  INTO 
    v_total,
    v_impulse_total,
    v_count,
    v_confirmed_count
  FROM expenses
  WHERE 
    user_id = auth.uid() -- Segurança RLS forçada manualmente
    AND status != 'deleted'
    AND date >= start_date 
    AND date < end_date;

  -- Retornar resultado estruturado
  RETURN QUERY SELECT 
    v_total,
    v_impulse_total,
    CASE 
      WHEN v_confirmed_count > 0 THEN CAST(ROUND((v_impulse_total / v_total) * 100) AS INTEGER) -- Percentual sobre o total financeiro ou sobre contagem? 
      -- O código original JS fazia: (impulseExpenses.length / confirmedCount) * 100 
      -- O código original calculava % de QUANTIDADE de itens de impulso, não de VALOR.
      -- Vou manter a lógica original (count), mas corrigindo para ser sobre o total de itens com emoção definida.
      WHEN v_confirmed_count > 0 THEN CAST(ROUND((CAST(COUNT(CASE WHEN emotion = 'impulso' THEN 1 END) AS NUMERIC) / v_confirmed_count) * 100) AS INTEGER)
      ELSE 0
    END,
    v_count;
END;
$$;

-- Corrigindo a lógica do percentual para bater EXATAMENTE com o original do JS:
-- Original JS: 
-- const impulseExpenses = expenses.filter((e) => e.emotion === "impulso");
-- const confirmedCount = expenses.filter((e) => e.emotion !== null).length;
-- const impulsePercentage = confirmedCount > 0 ? Math.round((impulseExpenses.length / confirmedCount) * 100) : 0;

CREATE OR REPLACE FUNCTION public.get_monthly_expenses_stats(
  year_input INTEGER,
  month_input INTEGER
)
RETURNS TABLE (
  total NUMERIC,
  impulse_total NUMERIC,
  impulse_percentage INTEGER,
  count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  v_total NUMERIC;
  v_impulse_total NUMERIC;
  v_count INTEGER;
  v_impulse_count INTEGER;
  v_confirmed_emotion_count INTEGER;
BEGIN
  -- Definir data inicial
  start_date := make_date(year_input, month_input + 1, 1);
  
  -- Definir data final (primeiro dia do mês seguinte)
  if month_input = 11 then
    end_date := make_date(year_input + 1, 1, 1);
  else
    end_date := make_date(year_input, month_input + 2, 1);
  end if;

  SELECT 
    -- Totais monetários
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN emotion = 'impulso' THEN amount ELSE 0 END), 0),
    -- Contagens para estatística
    COUNT(*),
    COUNT(CASE WHEN emotion = 'impulso' THEN 1 END),
    COUNT(CASE WHEN emotion IS NOT NULL THEN 1 END)
  INTO 
    v_total,
    v_impulse_total,
    v_count,
    v_impulse_count,
    v_confirmed_emotion_count
  FROM expenses
  WHERE 
    user_id = auth.uid()
    AND status != 'deleted'
    AND date >= start_date 
    AND date < end_date;

  RETURN QUERY SELECT 
    v_total,
    v_impulse_total,
    CASE 
      WHEN v_confirmed_emotion_count > 0 THEN CAST(ROUND((CAST(v_impulse_count AS NUMERIC) / v_confirmed_emotion_count) * 100) AS INTEGER)
      ELSE 0
    END,
    v_count;
END;
$$;
