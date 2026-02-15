# 🤖 EVOLUTION API - GUIA RÁPIDO

## ❓ **PRECISA ESTAR RODANDO LOCALMENTE?**

**RESPOSTA:** Depende de onde você instalou!

---

## 🔍 **VERIFICAR SUA CONFIGURAÇÃO ATUAL**

Você já tem a `EVOLUTION_API_URL` configurada no Supabase. Para ver qual URL está:

### **Opção 1: Ver no código**
A URL está sendo usada na linha 10 do `index.ts`:
```typescript
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
```

### **Opção 2: Testar se está online**
Execute este teste para ver se sua Evolution API está respondendo:

```bash
# Windows (PowerShell)
curl -H "apikey: SUA_EVOLUTION_API_KEY" https://SUA_URL/instance/fetchInstances

# Ou use Postman/Insomnia
```

---

## 🌐 **ONDE SUA EVOLUTION API DEVE ESTAR:**

### ✅ **PRODUÇÃO (Recomendado)**
- **Local:** Servidor na nuvem (VPS, AWS, DigitalOcean, Railway)
- **URL:** `https://evolution.seudominio.com`
- **Vantagens:**
  - ✅ Sempre online
  - ✅ Supabase consegue acessar
  - ✅ WhatsApp funciona 24/7
  
### ⚠️ **DESENVOLVIMENTO LOCAL**
- **Local:** Seu computador
- **URL:** `http://localhost:8080` ou `http://192.168.x.x:8080`
- **Problemas:**
  - ❌ Supabase não acessa localhost
  - ❌ Precisa de túnel (ngrok)
  - ❌ Computador precisa ficar ligado

---

## 🚀 **CENÁRIOS COMUNS:**

### **Cenário 1: Você tem Evolution na nuvem**
```
✅ Evolution API rodando em: https://evolution.seudominio.com
✅ Supabase consegue enviar webhooks
✅ WhatsApp funciona 24/7
✅ NADA precisa rodar localmente

AÇÃO: Nenhuma! Tudo já funciona.
```

### **Cenário 2: Você tem Evolution local + Ngrok**
```
⚠️ Evolution API local: http://localhost:8080
⚠️ Ngrok expõe: https://abc123.ngrok.io
⚠️ Supabase envia para: https://abc123.ngrok.io

AÇÃO: 
1. Deixar Evolution rodando local
2. Deixar ngrok rodando
3. Atualizar EVOLUTION_API_URL toda vez que ngrok reiniciar
```

### **Cenário 3: Você NÃO tem Evolution ainda**
```
❌ Evolution API não instalada

AÇÃO:
1. Instalar Evolution API em servidor cloud
2. Conectar WhatsApp (escanear QR Code)
3. Configurar webhook para webhook Supabase
```

---

## 🔧 **COMO DESCOBRIR SEU CENÁRIO:**

Execute estes comandos no terminal:

```powershell
# 1. Ver se Evolution está rodando localmente
curl http://localhost:8080/instance/fetchInstances

# Se der erro → Não está local
# Se retornar JSON → Está rodando local na porta 8080
```

---

## 📋 **CHECKLIST DE CONFIGURAÇÃO:**

### **Na Evolution API (onde estiver rodando):**
- [ ] Evolution API está online e acessível
- [ ] WhatsApp está conectado (QR Code escaneado)
- [ ] Instância criada (ex: "saldin-bot")
- [ ] Webhook configurado para apontar para Supabase:
  ```
  https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook
  ```

### **No Supabase (já configurado):**
- [x] EVOLUTION_API_URL definido
- [x] EVOLUTION_API_KEY definido
- [x] Edge Function deployed
- [x] Números verificados na tabela `whatsapp_users`

---

## 🎯 **TESTE RÁPIDO:**

Para saber se está tudo funcionando, envie uma mensagem de teste:

**Do WhatsApp:** "Teste"

**Resultado esperado:**
- ✅ Evolution recebe
- ✅ Evolution envia para Supabase webhook
- ✅ Webhook processa
- ✅ Você recebe resposta

**Se não funcionar, verifique:**
1. Evolution está online?
2. WhatsApp está conectado?
3. Webhook está configurado corretamente?
4. Logs do Supabase mostram algum erro?

---

## 💡 **RECOMENDAÇÃO:**

**Se você está testando:**
- Use Evolution local + ngrok (temporário)

**Se está em produção:**
- Use Evolution em servidor cloud (permanente)

---

**Quer que eu te ajude a verificar qual é o seu cenário atual?** 🔍
