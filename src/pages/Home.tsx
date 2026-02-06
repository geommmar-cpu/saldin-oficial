import { useState, useMemo } from "react";
import logoSaldin from "@/assets/logo-saldin-final.png";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { BalanceCard } from "@/components/BalanceCard";
import { FadeIn } from "@/components/ui/motion";
import { 
  TrendingDown, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MessageCircle, 
  CreditCard,
  HandCoins,
  Loader2,
  MoreHorizontal,
  Plus,
  X,
  ArrowDownCircle,
  Calendar,
  Sparkles,
  Clock,
  AlertTriangle,
  Lock,
  Wallet,
  Receipt,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useExpenses, useExpensesByCategory } from "@/hooks/useExpenses";
import { useDebts } from "@/hooks/useDebts";
import { useReceivables } from "@/hooks/useReceivables";
import { useIncomes } from "@/hooks/useIncomes";
import { cn } from "@/lib/utils";
import { calculateBalances, formatCurrency, formatShortCurrency } from "@/lib/balanceCalculations";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

// Emojis padronizados para tipos de transação
const transactionEmojis: Record<string, string> = {
  income: "💰",
  expense: "🧾",
  receivable: "🤝",
  debt: "💳",
};

// Emojis para categorias emocionais
const emotionEmojis: Record<string, string> = {
  essencial: "✅",
  pilar: "🎯",
  impulso: "🔥",
  prazer: "😊",
};

const getCategoryColor = (emotion: string | null) => {
  switch (emotion) {
    case "essencial":
      return "bg-essential";
    case "pilar":
      return "bg-obligation";
    case "impulso":
      return "bg-impulse";
    default:
      return "bg-muted-foreground";
  }
};

const getCategoryIcon = (_category: string) => {
  return MoreHorizontal;
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-muted-foreground" },
  whatsapp: { label: "WhatsApp", color: "text-[#25D366]" },
  integration: { label: "Banco", color: "text-primary" },
};

type TransactionFilter = "all" | "expense" | "income" | "debt" | "receivable";

export const Home = () => {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");
  
  // Fetch real data from Supabase
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: expenses = [], isLoading: expenseLoading } = useExpenses("all");
  const { data: expensesByCategory, isLoading: categoryLoading } = useExpensesByCategory();
  const { data: debts = [], isLoading: debtLoading } = useDebts("active");
  const { data: receivables = [], isLoading: receivableLoading } = useReceivables("pending");
  const { data: incomes = [], isLoading: incomeLoading } = useIncomes();

  const isLoading = profileLoading || expenseLoading || categoryLoading || debtLoading || receivableLoading || incomeLoading;

  // Calculate date range for selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Filter data by selected month (including installment expenses that fall in this month)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      
      // For installment expenses: calculate when THIS installment is due
      if (expense.is_installment && expense.installment_number && expense.total_installments) {
        // The expense.date represents when THIS specific installment is due
        // (each installment should have its own date set when created)
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      }
      
      // For regular expenses: simple date filter
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  }, [expenses, monthStart, monthEnd]);

  // Filter incomes by selected month (considering recurring)
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date || income.created_at);
      
      // For recurring incomes: show if the income started before or during this month
      // AND the selected month is not before the start date
      if (income.is_recurring) {
        const incomeStart = startOfMonth(incomeDate);
        // Show in all months from the start date onwards
        return !isBefore(monthStart, incomeStart);
      }
      
      // For non-recurring: only show in the month it was created
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    });
  }, [incomes, monthStart, monthEnd]);

  // Filter receivables by due date in selected month
  const filteredReceivables = useMemo(() => {
    return receivables.filter(receivable => {
      const dueDate = receivable.due_date ? new Date(receivable.due_date) : null;
      if (!dueDate) return false;
      return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
    });
  }, [receivables, monthStart, monthEnd]);

  // Filter debts that are active in the selected month
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const debtStart = new Date(debt.created_at);
      
      // Check if debt started before or during this month
      if (isAfter(debtStart, monthEnd)) return false;
      
      // For installment debts, check if still has remaining payments
      if (debt.is_installment && debt.total_installments) {
        const monthsFromStart = Math.floor(
          (monthStart.getTime() - debtStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        // Still has installments remaining?
        return monthsFromStart < debt.total_installments;
      }
      
      // For recurring debts, always show if started before this month
      return true;
    });
  }, [debts, monthStart, monthEnd]);

  // Calculate totals for selected month
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalReceivables = filteredReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
 
  // Total ALL pending receivables (for display)
  const totalPendingReceivables = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
  
  // Debt calculations for this month
  const debtCommitment = filteredDebts.reduce((sum, d) => sum + Number(d.installment_amount || 0), 0);
  const activeDebtsCount = filteredDebts.length;
  const installmentDebts = filteredDebts.filter(d => d.is_installment);
  
  // Calculate the 3 balance types using the new calculation
  const balanceBreakdown = calculateBalances(
    filteredIncomes,
    filteredExpenses,
    filteredDebts,
    selectedMonth
  );

  // Transactions for the list
  const transactions = useMemo(() => {
    const items: Array<{
      id: string;
      type: "expense" | "income" | "debt" | "receivable";
      amount: number;
      description: string;
      source: string;
      date: Date;
      emotion?: string;
      isRecurring?: boolean;
      status?: string;
      dueDate?: Date;
    }> = [];

    filteredExpenses.forEach(expense => {
      items.push({
        id: expense.id,
        type: "expense",
        amount: Number(expense.amount),
        description: expense.description,
        source: expense.source,
        date: new Date(expense.date || expense.created_at),
        emotion: expense.emotion || undefined,
      });
    });

    filteredIncomes.forEach(income => {
      // For recurring incomes, show with the selected month's date
      const displayDate = income.is_recurring 
        ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), new Date(income.date || income.created_at).getDate())
        : new Date(income.date || income.created_at);
      
      items.push({
        id: income.id,
        type: "income",
        amount: Number(income.amount),
        description: income.is_recurring ? `${income.description} (recorrente)` : income.description,
        source: "manual",
        date: displayDate,
        isRecurring: income.is_recurring,
      });
    });

    // Add debts
    filteredDebts.forEach(debt => {
      items.push({
        id: debt.id,
        type: "debt",
        amount: Number(debt.installment_amount || debt.total_amount),
        description: `${debt.creditor_name}${debt.is_installment ? ` - ${debt.current_installment || 1}/${debt.total_installments}` : ''}`,
        source: "manual",
        date: new Date(debt.created_at),
        status: debt.status,
      });
    });

    // Add receivables
    filteredReceivables.forEach(receivable => {
      items.push({
        id: receivable.id,
        type: "receivable",
        amount: Number(receivable.amount),
        description: `${receivable.debtor_name} - ${receivable.description || 'A receber'}`,
        source: "manual",
        date: new Date(receivable.created_at),
        dueDate: receivable.due_date ? new Date(receivable.due_date) : undefined,
        status: receivable.status,
      });
    });

    // Filter by type
    const filtered = transactionFilter === "all" 
      ? items 
      : items.filter(i => i.type === transactionFilter);

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [filteredExpenses, filteredIncomes, filteredDebts, filteredReceivables, transactionFilter, selectedMonth]);

  // Top 3 categories for the month (grouped by emotion since we don't have category names)
  const topCategories = useMemo(() => {
    const categoryMap: Record<string, { name: string; total: number; emotion: string | null }> = {};
    
    const emotionLabels: Record<string, string> = {
      essencial: "Essenciais",
      pilar: "Pilares",
      impulso: "Impulsos",
    };
    
    filteredExpenses.forEach(expense => {
      const emotion = expense.emotion || "outros";
      const cat = emotionLabels[emotion] || "Outros";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, total: 0, emotion: expense.emotion };
      }
      categoryMap[cat].total += Number(expense.amount);
    });

    return Object.values(categoryMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [filteredExpenses]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatShortCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
    }
    return formatCurrency(value);
  };

  const openWhatsApp = () => {
    const whatsappUrl = "https://wa.me/5511999999999";
    window.open(whatsappUrl, "_blank");
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const handleTransactionClick = (transaction: typeof transactions[0]) => {
    if (transaction.type === "income") {
      navigate(`/income/${transaction.id}`);
    } else if (transaction.type === "debt") {
      navigate(`/debts/${transaction.id}`);
    } else if (transaction.type === "receivable") {
      navigate(`/receivables/${transaction.id}`);
    } else {
      navigate(`/expenses/${transaction.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com Logo destacada */}
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="pt-4 pb-4">
          <FadeIn>
            <div className="flex justify-center">
              <img src={logoSaldin} alt="Saldin" className="h-24 object-contain" />
            </div>
          </FadeIn>
        </div>

        {/* Month Selector */}
        <FadeIn delay={0.05}>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium capitalize">{monthLabel}</span>
              {isCurrentMonth && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Atual
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </FadeIn>
      </header>

      <main className="px-5 space-y-5 pt-4">
        {/* Summary Cards */}
        <FadeIn delay={0.1}>
          <div className="space-y-3">
            {/* Main Card - Available Balance */}
            <motion.div 
              className="p-5 rounded-2xl bg-card border border-border shadow-medium"
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Saldo Livre</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-essential/10 text-essential font-medium">
                    Real
                  </span>
                </div>
                <Wallet className="w-5 h-5 text-muted-foreground" />
              </div>
              <p
                className={cn(
                  "font-serif text-3xl font-bold tracking-tight",
                  balanceBreakdown.saldoLivre >= 0 ? "text-essential" : "text-impulse"
                )}
              >
                {formatCurrency(balanceBreakdown.saldoLivre)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Dinheiro realmente disponível
              </p>
              {totalIncome > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalSpent / totalIncome) * 100, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        totalSpent > totalIncome ? "bg-impulse" :
                        totalSpent > totalIncome * 0.8 ? "bg-pleasure" :
                        "bg-essential"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {Math.round((totalSpent / totalIncome) * 100)}% da receita utilizada
                  </p>
                </div>
              )}
              
              {/* Expanded details - Saldo Bruto e Comprometido */}
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {/* Saldo Bruto */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Saldo Bruto</p>
                      <p className="text-xs text-muted-foreground">Receitas - Gastos</p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    balanceBreakdown.saldoBruto >= 0 ? "text-foreground" : "text-impulse"
                  )}>
                    {formatCurrency(balanceBreakdown.saldoBruto)}
                  </p>
                </div>
                
                {/* Saldo Comprometido */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-impulse/10 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-impulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Comprometido</p>
                      <p className="text-xs text-muted-foreground">Dívidas e parcelas</p>
                    </div>
                  </div>
                  <p className="font-semibold text-impulse">
                    - {formatCurrency(balanceBreakdown.saldoComprometido)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Secondary Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/income", { state: { selectedMonth: selectedMonth.toISOString() } })}
                className="p-3 rounded-xl bg-essential/10 border border-essential/20 text-left"
              >
                <TrendingUp className="w-4 h-4 text-essential mb-1" />
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="font-semibold text-sm text-essential">{formatCurrency(totalIncome)}</p>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/expenses", { state: { selectedMonth: selectedMonth.toISOString() } })}
                className="p-3 rounded-xl bg-card border border-border text-left"
              >
                <Receipt className="w-4 h-4 text-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="font-semibold text-sm">{formatCurrency(totalSpent)}</p>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/receivables", { state: { selectedMonth: selectedMonth.toISOString() } })}
                className="p-3 rounded-xl bg-card border border-border text-left"
              >
                <HandCoins className="w-4 h-4 text-essential/70 mb-1" />
                <p className="text-xs text-muted-foreground">A receber</p>
                <p className="font-semibold text-sm">{formatCurrency(totalPendingReceivables)}</p>
              </motion.button>
            </div>
          </div>
        </FadeIn>

        {/* Commitments Section */}
        {(activeDebtsCount > 0 || installmentDebts.length > 0) && (
          <FadeIn delay={0.15}>
            <div className="space-y-2">
              <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Compromissos
              </h2>
              
              {/* Summary Card */}
              <div className="p-3 rounded-xl bg-impulse/5 border border-impulse/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-impulse" />
                  <span className="text-sm font-medium">
                    {activeDebtsCount} dívida{activeDebtsCount !== 1 ? "s" : ""} ativa{activeDebtsCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-sm font-semibold text-impulse">
                  {formatCurrency(debtCommitment)}/mês
                </span>
              </div>

              {/* Individual Debt Cards */}
              <div className="space-y-2">
                {filteredDebts.slice(0, 5).map((debt, index) => {
                  const isInstallment = debt.is_installment;
                  const progress = isInstallment 
                    ? Math.round(((debt.current_installment || 1) / (debt.total_installments || 1)) * 100)
                    : 0;
                  
                  return (
                    <motion.button
                      key={debt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/debts/${debt.id}`)}
                      className="w-full p-3 rounded-xl bg-card border border-impulse/30 shadow-soft flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-impulse/15 flex items-center justify-center text-lg">
                        💳
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{debt.creditor_name}</p>
                          {isInstallment && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
                              {debt.current_installment}/{debt.total_installments}
                            </span>
                          )}
                          {!isInstallment && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium shrink-0">
                              Recorrente
                            </span>
                          )}
                        </div>
                        {isInstallment && (
                          <div className="mt-1.5">
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ delay: index * 0.03 + 0.2, duration: 0.5 }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>
                          </div>
                        )}
                        {!isInstallment && (
                          <p className="text-xs text-muted-foreground">
                            {debt.description || "Dívida recorrente"}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm tabular-nums text-impulse">
                          {formatCurrency(Number(debt.installment_amount || debt.total_amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Ver todas button */}
              {filteredDebts.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => navigate("/debts")}
                >
                  Ver todas as {filteredDebts.length} dívidas
                </Button>
              )}

              {filteredDebts.length <= 5 && filteredDebts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => navigate("/debts")}
                >
                  Gerenciar dívidas
                </Button>
              )}
            </div>
          </FadeIn>
        )}

        {/* Transactions Section */}
        <FadeIn delay={0.2}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-semibold text-foreground">Movimentações</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => navigate("/history")}
              >
                Ver todas
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { key: "all", label: "Todos" },
                { key: "expense", label: "Gastos" },
                { key: "income", label: "Receitas" },
                { key: "debt", label: "Dívidas" },
                { key: "receivable", label: "A Receber" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTransactionFilter(filter.key as TransactionFilter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    transactionFilter === filter.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Transaction List */}
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction, index) => {
                  const isIncome = transaction.type === "income";
                  const isDebt = transaction.type === "debt";
                  const isReceivable = transaction.type === "receivable";
                  const sourceInfo = sourceLabels[transaction.source] || sourceLabels.manual;
                  
                  return (
                    <motion.button
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTransactionClick(transaction)}
                      className={cn(
                        "w-full p-3 rounded-xl bg-card border shadow-soft flex items-center gap-3",
                        isDebt ? "border-impulse/30" : isReceivable ? "border-essential/30" : "border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center",
                          isIncome ? "bg-essential/15" : 
                          isDebt ? "bg-impulse/15" :
                          isReceivable ? "bg-essential/15" :
                          transaction.emotion === 'impulso' ? "bg-impulse/15" :
                          transaction.emotion === 'essencial' ? "bg-essential/15" : "bg-muted",
                          "text-lg"
                        )}
                      >
                        {isIncome ? (
                          <span>💰</span>
                        ) : isDebt ? (
                          <span>💳</span>
                        ) : isReceivable ? (
                          <span>🤝</span>
                        ) : (
                          <span>{transaction.emotion ? emotionEmojis[transaction.emotion] || "💸" : "💸"}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          {isDebt && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-impulse/10 text-impulse font-medium shrink-0">
                              Dívida
                            </span>
                          )}
                          {isReceivable && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-essential/10 text-essential font-medium shrink-0">
                              A receber
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {transaction.dueDate ? (
                            <>Vence {format(transaction.dueDate, "dd/MM", { locale: ptBR })}</>
                          ) : (
                            format(transaction.date, "dd/MM", { locale: ptBR })
                          )}
                          <span className="mx-1">·</span>
                          <span className={sourceInfo.color}>{sourceInfo.label}</span>
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-semibold text-sm tabular-nums",
                          isIncome || isReceivable ? "text-essential" : 
                          isDebt ? "text-impulse" : "text-foreground"
                        )}
                      >
                        {isIncome || isReceivable ? "+" : "-"} {formatCurrency(transaction.amount)}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Nenhuma movimentação neste período
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Quick Analysis */}
        {topCategories.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Análise do mês
                </h2>
              </div>

              {/* Top Categories */}
              <div className="space-y-3 mb-4">
                {topCategories.map((category, index) => {
                  const Icon = getCategoryIcon(category.name);
                  const percentage = totalSpent > 0 ? Math.round((category.total / totalSpent) * 100) : 0;
                  
                  return (
                    <div key={category.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{category.name}</span>
                          <span className="text-xs text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn("h-full rounded-full", getCategoryColor(category.emotion))}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-20 text-right">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* AI Insight Placeholder */}
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-foreground">
                  💡 {topCategories.length > 0 
                    ? `Seus gastos com ${topCategories[0]?.name.toLowerCase()} representam ${Math.round((topCategories[0]?.total / totalSpent) * 100)}% do total este mês.`
                    : "Registre seus gastos para receber insights personalizados."
                  }
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* WhatsApp Assistant Card */}
        <FadeIn delay={0.3}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={openWhatsApp}
            className="w-full p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Registrar via WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Envie texto, foto ou áudio
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </FadeIn>

        {/* Empty State */}
        {totalIncome === 0 && totalSpent === 0 && (
          <FadeIn delay={0.1}>
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Comece a organizar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione suas receitas e gastos para ter uma visão clara das suas finanças
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/income/add")}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Receita
                </Button>
                <Button variant="warm" onClick={() => navigate("/expenses/add")}>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Gasto
                </Button>
              </div>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-20">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 space-y-2"
            >
              {[
                { icon: TrendingDown, label: "Gasto", path: "/expenses/add", color: "bg-foreground" },
                { icon: TrendingUp, label: "Receita", path: "/income/add", color: "bg-essential" },
                { icon: CreditCard, label: "Dívida", path: "/debts/add", color: "bg-impulse" },
                { icon: HandCoins, label: "A receber", path: "/receivables/add", color: "bg-pleasure" },
              ].map((item, index) => (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setFabOpen(false);
                    navigate(item.path);
                  }}
                  className="flex items-center gap-2 ml-auto"
                >
                  <span className="px-3 py-1.5 rounded-full bg-card border border-border shadow-medium text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-medium", item.color)}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFabOpen(!fabOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
            fabOpen ? "bg-muted" : "bg-primary"
          )}
        >
          <motion.div
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {fabOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Plus className="w-6 h-6 text-primary-foreground" />
            )}
          </motion.div>
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
