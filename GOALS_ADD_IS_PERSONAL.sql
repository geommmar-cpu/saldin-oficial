-- =====================================================
-- SQL para adicionar campo is_personal na tabela goals
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- Adicionar coluna is_personal (default true = meta pessoal)
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT true;

-- =====================================================
-- PRONTO! Metas existentes serão marcadas como pessoais.
-- Novas metas podem ser criadas como "para terceiros" 
-- (is_personal = false), sem afetar o saldo livre.
-- =====================================================
