import { motion } from "framer-motion";
import { RefreshCw, Zap, MessageCircle, CreditCard, Pencil, Calendar, CalendarDays, Landmark } from "lucide-react";
import { Income } from "@/types/expense";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface IncomeListProps {
  incomes: Income[];
  onIncomeClick?: (income: Income) => void;
}

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  bank: "Banco",
};

const sourceIcons = {
  manual: Pencil,
  whatsapp: MessageCircle,
  bank: CreditCard,
};

export const IncomeList = ({ incomes, onIncomeClick }: IncomeListProps) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="space-y-2">
      {incomes.map((income, index) => {
        const isInitialBalance = income.type === "initial_balance";
        const SourceIcon = sourceIcons[income.source];
        const TypeIcon = isInitialBalance ? Landmark : income.type === "fixed" ? RefreshCw : Zap;

        return (
          <motion.button
            key={income.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onIncomeClick?.(income)}
            className="w-full p-3 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
          >
            {/* Type Icon */}
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
              isInitialBalance ? "bg-accent/15" : "bg-essential/15"
            )}>
              <TypeIcon className={cn("w-4 h-4", isInitialBalance ? "text-accent" : "text-essential")} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{income.description}</p>
                {isInitialBalance && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    Saldo inicial
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {/* Frequency */}
                <span className="flex items-center gap-1">
                  {income.recurring ? (
                    <>
                      <CalendarDays className="w-3 h-3" />
                      Mensal
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3" />
                      Pontual
                    </>
                  )}
                </span>
                <span>·</span>
                {/* Source - discrete */}
                <span className="flex items-center gap-1">
                  <SourceIcon className={cn(
                    "w-3 h-3",
                    income.source === "whatsapp" && "text-[#25D366]"
                  )} />
                  {sourceLabels[income.source]}
                </span>
              </div>
            </div>

            {/* Amount */}
            <p className="font-semibold text-sm text-essential whitespace-nowrap">
              +{formatCurrency(income.amount)}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
};
