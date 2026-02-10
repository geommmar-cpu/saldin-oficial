import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ChevronDown, ChevronUp, Wallet, Lock, PiggyBank, Info, CreditCard, Bitcoin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BalanceBreakdown, formatCurrency } from "@/lib/balanceCalculations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BalanceHeroProps {
  balance: BalanceBreakdown;
  totalIncome: number;
  totalSpent: number;
  cryptoTotal?: number;
  cryptoEnabled?: boolean;
}

export const BalanceHero = ({ balance, totalIncome, totalSpent, cryptoTotal = 0, cryptoEnabled = false }: BalanceHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const totalCompromised = totalSpent + balance.saldoComprometido + balance.saldoGuardado;
  const usagePercentage = totalIncome > 0 ? (totalCompromised / totalIncome) * 100 : 0;
  const patrimonioTotal = balance.saldoBruto + cryptoTotal;

  return (
    <motion.div
      className="p-6 rounded-2xl bg-card border border-border shadow-medium"
      whileTap={{ scale: 0.998 }}
    >
      {/* Top label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">Saldo Livre Hoje</p>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px]">
              <p className="text-xs">
                Quanto você pode gastar agora, já descontando dívidas, parcelas e dinheiro guardado em metas.
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
      <p className="text-xs text-muted-foreground mt-1.5">
        {balance.saldoLivre >= 0
          ? "Disponível para gastar"
          : "Você está no vermelho"}
      </p>

      {/* Usage bar */}
      {totalIncome > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              transition={{ duration: 0.6 }}
              className={cn(
                "h-full rounded-full",
                usagePercentage > 100 ? "bg-impulse" :
                usagePercentage > 80 ? "bg-pleasure" :
                "bg-essential"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(usagePercentage)}% da receita utilizada
          </p>
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-4 pt-3 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Ocultar detalhes
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Ver detalhes do saldo
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saldo Bruto</p>
                  <p className="text-xs text-muted-foreground">Saldo nas contas bancárias</p>
                </div>
              </div>
              <p className={cn("font-semibold", balance.saldoBruto >= 0 ? "text-foreground" : "text-impulse")}>
                {formatCurrency(balance.saldoBruto)}
              </p>
            </div>

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

            {/* Crypto Investment - separate from available balance */}
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

            {/* Breakdown */}
            <div className="p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receitas do mês</span>
                <span className="text-essential">+ {formatCurrency(balance.detalhes.receitasTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastos do mês</span>
                <span>− {formatCurrency(balance.detalhes.gastosTotal)}</span>
              </div>
              {balance.detalhes.dividasAtivas > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dívidas ativas</span>
                  <span className="text-impulse">− {formatCurrency(balance.detalhes.dividasAtivas)}</span>
                </div>
              )}
              {(balance.saldoComprometido - balance.detalhes.dividasAtivas) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Parcelas cartão
                  </span>
                  <span className="text-obligation">− {formatCurrency(balance.saldoComprometido - balance.detalhes.dividasAtivas - balance.detalhes.valoresParaTerceiros)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
