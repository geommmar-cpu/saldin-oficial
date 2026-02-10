import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmotionCategory } from "./EmotionSelector";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck, Target, Smile, Flame, Receipt, LucideIcon } from "lucide-react";

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
  installmentNumber?: number;
  totalInstallments?: number;
}

interface ExpenseItemProps {
  expense: Expense;
  onClick?: () => void;
}

const categoryIcons: Record<EmotionCategory, LucideIcon> = {
  essential: ShieldCheck,
  obligation: Target,
  pleasure: Smile,
  impulse: Flame,
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

  const CategoryIcon = expense.category ? categoryIcons[expense.category] : Receipt;

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
          "flex h-12 w-12 items-center justify-center rounded-full",
          expense.category
            ? ""
            : "bg-impulse/10"
        )}
        style={
          expense.category
            ? {
                backgroundColor: `hsl(var(--${expense.category}) / 0.15)`,
              }
            : undefined
        }
      >
        <CategoryIcon
          className={cn(
            "w-5 h-5",
            expense.category
              ? ""
              : "text-impulse"
          )}
          style={
            expense.category
              ? { color: `hsl(var(--${expense.category}))` }
              : undefined
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {expense.description || expense.establishment || "Despesa"}
          </p>
          {expense.totalInstallments && expense.totalInstallments > 1 && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              {expense.installmentNumber || 1}/{expense.totalInstallments}
            </span>
          )}
        </div>
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
