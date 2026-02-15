import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CreditCard, Banknote, HandCoins, Receipt, LucideIcon, Plus, Calendar } from "lucide-react";
import { BankLogo } from "@/components/BankLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import { format, isToday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/dateUtils";
import type { ExpenseRow } from "@/hooks/useExpenses";
import type { IncomeRow } from "@/hooks/useIncomes";
import type { DebtRow } from "@/hooks/useDebts";
import type { CreditCardInstallment, CreditCardPurchase, CreditCard as CreditCardType } from "@/types/creditCard";

type TimePeriod = "today" | "week" | "month";

interface TransactionItem {
  id: string;
  type: "expense" | "income" | "debt" | "receivable" | "credit_card" | "subscription";
  amount: number;
  description: string;
  date: Date;
  icon: LucideIcon;
  color: string;
  bg?: string;
}

interface TransactionsSectionProps {
  expenses: ExpenseRow[];
  incomes: IncomeRow[];
  debts: DebtRow[];
  receivables: any[];
  creditCardInstallments: (CreditCardInstallment & { purchase: CreditCardPurchase & { card: CreditCardType } })[];
  selectedMonth: Date;
}

export const TransactionsSection = ({
  expenses,
  incomes,
  debts,
  receivables,
  creditCardInstallments,
  selectedMonth,
}: TransactionsSectionProps) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<TimePeriod>("month");

  const transactions = useMemo(() => {
    const items: TransactionItem[] = [];

    // Add expenses
    expenses.forEach(e => {
      const installmentLabel = e.is_installment && e.total_installments && e.total_installments > 1
        ? ` · ${e.installment_number || 1}/${e.total_installments}`
        : "";

      const txDate = e.date ? parseLocalDate(e.date) : new Date(e.created_at);
      const isSub = e.description?.startsWith("Assinatura: ");

      items.push({
        id: e.id,
        type: isSub ? "subscription" : "expense",
        amount: Number(e.amount),
        description: `${e.description}${installmentLabel}`,
        date: new Date(e.created_at), // Use timestamp for time, assuming backend saves correctly now
        icon: isSub ? Calendar : Receipt,
        color: isSub ? "text-primary" : "text-impulse",
        bg: isSub ? "bg-primary/10" : "bg-impulse/10",
      });
    });

    // Add incomes
    incomes.forEach(i => {
      const paymentDayMatch = i.notes?.match(/payment_day:(\d+)/);
      const paymentDay = paymentDayMatch ? Number(paymentDayMatch[1]) : null;
      const incomeDate = i.date ? parseLocalDate(i.date) : new Date(i.created_at);
      const displayDate = i.is_recurring
        ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), incomeDate.getDate())
        : incomeDate;
      const isFuture = i.is_recurring && paymentDay ? displayDate > new Date() : false;
      items.push({
        id: i.id,
        type: "income",
        amount: Number(i.amount),
        description: isFuture
          ? `${i.description} (prevista)`
          : i.is_recurring ? `${i.description} (recorrente)` : i.description,
        date: displayDate,
        icon: Banknote,
        color: isFuture ? "text-muted-foreground" : "text-essential",
        bg: isFuture ? "bg-muted" : "bg-essential/10",
      });
    });

    // Add debts
    debts.forEach(d => {
      items.push({
        id: d.id,
        type: "debt",
        amount: Number(d.installment_amount || d.total_amount),
        description: `${d.creditor_name}${d.is_installment ? ` ${d.current_installment}/${d.total_installments}` : ''}`,
        date: new Date(d.created_at),
        icon: CreditCard,
        color: "text-impulse",
        bg: "bg-impulse/10",
      });
    });

    // Add receivables
    receivables.forEach(r => {
      items.push({
        id: r.id,
        type: "receivable",
        amount: Number(r.amount),
        description: `${r.debtor_name}${r.description ? ` · ${r.description}` : ''}`,
        date: r.due_date ? parseLocalDate(r.due_date) : new Date(r.created_at),
        icon: HandCoins,
        color: "text-essential",
        bg: "bg-essential/10",
      });
    });

    // Add credit card purchases
    creditCardInstallments.forEach(inst => {
      const purchase = inst.purchase;
      const installmentLabel = purchase?.total_installments > 1
        ? ` · ${inst.installment_number}/${purchase.total_installments}`
        : "";
      const purchaseDate = purchase?.created_at ? new Date(purchase.created_at) : new Date(inst.created_at);
      const isSub = purchase?.description?.startsWith("Assinatura: ");

      items.push({
        id: inst.id,
        type: isSub ? "subscription" : "credit_card",
        amount: Number(inst.amount),
        description: `${purchase?.description || "Cartão"} · ${purchase?.card?.card_name || ""}${installmentLabel}`,
        date: purchaseDate,
        icon: isSub ? Calendar : CreditCard,
        color: isSub ? "text-primary" : "text-obligation",
        bg: isSub ? "bg-primary/10" : "bg-obligation/10",
      });
    });

    // Filter by time period
    const filtered = items.filter(item => {
      if (period === "today") return isToday(item.date);
      if (period === "week") return isThisWeek(item.date, { weekStartsOn: 0 });
      return true;
    });

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  }, [expenses, incomes, debts, receivables, creditCardInstallments, selectedMonth, period]);

  const handleClick = (item: TransactionItem) => {
    if (!item.id) return;

    switch (item.type) {
      case "income": navigate(`/income/${item.id}`); break;
      case "debt": navigate(`/debts/${item.id}`); break;
      case "receivable": navigate(`/receivables/${item.id}`); break;
      case "credit_card":
        navigate(`/expenses/cc-${item.id}`);
        break;
      case "subscription":
        // Subscriptions generated as expenses can go to expense details or history with filter
        if (item.id.length > 30) { // UUID length check to guess if it's an expense or cc installment
          navigate(`/expenses/${item.id}`);
        } else {
          navigate(`/expenses/cc-${item.id}`);
        }
        break;
      default: navigate(`/expenses/${item.id}`);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "credit_card": return <CreditCard className="w-3.5 h-3.5" />;
      case "income": return <Banknote className="w-3.5 h-3.5" />;
      case "receivable": return <HandCoins className="w-3.5 h-3.5" />;
      case "debt": return <CreditCard className="w-3.5 h-3.5" />;
      case "subscription": return <Calendar className="w-3.5 h-3.5" />;
      default: return <Receipt className="w-3.5 h-3.5" />;
    }
  };

  const typeLabel: Record<string, string> = {
    expense: "Gasto",
    income: "Receita",
    debt: "Dívida",
    receivable: "A receber",
    credit_card: "Cartão",
    subscription: "Gasto Recorrente",
  };

  // Group by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    transactions.forEach(tx => {
      let key = format(tx.date, "dd 'de' MMMM", { locale: ptBR });
      if (isToday(tx.date)) key = "Hoje";
      else if (new Date().getDate() - tx.date.getDate() === 1 && isThisWeek(tx.date)) key = "Ontem";

      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-foreground">Últimas movimentações</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 hover:bg-transparent hover:text-primary"
          onClick={() => navigate("/history")}
        >
          Ver histórico
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-0.5 rounded-xl bg-muted/40 mx-1">
        {([
          { key: "today", label: "Hoje" },
          { key: "week", label: "Semana" },
          { key: "month", label: "Mês" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
              period === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped List */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {dateLabel}
              </p>
              <div className="space-y-1">
                {items.map((tx, index) => {
                  const isPositive = tx.type === "income" || tx.type === "receivable";
                  return (
                    <motion.button
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleClick(tx)}
                      className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-muted/40 transition-colors group"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        "bg-muted/50 group-hover:bg-white/80 dark:group-hover:bg-muted"
                      )}>
                        {tx.type === "subscription" ? (
                          <BankLogo bankName={tx.description.replace("Assinatura: ", "")} size="sm" />
                        ) : (
                          <tx.icon className={cn("w-4 h-4", tx.color)} />
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm truncate text-foreground/90">{tx.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {typeIcon(tx.type)}
                          <span>{typeLabel[tx.type]}</span>
                          <span>·</span>
                          <span>{format(tx.date, "dd/MM", { locale: ptBR })}</span>
                          <span>·</span>
                          <span>{format(tx.date, "HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>

                      <p className={cn(
                        "font-bold text-sm tabular-nums tracking-tight",
                        isPositive ? "text-essential" : "text-foreground"
                      )}>
                        {isPositive ? "+" : "−"} {formatCurrency(tx.amount)}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
          <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-xs">
            Nada por aqui {period === "today" ? "hoje" : period === "week" ? "nesta semana" : "neste mês"}
          </p>
        </div>
      )}
    </div>
  );
};
