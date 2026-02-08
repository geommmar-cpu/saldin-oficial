import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmotionCategory } from "./EmotionSelector";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category?: EmotionCategory;
  wouldDoAgain?: boolean;
  source: "manual" | "bank" | "photo" | "whatsapp" | "audio" | "cartao";
  pending: boolean;
  createdAt: Date;
  establishment?: string;
}

interface ExpenseItemProps {
  expense: Expense;
  onClick?: () => void;
}

const categoryEmojis: Record<EmotionCategory, string> = {
  essential: "✅",
  obligation: "🎯",
  pleasure: "😊",
  impulse: "🔥",
};

const sourceLabels: Record<Expense["source"], string> = {
  manual: "Manual",
  bank: "Banco",
  photo: "Foto",
  whatsapp: "WhatsApp",
  audio: "Áudio",
  cartao: "Cartão",
};

export const ExpenseItem = ({ expense, onClick }: ExpenseItemProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(expense.amount);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200",
        "bg-card border border-border shadow-soft",
        "hover:shadow-medium",
        expense.pending && "border-accent border-2 bg-accent/5"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-xl",
          expense.category
            ? `bg-${expense.category}/10`
            : "bg-muted"
        )}
        style={
          expense.category
            ? {
                backgroundColor: `hsl(var(--${expense.category}) / 0.15)`,
              }
            : undefined
        }
      >
        {expense.category ? categoryEmojis[expense.category] : "💳"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {expense.description || expense.establishment || "Despesa"}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(expense.createdAt, {
            addSuffix: true,
            locale: ptBR,
          })}
          {" · "}
          {sourceLabels[expense.source]}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-semibold tabular-nums",
            expense.category === "impulse" && "text-impulse"
          )}
        >
          {formattedAmount}
        </p>
        {expense.pending && (
          <span className="text-xs text-accent font-medium">Pendente</span>
        )}
      </div>
    </motion.button>
  );
};

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseClick?: (expense: Expense) => void;
  emptyMessage?: string;
}

export const ExpenseList = ({
  expenses,
  onExpenseClick,
  emptyMessage = "Nenhum gasto registrado",
}: ExpenseListProps) => {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ExpenseItem
            expense={expense}
            onClick={() => onExpenseClick?.(expense)}
          />
        </motion.div>
      ))}
    </div>
  );
};
