-- ═══════════════════════════════════════════════════════════════
-- SALDIN WHATSAPP AGENT - SETUP SCRIPT
-- ═══════════════════════════════════════════════════════════════

-- 1. CONFIGURAÇÃO DE USUÁRIOS DO WHATSAPP
-- Mapeia números de telefone para usuários do sistema para segurança e agilidade.
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL UNIQUE, -- Formato E.164 (ex: 5511999999999)
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, phone_number)
);

ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;
-- Apenas service_role (Edge Function) deve acessar essa tabela por enquanto
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages whatsapp users') THEN
        CREATE POLICY "Service role manages whatsapp users" ON public.whatsapp_users USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 2. LOGS DE MENSAGENS (RAW)
-- Guarda tudo que chega para auditoria e debugging.
-- 2. LOGS DE MENSAGENS (RAW & IDEMPOTENCY)
-- Guarda tudo que chega para auditoria e debugging, com suporte a deduplicação.
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_user_id UUID REFERENCES public.whatsapp_users(id) ON DELETE SET NULL, -- Opcional
    phone_number TEXT, -- User Phone directly
    message_content JSONB, -- Payload completo da Evolution
    message_type TEXT, -- 'conversation', 'audioMessage', 'imageMessage'
    processed BOOLEAN DEFAULT false,
    processing_result JSONB, -- O que a IA extraiu
    error_message TEXT,
    message_id TEXT UNIQUE, -- Hardware Idempotency (ID da Mensagem WhatsApp)
    dedup_key TEXT UNIQUE,  -- Logic Idempotency (Phone + ContentHash + Minute)
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages logs') THEN
        CREATE POLICY "Service role manages logs" ON public.whatsapp_logs USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 3. SUPORTE A ASSINATURAS (MVP)
-- Adiciona campos de controle de assinatura no perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS wa_default_income_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wa_default_expense_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wa_default_expense_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.wa_default_income_account_id IS 'Conta padrão para receitas via WhatsApp';
COMMENT ON COLUMN public.profiles.wa_default_expense_card_id IS 'Cartão de crédito padrão para gastos via WhatsApp';
COMMENT ON COLUMN public.profiles.wa_default_expense_account_id IS 'Conta bancária padrão para gastos via WhatsApp (se não for cartão)';


-- 4. FUNÇÃO RPC PARA TRANSAÇÃO FINANCEIRA ATÔMICA
-- Garante que o registro da despesa/receita E a atualização do saldo aconteçam juntos ou falhem juntos.
-- Removemos versões antigas para evitar ambiguidade (Erro PGRST203)
DROP FUNCTION IF EXISTS public.process_financial_transaction(uuid, text, numeric, text, uuid, uuid, date, text);
DROP FUNCTION IF EXISTS public.process_financial_transaction(uuid, text, numeric, text, uuid, uuid, timestamptz, text);

CREATE OR REPLACE FUNCTION public.process_financial_transaction(
    p_user_id UUID,
    p_type TEXT, -- 'expense' ou 'income'
    p_amount NUMERIC,
    p_description TEXT,
    p_category_id UUID DEFAULT NULL,
    p_bank_account_id UUID DEFAULT NULL,
    p_date TIMESTAMPTZ DEFAULT NOW(),
    p_source TEXT DEFAULT 'whatsapp'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_card_id UUID;
    v_profile RECORD;
    v_transaction_id UUID;
    v_installment_id UUID;
    v_new_balance NUMERIC;
    v_is_credit_card BOOLEAN := false;
    v_clean_amount NUMERIC;
    v_clean_type TEXT;
    v_dest_name TEXT;
    v_result JSONB;
BEGIN
    -- 1. Buscar Perfil e IDs Padrão
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- Garantir valor positivo para evitar inversão de sinal por erro da IA
    v_clean_amount := ABS(p_amount);
    v_clean_type := LOWER(TRIM(p_type));

    -- 2. Resolver Destino (Conta ou Cartão)
    IF v_clean_type = 'income' THEN
        v_account_id := COALESCE(p_bank_account_id, v_profile.wa_default_income_account_id);
    ELSE -- expense
        -- Prioridade para Cartão se o usuário definiu um padrão para WhatsApp
        IF p_bank_account_id IS NULL AND v_profile.wa_default_expense_card_id IS NOT NULL THEN
            v_card_id := v_profile.wa_default_expense_card_id;
            v_is_credit_card := true;
        ELSE
            -- Senão, tenta conta padrão de gastos
            v_account_id := COALESCE(p_bank_account_id, v_profile.wa_default_expense_account_id);
        END IF;
    END IF;

    -- 3. Fallback: Pega a primeira conta ativa encontrada se nada foi resolvido
    IF v_account_id IS NULL AND v_card_id IS NULL THEN
        SELECT id INTO v_account_id 
        FROM public.bank_accounts 
        WHERE user_id = p_user_id AND active = true 
        ORDER BY account_type = 'checking' DESC, created_at ASC LIMIT 1;
    END IF;

    -- 4. Garantir que temos um destino e pegar o nome
    IF v_is_credit_card THEN
        SELECT card_name INTO v_dest_name FROM public.credit_cards WHERE id = v_card_id;
    ELSIF v_account_id IS NOT NULL THEN
        SELECT bank_name INTO v_dest_name FROM public.bank_accounts WHERE id = v_account_id;
    END IF;

    IF v_dest_name IS NULL THEN
        RAISE EXCEPTION 'Nenhuma conta ou cartão configurado. Adicione uma conta no app.';
    END IF;

    -- 5. Processar Transação
    IF v_clean_type = 'income' THEN
        -- Inserir Receita
        INSERT INTO public.incomes (user_id, bank_account_id, description, amount, date, type)
        VALUES (p_user_id, v_account_id, p_description, v_clean_amount, p_date, 'other')
        RETURNING id INTO v_transaction_id;

        -- Atualizar Saldo Bancário
        UPDATE public.bank_accounts 
        SET current_balance = current_balance + v_clean_amount, updated_at = now()
        WHERE id = v_account_id;

    ELSIF v_clean_type = 'expense' THEN
        IF v_is_credit_card THEN
            -- Inserir no Cartão de Crédito (credit_card_purchases)
            INSERT INTO public.credit_card_purchases (user_id, card_id, description, total_amount, category_id, purchase_date)
            VALUES (p_user_id, v_card_id, p_description, v_clean_amount, p_category_id, p_date::date)
            RETURNING id INTO v_transaction_id;
            
            -- CRIAR AUTOMATICAMENTE A PRIMEIRA PARCELA
            INSERT INTO public.credit_card_installments (
                purchase_id, user_id, installment_number, amount, reference_month, status
            ) VALUES (
                v_transaction_id, p_user_id, 1, v_clean_amount, date_trunc('month', p_date)::date, 'open'
            ) RETURNING id INTO v_installment_id;
        ELSE
            -- Inserir Despesa em Conta (expenses)
            INSERT INTO public.expenses (user_id, category_id, bank_account_id, description, amount, date, source, status)
            VALUES (p_user_id, p_category_id, v_account_id, p_description, v_clean_amount, p_date, p_source::expense_source, 'confirmed')
            RETURNING id INTO v_transaction_id;

            -- Atualizar Saldo Bancário (SUBTRAIR)
            UPDATE public.bank_accounts 
            SET current_balance = current_balance - v_clean_amount, updated_at = now()
            WHERE id = v_account_id;
        END IF;
    END IF;

    -- 6. Calcular Saldo Disponível (Líquido)
    -- Agora reflete exatamente o saldo que o usuário vê na tela inicial do app (descontando metas e cartões)
    v_new_balance := public.calculate_liquid_balance(p_user_id);

    -- 7. Retorno de Sucesso
    RETURN jsonb_build_object(
        'status', 'success',
        'sub_type', v_clean_type,
        'transaction_id', v_transaction_id,
        'installment_id', v_installment_id,
        'new_balance', v_new_balance,
        'is_credit_card', v_is_credit_card,
        'dest_name', v_dest_name,
        'account_id', COALESCE(v_account_id, v_card_id)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
