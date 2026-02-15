-- ATUALIZAÇÃO DA FUNÇÃO HANDLE_NEW_USER
-- Objetivo: Corrigir o problema onde o telefone (phone) não estava sendo salvo ao criar usuário.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, ai_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    'Luna',
    NEW.raw_user_meta_data ->> 'phone' -- Adicionado mapeamento do telefone
  );
  RETURN NEW;
END;
$$;

-- Opcional: Tentar recuperar telefones de usuários já criados (se estiverem nos metadados)
UPDATE public.profiles
SET phone = auth.users.raw_user_meta_data ->> 'phone'
FROM auth.users
WHERE public.profiles.user_id = auth.users.id
AND public.profiles.phone IS NULL
AND auth.users.raw_user_meta_data ->> 'phone' IS NOT NULL;
