-- =====================================================
-- SQL para criar as tabelas de METAS FINANCEIRAS
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Criar enum para status da meta
DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('in_progress', 'completed', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Metas (goals)
CREATE TABLE IF NOT EXISTS public.goals (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Transações de Metas (goal_transactions)
CREATE TABLE IF NOT EXISTS public.goal_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_goal_id ON public.goal_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_user_id ON public.goal_transactions(user_id);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para goals
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Políticas RLS para goal_transactions
DROP POLICY IF EXISTS "Users can view own goal transactions" ON public.goal_transactions;
CREATE POLICY "Users can view own goal transactions" ON public.goal_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goal transactions" ON public.goal_transactions;
CREATE POLICY "Users can insert own goal transactions" ON public.goal_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goal transactions" ON public.goal_transactions;
CREATE POLICY "Users can delete own goal transactions" ON public.goal_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goals_updated_at();

-- =====================================================
-- PRONTO! As tabelas foram criadas com sucesso.
-- Agora você pode usar a funcionalidade de Metas no app.
-- =====================================================
