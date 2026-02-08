import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { ExpenseList, Expense } from "@/components/ExpenseList";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Receipt, MessageCircle, Loader2 } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Emotion types from database
type EmotionType = "essencial" | "impulso" | "pilar" | null;

export const Expenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get selected month from navigation state, fallback to current month
  const selectedMonth = useMemo(() => {
    const stateMonth = location.state?.selectedMonth;
    return stateMonth ? new Date(stateMonth) : new Date();
  }, [location.state?.selectedMonth]);
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch real data from Supabase
  const { data: allExpenses = [], isLoading: expensesLoading } = useExpenses("all");
  const { data: ccInstallments = [], isLoading: installmentsLoading } = useCardInstallmentsByMonth(selectedMonth);

  const isLoading = expensesLoading || installmentsLoading;
  
  // Filter expenses by selected month
  const expenses = useMemo(() => {
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  }, [allExpenses, monthStart, monthEnd]);

  // Transform credit card installments into Expense format
  const cardExpenses = useMemo((): Expense[] => {
    return ccInstallments.map(inst => {
      const purchase = inst.purchase;
      const card = purchase?.card;
      const installmentLabel = purchase?.total_installments > 1
        ? ` (${inst.installment_number}/${purchase.total_installments}x)`
        : "";
      const cardLabel = card?.card_name ? `${card.card_name} · ` : "";
      
      return {
        id: `cc-${inst.id}`,
        amount: Number(inst.amount),
        description: `${cardLabel}${purchase?.description || "Compra no cartão"}${installmentLabel}`,
        category: undefined,
        wouldDoAgain: undefined,
        source: "cartao" as const,
        pending: inst.status === "open",
        createdAt: new Date(purchase?.purchase_date || inst.created_at),
      };
    });
  }, [ccInstallments]);

  // Merge all expenses
  const allItems = useMemo(() => {
    return [...expenses.map(transformExpense), ...cardExpenses]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [expenses, cardExpenses]);

  const openWhatsApp = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  const handleExpenseClick = (expense: Expense) => {
    // Don't navigate for credit card items
    if (expense.id.startsWith("cc-")) return;
    navigate(`/expenses/${expense.id}`);
  };

  // Calculate totals
  const totalSpent = allItems.reduce((acc, e) => acc + e.amount, 0);

  // Group by emotion category (only regular expenses have emotions)
  const essentialItems = allItems.filter(e => e.category === "essential");
  const obligationItems = allItems.filter(e => e.category === "obligation");
  const impulseItems = allItems.filter(e => e.category === "impulse");
  const cardItems = allItems.filter(e => e.source === "cartao");
  const otherItems = allItems.filter(e => !e.category && e.source !== "cartao");

  const essentialTotal = essentialItems.reduce((acc, e) => acc + e.amount, 0);
  const obligationTotal = obligationItems.reduce((acc, e) => acc + e.amount, 0);
  const impulseTotal = impulseItems.reduce((acc, e) => acc + e.amount, 0);
  const cardTotal = cardItems.reduce((acc, e) => acc + e.amount, 0);
  const otherTotal = otherItems.reduce((acc, e) => acc + e.amount, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Get month name from selected month
  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Gastos</h1>
              <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
            </div>
          </div>
          <Button variant="warm" size="icon" onClick={() => navigate("/expenses/add")}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Summary Card */}
        <FadeIn>
          <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-impulse/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-impulse" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gasto total do mês</p>
                <p className="font-serif text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Essenciais</p>
                <p className="font-semibold text-sm text-essential">{formatCurrency(essentialTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impulsos</p>
                <p className="font-semibold text-sm text-impulse">{formatCurrency(impulseTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cartão</p>
                <p className="font-semibold text-sm text-primary">{formatCurrency(cardTotal)}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Essential Expenses */}
        {essentialItems.length > 0 && (
          <FadeIn delay={0.15}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">✅</span> Essenciais
              </h2>
              <ExpenseList 
                expenses={essentialItems} 
                onExpenseClick={handleExpenseClick} 
              />
            </div>
          </FadeIn>
        )}

        {/* Obligation Expenses */}
        {obligationItems.length > 0 && (
          <FadeIn delay={0.2}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">🎯</span> Pilares
              </h2>
              <ExpenseList 
                expenses={obligationItems} 
                onExpenseClick={handleExpenseClick} 
              />
            </div>
          </FadeIn>
        )}

        {/* Impulse Expenses */}
        {impulseItems.length > 0 && (
          <FadeIn delay={0.25}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">🔥</span> Impulsos
              </h2>
              <ExpenseList 
                expenses={impulseItems} 
                onExpenseClick={handleExpenseClick} 
              />
            </div>
          </FadeIn>
        )}

        {/* Credit Card Expenses */}
        {cardItems.length > 0 && (
          <FadeIn delay={0.3}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">💳</span> Cartão de crédito
              </h2>
              <ExpenseList 
                expenses={cardItems} 
                onExpenseClick={handleExpenseClick} 
              />
            </div>
          </FadeIn>
        )}

        {/* Other Expenses */}
        {otherItems.length > 0 && (
          <FadeIn delay={0.35}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">📝</span> Outros
              </h2>
              <ExpenseList 
                expenses={otherItems} 
                onExpenseClick={handleExpenseClick} 
              />
            </div>
          </FadeIn>
        )}

        {/* Empty State */}
        {allItems.length === 0 && (
          <FadeIn delay={0.2}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Nenhum gasto registrado ainda
              </p>
              <Button variant="warm" onClick={() => navigate("/expenses/add")}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar gasto
              </Button>
            </div>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

// Transform database expense to ExpenseList format
function transformExpense(e: any): Expense {
  return {
    id: e.id,
    amount: Number(e.amount),
    description: e.description,
    category: e.emotion === "essencial" ? "essential" 
      : e.emotion === "pilar" ? "obligation" 
      : e.emotion === "impulso" ? "impulse" 
      : undefined,
    wouldDoAgain: undefined,
    source: (e.source as Expense["source"]) || "manual",
    pending: e.status === "pending",
    createdAt: new Date(e.date || e.created_at),
    establishment: undefined,
  };
}

export default Expenses;
