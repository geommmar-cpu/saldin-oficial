 // Componente de Saldo com os 3 tipos: Bruto, Comprometido e Livre
 
import { motion } from "framer-motion";
import { Wallet, Lock, Coins, ChevronDown, ChevronUp, Info } from "lucide-react";
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
}
 
export const BalanceCard = ({ balance }: BalanceCardProps) => {
    const [expanded, setExpanded] = useState(false);
 
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