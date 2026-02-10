import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ChevronDown, ChevronUp, Lock, PiggyBank, Info, Bitcoin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BalanceBreakdown, formatCurrency } from "@/lib/balanceCalculations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BalanceHeroProps {
  balance: BalanceBreakdown;
  cryptoTotal?: number;
  cryptoEnabled?: boolean;
  totalIncome?: number;
  totalSpent?: number;
}

export const BalanceHero = ({ balance, cryptoTotal = 0, cryptoEnabled = false, totalIncome = 0, totalSpent = 0 }: BalanceHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const patrimonioTotal = balance.saldoBruto + cryptoTotal;
  const resultadoMes = totalIncome - totalSpent;
  const isDeficit = resultadoMes < 0;
  const hasMonthlyData = totalIncome > 0 || totalSpent > 0;

  return (
    <motion.div
      className="p-6 rounded-2xl bg-card border border-border shadow-medium"
      whileTap={{ scale: 0.998 }}
    >
      {/* Top label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">Saldo Livre</p>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px]">
              <p className="text-xs">
                Dinheiro disponível nas suas contas, já descontando compromissos e metas.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Coins className="w-5 h-5 text-muted-foreground/40" />
      </div>

      {/* Main value */}
      <p
        className={cn(
          "font-serif text-4xl font-bold tracking-tight leading-none",
          balance.saldoLivre >= 0 ? "text-essential" : "text-impulse"
        )}
      >
        {formatCurrency(balance.saldoLivre)}
      </p>
      <p className={cn(
        "text-xs mt-1.5",
        balance.saldoLivre >= 0 ? "text-muted-foreground" : "text-impulse font-medium"
      )}>
        {balance.saldoLivre >= 0
          ? "Dinheiro disponível nas suas contas"
          : balance.saldoLivre > -500
            ? "⚠️ Atenção: seu saldo está negativo"
            : balance.saldoLivre > -2000
              ? "🚨 Situação crítica. Revise seus gastos."
              : "🔴 Alerta máximo: saldo muito comprometido."}
      </p>

      {/* Resultado do mês */}
      {hasMonthlyData && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDeficit ? (
              <TrendingDown className="w-4 h-4 text-impulse shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-essential shrink-0" />
            )}
            <p className="text-xs text-muted-foreground">Resultado do mês</p>
          </div>
          <p className={cn("text-sm font-semibold tabular-nums", isDeficit ? "text-impulse" : "text-essential")}>
            {isDeficit ? "− " : "+ "}{formatCurrency(Math.abs(resultadoMes))}
          </p>
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-3 pt-3 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Ocultar detalhes
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Ver detalhes
          </>
        )}
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            {/* Resultado do Mês - Detalhamento */}
            {hasMonthlyData && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado do mês</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-essential/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-essential" />
                    </div>
                    <p className="text-sm">Receitas</p>
                  </div>
                  <p className="text-sm font-semibold text-essential">
                    + {formatCurrency(totalIncome)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-impulse/10 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-impulse" />
                    </div>
                    <p className="text-sm">Gastos</p>
                  </div>
                  <p className="text-sm font-semibold">
                    − {formatCurrency(totalSpent)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-sm font-medium">Resultado</p>
                  <p className={cn("text-sm font-bold", isDeficit ? "text-impulse" : "text-essential")}>
                    {isDeficit ? "" : "+ "}{formatCurrency(resultadoMes)}
                  </p>
                </div>
              </div>
            )}

            {/* Composição do Saldo Livre */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Composição do saldo</p>

              {balance.saldoComprometido > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-impulse/10 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-impulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Comprometido</p>
                      <p className="text-xs text-muted-foreground">Dívidas e parcelas</p>
                    </div>
                  </div>
                  <p className="font-semibold text-impulse">
                    − {formatCurrency(balance.saldoComprometido)}
                  </p>
                </div>
              )}

              {balance.saldoGuardado > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-essential/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-essential" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Guardado em metas</p>
                      <p className="text-xs text-muted-foreground">Separado para objetivos</p>
                    </div>
                  </div>
                  <p className="font-semibold text-essential">
                    − {formatCurrency(balance.saldoGuardado)}
                  </p>
                </div>
              )}
            </div>

            {/* Crypto Investment */}
            {cryptoEnabled && cryptoTotal > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F7931A]/10 flex items-center justify-center">
                    <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Investimentos</p>
                    <p className="text-xs text-muted-foreground">Patrimônio em cripto</p>
                  </div>
                </div>
                <p className="font-semibold text-[#F7931A]">
                  {formatCurrency(cryptoTotal)}
                </p>
              </div>
            )}

            {/* Patrimônio Total */}
            {cryptoEnabled && cryptoTotal > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Patrimônio Total</p>
                    <p className="text-xs text-muted-foreground">Bancos + Investimentos</p>
                  </div>
                </div>
                <p className="font-semibold text-primary">
                  {formatCurrency(patrimonioTotal)}
                </p>
              </div>
            )}

            {/* Explicação do saldo */}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Saldo Livre = Saldo nas contas
                {balance.saldoComprometido > 0 ? " − Compromissos" : ""}
                {balance.saldoGuardado > 0 ? " − Guardado em metas" : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
