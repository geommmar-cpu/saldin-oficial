import { motion } from "framer-motion";
import { AlertTriangle, CreditCard, Target, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { DebtRow } from "@/hooks/useDebts";
import type { Goal } from "@/types/goal";
import type { CreditCard as CreditCardType } from "@/types/creditCard";
import type { CreditCardInstallment, CreditCardPurchase } from "@/types/creditCard";
import type { Subscription } from "@/types/subscription";

interface AlertItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  action?: () => void;
}

interface AlertsSectionProps {
  debts: DebtRow[];
  goals: Goal[];
  creditCards: CreditCardType[];
  installments: (CreditCardInstallment & { purchase: CreditCardPurchase & { card: CreditCardType } })[];
  subscriptions?: Subscription[];
  selectedMonth: Date;
}

export const AlertsSection = ({ debts, goals, creditCards, installments, subscriptions = [], selectedMonth }: AlertsSectionProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const alerts: AlertItem[] = [];

  // 0. Subscriptions due soon
  subscriptions.forEach(sub => {
    if (sub.status !== 'active') return;

    const billingDay = sub.billing_date;
    const todayDay = today.getDate();
    const daysUntil = billingDay - todayDay;

    // Show alert if billing is within 3 days or today
    if (daysUntil >= 0 && daysUntil <= 3) {
      alerts.push({
        id: `sub-due-${sub.id}`,
        icon: <Calendar className="w-4 h-4" />,
        title: `${sub.name} vence ${daysUntil === 0 ? 'hoje' : `em ${daysUntil}d`}`,
        description: `Cobrança de ${formatCurrency(sub.amount)}`,
        color: daysUntil <= 1 ? "text-impulse bg-impulse/10 border-impulse/20" : "text-pleasure bg-pleasure/10 border-pleasure/20",
        action: () => navigate(`/subscriptions`),
      });
    }
  });

  // 1. Credit card due dates approaching
  creditCards.forEach(card => {
    const dueDay = card.due_day;
    const daysUntilDue = dueDay - today.getDate();

    // Check if there are installments for this card this month
    const cardInstallments = installments.filter(
      i => i.purchase?.card?.id === card.id && i.status === "open"
    );
    const statementTotal = cardInstallments.reduce((sum, i) => sum + Number(i.amount), 0);

    if (statementTotal > 0 && daysUntilDue >= 0 && daysUntilDue <= 7) {
      alerts.push({
        id: `card-due-${card.id}`,
        icon: <CreditCard className="w-4 h-4" />,
        title: `Fatura ${card.card_name} vence em ${daysUntilDue === 0 ? 'hoje' : `${daysUntilDue}d`}`,
        description: `${formatCurrency(statementTotal)} pendente`,
        color: daysUntilDue <= 2 ? "text-impulse bg-impulse/10 border-impulse/20" : "text-pleasure bg-pleasure/10 border-pleasure/20",
        action: () => navigate(`/credit-cards/${card.id}`),
      });
    }
  });

  // 2. Debts due soon
  debts.forEach(debt => {
    if (debt.due_date) {
      const dueDate = new Date(debt.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 5) {
        alerts.push({
          id: `debt-due-${debt.id}`,
          icon: <AlertTriangle className="w-4 h-4" />,
          title: `Dívida vence ${diffDays === 0 ? 'hoje' : `em ${diffDays}d`}`,
          description: `${debt.creditor_name} · ${formatCurrency(Number(debt.installment_amount || debt.total_amount))}`,
          color: diffDays <= 2 ? "text-impulse bg-impulse/10 border-impulse/20" : "text-pleasure bg-pleasure/10 border-pleasure/20",
          action: () => navigate(`/debts/${debt.id}`),
        });
      } else if (diffDays < 0) {
        alerts.push({
          id: `debt-overdue-${debt.id}`,
          icon: <AlertTriangle className="w-4 h-4" />,
          title: `Dívida vencida há ${Math.abs(diffDays)}d`,
          description: `${debt.creditor_name} · ${formatCurrency(Number(debt.installment_amount || debt.total_amount))}`,
          color: "text-impulse bg-impulse/10 border-impulse/20",
          action: () => navigate(`/debts/${debt.id}`),
        });
      }
    }
  });

  // 3. Goals behind schedule
  goals.forEach(goal => {
    if (goal.target_date && goal.status === 'in_progress') {
      const targetDate = new Date(goal.target_date);
      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) : 0;
      const timeElapsed = (today.getTime() - new Date(goal.created_at).getTime()) /
        (targetDate.getTime() - new Date(goal.created_at).getTime());

      if (timeElapsed > 0.5 && progress < timeElapsed * 0.5) {
        alerts.push({
          id: `goal-behind-${goal.id}`,
          icon: <Target className="w-4 h-4" />,
          title: `Meta "${goal.name}" atrasada`,
          description: `${Math.round(progress * 100)}% guardado, prazo se aproximando`,
          color: "text-pleasure bg-pleasure/10 border-pleasure/20",
          action: () => navigate(`/goals/${goal.id}`),
        });
      }
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-pleasure" />
        Alertas
      </h2>
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert, index) => (
          <motion.button
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={alert.action}
            className={cn(
              "w-full p-3 rounded-xl border flex items-center gap-3 text-left",
              alert.color
            )}
          >
            <div className="shrink-0">{alert.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs opacity-70">{alert.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
