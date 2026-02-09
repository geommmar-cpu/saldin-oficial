-- ============================================================
-- PERSISTÊNCIA DE CONFIGURAÇÕES DO USUÁRIO
-- Adiciona colunas dark_mode e crypto_enabled na tabela profiles
-- Rode este script no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar colunas de configuração
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS crypto_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Confirmar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('dark_mode', 'crypto_enabled');
