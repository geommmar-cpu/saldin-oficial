import { motion } from "framer-motion";
import { Landmark, ChevronRight, Plus, AlertTriangle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import { CASH_ACCOUNT_KEY } from "@/types/bankAccount";

export const BankAccountsSummary = () => {
  const navigate = useNavigate();
  const { data: accounts = [] } = useBankAccounts();

  if (accounts.length === 0) return null;

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);

  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Onde está seu dinheiro</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => navigate("/banks")}
        >
          Ver todas
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Total */}
      <div className="mb-3 px-1">
        <p className="text-xs text-muted-foreground">Saldo total</p>
        <p className={cn("font-serif text-lg font-semibold", totalBalance < 0 && "text-impulse")}>
          {formatCurrency(totalBalance)}
        </p>
        {totalBalance < 0 && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-impulse" />
            <p className="text-xs text-impulse">Saldo negativo</p>
          </div>
        )}
      </div>

      {/* Account cards */}
      <div className="space-y-2">
        {accounts.slice(0, 3).map((account) => {
          const isCash = account.bank_key === CASH_ACCOUNT_KEY || account.account_type === ("cash" as any);
          const bankTheme = detectBank(account.bank_name, account.bank_key);
          const color = isCash ? "#6B7280" : (account.color || bankTheme.color);
          const Icon = isCash ? Wallet : Landmark;

          return (
            <motion.button
              key={account.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/banks/${account.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "20" }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{account.bank_name}</p>
              </div>
              <p className={cn(
                "font-semibold text-sm tabular-nums",
                Number(account.current_balance) < 0 && "text-impulse"
              )}>
                {formatCurrency(Number(account.current_balance))}
              </p>
            </motion.button>
          );
        })}
      </div>

      {accounts.length > 3 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{accounts.length - 3} conta{accounts.length - 3 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};
