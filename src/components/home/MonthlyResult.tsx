import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";

interface MonthlyResultProps {
  totalIncome: number;
  totalSpent: number;
  subscriptionsAmount?: number;
}

export const MonthlyResult = ({ totalIncome, totalSpent, subscriptionsAmount }: MonthlyResultProps) => {
  const resultado = totalIncome - totalSpent;
  const isDeficit = resultado < 0;
  const hasNoData = totalIncome === 0 && totalSpent === 0;

  if (hasNoData) return null;

  const percentSpent = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 100;

  return (
    <div className="space-y-3">
      <h3 className="px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resumo do Mês</h3>

      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">

        {/* Visual Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Gasto vs Recebimento</span>
            <span className={cn(percentSpent > 90 ? "text-impulse" : "text-essential")} data-testid="percent-consumed">
              {percentSpent.toFixed(0)}% comprometido
            </span>
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500",
                percentSpent > 100 ? "bg-impulse" :
                  percentSpent > 80 ? "bg-orange-400" : "bg-essential"
              )}
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-essential" />
              <span className="text-xs">Entradas</span>
            </div>
            <p className="text-lg font-bold text-foreground tracking-tight" data-testid="monthly-income">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-impulse" />
              <span className="text-xs">Saídas</span>
            </div>
            <p className="text-lg font-bold text-foreground tracking-tight" data-testid="monthly-expense">
              {formatCurrency(totalSpent)}
            </p>
            {subscriptionsAmount && subscriptionsAmount > 0 && (
              <p className="text-[10px] text-muted-foreground px-1">
                incl. {formatCurrency(subscriptionsAmount)} em assinaturas
              </p>
            )}
          </div>
        </div>

        {/* Footer Result */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl",
          isDeficit ? "bg-impulse/5 text-impulse" : "bg-essential/5 text-essential"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            isDeficit ? "bg-impulse/10" : "bg-essential/10"
          )}>
            {isDeficit ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-medium opacity-80">
              {isDeficit ? "Déficit Mensal" : "Sobrou no mês"}
            </p>
            <p className="text-sm font-bold tracking-tight">
              {isDeficit ? "− " : "+ "}{formatCurrency(Math.abs(resultado))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
