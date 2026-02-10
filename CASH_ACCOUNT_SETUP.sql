-- ═══════════════════════════════════════════════════════════════
-- SALDIN - Adicionar tipo "cash" à enum de contas bancárias
-- Execute este script no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1) Adicionar valor 'cash' ao enum bank_account_type
ALTER TYPE public.bank_account_type ADD VALUE IF NOT EXISTS 'cash';

-- Pronto! O app criará automaticamente a conta "Dinheiro em mãos"
-- quando o usuário fizer o primeiro gasto ou receita em dinheiro.
