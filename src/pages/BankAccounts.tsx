import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ChevronLeft, Plus, Landmark, ArrowLeftRight, Loader2, Smartphone as PhoneIcon } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import { accountTypeLabels } from "@/types/bankAccount";
import { motion } from "framer-motion";
import { BankLogo } from "@/components/BankLogo";


export const BankAccounts = () => {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useBankAccounts();
  const { data: profile } = useProfile();

  const defaultIncomeId = (profile as any)?.wa_default_income_account_id;
  const defaultExpenseId = (profile as any)?.wa_default_expense_account_id;

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
        <div className="pt-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-lg sm:text-xl font-semibold truncate">Contas</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            {accounts.length >= 2 && (
              <Button variant="outline" size="sm" className="px-3" onClick={() => navigate("/banks/transfer")}>
                <ArrowLeftRight className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Transferir</span>
              </Button>
            )}
            <Button variant="warm" size="sm" className="px-3" onClick={() => navigate("/banks/add")}>
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Nova</span>
              <span className="sm:hidden">Nova</span>
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
                    className="w-full p-3 sm:p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <BankLogo
                        bankName={account.bank_name}
                        color={color}
                        size="md"
                        className="sm:w-12 sm:h-12"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{account.bank_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {accountTypeLabels[account.account_type] || "Corrente"}
                          </p>
                          {(account.id === defaultIncomeId || account.id === defaultExpenseId) && (
                            <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 border border-primary/10">
                              <PhoneIcon className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-bold uppercase tracking-tight">Bot WhatsApp</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm sm:text-base tabular-nums">
                          {formatCurrency(Number(account.current_balance))}
                        </p>
                        {Number(account.initial_balance) !== Number(account.current_balance) && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatCurrency(Number(account.initial_balance))}
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
