import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ChevronDown,
  Lock,
  PiggyBank,
  Info,
  Bitcoin,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BalanceBreakdown } from "@/lib/balanceCalculations";
import { AnimatedAmount } from "@/components/ui/motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";

interface BalanceHeroProps {
  balance: BalanceBreakdown;
  cryptoTotal?: number;
  cryptoEnabled?: boolean;
}

const chartConfig = {
  free: {
    label: "Bancos",
    color: "hsl(var(--essential))",
  },
  committed: {
    label: "Comprometido",
    color: "hsl(var(--impulse))",
  },
  saved: {
    label: "Guardado",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export const BalanceHero = ({ balance, cryptoTotal = 0, cryptoEnabled = false }: BalanceHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const patrimonioTotal = balance.saldoBruto + cryptoTotal;

  const total = Math.max(1, balance.saldoLivre) + balance.saldoComprometido + balance.saldoGuardado;

  const chartData = [
    { name: "free", value: Math.max(0, balance.saldoLivre), fill: "var(--color-free)" },
    { name: "committed", value: balance.saldoComprometido, fill: "var(--color-committed)" },
    { name: "saved", value: balance.saldoGuardado, fill: "var(--color-saved)" },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      className="relative overflow-hidden p-7 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-white/10 shadow-large"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Decorative background blurs - Premium touch */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-accent/10 rounded-full blur-[50px]" />

      {/* Top label */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block">Total Geral</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground">Disponível em Bancos</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/40" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] border-primary/10 shadow-medium p-3">
                  <p className="text-xs font-medium mb-1">Saldo Acumulado</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Este valor representa todo o dinheiro que você tem hoje em suas contas, somando economias de meses anteriores.<br /><br />
                    Ele desconta os compromissos deste mês, mas não deve ser confundido com o "Resultado do Mês" (que considera apenas entradas e saídas do mês atual).
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Main value with AnimatedAmount and Playfair Display */}
      <div className="relative mb-6">
        <AnimatedAmount
          value={balance.saldoLivre}
          className={cn(
            "text-4xl sm:text-5xl font-serif font-bold tracking-tight block tabular-nums",
            balance.saldoLivre >= 0 ? "text-foreground" : "text-impulse"
          )}
        />

        {/* Status Badge - Refined */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider mt-4 border",
          balance.saldoLivre >= 0
            ? "bg-essential/5 text-essential border-essential/20"
            : "bg-impulse/5 text-impulse border-impulse/20"
        )}>
          {balance.saldoLivre >= 0 ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {balance.saldoLivre >= 0 ? "Saúde Financeira OK" : "Atenção Crítica"}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-95"
      >
        <span className="font-bold uppercase tracking-widest text-[10px]">Ver detalhes</span>
        <div className={cn(
          "p-1 rounded-full bg-secondary transition-transform duration-500",
          expanded ? "rotate-180" : ""
        )}>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4 pt-6 border-t border-border/50"
          >
            {/* Donut Chart Visualization */}
            <div className="flex flex-col items-center">
              <div className="w-full relative py-2">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[160px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      strokeWidth={5}
                      cornerRadius={8}
                      paddingAngle={5}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold font-serif"
                                >
                                  {Math.round((Math.max(0, balance.saldoLivre) / total) * 100)}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Livre
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Legend area outside the SVG to avoid squashing */}
              <div className="w-full mt-2 px-6">
                <div className="flex flex-col gap-2.5">
                  {chartData.map((entry) => {
                    const config = chartConfig[entry.name as keyof typeof chartConfig];
                    const percentage = Math.round((entry.value / total) * 100);
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-xs transition-opacity hover:opacity-80">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            {config.label}
                          </span>
                        </div>
                        <span className="font-bold text-foreground">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* View description of distribution */}
            <div className="text-center px-4 pt-4 pb-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você tem <span className="text-essential font-bold font-sans">{Math.round((Math.max(0, balance.saldoLivre) / total) * 100)}%</span> do seu saldo total livre para uso imediato.
              </p>
            </div>

            {/* Composition Grid */}
            <div className="grid gap-3">
              {balance.saldoComprometido > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-impulse/10 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-impulse" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Comprometido</p>
                      <AnimatedAmount
                        value={balance.saldoComprometido}
                        className="text-sm font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {balance.saldoGuardado > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-essential/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-essential" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Guardado</p>
                      <AnimatedAmount
                        value={balance.saldoGuardado}
                        className="text-sm font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cryptoEnabled && cryptoTotal > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F7931A]/5 border border-[#F7931A]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 flex items-center justify-center">
                      <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Criptoativos</p>
                      <AnimatedAmount
                        value={cryptoTotal}
                        className="text-sm font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Net Worth - Premium Style */}
            {cryptoEnabled && cryptoTotal > 0 && (
              <div className="p-4 rounded-[2rem] bg-gradient-to-r from-primary/10 to-accent/10 flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Patrimônio Real</p>
                <AnimatedAmount
                  value={patrimonioTotal}
                  className="text-xl font-serif font-bold text-primary"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
