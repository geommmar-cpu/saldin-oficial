-- ADICIONA COLUNA ONBOARDING_COMPLETED
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- MARCA COMO TODOS CONCLUÍDOS (PARA USUÁRIOS VELHOS)
UPDATE public.profiles
SET onboarding_completed = true;

-- HABILITA PERMISSÃO DE UPDATE PARA O USUÁRIO (RSL)
-- (Geralmente o usuário já tem, mas garantimos)
GRANT UPDATE(onboarding_completed) ON public.profiles TO authenticated;
