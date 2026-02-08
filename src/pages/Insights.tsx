import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { 
  Zap, 
  Repeat, 
  Scale, 
  X, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { useDebts } from "@/hooks/useDebts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type InsightType = 
  | "impulse" 
  | "repetition" 
  | "proportion" 
  | "comparison" 
  | "category" 
  | "debt";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  text: string;
  priority: number;
}

const insightConfig: Record<InsightType, { icon: React.ElementType; color: string }> = {
  impulse: { icon: Zap, color: "impulse" },
  repetition: { icon: Repeat, color: "accent" },
  proportion: { icon: Scale, color: "primary" },
  comparison: { icon: TrendingUp, color: "accent" },
  category: { icon: ShoppingBag, color: "pleasure" },
  debt: { icon: CreditCard, color: "impulse" },
};

export const Insights = () => {
  const navigate = useNavigate();
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  
  // Fetch real data
  const { data: expenses = [] } = useExpenses("all");
  const { data: incomes = [] } = useIncomes();
  const { data: debts = [] } = useDebts("active");
  
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });
  
  // Calculate real insights
  const insights = useMemo(() => {
    const result: Insight[] = [];
    
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    
    // Filter expenses by month
    const thisMonthExpenses = expenses.filter(e => {
      const date = new Date(e.date || e.created_at);
      return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
    });
    
    const lastMonthExpenses = expenses.filter(e => {
      const date = new Date(e.date || e.created_at);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });
    
    // Calculate totals
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Filter incomes
    const thisMonthIncomes = incomes.filter(i => {
      const date = new Date(i.date || i.created_at);
      return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd }) || i.is_recurring;
    });
    const totalIncome = thisMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
    
    // Calculate impulse expenses
    const impulseExpenses = thisMonthExpenses.filter(e => e.emotion === "impulso");
    const impulseTotal = impulseExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const impulsePercentage = thisMonthTotal > 0 ? Math.round((impulseTotal / thisMonthTotal) * 100) : 0;
    
    if (impulsePercentage > 20) {
      result.push({
        id: "impulse",
        type: "impulse",
        title: "Gastos por impulso",
        text: `${impulsePercentage}% dos seus gastos este mês foram por impulso. Isso representa R$ ${impulseTotal.toFixed(2).replace(".", ",")} não planejados.`,
        priority: 1,
      });
    }
    
    // Monthly comparison
    if (lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal) {
      const increase = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
      if (increase > 10) {
        result.push({
          id: "comparison",
          type: "comparison",
          title: "Aumento nos gastos",
          text: `Você gastou ${increase}% mais este mês comparado ao anterior. Acompanhe seus gastos de perto.`,
          priority: 2,
        });
      }
    }
    
    // Dominant emotion category
    const emotionTotals: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
      const emotion = e.emotion || "outros";
      emotionTotals[emotion] = (emotionTotals[emotion] || 0) + Number(e.amount);
    });
    
    const topEmotion = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0];
    if (topEmotion && thisMonthTotal > 0) {
      const emotionLabels: Record<string, string> = {
        essencial: "Essenciais",
        pilar: "Pilares",
        impulso: "Impulsos",
        outros: "Outros",
      };
      const percentage = Math.round((topEmotion[1] / thisMonthTotal) * 100);
      result.push({
        id: "category",
        type: "category",
        title: "Categoria dominante",
        text: `Seus gastos com "${emotionLabels[topEmotion[0]] || topEmotion[0]}" representam ${percentage}% do total este mês (R$ ${topEmotion[1].toFixed(2).replace(".", ",")}).`,
        priority: 3,
      });
    }
    
    // Debt insight
    const activeDebts = debts.filter(d => d.status === "active");
    const monthlyDebtPayment = activeDebts.reduce((sum, d) => sum + Number(d.installment_amount || 0), 0);
    
    if (activeDebts.length > 0 && totalIncome > 0) {
      const debtPercentage = Math.round((monthlyDebtPayment / totalIncome) * 100);
      result.push({
        id: "debt",
        type: "debt",
        title: "Compromisso com dívidas",
        text: `Suas ${activeDebts.length} dívida${activeDebts.length > 1 ? "s" : ""} consomem ${debtPercentage}% da sua renda (R$ ${monthlyDebtPayment.toFixed(2).replace(".", ",")}/mês).`,
        priority: 4,
      });
    }
    
    // Income usage proportion
    if (totalIncome > 0) {
      const usagePercentage = Math.round((thisMonthTotal / totalIncome) * 100);
      if (usagePercentage > 70) {
        result.push({
          id: "proportion",
          type: "proportion",
          title: "Uso da renda",
          text: `Você já utilizou ${usagePercentage}% da sua renda este mês. ${usagePercentage > 100 ? "Atenção: gastos acima da receita!" : "Mantenha o controle."}`,
          priority: 5,
        });
      }
    }
    
    // If no insights generated, add a placeholder
    if (result.length === 0) {
      result.push({
        id: "no-data",
        type: "category",
        title: "Continue registrando",
        text: "Registre mais gastos e receitas para que possamos identificar padrões e gerar insights personalizados para você.",
        priority: 99,
      });
    }
    
    return result;
  }, [expenses, incomes, debts, currentMonth, lastMonth]);

  const visibleInsights = insights
    .filter((i) => !ignoredIds.has(i.id))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4); // Show up to 4 insights now

  const handleIgnore = (id: string) => {
    setIgnoredIds((prev) => new Set([...prev, id]));
  };

  const handleViewDetails = (insight: Insight) => {
    if (insight.type === "debt") {
      navigate("/debts");
    } else {
      navigate("/history", { state: { filter: insight.type } });
    }
  };

  const primaryInsight = visibleInsights[0];
  const secondaryInsights = visibleInsights.slice(1);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Minimal */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3">
          <FadeIn>
            <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
            <h1 className="font-serif text-2xl font-semibold">Seus padrões</h1>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Info Text */}
        <FadeIn>
          <p className="text-sm text-muted-foreground">
            Alertas baseados no seu comportamento financeiro
          </p>
        </FadeIn>

        {visibleInsights.length === 0 ? (
          <FadeIn className="text-center py-12">
            <p className="text-muted-foreground">Nenhum padrão identificado ainda.</p>
          </FadeIn>
        ) : (
          <>
            {/* Primary Insight - Highlighted */}
            {primaryInsight && (
              <FadeIn>
                <InsightCard
                  insight={primaryInsight}
                  variant="primary"
                  onIgnore={() => handleIgnore(primaryInsight.id)}
                  onViewDetails={() => handleViewDetails(primaryInsight)}
                />
              </FadeIn>
            )}

            {/* Secondary Insights */}
            <AnimatePresence>
              {secondaryInsights.map((insight, index) => (
                <FadeIn key={insight.id} delay={0.1 * (index + 1)}>
                  <InsightCard
                    insight={insight}
                    variant="secondary"
                    onIgnore={() => handleIgnore(insight.id)}
                    onViewDetails={() => handleViewDetails(insight)}
                  />
                </FadeIn>
              ))}
            </AnimatePresence>
          </>
        )}

        {/* Ignored count - subtle */}
        {ignoredIds.size > 0 && (
          <FadeIn delay={0.3}>
            <p className="text-xs text-muted-foreground text-center pt-4">
              {ignoredIds.size} alerta{ignoredIds.size > 1 ? "s" : ""} ignorado{ignoredIds.size > 1 ? "s" : ""}
              <button
                onClick={() => setIgnoredIds(new Set())}
                className="ml-2 underline hover:text-foreground transition-colors"
              >
                Restaurar
              </button>
            </p>
          </FadeIn>
        )}

        {/* Future AI note */}
        <FadeIn delay={0.4}>
          <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              💡 Em breve: alertas automáticos baseados em IA analisando seus padrões de comportamento
            </p>
          </div>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

interface InsightCardProps {
  insight: Insight;
  variant: "primary" | "secondary";
  onIgnore: () => void;
  onViewDetails: () => void;
}

const InsightCard = ({ insight, variant, onIgnore, onViewDetails }: InsightCardProps) => {
  const config = insightConfig[insight.type];
  const Icon = config.icon;
  const isPrimary = variant === "primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "rounded-xl border shadow-soft overflow-hidden",
        isPrimary
          ? "bg-card border-border"
          : "bg-card border-border"
      )}
      style={
        isPrimary
          ? {
              backgroundColor: `hsl(var(--${config.color}) / 0.08)`,
              borderColor: `hsl(var(--${config.color}) / 0.3)`,
            }
          : undefined
      }
    >
      <div className={cn("p-4", isPrimary && "pb-3")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center rounded-full flex-shrink-0",
                isPrimary ? "w-11 h-11" : "w-9 h-9"
              )}
              style={{
                backgroundColor: `hsl(var(--${config.color}) / 0.2)`,
              }}
            >
              <Icon
                className={isPrimary ? "w-5 h-5" : "w-4 h-4"}
                style={{ color: `hsl(var(--${config.color}))` }}
              />
            </div>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  isPrimary ? "text-base" : "text-sm"
                )}
                style={isPrimary ? { color: `hsl(var(--${config.color}))` } : undefined}
              >
                {insight.title}
              </p>
            </div>
          </div>
          <button
            onClick={onIgnore}
            className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Ignorar insight"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Text */}
        <p
          className={cn(
            "leading-relaxed",
            isPrimary ? "text-base text-foreground" : "text-sm text-muted-foreground"
          )}
        >
          {insight.text}
        </p>
      </div>

      {/* Action */}
      <button
        onClick={onViewDetails}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          isPrimary
            ? "border-t hover:bg-muted/50"
            : "border-t border-border hover:bg-muted/30"
        )}
        style={
          isPrimary
            ? { borderColor: `hsl(var(--${config.color}) / 0.2)` }
            : undefined
        }
      >
        <span className="text-sm font-medium">Ver detalhes</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
};

export default Insights;
