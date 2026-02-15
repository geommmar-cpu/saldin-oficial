-- CORREÇÃO DE ONBOARDING
-- Marca todos os perfis existentes como 'onboarding concluído' para evitar o loop de redirecionamento.

UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Opcional: Garantir que a coluna tenha valor padrão false (se não tiver)
ALTER TABLE public.profiles 
ALTER COLUMN onboarding_completed SET DEFAULT false;
