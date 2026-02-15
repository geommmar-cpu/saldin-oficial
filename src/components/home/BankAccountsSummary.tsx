import { motion } from "framer-motion";
import { Landmark, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { BankAccount } from "@/types/bankAccount";
import { BankLogo } from "@/components/BankLogo";
import { useProfile } from "@/hooks/useProfile";
import { Smartphone as PhoneIcon } from "lucide-react";

interface AccountCardProps {
  account: BankAccount;
  isDefault: boolean;
}

const AccountCard = ({ account, isDefault }: AccountCardProps) => {
  const navigate = useNavigate();
  const bankTheme = detectBank(account.bank_name, account.bank_key);
  const isNegative = Number(account.current_balance) < 0;

  return (
    <motion.div
      onClick={() => navigate(`/banks/${account.id}`)}
      className="snap-center shrink-0 w-[160px] h-[160px] rounded-[1.5rem] p-4 relative overflow-hidden shadow-md group cursor-pointer transition-transform active:scale-95 border-0"
    >

      {/* Dynamic Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-100 transition-all duration-300",
        bankTheme.gradient || "from-slate-700 to-slate-900"
      )} />

      {/* Textures */}
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between text-white">
        {/* Header: Icon & Name */}
        <div className="flex flex-col items-start gap-2">
          <BankLogo
            bankName={account.bank_name}
            className="w-9 h-9 border-white/20 bg-white/20 backdrop-blur-md"
            iconClassName="text-white"
            size="md"
          />
          <p className="text-xs font-bold opacity-90 truncate w-full tracking-tight">
            {account.bank_name}
          </p>
        </div>

        {isDefault && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-1 border border-white/20 flex items-center gap-1 pr-2">
            <PhoneIcon className="w-3 h-3 text-white" />
            <span className="text-[8px] font-bold uppercase tracking-tighter text-white">Principal</span>
          </div>
        )}

        {/* Balance */}
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">Saldo Atual</p>
          <p className={cn(
            "font-sans text-lg font-bold tracking-tight drop-shadow-md truncate",
            isNegative ? "text-red-200" : "text-white"
          )}>
            {formatCurrency(Number(account.current_balance))}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const BankAccountsSummary = () => {
  const navigate = useNavigate();
  const { data: accounts = [] } = useBankAccounts();
  const { data: profile } = useProfile();

  const defaultIncomeId = (profile as any)?.wa_default_income_account_id;
  const defaultExpenseId = (profile as any)?.wa_default_expense_account_id;

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Minhas Contas</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-primary font-medium hover:underline p-0"
            onClick={() => navigate("/banks")}
          >
            Ver todas
          </Button>
        </div>
      </div>

      <div className="relative w-full">
        <div
          className="flex gap-4 overflow-x-auto pb-6 px-4 -mx-4 snap-x snap-mandatory no-scrollbar touch-pan-x"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Account Cards */}
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isDefault={account.id === defaultIncomeId || account.id === defaultExpenseId}
            />
          ))}

          {/* Add New Card */}
          <div
            onClick={() => navigate("/banks/add")}
            className="snap-center shrink-0 w-[60px] h-[160px] rounded-[1.5rem] border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
              Nova<br />Conta
            </span>
          </div>

          {/* Spacer for right padding */}
          <div className="w-2 shrink-0" />
        </div>
      </div>
    </div>
  );
};
