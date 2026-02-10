import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";

interface MonthlyResultProps {
  totalIncome: number;
  totalSpent: number;
}

export const MonthlyResult = ({ totalIncome, totalSpent }: MonthlyResultProps) => {
  const resultado = totalIncome - totalSpent;
  const isDeficit = resultado < 0;
  const hasNoIncome = totalIncome === 0 && totalSpent > 0;
  const hasNoData = totalIncome === 0 && totalSpent === 0;

  if (hasNoData) return null;

  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-soft space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Resultado do mês</p>

      {/* Income & Expenses rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-essential/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-essential" />
            </div>
            <span className="text-sm">Receitas</span>
          </div>
          <span className="text-sm font-semibold text-essential tabular-nums">
            + {formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-impulse/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-impulse" />
            </div>
            <span className="text-sm">Gastos</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            − {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Divider + Result */}
      <div className="pt-3 border-t border-border">
        {hasNoIncome ? (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-impulse shrink-0" />
            <p className="text-xs text-impulse">
              Você ainda não registrou receitas neste mês
            </p>
          </div>
        ) : isDeficit ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-impulse shrink-0" />
                <p className="text-sm text-impulse font-medium">Déficit no mês</p>
              </div>
              <span className="font-serif text-lg font-bold text-impulse tabular-nums">
                − {formatCurrency(Math.abs(resultado))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {Math.abs(resultado) > 2000
                ? "Gastos muito acima da receita. Considere cortar despesas."
                : Math.abs(resultado) > 500
                  ? "Cuidado: o déficit está crescendo. Reavalie prioridades."
                  : "Fique atento para não aumentar essa diferença."}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-essential shrink-0" />
              <p className="text-sm text-essential font-medium">Dentro do orçamento</p>
            </div>
            <span className="font-serif text-lg font-bold text-essential tabular-nums">
              + {formatCurrency(resultado)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
