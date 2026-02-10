import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CreditCard, Banknote, HandCoins, Receipt, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import { format, isToday, isThisWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ExpenseRow } from "@/hooks/useExpenses";
import type { IncomeRow } from "@/hooks/useIncomes";
import type { DebtRow } from "@/hooks/useDebts";
import type { CreditCardInstallment, CreditCardPurchase, CreditCard as CreditCardType } from "@/types/creditCard";

type TimePeriod = "today" | "week" | "month";

interface TransactionItem {
  id: string;
  type: "expense" | "income" | "debt" | "receivable" | "credit_card";
  amount: number;
  description: string;
  date: Date;
  icon: LucideIcon;
  color: string;
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
      items.push({
        id: e.id,
        type: "expense",
        amount: Number(e.amount),
        description: e.description,
        date: new Date(e.date || e.created_at),
        icon: Receipt,
        color: "text-impulse",
      });
    });

    // Add incomes
    incomes.forEach(i => {
      const paymentDayMatch = i.notes?.match(/payment_day:(\d+)/);
      const paymentDay = paymentDayMatch ? Number(paymentDayMatch[1]) : null;
      const displayDate = i.is_recurring
        ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), new Date(i.date || i.created_at).getDate())
        : new Date(i.date || i.created_at);
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
      });
    });

    // Add receivables
    receivables.forEach(r => {
      items.push({
        id: r.id,
        type: "receivable",
        amount: Number(r.amount),
        description: `${r.debtor_name}${r.description ? ` · ${r.description}` : ''}`,
        date: new Date(r.due_date || r.created_at),
        icon: HandCoins,
        color: "text-essential",
      });
    });

    // Add credit card purchases
    creditCardInstallments.forEach(inst => {
      items.push({
        id: inst.id,
        type: "credit_card",
        amount: Number(inst.amount),
        description: `${inst.purchase?.description || "Cartão"} · ${inst.purchase?.card?.card_name || ""}`,
        date: new Date(inst.created_at),
        icon: CreditCard,
        color: "text-obligation",
      });
    });

    // Filter by time period
    const filtered = items.filter(item => {
      if (period === "today") return isToday(item.date);
      if (period === "week") return isThisWeek(item.date, { weekStartsOn: 0 });
      return true; // month - already filtered by parent
    });

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [expenses, incomes, debts, receivables, creditCardInstallments, selectedMonth, period]);

  const handleClick = (item: TransactionItem) => {
    switch (item.type) {
      case "income": navigate(`/income/${item.id}`); break;
      case "debt": navigate(`/debts/${item.id}`); break;
      case "receivable": navigate(`/receivables/${item.id}`); break;
      case "credit_card": navigate("/credit-cards"); break;
      default: navigate(`/expenses/${item.id}`);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "credit_card": return <CreditCard className="w-3.5 h-3.5" />;
      case "income": return <Banknote className="w-3.5 h-3.5" />;
      case "receivable": return <HandCoins className="w-3.5 h-3.5" />;
      case "debt": return <CreditCard className="w-3.5 h-3.5" />;
      default: return <Receipt className="w-3.5 h-3.5" />;
    }
  };

  const typeLabel: Record<string, string> = {
    expense: "Gasto",
    income: "Receita",
    debt: "Dívida",
    receivable: "A receber",
    credit_card: "Cartão",
  };

  return (
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

      {/* Time period tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {([
          { key: "today", label: "Hoje" },
          { key: "week", label: "Semana" },
          { key: "month", label: "Mês" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              period === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((tx, index) => {
            const isPositive = tx.type === "income" || tx.type === "receivable";
            return (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClick(tx)}
                className="w-full p-3 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                  tx.type === "income" ? "bg-essential/15" :
                  tx.type === "debt" ? "bg-impulse/10" :
                  tx.type === "credit_card" ? "bg-obligation/10" :
                  tx.type === "receivable" ? "bg-essential/10" :
                  "bg-impulse/10"
                )}>
                  <tx.icon className={cn("w-4 h-4", tx.color)} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm truncate">{tx.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {typeIcon(tx.type)}
                    <span>{typeLabel[tx.type]}</span>
                    <span>·</span>
                    <span>{format(tx.date, "dd/MM", { locale: ptBR })}</span>
                  </div>
                </div>
                <p className={cn("font-semibold text-sm tabular-nums shrink-0", tx.color)}>
                  {isPositive ? "+" : "−"} {formatCurrency(tx.amount)}
                </p>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            {period === "today" ? "Nenhuma movimentação hoje" :
             period === "week" ? "Nenhuma movimentação esta semana" :
             "Nenhuma movimentação neste mês"}
          </p>
        </div>
      )}
    </div>
  );
};
