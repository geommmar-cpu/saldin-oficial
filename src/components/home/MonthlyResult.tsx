import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";

interface MonthlyResultProps {
  totalIncome: number;
  totalSpent: number;
  investedAmount?: number;
  subscriptionsAmount?: number;
}

export const MonthlyResult = ({ totalIncome, totalSpent, investedAmount = 0, subscriptionsAmount }: MonthlyResultProps) => {
  // Resultado do mês = Entradas - (Saídas + Investimentos)
  // Investimentos saem do banco, então para o fluxo de caixa do MÊS, é uma saída de recurso disponível.
  const totalOutflow = totalSpent + investedAmount;
  const resultado = totalIncome - totalOutflow;
  const isDeficit = resultado < 0;

  const hasNoData = totalIncome === 0 && totalOutflow === 0;

  if (hasNoData) return null;

  const percentSpent = totalIncome > 0 ? Math.min((totalOutflow / totalIncome) * 100, 100) : (totalOutflow > 0 ? 100 : 0);

  return (
    <div className="space-y-3">
      <h3 className="px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resumo do Mês</h3>

      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">

        {/* Visual Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Comprometimento da Renda</span>
            <span className={cn(percentSpent > 90 ? "text-impulse" : "text-essential")} data-testid="percent-consumed">
              {percentSpent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
            {/* Saídas normais */}
            <div
              className={cn("h-full transition-all duration-500",
                percentSpent > 90 ? "bg-impulse" : "bg-essential"
              )}
              style={{ width: `${Math.min((totalSpent / (totalIncome || 1)) * 100, 100)}%` }}
            />
            {/* Investimentos (cor diferente) */}
            {investedAmount > 0 && (
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min((investedAmount / (totalIncome || 1)) * 100, 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-essential" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Entradas</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate" data-testid="monthly-income">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="space-y-1 border-x border-border/50 px-1">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-impulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Saídas</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate" data-testid="monthly-expense">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Investido</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              {formatCurrency(investedAmount)}
            </p>
          </div>
        </div>

        {/* Footer Result */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl",
          isDeficit ? "bg-impulse/5 text-impulse" : "bg-essential/5 text-essential"
        )}>
          <div className="flex items-center gap-3">
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
              <p className="text-[10px] opacity-60 leading-tight">
                (Após gastos e investimentos)
              </p>
            </div>
          </div>
          <p className="text-lg font-bold tracking-tight">
            {isDeficit ? "-" : "+"}{formatCurrency(Math.abs(resultado))}
          </p>
        </div>
      </div>
    </div>
  );
};
