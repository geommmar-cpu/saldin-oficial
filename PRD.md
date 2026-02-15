# PRD - Saldin: Seu Assistente Financeiro Inteligente

## 1. Visão Geral do Produto
O **Saldin** é uma plataforma de gestão financeira pessoal focada em simplicidade, consciência comportamental e integração inteligente. O objetivo é ajudar o usuário a sair da inércia financeira, registrando movimentações de forma rápida (via app ou WhatsApp) e visualizando o impacto de suas escolhas no "Saldo Livre" do mês.

## 2. Público-Alvo
- Pessoas que buscam controle financeiro sem a complexidade de planilhas.
- Usuários que esquecem de anotar gastos pequenos e precisam de uma interface ágil.
- Pessoas que possuem múltiplas contas e cartões e precisam de uma visão unificada.

## 3. Funcionalidades Principais

### A. Autenticação e Perfil
- **Login/Cadastro:** Sistema via email e senha (integrado com Supabase Auth).
- **Onboarding:** Fluxo inicial para configuração de nome e cadastro das primeiras contas bancárias.
- **Biometria:** Suporte a FaceID/Digital (WebAuthn) para acesso rápido e seguro.
- **Preferências:** Personalização do nome da IA (padrão: Saldin).

### B. Dashboard (Home)
- **Balance Hero 2.0:** Visualização dinâmica via **Gráfico de Rosca (Donut Chart)** da composição do saldo (Livre vs. Comprometido vs. Guardado).
- **Resultados Mensais:** Comparativo direto entre Receitas e Gastos com barra de progresso de comprometimento da renda.
- **Contas Bancárias:** Carrossel horizontal com detecção automática de marcas (logos de bancos reais) e saldos.
- **Cartões de Crédito:** Resumo de faturas, limites e dias de vencimento com visualização de "cartão físico".
- **Criptoativos:** Integração opcional para visualização de saldo em Cripto (BTC/ETH) somando ao patrimônio total.
- **Metas de Poupança:** Carrossel visual com imagens reais baseadas no tipo da meta (viagem, carro, casa) e barra de progresso.
- **Alertas Inteligentes:** Notificações de faturas vencendo, metas perto do objetivo ou gastos excessivos.
- **Movimentações Recentes:** Lista cronológica com ícones de emoção/categoria e navegação inteligente que preserva filtros.

### C. Gestão de Transações
- **Gastos (Despesas):** Registro rápido com teclado numérico. Suporte a parcelamentos automáticos e categorias.
- **Receitas (Incomes):** Registro de ganhos fixos ou variáveis.
- **Dívidas e Empréstimos:** Controle granular de dívidas com marcação de parcelas pagas individualmente.
- **A Receber (Receivables):** Gestão de empréstimos feitos. Suporte a **Exclusão Avançada** (Apenas esta, Futuras ou Todas) para itens recorrentes/parcelados.
- **Navegação de Detalhes:** Telas de detalhes com histórico de navegação reativo (volta para a origem correta).

### D. Integração com IA (Saldin AI)
- **WhatsApp:** Link direto para enviar comprovantes, áudios ou textos para a IA processar os dados (Backend processa e reflete no App).

### G. Estabilidade e Testes
- **Ambiente de Depuração:** Página `/debug-stress` para simulação de alta carga (5.000+ registros) garantindo performance do dashboard.
- **Fail-safe de Carregamento:** Sistema de emergência no `index.html` para detectar travamentos ou timeouts na SPA, oferecendo recuperação rápida ao usuário.
- **Teclado Numérico Universal:** Componente compartilhado e testável com feedback háptico e IDs de automação.

## 4. Requisitos Técnicos
- **Frontend:** React 18+, Vite, TypeScript.
- **Estilização:** Tailwind CSS v3/v4 + Shadcn UI para componentes de alta qualidade.
- **Visualização de Dados:** **Recharts** para gráficos interativos e responsivos.
- **Animações:** Framer Motion para micro-interações "pro" e transições de página.
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage).
- **Fuso Horário:** Tratamento via `date-fns` e SQL para o fuso brasileiro (GMT-3).
- **PWA:** Totalmente instalável via Vite PWA Plugin.
- **Testes e Qualidade:** 
  - **Automação:** Atributos `data-testid` padronizados para testes E2E/Robóticos.
  - **Monitoramento:** Tratamento de erros global com `GlobalErrorBoundary` e logs de depuração.

## 5. Design e Experiência do Usuário (UX)
- **Estética:** Cores quentes e humanas (Terracotta, Sage Green) fugindo do visual "bancário frio".
- **Mobile-First:** Interface otimizada para uso com uma mão e toques rápidos.
- **Feedback Háptico:** Vibrações sutis ao interagir com o teclado numérico (Nativo mobile).

## 6. Roadmap / Futuro
- Importação automática de extratos bancários (Open Finance).
- Relatórios mensais gerados por IA com dicas de economia.
- Compartilhamento de contas (Finanças para casais).
