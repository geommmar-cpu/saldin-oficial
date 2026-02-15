# Resumo: Integração WhatsApp (n8n + Supabase)

**Status Atual:**
- ✅ **Recebimento de Imagem:** Resolvido! O nó HTTP Request agora baixa a imagem em Base64 corretamente da Evolution API.
- ✅ **Extração de Dados:** A IA já está lendo a imagem e retornando os dados (valor, estabelecimento, data).
- 🚧 **Gravação no Banco (Travado):** O sub-workflow falha ao tentar salvar.

**Problemas Identificados:**
1. **Tabela Incorreta:** O fluxo tentava salvar em `transacoes`, mas o Saldin usa `expenses` (despesas) e `incomes` (receitas).
2. **Campos Incorretos:** Os nomes das colunas (`detalhes`, `tipo`) não existem no banco. Precisamos usar os nomes em inglês (`description`, `amount`, `source`, etc.).
3. **Falta do `user_id`:** O banco exige saber *quem* é o usuário. Precisamos buscar o ID pelo telefone antes de salvar.

**Próximos Passos (Para Fazer Amanhã):**
1. **Criar Nó "Buscar Usuário":**
   - Adicionar um nó Supabase (Get Row) no início do fluxo.
   - Buscar na tabela `profiles` filtrando pelo `phone` (número do WhatsApp).
   - Isso vai nos dar o `user_id` necessário.

2. **Corrigir o Sub-Workflow:**
   - Mudar a tabela alvo para `expenses`.
   - Mapear os campos corretamente:
     - `user_id` -> ID encontrado no passo 1.
     - `amount` -> Valor da IA.
     - `description` -> Detalhes/Estabelecimento da IA.
     - `date` -> Data da IA.
     - `source` -> 'whatsapp' (texto fixo).
     - `status` -> 'confirmed' (texto fixo).

3. **Testar Fluxo Completo:** Enviar uma imagem pro Zap e ver o registro aparecer no Dashboard do Saldin.

Bom descanso! Até amanhã. 🚀😴
