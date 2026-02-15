# ========================================
# CONFIGURAR OPENAI API KEY NO SUPABASE
# ========================================

# 1. OBTER A CHAVE DA OPENAI
# Acesse: https://platform.openai.com/api-keys
# Clique em "Create new secret key"
# Dê um nome (ex: "Saldin WhatsApp Agent")
# Copie a chave (formato: sk-proj-...)

# 2. CONFIGURAR NO SUPABASE (escolha uma opção)

## OPÇÃO A: Via Supabase CLI (recomendado se você tem a CLI instalada)
supabase secrets set OPENAI_API_KEY="sk-proj-SEU_TOKEN_AQUI" --project-ref vmkhqtuqgvtcapwmxtov

## OPÇÃO B: Via Dashboard Web
# 1. Acesse: https://supabase.com/dashboard/project/vmkhqtuqgvtcapwmxtov/settings/functions
# 2. No menu lateral: Settings → Edge Functions → Secrets
# 3. Clique em "Add new secret"
# 4. Name: OPENAI_API_KEY
# 5. Value: sk-proj-SEU_TOKEN_AQUI
# 6. Salvar

# 3. VERIFICAR SE FOI CONFIGURADO
supabase secrets list --project-ref vmkhqtuqgvtcapwmxtov

# Você deve ver "OPENAI_API_KEY" na lista

# 4. TESTAR
# Envie um áudio no WhatsApp e veja os logs:
supabase functions logs whatsapp-webhook --tail --project-ref vmkhqtuqgvtcapwmxtov
