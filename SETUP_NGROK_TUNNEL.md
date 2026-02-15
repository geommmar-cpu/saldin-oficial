# 🌐 CONFIGURAR NGROK PARA EVOLUTION API LOCAL

## 📍 SITUAÇÃO ATUAL
- Evolution API: Rodando local na porta 8080 ✅
- Supabase Edge Function: Na nuvem ✅
- Problema: Supabase não acessa localhost ❌

## 🔧 SOLUÇÃO: Ngrok (Túnel para internet)

### PASSO 1: Instalar Ngrok

#### Opção A: Download direto
1. Acesse: https://ngrok.com/download
2. Baixe para Windows
3. Extraia o arquivo `ngrok.exe`

#### Opção B: Via Chocolatey (se tiver)
```powershell
choco install ngrok
```

#### Opção C: Via Scoop (se tiver)
```powershell
scoop install ngrok
```

---

### PASSO 2: Criar conta e pegar Auth Token

1. Crie conta grátis em: https://dashboard.ngrok.com/signup
2. Copie seu auth token em: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure o token:
```powershell
ngrok authtoken SEU_TOKEN_AQUI
```

---

### PASSO 3: Iniciar túnel para Evolution API

```powershell
# Expor a porta 8080 da Evolution API
ngrok http 8080
```

**Resultado esperado:**
```
Forwarding https://abc123.ngrok.io -> http://localhost:8080
```

⚠️ **IMPORTANTE:** Copie essa URL `https://abc123.ngrok.io`

---

### PASSO 4: Atualizar EVOLUTION_API_URL no Supabase

Execute este comando COM A URL DO NGROK:

```powershell
supabase secrets set EVOLUTION_API_URL="https://abc123.ngrok.io" --project-ref vmkhqtuqgvtcapwmxtov
```

⚠️ **ATENÇÃO:** Toda vez que o ngrok reiniciar, a URL muda! Precisa atualizar novamente.

---

### PASSO 5: Configurar Webhook na Evolution API

Acesse a Evolution API e configure o webhook:

**URL do Webhook:**
```
https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook
```

**Você pode configurar via:**

#### Opção A: API (Recomendado)
```powershell
# Substitua:
# - YOUR_INSTANCE: nome da instância (ex: saldin-bot)
# - YOUR_API_KEY: sua API key da Evolution

curl -X POST http://localhost:8080/webhook/set/YOUR_INSTANCE `
  -H "apikey: YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "enabled": true,
    "url": "https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }'
```

#### Opção B: Interface Web da Evolution
1. Acesse: http://localhost:8080
2. Vá em sua instância
3. Settings → Webhook
4. Cole a URL do webhook Supabase
5. Ative os eventos: `MESSAGES_UPSERT`

---

## 📋 CHECKLIST COMPLETO

### Docker (Local)
- [x] Evolution API rodando (`docker ps`)
- [x] Postgres rodando
- [x] Redis rodando
- [x] Porta 8080 acessível

### Ngrok
- [ ] Instalado
- [ ] Auth token configurado
- [ ] Túnel rodando (`ngrok http 8080`)
- [ ] URL copiada (https://xxx.ngrok.io)

### Supabase
- [ ] EVOLUTION_API_URL atualizada com URL do ngrok
- [ ] Edge Function deployed (já está ✅)

### Evolution API
- [ ] Instância criada
- [ ] WhatsApp conectado (QR Code)
- [ ] Webhook configurado para Supabase

---

## 🎯 TESTE FINAL

Depois de tudo configurado:

1. Envie mensagem do WhatsApp: "Teste"
2. Veja os logs no terminal do ngrok
3. Veja os logs no Supabase Dashboard
4. Receba resposta automática!

---

## ⚠️ ALTERNATIVA (PRODUÇÃO)

Para **produção**, recomendo:

1. **Deploy da Evolution API em servidor cloud:**
   - Railway: https://railway.app/
   - Render: https://render.com/
   - DigitalOcean: https://www.digitalocean.com/

2. **Vantagens:**
   - URL fixa (não muda)
   - Sempre online
   - Não precisa ngrok
   - Mais confiável

---

**Quer ajuda para configurar o ngrok agora?** 🚀
