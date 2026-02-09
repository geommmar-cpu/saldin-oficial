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
} from "lucide-react";
import { useBankAccountById, useDeleteBankAccount } from "@/hooks/useBankAccounts";
import { detectBank } from "@/lib/cardBranding";
import { formatCurrency } from "@/lib/balanceCalculations";
import { accountTypeLabels } from "@/types/bankAccount";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useState } from "react";

export const BankAccountDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: account, isLoading } = useBankAccountById(id);
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
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
    navigate("/banks");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">{account.bank_name}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>
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
