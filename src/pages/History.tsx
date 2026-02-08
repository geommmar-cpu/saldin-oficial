import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FilterSheet } from "@/components/FilterSheet";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, ArrowDownCircle, AlertCircle, CreditCard, Loader2, Receipt, Banknote, HandCoins } from "lucide-react";
import { PeriodFilter, SourceFilter, EmotionFilter, ItemTypeFilter } from "@/types/expense";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExpenses, ExpenseRow } from "@/hooks/useExpenses";
import { useIncomes, IncomeRow } from "@/hooks/useIncomes";
import { useDebts, DebtRow } from "@/hooks/useDebts";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";

// Emotion category type based on database enum
type EmotionCategory = "pilar" | "essencial" | "impulso";

// Combined type for list items
interface HistoryItem {
  id: string;
  type: "expense" | "income" | "debt" | "credit_card";
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
}

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  integration: "Integração",
};

// Group items by period
function groupByPeriod(items: HistoryItem[]) {
  const groups: { label: string; items: HistoryItem[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Esta semana", items: [] },
    { label: "Este mês", items: [] },
  ];

  items.forEach((item) => {
    if (isToday(item.createdAt)) {
      groups[0].items.push(item);
    } else if (isYesterday(item.createdAt)) {
      groups[1].items.push(item);
    } else if (isThisWeek(item.createdAt, { weekStartsOn: 0 })) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

interface HistoryItemCardProps {
  item: HistoryItem;
  onClick: () => void;
}

const HistoryItemCard = ({ item, onClick }: HistoryItemCardProps) => {
  const isIncome = item.type === "income";
  const isDebt = item.type === "debt";
  const isCreditCard = item.type === "credit_card";
  const needsCompletion = item.type === "expense" && !item.category && !item.pending;

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.amount);

  const typeLabel = isIncome ? "Receita" : isDebt ? "Dívida" : isCreditCard ? "Cartão" : null;
  const typeLabelColor = isIncome ? "text-essential bg-essential/10" : isDebt ? "text-impulse bg-impulse/10" : isCreditCard ? "text-obligation bg-obligation/10" : "";

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
        isIncome ? "border-essential/30" : isDebt ? "border-impulse/20" : isCreditCard ? "border-obligation/20" : "border-border",
        item.pending && "border-accent border-2 bg-accent/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-lg flex-shrink-0",
          isIncome ? "bg-essential/15" : isDebt ? "bg-impulse/10" : isCreditCard ? "bg-obligation/10" : "bg-muted"
        )}
      >
        {isIncome ? (
          <Banknote className="w-5 h-5 text-essential" />
        ) : isDebt ? (
          <CreditCard className="w-5 h-5 text-impulse" />
        ) : isCreditCard ? (
          <CreditCard className="w-5 h-5 text-obligation" />
        ) : (
          <Receipt className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">
            {item.description}
          </p>
          {typeLabel && (
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium shrink-0", typeLabelColor)}>
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
          {!item.cardName && !item.invoiceMonth && (
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
            isIncome && "text-essential",
            isDebt && "text-impulse",
            isCreditCard && "text-obligation",
            item.category === "impulso" && "text-impulse"
          )}
        >
          {isIncome ? "+" : "−"} {formattedAmount}
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
  const initialTypeFilter = (searchParams.get("type") as ItemTypeFilter) || "all";
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [emotionFilter, setEmotionFilter] = useState<EmotionFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>(initialTypeFilter);

  // Fetch real data from Supabase
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses("all");
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes();
  const { data: debts = [], isLoading: debtsLoading } = useDebts("active");
  const { data: ccInstallments = [], isLoading: ccLoading } = useCardInstallmentsByMonth(new Date());

  const isLoading = expensesLoading || incomesLoading || debtsLoading || ccLoading;

  // Transform data to HistoryItem format
  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];

    // Add expenses
    expenses.forEach((expense: ExpenseRow) => {
      items.push({
        id: expense.id,
        type: "expense",
        amount: Number(expense.amount),
        description: expense.description,
        category: expense.emotion as EmotionCategory | undefined,
        source: expense.source as HistoryItem["source"],
        pending: expense.status === "pending",
        createdAt: new Date(expense.created_at),
      });
    });

    // Add incomes
    incomes.forEach((income: IncomeRow) => {
      items.push({
        id: income.id,
        type: "income",
        amount: Number(income.amount),
        description: income.description,
        incomeType: income.type,
        source: "manual" as const,
        pending: false,
        createdAt: new Date(income.created_at),
      });
    });

    // Add active debts
    debts.forEach((debt: DebtRow) => {
      items.push({
        id: debt.id,
        type: "debt",
        amount: Number(debt.installment_amount || debt.total_amount),
        description: `${debt.creditor_name} - ${debt.current_installment || 0}/${debt.total_installments || 1}`,
        source: "manual" as const,
        pending: false,
        createdAt: new Date(debt.created_at),
      });
    });

    // Add credit card purchases (installments)
    ccInstallments.forEach((inst: any) => {
      const purchase = inst.purchase;
      const card = purchase?.card;
      const refMonth = inst.reference_month
        ? format(new Date(inst.reference_month), "MMM/yy", { locale: ptBR })
        : undefined;

      items.push({
        id: inst.id,
        type: "credit_card",
        amount: Number(inst.amount),
        description: purchase?.description || "Compra no cartão",
        cardName: card?.card_name,
        invoiceMonth: refMonth,
        source: "manual" as const,
        pending: inst.status === "open",
        createdAt: new Date(purchase?.purchase_date || inst.created_at),
      });
    });

    return items;
  }, [expenses, incomes, debts, ccInstallments]);

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === "income") {
      navigate(`/income/${item.id}`);
    } else if (item.type === "debt") {
      navigate(`/debts/${item.id}`);
    } else if (item.type === "credit_card") {
      navigate("/credit-cards");
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
      if (typeFilter === "expense" && item.type !== "expense" && item.type !== "credit_card") return false;
      if (typeFilter === "income" && item.type !== "income") return false;
      if (typeFilter === "debt" && item.type !== "debt") return false;
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
  const groupedItems = groupByPeriod(sortedItems);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Get current month name
  const currentMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

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
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Histórico</h1>
              <p className="text-xs text-muted-foreground capitalize">{currentMonth}</p>
            </div>
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
      </header>

      <main className="px-5">
        {/* Compact Summary */}
        <FadeIn className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-card border border-border shadow-soft">
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="font-semibold text-sm">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 rounded-xl bg-essential/5 border border-essential/20 shadow-soft">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-semibold text-sm text-essential">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 rounded-xl bg-impulse/5 border border-impulse/20 shadow-soft">
              <p className="text-xs text-muted-foreground">Dívidas</p>
              <p className="font-semibold text-sm text-impulse">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="p-3 rounded-xl bg-obligation/5 border border-obligation/20 shadow-soft">
              <p className="text-xs text-muted-foreground">Cartão</p>
              <p className="font-semibold text-sm text-obligation">{formatCurrency(totalCreditCard)}</p>
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
