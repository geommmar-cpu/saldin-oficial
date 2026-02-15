# Implementação do Módulo de Assinaturas (Subscriptions)

Este documento detalha o plano para implementar o gerenciamento de assinaturas fixas mensais no app Saldin.

## 1. Banco de Dados (Supabase)

### 1.1 Nova Tabela `subscriptions`
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  billing_date INTEGER NOT NULL CHECK (billing_date BETWEEN 1 AND 31),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly', 'custom')),
  custom_frequency_days INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  active BOOLEAN NOT NULL DEFAULT true, -- Soft delete
  last_generated_date DATE, -- Guarda a data do último lançamento gerado (ex: '2026-02-01')
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Políticas RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 2. Frontend - Hooks e Tipagem

### 2.1 Tipagem (`src/types/subscription.ts`)
Definir interfaces para Subscription, Insert, Update.

### 2.2 Hook (`src/hooks/useSubscriptions.ts`)
- `useSubscriptions()`: Listagem filtrando por `active: true`.
- `useCreateSubscription()`: Inserção.
- `useUpdateSubscription()`: Edição/Cancelamento.
- `useSubscriptionTrigger()`: Lógica para verificar e gerar lançamentos na `expenses` ou `credit_card_purchases`.

## 3. UI/UX - Novas Páginas e Componentes

### 3.1 Página de Listagem (`src/pages/Subscriptions.tsx`)
- Resumo financeiro (Total mensal/anual).
- Lista de cards com nome, logo (usando `BankLogo`), valor e data.
- Filtro por status (Ativa/Cancelada).

### 3.2 Formulário (`src/pages/AddSubscription.tsx`)
- Seleção de nome, valor, data.
- Seleção de meio de pagamento (Lista de cartões ou contas bancárias).
- Seleção de categoria (Default: Assinaturas).

### 3.3 Integração Home
- Link na `BottomNav` (seção "Mais").
- Card de resumo no Dashboard.

## 4. Lógica de Automação
Ao iniciar o app ou carregar as assinaturas:
1. Filtrar assinaturas ativas cujo `last_generated_date` seja anterior ao mês/ano atual.
2. Para cada uma:
   - Se `card_id` → Gerar `credit_card_purchase` com 1 parcela.
   - Se `bank_account_id` → Gerar `expense` vinculada à conta.
   - Atualizar `last_generated_date`.

## 5. Cronograma de Execução
1. [ ] Script SQL para base de dados.
2. [ ] Tipagem e Hooks básicos.
3. [ ] Página de Listagem e Layout.
4. [ ] Formulário de Cadastro.
5. [ ] Lógica de geração automática.
6. [ ] Alertas e refinamento visual.
