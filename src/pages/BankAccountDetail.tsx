import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  Landmark,
  Loader2,
  Trash2,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Settings,
} from "lucide-react";
import { useBankAccountById, useDeleteBankAccount, useBankAccountHistory } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import { accountTypeLabels } from "@/types/bankAccount";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useState } from "react";

export const BankAccountDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: account, isLoading } = useBankAccountById(id);
  const { data: historyItems = [], isLoading: historyLoading } = useBankAccountHistory(id);
  const deleteAccount = useDeleteBankAccount();
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="text-muted-foreground">Conta não encontrada</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const bankTheme = detectBank(account.bank_name, account.bank_key);
  const color = account.color || bankTheme.color;
  const balanceDiff = Number(account.current_balance) - Number(account.initial_balance);

  const handleDelete = async () => {
    await deleteAccount.mutateAsync(account.id);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">{account.bank_name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/banks/${account.id}/edit`)}>
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-4">
        {/* Balance card */}
        <FadeIn>
          <div
            className="p-6 rounded-2xl text-white shadow-large"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Landmark className="w-6 h-6 text-white/80" />
              <div>
                <p className="font-semibold">{account.bank_name}</p>
                <p className="text-sm text-white/70">
                  {accountTypeLabels[account.account_type] || "Corrente"}
                </p>
              </div>
            </div>
            <p className="text-sm text-white/70">Saldo atual</p>
            <p className="font-serif text-3xl font-bold">
              {formatCurrency(Number(account.current_balance))}
            </p>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-essential" />
                <p className="text-xs text-muted-foreground">Saldo inicial</p>
              </div>
              <p className="font-semibold">{formatCurrency(Number(account.initial_balance))}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                {balanceDiff >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-essential" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-impulse" />
                )}
                <p className="text-xs text-muted-foreground">Variação</p>
              </div>
              <p className={`font-semibold ${balanceDiff >= 0 ? "text-essential" : "text-impulse"}`}>
                {balanceDiff >= 0 ? "+" : ""}
                {formatCurrency(balanceDiff)}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={0.1}>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/banks/transfer")}
            >
              <ArrowLeftRight className="w-5 h-5" />
              Transferir entre contas
            </Button>
          </div>
        </FadeIn>

        {/* Transaction History */}
        <FadeIn delay={0.15}>
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Histórico Recente</h3>

            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <span className="text-3xl mb-2 block">📭</span>
                <p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item, idx) => {
                  const isPositive = item.type === "income" || item.type === "transfer_in";

                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? "bg-essential/10" : "bg-impulse/10"
                        }`}>
                        {item.type === "transfer_in" || item.type === "transfer_out" ? (
                          <ArrowLeftRight className={`w-5 h-5 ${isPositive ? "text-essential" : "text-impulse"}`} />
                        ) : isPositive ? (
                          <TrendingUp className="w-5 h-5 text-essential" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-impulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-semibold text-sm ${isPositive ? "text-essential" : "text-foreground"}`}>
                          {isPositive ? "+" : "-"} {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeIn>
      </main>

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={() => handleDelete()}
        title="Remover conta?"
        description="A conta será desativada. Movimentações vinculadas não serão afetadas."
        isLoading={deleteAccount.isPending}
      />
    </div>
  );
};

export default BankAccountDetail;
