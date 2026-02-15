# ✅ CHECKLIST - Configuração de API Keys do WhatsApp Agent

## 📍 STATUS ATUAL

### ✅ O que já está pronto:
1. ✅ **Edge Function deployed** (v5) - `whatsapp-webhook`
2. ✅ **Banco de dados configurado** - Tabelas e RPC criados
3. ✅ **Código pronto** - Todos os arquivos (.ts) implementados
4. ✅ **Template de ENV** - `.env.example` criado em `supabase/functions/`

### ❓ O que precisa ser verificado:
**API Keys no Supabase (Secrets na nuvem)**

---

## 🔑 VERIFICAR SE AS CHAVES JÁ FORAM CONFIGURADAS

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse:** https://supabase.com/dashboard/project/vmkhqtuqgvtcapwmxtov/settings/functions
   
2. **Vá em:** Settings → Edge Functions → **Secrets**

3. **Verifique se existem:**
   - `ANTHROPIC_API_KEY`
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `OPENAI_API_KEY` (opcional)

4. **Se NÃO existirem**, adicione agora:
   - Clique em **"Add new secret"**
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: `sk-ant-...` (sua chave)
   - Repita para as outras

---

### Opção 2: Via Supabase CLI (Terminal)

```bash
# Ver todos os secrets configurados (apenas nomes, não valores)
supabase secrets list --project-ref vmkhqtuqgvtcapwmxtov

# Se não existirem, adicionar:
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx --project-ref vmkhqtuqgvtcapwmxtov
supabase secrets set EVOLUTION_API_URL=https://sua-api.com --project-ref vmkhqtuqgvtcapwmxtov
supabase secrets set EVOLUTION_API_KEY=seu_token --project-ref vmkhqtuqgvtcapwmxtov
```

---

## 📝 CHAVES NECESSÁRIAS

### 1. **ANTHROPIC_API_KEY** (Obrigatório)
**Função:** Analisar mensagens com Claude AI  
**Onde obter:** https://console.anthropic.com/settings/keys  
**Formato:** `sk-ant-api03-...`

**Como criar:**
1. Acesse https://console.anthropic.com/
2. Faça login ou crie conta
3. Vá em **API Keys** → **Create Key**
4. Copie a chave

---

### 2. **EVOLUTION_API_URL** (Obrigatório)
**Função:** URL da sua instância Evolution API  
**Formato:** `https://evolution.seudominio.com` (sem barra final)

**Opções:**
- Se você **já tem** uma Evolution API rodando → use a URL dela
- Se **não tem** → precisa instalar:
  - Docker: https://doc.evolution-api.com/install/docker
  - VPS: https://doc.evolution-api.com/install/vps
  - Cloud: https://doc.evolution-api.com/install/railway

---

### 3. **EVOLUTION_API_KEY** (Obrigatório)
**Função:** Token de autenticação da Evolution API  
**Formato:** String qualquer (você define ao instalar)

**Como obter:**
- Se já instalou: está no arquivo `.env` da Evolution (variável `AUTHENTICATION_API_KEY`)
- Se vai instalar: você define uma senha forte

---

### 4. **OPENAI_API_KEY** (Opcional)
**Função:** Transcrever áudios com Whisper  
**Onde obter:** https://platform.openai.com/api-keys  
**Formato:** `sk-proj-...`

**Observação:** Por enquanto está em mock (não está sendo usado). Pode adicionar depois.

---

## 🎯 PRÓXIMOS PASSOS

### Se as chaves JÁ estão configuradas:
✅ Tudo pronto! Pode pular para **"Testar o fluxo"** no `WHATSAPP_AGENT_README.md`

### Se as chaves NÃO estão configuradas:

1. **Criar conta na Anthropic:**
   - https://console.anthropic.com/
   - Criar API Key
   - Copiar `sk-ant-...`

2. **Configurar Evolution API:**
   - Instalar (se não tiver)
   - Anotar URL e API Key

3. **Adicionar secrets no Supabase:**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref vmkhqtuqgvtcapwmxtov
   supabase secrets set EVOLUTION_API_URL=https://... --project-ref vmkhqtuqgvtcapwmxtov
   supabase secrets set EVOLUTION_API_KEY=... --project-ref vmkhqtuqgvtcapwmxtov
   ```

4. **Verificar no Dashboard:**
   - https://supabase.com/dashboard/project/vmkhqtuqgvtcapwmxtov/settings/functions
   - Confirmar que as chaves aparecem listadas

---

## 🧪 TESTAR SE ESTÁ TUDO CONFIGURADO

```bash
# Ver os logs da Edge Function em tempo real
supabase functions logs whatsapp-webhook --tail --project-ref vmkhqtuqgvtcapwmxtov
```

**O que procurar nos logs:**
- ❌ `ANTHROPIC_API_KEY is undefined` → Chave não configurada
- ✅ `AI Analysis...` → Chave funcionando

---

## 📞 RESUMO RÁPIDO

| Item | Status | Ação |
|------|--------|------|
| Edge Function deployed | ✅ | Nenhuma |
| Banco configurado | ✅ | Nenhuma |
| ANTHROPIC_API_KEY | ❓ | Verificar no Dashboard |
| EVOLUTION_API_URL | ❓ | Verificar no Dashboard |
| EVOLUTION_API_KEY | ❓ | Verificar no Dashboard |

---

**Me avise depois de verificar se as chaves estão configuradas ou não!** 🚀
