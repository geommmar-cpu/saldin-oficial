import { motion } from "framer-motion";
import { TrendingUp, Receipt, HandCoins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/balanceCalculations";

interface QuickActionsProps {
  totalIncome: number;
  totalSpent: number;
  totalCardInstallments: number;
  totalReceivables: number;
  selectedMonth: Date;
}

export const QuickActions = ({ totalIncome, totalSpent, totalCardInstallments, totalReceivables, selectedMonth }: QuickActionsProps) => {
  const totalExpenses = totalSpent + totalCardInstallments;
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/income", { state: { selectedMonth: selectedMonth.toISOString() } })}
        className="p-3 rounded-xl bg-essential/8 border border-essential/15 text-left"
      >
        <TrendingUp className="w-4 h-4 text-essential mb-1" />
        <p className="text-[10px] text-muted-foreground">Receitas</p>
        <p className="font-semibold text-xs text-essential tabular-nums">{formatCurrency(totalIncome)}</p>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/expenses", { state: { selectedMonth: selectedMonth.toISOString() } })}
        className="p-3 rounded-xl bg-card border border-border text-left"
      >
        <Receipt className="w-4 h-4 text-foreground mb-1" />
        <p className="text-[10px] text-muted-foreground">Gastos</p>
        <p className="font-semibold text-xs tabular-nums">{formatCurrency(totalExpenses)}</p>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/receivables", { state: { selectedMonth: selectedMonth.toISOString() } })}
        className="p-3 rounded-xl bg-card border border-border text-left"
      >
        <HandCoins className="w-4 h-4 text-essential/70 mb-1" />
        <p className="text-[10px] text-muted-foreground">A receber</p>
        <p className="font-semibold text-xs tabular-nums">{formatCurrency(totalReceivables)}</p>
      </motion.button>
    </div>
  );
};
