import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  Building, 
  ShoppingBag,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebts, useDebtStats, DebtRow } from "@/hooks/useDebts";

const categoryIcons: Record<string, React.ElementType> = {
  credit_card: CreditCard,
  loan: Building,
  financing: Building,
  store: ShoppingBag,
  personal: CreditCard,
  other: CreditCard,
};

const categoryLabels: Record<string, string> = {
  credit_card: "Cartão de crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
  store: "Loja",
  personal: "Pessoal",
  other: "Outros",
};

export const Debts = () => {
  const navigate = useNavigate();
  const [showPaid, setShowPaid] = useState(false);

  // Fetch real data from Supabase
  const { data: debts = [], isLoading } = useDebts("all");
  const { data: stats } = useDebtStats();

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");

  const totalMonthlyCommitment = stats?.totalMonthly ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDebtClick = (debt: DebtRow) => {
    navigate(`/debts/${debt.id}`, { state: { debt } });
  };

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
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Dívidas</h1>
              <p className="text-xs text-muted-foreground">
                Parcelamentos e compromissos
              </p>
            </div>
          </div>
          <Button
            variant="warm"
            size="sm"
            onClick={() => navigate("/debts/add")}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Summary Card */}
        <FadeIn>
          <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Compromisso mensal
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                {activeDebts.length} ativa{activeDebts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="font-serif text-3xl font-semibold text-impulse">
              {formatCurrency(totalMonthlyCommitment)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Este valor já compromete sua renda todo mês
            </p>
          </div>
        </FadeIn>

        {/* Active Debts */}
        {activeDebts.length > 0 && (
          <FadeIn delay={0.1}>
            <h2 className="font-serif text-lg font-semibold mb-2">
              Dívidas ativas
            </h2>
            <div className="space-y-2">
              {activeDebts.map((debt, index) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onClick={() => handleDebtClick(debt)}
                  delay={index * 0.05}
                />
              ))}
            </div>
          </FadeIn>
        )}

        {/* Empty State */}
        {activeDebts.length === 0 && (
          <FadeIn delay={0.1} className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-essential/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-essential" />
            </div>
            <h3 className="font-semibold mb-1">Sem dívidas ativas</h3>
            <p className="text-sm text-muted-foreground">
              Você não tem compromissos pendentes
            </p>
          </FadeIn>
        )}

        {/* Paid Debts Toggle */}
        {paidDebts.length > 0 && (
          <FadeIn delay={0.2}>
            <button
              onClick={() => setShowPaid(!showPaid)}
              className="w-full p-3 rounded-xl bg-muted/50 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              {showPaid ? "Ocultar" : "Ver"} {paidDebts.length} dívida
              {paidDebts.length !== 1 ? "s" : ""} quitada
              {paidDebts.length !== 1 ? "s" : ""}
            </button>

            {showPaid && (
              <div className="space-y-2 mt-3">
                {paidDebts.map((debt, index) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onClick={() => handleDebtClick(debt)}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            )}
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

interface DebtCardProps {
  debt: DebtRow;
  onClick: () => void;
  delay?: number;
}

const DebtCard = ({ debt, onClick, delay = 0 }: DebtCardProps) => {
  const Icon = categoryIcons["other"]; // Default icon since we removed category
  const isPaid = debt.status === "paid";
  const isRecurring = !debt.is_installment;
  const progress = isRecurring
    ? 0
    : Math.round(((debt.current_installment || 0) / (debt.total_installments || 1)) * 100);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all",
        "bg-card border shadow-soft hover:shadow-medium",
        isPaid
          ? "border-essential/30 opacity-70"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
            isPaid ? "bg-essential/15" : "bg-impulse/15"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isPaid ? "text-essential" : "text-impulse"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{debt.creditor_name}</p>
            {isPaid && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-essential/10 text-essential font-medium flex-shrink-0">
                Quitada
              </span>
            )}
            {isRecurring && !isPaid && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium flex-shrink-0">
                Recorrente
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{debt.description || "Dívida"}</span>
            {!isRecurring && (
              <>
                <span>·</span>
                <span>
                  {debt.current_installment}/{debt.total_installments} parcelas
                </span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {!isRecurring && !isPaid && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: delay + 0.2, duration: 0.5 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-semibold tabular-nums">
            {formatCurrency(Number(debt.installment_amount || 0))}
          </p>
          <p className="text-xs text-muted-foreground">/mês</p>
        </div>
      </div>
    </motion.button>
  );
};

export default Debts;
