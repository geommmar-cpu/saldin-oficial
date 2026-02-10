 // Componente de Saldo com os 3 tipos: Bruto, Comprometido e Livre
 
 import { motion } from "framer-motion";
 import { Wallet, Lock, Coins, ChevronDown, ChevronUp, Info, AlertTriangle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useState } from "react";
 import { BalanceBreakdown, formatCurrency } from "@/lib/balanceCalculations";
 import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 
 interface BalanceCardProps {
   balance: BalanceBreakdown;
   totalIncome: number;
   totalSpent: number;
 }
 
 export const BalanceCard = ({ balance, totalIncome, totalSpent }: BalanceCardProps) => {
   const [expanded, setExpanded] = useState(false);
   
    const usagePercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
    const isOverBudget = usagePercentage > 100;
    const hasNoIncome = totalIncome === 0 && totalSpent > 0;
    const excessAmount = totalSpent - totalIncome;
    
    const getProgressColor = () => {
      if (isOverBudget || hasNoIncome) return "bg-impulse";
      if (usagePercentage > 80) return "bg-pleasure";
      return "bg-essential";
    };
 
   return (
     <div className="space-y-3">
       {/* Main Card - Saldo Livre (destaque principal) */}
       <motion.div 
         className="p-5 rounded-2xl bg-card border border-border shadow-medium"
         whileTap={{ scale: 0.995 }}
       >
         <div className="flex items-center justify-between mb-1">
           <div className="flex items-center gap-2">
             <p className="text-sm text-muted-foreground">Saldo Livre</p>
             <Tooltip>
               <TooltipTrigger>
                 <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
               </TooltipTrigger>
               <TooltipContent className="max-w-[250px]">
                 <p className="text-xs">
                   Dinheiro realmente disponível após descontar compromissos futuros (dívidas, parcelas).
                 </p>
               </TooltipContent>
             </Tooltip>
           </div>
           <Coins className="w-5 h-5 text-muted-foreground" />
         </div>
         <p
           className={cn(
             "font-serif text-3xl font-bold tracking-tight",
             balance.saldoLivre >= 0 ? "text-essential" : "text-impulse"
           )}
         >
           {formatCurrency(balance.saldoLivre)}
         </p>
         
          {/* Progress bar */}
          {(totalIncome > 0 || hasNoIncome) && (
            <div className="mt-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: hasNoIncome ? "100%" : `${Math.min(usagePercentage, 100)}%` }}
                  transition={{ duration: 0.6 }}
                  className={cn("h-full rounded-full", getProgressColor())}
                />
              </div>
              {hasNoIncome ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-impulse" />
                  <p className="text-xs text-impulse">
                    Você ainda não registrou receitas neste mês
                  </p>
                </div>
              ) : isOverBudget ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-impulse" />
                  <p className="text-xs text-impulse">
                    Você gastou {formatCurrency(excessAmount)} a mais do que ganhou este mês
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {Math.round(usagePercentage)}% da receita utilizada
                </p>
              )}
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
               Ver detalhes do saldo
             </>
           )}
         </button>
         
         {/* Expanded details */}
         {expanded && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             exit={{ opacity: 0, height: 0 }}
             className="mt-3 pt-3 border-t border-border space-y-3"
           >
             {/* Saldo Bruto */}
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                   <Wallet className="w-4 h-4 text-muted-foreground" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">Saldo Bruto</p>
                   <p className="text-xs text-muted-foreground">Receitas - Gastos</p>
                 </div>
               </div>
               <p className={cn(
                 "font-semibold",
                 balance.saldoBruto >= 0 ? "text-foreground" : "text-impulse"
               )}>
                 {formatCurrency(balance.saldoBruto)}
               </p>
             </div>
             
             {/* Saldo Comprometido */}
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
                 - {formatCurrency(balance.saldoComprometido)}
               </p>
             </div>
             
             {/* Breakdown */}
             <div className="p-3 rounded-xl bg-muted/50 space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Receitas do mês</span>
                 <span className="text-essential">+ {formatCurrency(balance.detalhes.receitasTotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Gastos do mês</span>
                 <span>- {formatCurrency(balance.detalhes.gastosTotal)}</span>
               </div>
               {balance.detalhes.dividasAtivas > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Dívidas ativas</span>
                   <span className="text-impulse">- {formatCurrency(balance.detalhes.dividasAtivas)}</span>
                 </div>
               )}
             </div>
           </motion.div>
         )}
       </motion.div>
     </div>
   );
 };