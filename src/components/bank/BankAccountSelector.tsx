import { motion } from "framer-motion";
import { Landmark, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";

interface BankAccountSelectorProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  label?: string;
  excludeId?: string; // For transfer: exclude the "from" account
  onCreateAccount?: () => void; // Custom handler for creating account
  emptyMessage?: string;
}

export const BankAccountSelector = ({
  selectedId,
  onSelect,
  label = "Conta bancária",
  excludeId,
  onCreateAccount,
  emptyMessage = "Nenhuma conta cadastrada",
}: BankAccountSelectorProps) => {
  const navigate = useNavigate();
  const { data: accounts = [] } = useBankAccounts();

  const filteredAccounts = excludeId
    ? accounts.filter((a) => a.id !== excludeId)
    : accounts;

  if (filteredAccounts.length === 0) {
    return (
      <div className="mb-5">
        <label className="text-sm text-muted-foreground mb-3 block">{label}</label>
        <div className="p-4 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
          <Button variant="outline" size="sm" onClick={() => onCreateAccount ? onCreateAccount() : navigate("/banks/add")}>
            <Plus className="w-4 h-4 mr-1" />
            Criar conta agora
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <label className="text-sm text-muted-foreground mb-3 block">{label}</label>
      <div className="space-y-2">
        {filteredAccounts.map((account) => {
          const bankTheme = detectBank(account.bank_name, account.bank_key);
          const color = account.color || bankTheme.color;

          return (
            <motion.button
              key={account.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(account.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                selectedId === account.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-secondary"
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + "30" }}
              >
                <Landmark className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{account.bank_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(account.current_balance))}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
