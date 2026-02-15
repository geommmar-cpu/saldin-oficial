import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FilterSheet } from "@/components/FilterSheet";
import { FadeIn } from "@/components/ui/motion";
import { ArrowDownCircle, AlertCircle, CreditCard, Loader2, Receipt, Banknote, HandCoins, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { PeriodFilter, SourceFilter, EmotionFilter, ItemTypeFilter } from "@/types/expense";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format, startOfMonth, endOfMonth, isWithinInterval, isBefore, isAfter, subMonths, addMonths } from "date-fns";
import { getExpensesForMonth } from "@/lib/recurringExpenses";
import { ptBR } from "date-fns/locale";
import { parseLocalDate, toLocalDateString } from "@/lib/dateUtils";
import { useSubscriptionAutoLauncher } from "@/hooks/useSubscriptions";
import { useEffect } from "react";
import { useExpenses, ExpenseRow } from "@/hooks/useExpenses";
import { useIncomes, IncomeRow } from "@/hooks/useIncomes";
import { useDebts, DebtRow } from "@/hooks/useDebts";
import { useReceivables } from "@/hooks/useReceivables";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { BankLogo } from "@/components/BankLogo";

// Emotion category type based on database enum
type EmotionCategory = "pilar" | "essencial" | "impulso";

// Combined type for list items
interface HistoryItem {
  id: string;
  type: "expense" | "income" | "debt" | "credit_card" | "receivable" | "subscription";
  amount: number;
  description: string;
  category?: EmotionCategory;
  categoryName?: string;
  cardName?: string;
  invoiceMonth?: string;
  incomeType?: string;
  source: "manual" | "whatsapp" | "integration";
  pending: boolean;
  createdAt: Date;
  accountName?: string;
}

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  integration: "Integração",
};

// Group items by period
function groupByPeriod(items: HistoryItem[], selectedMonth: Date) {
  const groups: Map<string, HistoryItem[]> = new Map();

  items.forEach((item) => {
    let label = "";
    if (isToday(item.createdAt)) {
      label = "Hoje";
    } else if (isYesterday(item.createdAt)) {
      label = "Ontem";
    } else {
      label = format(item.createdAt, "dd 'de' MMMM", { locale: ptBR });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

interface HistoryItemCardProps {
  item: HistoryItem;
  onClick: () => void;
}

const HistoryItemCard = ({ item, onClick }: HistoryItemCardProps) => {
  const isIncome = item.type === "income";
  const isDebt = item.type === "debt";
  const isReceivable = item.type === "receivable";
  const isCreditCard = item.type === "credit_card";
  const isSubscription = item.type === "subscription";
  const needsCompletion = item.type === "expense" && !item.category && !item.pending;

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.amount);

  const typeLabel = isIncome ? "Receita" : isDebt ? "Dívida" : isReceivable ? "A receber" : isCreditCard ? "Cartão" : isSubscription ? "Assinatura" : null;
  const typeLabelColor = isIncome
    ? "text-essential bg-essential/10"
    : isDebt
      ? "text-impulse bg-impulse/10"
      : isReceivable
        ? "text-essential bg-essential/10"
        : isCreditCard
          ? "text-obligation bg-obligation/10"
          : isSubscription
            ? "text-primary bg-primary/10"
            : "";

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200",
        "bg-card border shadow-soft hover:shadow-medium",
        isIncome || isReceivable ? "border-essential/30" : isDebt ? "border-impulse/20" : isCreditCard ? "border-obligation/20" : "border-border",
        item.pending && "border-accent border-2 bg-accent/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-lg flex-shrink-0",
          isIncome || isReceivable ? "bg-essential/15" : isDebt ? "bg-impulse/10" : isCreditCard ? "bg-obligation/10" : isSubscription ? "bg-primary/10" : "bg-impulse/10"
        )}
      >
        {isIncome ? (
          <Banknote className="w-5 h-5 text-essential" />
        ) : isReceivable ? (
          <HandCoins className="w-5 h-5 text-essential" />
        ) : isDebt ? (
          <CreditCard className="w-5 h-5 text-impulse" />
        ) : isCreditCard ? (
          <CreditCard className="w-5 h-5 text-obligation" />
        ) : isSubscription ? (
          <BankLogo bankName={item.description.replace("Assinatura: ", "")} className="w-12 h-12" />
        ) : (
          <Receipt className="w-5 h-5 text-impulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="font-medium text-sm truncate flex-1">
            {item.description}
          </p>
          {typeLabel && !isReceivable && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 whitespace-nowrap uppercase tracking-tight", typeLabelColor)}>
              {typeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: ptBR })}
          {item.cardName && (
            <>
              <span className="mx-1">·</span>
              {item.cardName}
            </>
          )}
          {item.invoiceMonth && (
            <>
              <span className="mx-1">·</span>
              Fatura {item.invoiceMonth}
            </>
          )}
          {item.accountName && (
            <>
              <span className="mx-1">·</span>
              {item.accountName}
            </>
          )}
          {!item.cardName && !item.invoiceMonth && !item.accountName && (
            <>
              <span className="mx-1">·</span>
              {sourceLabels[item.source] || item.source}
            </>
          )}
        </p>
      </div>

      {/* Amount & Actions */}
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            "font-semibold text-sm tabular-nums",
            (isIncome || isReceivable) && "text-essential",
            isDebt && "text-impulse",
            isCreditCard && "text-obligation",
            isSubscription && "text-primary",
            item.category === "impulso" && "text-impulse"
          )}
        >
          {isIncome || isReceivable ? "+" : "−"} {formattedAmount}
        </p>
        {item.pending && (
          <span className="text-xs text-accent font-medium">Pendente</span>
        )}
        {needsCompletion && (
          <span className="text-xs text-accent font-medium flex items-center gap-1 justify-end">
            <AlertCircle className="w-3 h-3" />
            Completar
          </span>
        )}
      </div>
    </motion.button>
  );
};

export const History = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialTypeFilter = (searchParams.get("type") as ItemTypeFilter) || "all";

  const { launch } = useSubscriptionAutoLauncher();

  // Accept selectedMonth from navigation state or default to current month
  const navState = location.state as { selectedMonth?: string } | null;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (navState?.selectedMonth) return new Date(navState.selectedMonth);
    return new Date();
  });

  // Auto launch subscriptions on mount
  useEffect(() => {
    launch();
  }, []);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [emotionFilter, setEmotionFilter] = useState<EmotionFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>(initialTypeFilter);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  // Fetch real data from Supabase - Optimized with server-side filtering
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses("all", currentMonth, currentYear);
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(currentMonth, currentYear);
  const { data: debts = [], isLoading: debtsLoading } = useDebts("active");
  const { data: receivables = [], isLoading: receivablesLoading } = useReceivables("all");
  const { data: ccInstallments = [], isLoading: ccLoading } = useCardInstallmentsByMonth(selectedMonth);
  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions();

  const isLoading = expensesLoading || incomesLoading || debtsLoading || ccLoading || receivablesLoading || subsLoading;

  // Transform data to HistoryItem format — filter by selectedMonth
  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];

    // Add expenses — server already filtered mostly, but getExpensesForMonth handles recurring logic
    const filteredExpenses = getExpensesForMonth(expenses, selectedMonth);
    filteredExpenses.forEach((expense: ExpenseRow) => {
      // Skip auto-generated loan expenses (they're internal accounting, user sees the receivable instead)
      if (expense.description?.startsWith("Empréstimo concedido:")) return;

      const expDate = expense.date ? parseLocalDate(expense.date) : new Date(expense.created_at);
      const installmentLabel = expense.is_installment && expense.total_installments && expense.total_installments > 1
        ? ` (${expense.installment_number}/${expense.total_installments}x)`
        : "";

      const isSub = expense.description?.startsWith("Assinatura: ");

      items.push({
        id: expense.id,
        type: isSub ? "subscription" : "expense",
        amount: Number(expense.amount),
        description: `${expense.description}${installmentLabel}`,
        category: expense.emotion as EmotionCategory | undefined,
        source: expense.source as HistoryItem["source"],
        pending: expense.status === "pending",
        createdAt: expDate,
        accountName: (expense as any).bank_accounts?.name || (expense as any).bank_accounts?.bank_name,
      });
    });

    // Add incomes — filter by month (including recurring)
    incomes.forEach((income: IncomeRow) => {
      const incomeDate = income.date ? parseLocalDate(income.date) : new Date(income.created_at);
      const isRecurring = income.is_recurring;
      if (isRecurring === true) {
        if (isBefore(monthStart, startOfMonth(incomeDate))) return;
      } else {
        if (!isWithinInterval(incomeDate, { start: monthStart, end: monthEnd })) return;
      }
      items.push({
        id: income.id,
        type: "income",
        amount: Number(income.amount),
        description: income.description,
        incomeType: income.type,
        source: "manual" as const,
        pending: false,
        createdAt: isRecurring
          ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), incomeDate.getDate())
          : incomeDate,
        accountName: (income as any).bank_account?.name || (income as any).bank_account?.bank_name,
      });
    });

    // Add receivables (Loans)
    receivables.forEach((receivable) => {
      const dueDate = receivable.due_date ? parseLocalDate(receivable.due_date) : new Date(receivable.created_at);
      // Filter by due date corresponding to the selected month (or creation date if no due date)
      if (!isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) return;

      items.push({
        id: receivable.id,
        type: "receivable",
        amount: Number(receivable.amount),
        description: `${receivable.debtor_name}${receivable.description ? ` · ${receivable.description}` : ""}`,
        source: "manual" as const,
        pending: receivable.status === "pending",
        createdAt: new Date(receivable.created_at), // Original creation date for sorting? Or due date? Keep creation for now.
        accountName: (receivable as any).bank_account?.name || (receivable as any).bank_account?.bank_name, // Typically destination account
      });
    });

    // Add active debts
    debts.forEach((debt: DebtRow) => {
      const debtDate = new Date(debt.created_at);
      if (!isWithinInterval(debtDate, { start: monthStart, end: monthEnd }) && !isBefore(debtDate, monthStart)) return;
      items.push({
        id: debt.id,
        type: "debt",
        amount: Number(debt.installment_amount || debt.total_amount),
        description: `${debt.creditor_name} - ${debt.current_installment || 0}/${debt.total_installments || 1}`,
        source: "manual" as const,
        pending: false,
        createdAt: debtDate,
      });
    });

    // Add credit card installments (already filtered by selectedMonth via hook)
    ccInstallments.forEach((inst: any) => {
      const purchase = inst.purchase;
      const card = purchase?.card;
      const refMonth = inst.reference_month
        ? format(parseLocalDate(inst.reference_month), "MMM/yy", { locale: ptBR })
        : undefined;

      const isSub = purchase?.description?.startsWith("Assinatura: ");

      items.push({
        id: inst.id,
        type: isSub ? "subscription" : "credit_card",
        amount: Number(inst.amount),
        description: purchase?.description || "Compra no cartão",
        cardName: card?.card_name,
        invoiceMonth: refMonth,
        source: "manual" as const,
        pending: inst.status === "open",
        createdAt: purchase?.purchase_date ? parseLocalDate(purchase.purchase_date) : new Date(inst.created_at),
      });
    });

    // Add projected subscriptions for current or future months
    const isFuture = isAfter(monthStart, startOfMonth(new Date()));
    if (isCurrentMonth || isFuture) {
      subscriptions.forEach(sub => {
        if (sub.status !== 'active') return;

        const hasExecuted = items.some(item =>
          item.type === "subscription" &&
          item.description.includes(sub.name)
        );

        if (!hasExecuted) {
          items.push({
            id: `proj-${sub.id}`,
            type: "subscription",
            amount: Number(sub.amount),
            description: `Assinatura: ${sub.name}`,
            source: "manual",
            pending: true,
            createdAt: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), sub.billing_date || 1),
            accountName: "Previsto",
          });
        }
      });
    }

    return items;
  }, [expenses, incomes, debts, receivables, ccInstallments, subscriptions, monthStart, monthEnd, selectedMonth, isCurrentMonth]);

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === "income") {
      navigate(`/income/${item.id}`);
    } else if (item.type === "debt") {
      navigate(`/debts/${item.id}`);
    } else if (item.type === "receivable") {
      navigate(`/receivables/${item.id}`);
    } else if (item.type === "credit_card") {
      navigate(`/expenses/cc-${item.id}`);
    } else if (item.pending || !item.category) {
      navigate(`/confirm/${item.id}`);
    } else {
      navigate(`/expenses/${item.id}`, { state: { item } });
    }
  };

  const resetFilters = () => {
    setPeriodFilter("month");
    setSourceFilter("all");
    setEmotionFilter("all");
    setTypeFilter("all");
  };

  // Apply filters
  const filteredItems = historyItems.filter((item) => {
    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "expense" && item.type !== "expense" && item.type !== "credit_card" && item.type !== "subscription") return false;
      if (typeFilter === "income" && item.type !== "income") return false;
      if (typeFilter === "debt" && item.type !== "debt") return false;
      if (typeFilter === "receivable" && item.type !== "receivable") return false;
    }
    // Source filter
    if (sourceFilter !== "all") {
      const sourceMap: Record<string, string> = {
        manual: "manual",
        bank: "integration",
        whatsapp: "whatsapp",
        photo: "manual",
        audio: "manual",
      };
      if (item.source !== sourceMap[sourceFilter]) return false;
    }
    // Emotion filter (only for expenses)
    if (emotionFilter !== "all" && item.type === "expense") {
      const emotionMap: Record<string, string> = {
        essential: "essencial",
        obligation: "pilar",
        pleasure: "essencial",
        impulse: "impulso",
      };
      const mappedEmotion = emotionMap[emotionFilter] || emotionFilter;
      if (item.category !== mappedEmotion) return false;
    }
    // Period filter
    if (periodFilter === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (item.createdAt.getTime() < weekAgo) return false;
    }
    return true;
  });

  // Sort by date (newest first)
  const sortedItems = [...filteredItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Group by period
  const groupedItems = groupByPeriod(sortedItems, selectedMonth);

  // Calculate totals

  const totalExpenses = filteredItems
    .filter((i) => i.type === "expense")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalIncome = filteredItems
    .filter((i) => i.type === "income")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalDebt = filteredItems
    .filter((i) => i.type === "debt")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalCreditCard = filteredItems
    .filter((i) => i.type === "credit_card")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalReceivables = filteredItems
    .filter((i) => i.type === "receivable")
    .reduce((acc, e) => acc + e.amount, 0);
  const activeSubsAmount = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalSubscriptions = (isCurrentMonth || isAfter(monthStart, startOfMonth(new Date())))
    ? activeSubsAmount
    : filteredItems
      .filter((i) => i.type === "subscription")
      .reduce((acc, e) => acc + e.amount, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

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
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="-ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">Histórico</h1>
          </div>
          <FilterSheet
            periodFilter={periodFilter}
            sourceFilter={sourceFilter}
            emotionFilter={emotionFilter}
            typeFilter={typeFilter}
            onPeriodChange={setPeriodFilter}
            onSourceChange={setSourceFilter}
            onEmotionChange={setEmotionFilter}
            onTypeChange={setTypeFilter}
            onReset={resetFilters}
          />
        </div>
        {/* Month selector */}
        <div className="flex items-center justify-between py-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium capitalize text-sm">{monthLabel}</span>
            {isCurrentMonth && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Atual</span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-5">
        {/* Compact Summary */}
        <FadeIn className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-card border border-border shadow-soft">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Total de Gastos</p>
              <p className="font-semibold text-sm">{formatCurrency(totalExpenses + totalCreditCard + totalSubscriptions)}</p>
            </div>
            <div className="p-3 rounded-xl bg-essential/5 border border-essential/20 shadow-soft">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Receitas</p>
              <p className="font-semibold text-sm text-essential">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 rounded-xl bg-impulse/5 border border-impulse/20 shadow-soft">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Dívidas</p>
              <p className="font-semibold text-sm text-impulse">{formatCurrency(totalDebt)}</p>
            </div>
            {totalReceivables > 0 && (
              <div className="p-3 rounded-xl bg-essential/5 border border-essential/20 shadow-soft flex flex-col justify-center">
                <p className="text-[10px] text-muted-foreground whitespace-nowrap uppercase tracking-wider mb-0.5">A receber</p>
                <p className="font-semibold text-sm text-essential truncate">{formatCurrency(totalReceivables)}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-obligation/5 border border-obligation/20 shadow-soft">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Cartão</p>
              <p className="font-semibold text-sm text-obligation">{formatCurrency(totalCreditCard)}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 shadow-soft">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Assinaturas</p>
              <p className="font-semibold text-sm text-primary">{formatCurrency(totalSubscriptions)}</p>
            </div>
          </div>
        </FadeIn>

        {/* Grouped List */}
        {groupedItems.length > 0 ? (
          groupedItems.map((group, groupIndex) => (
            <FadeIn key={group.label} delay={0.05 * groupIndex} className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: itemIndex * 0.03 }}
                  >
                    <HistoryItemCard
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          ))
        ) : (
          <FadeIn className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum registro encontrado.
            </p>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
