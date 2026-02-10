import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Landmark, ArrowLeftRight, Loader2 } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import { accountTypeLabels } from "@/types/bankAccount";
import { motion } from "framer-motion";

export const BankAccounts = () => {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useBankAccounts();

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">Contas Bancárias</h1>
          </div>
          <div className="flex gap-2">
            {accounts.length >= 2 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate("/banks/transfer")}>
                <ArrowLeftRight className="w-4 h-4" />
                Transferir
              </Button>
            )}
            <Button variant="warm" size="sm" className="gap-1" onClick={() => navigate("/banks/add")}>
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-4">
        {/* Total balance */}
        {accounts.length > 0 && (
          <FadeIn>
            <div className="p-5 rounded-2xl bg-card border border-border shadow-medium text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo total em contas</p>
              <p className="font-serif text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
            </div>
          </FadeIn>
        )}

        {/* Account list */}
        {accounts.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Landmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Adicione suas contas bancárias para acompanhar seus saldos
              </p>
              <Button variant="warm" onClick={() => navigate("/banks/add")}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar conta
              </Button>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => {
              const bankTheme = detectBank(account.bank_name, account.bank_key);
              const color = account.color || bankTheme.color;

              return (
                <FadeIn key={account.id} delay={0.05 * index}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/banks/${account.id}`)}
                    className="w-full p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <Landmark className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{account.bank_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {accountTypeLabels[account.account_type] || "Corrente"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(Number(account.current_balance))}
                        </p>
                        {Number(account.initial_balance) !== Number(account.current_balance) && (
                          <p className="text-xs text-muted-foreground">
                            Inicial: {formatCurrency(Number(account.initial_balance))}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                </FadeIn>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default BankAccounts;
