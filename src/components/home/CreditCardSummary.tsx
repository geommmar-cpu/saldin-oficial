import { motion } from "framer-motion";
import { CreditCard, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { CreditCard as CreditCardType, CreditCardInstallment, CreditCardPurchase } from "@/types/creditCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { detectBank, detectBrand, getCardColor } from "@/lib/cardBranding";

interface CreditCardSummaryProps {
  cards: CreditCardType[];
  installments: (CreditCardInstallment & { purchase: CreditCardPurchase & { card: CreditCardType } })[];
  selectedMonth: Date;
}

export const CreditCardSummary = ({ cards, installments, selectedMonth }: CreditCardSummaryProps) => {
  const navigate = useNavigate();

  if (cards.length === 0) return null;

  // Group installments by card
  const cardStatements = cards.map(card => {
    const cardInstallments = installments.filter(
      i => i.purchase?.card?.id === card.id
    );
    const total = cardInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
    const openCount = cardInstallments.filter(i => i.status === "open").length;
    const allPaid = openCount === 0 && cardInstallments.length > 0;

    return {
      card,
      total,
      itemCount: cardInstallments.length,
      status: allPaid ? "paid" as const : total > 0 ? "open" as const : "empty" as const,
    };
  }).filter(s => s.total > 0 || s.itemCount > 0);

  // Total across all cards
  const grandTotal = cardStatements.reduce((sum, s) => sum + s.total, 0);

  if (grandTotal === 0 && cardStatements.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        Fatura Atual
      </h2>

      {cardStatements.map((statement, index) => (
        <motion.button
          key={statement.card.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/credit-cards/${statement.card.id}`)}
          className="w-full p-4 rounded-xl bg-card border border-border shadow-soft"
        >
          {/* Card header with color bar */}
          <div className="flex items-center gap-3">
            {(() => {
              const bankTheme = detectBank(statement.card.card_name);
              const brand = detectBrand(statement.card.card_brand);
              const color = getCardColor(statement.card.color, statement.card.card_name);
              return (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {brand ? brand.abbr : bankTheme.name.charAt(0)}
                </div>
              );
            })()}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{statement.card.card_name}</p>
                {statement.card.card_brand && (
                  <span className="text-xs text-muted-foreground">{statement.card.card_brand}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha dia {statement.card.closing_day} · Vence dia {statement.card.due_day}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm tabular-nums">
                {formatCurrency(statement.total)}
              </p>
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                statement.status === "paid"
                  ? "bg-essential/10 text-essential"
                  : "bg-pleasure/10 text-pleasure"
              )}>
                {statement.status === "paid" ? "Paga" : `${statement.itemCount} item${statement.itemCount !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Usage bar */}
          {statement.card.credit_limit > 0 && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((statement.total / statement.card.credit_limit) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    (statement.total / statement.card.credit_limit) > 0.8
                      ? "bg-impulse"
                      : "bg-primary"
                  )}
                  style={{ backgroundColor: statement.card.color }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((statement.total / statement.card.credit_limit) * 100)}% usado
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Limite: {formatCurrency(statement.card.credit_limit)}
                </span>
              </div>
            </div>
          )}
        </motion.button>
      ))}

      {/* View all cards link */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/credit-cards")}
        className="w-full py-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Ver todos os cartões
        <ChevronRight className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
};
