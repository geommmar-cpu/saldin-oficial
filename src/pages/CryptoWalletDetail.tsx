import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft, Loader2, RefreshCw, TrendingUp, TrendingDown,
  Edit2, Trash2, Plus, Minus, ArrowUpDown, Bitcoin
} from "lucide-react";
import {
  useCryptoWalletById,
  useCryptoTransactions,
  useCreateCryptoTransaction,
  useRefreshCryptoPrices,
  useDeleteCryptoWallet,
} from "@/hooks/useCryptoWallets";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { formatCryptoValue, formatCryptoQuantity } from "@/lib/cryptoPrices";
import { CRYPTO_LIST, transactionTypeLabels } from "@/types/cryptoWallet";
import type { CryptoTransactionType } from "@/types/cryptoWallet";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const CryptoWalletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: wallet, isLoading } = useCryptoWalletById(id);
  const { data: transactions = [] } = useCryptoTransactions(id);
  const { data: bankAccounts = [] } = useBankAccounts();
  const createTransaction = useCreateCryptoTransaction();
  const refreshPrices = useRefreshCryptoPrices();
  const deleteWallet = useDeleteCryptoWallet();

  const [showDelete, setShowDelete] = useState(false);
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [txType, setTxType] = useState<CryptoTransactionType>("deposit");
  const [txQuantity, setTxQuantity] = useState("");
  const [txBankId, setTxBankId] = useState<string>("");
  const [txNotes, setTxNotes] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carteira não encontrada</p>
      </div>
    );
  }

  const cryptoInfo = CRYPTO_LIST.find(c => c.id === wallet.crypto_id);
  const color = cryptoInfo?.color || "#888";
  const totalValue = Number(wallet.quantity) * Number(wallet.last_price);

  const handleRefresh = () => {
    refreshPrices.mutate([wallet]);
  };

  const handleDelete = async () => {
    await deleteWallet.mutateAsync(wallet.id);
    navigate("/crypto");
  };

  const openTxDialog = (type: CryptoTransactionType) => {
    setTxType(type);
    setTxQuantity("");
    setTxBankId("");
    setTxNotes("");
    setShowTxDialog(true);
  };

  const handleSubmitTx = async () => {
    const qty = parseFloat(txQuantity);
    if (!qty || qty <= 0) return;

    if (txType === "withdraw" && qty > Number(wallet.quantity)) {
      return;
    }

    const totalVal = qty * Number(wallet.last_price);

    await createTransaction.mutateAsync({
      wallet_id: wallet.id,
      type: txType,
      quantity: txType === "adjustment" ? qty : qty,
      price_at_time: Number(wallet.last_price),
      total_value: txType === "adjustment" ? null : totalVal,
      bank_account_id: (txBankId && txBankId !== "none") ? txBankId : null,
      notes: txNotes || null,
    });

    setShowTxDialog(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crypto")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">{wallet.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshPrices.isPending}
            >
              <RefreshCw className={`w-4 h-4 ${refreshPrices.isPending ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-4">
        {/* Value card */}
        <FadeIn>
          <div className="p-5 rounded-2xl bg-card border border-border shadow-medium">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: color + "20" }}
              >
                <span className="text-lg font-bold" style={{ color }}>
                  {wallet.symbol}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor total</p>
                <p className="font-serif text-2xl font-bold">
                  {formatCryptoValue(totalValue, wallet.display_currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Quantidade</p>
                <p className="font-medium">
                  {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cotação</p>
                <p className="font-medium">
                  {formatCryptoValue(Number(wallet.last_price), wallet.display_currency)}
                </p>
              </div>
            </div>

            {wallet.last_price_updated_at && (
              <p className="text-xs text-muted-foreground mt-3">
                Atualizado em {new Date(wallet.last_price_updated_at).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="flex-col gap-1 h-auto py-3"
              onClick={() => openTxDialog("deposit")}
            >
              <Plus className="w-5 h-5 text-essential" />
              <span className="text-xs">Aporte</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col gap-1 h-auto py-3"
              onClick={() => openTxDialog("withdraw")}
            >
              <Minus className="w-5 h-5 text-impulse" />
              <span className="text-xs">Resgate</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col gap-1 h-auto py-3"
              onClick={() => openTxDialog("adjustment")}
            >
              <Edit2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">Ajustar</span>
            </Button>
          </div>
        </FadeIn>

        {/* Transaction history */}
        <FadeIn delay={0.1}>
          <h2 className="font-serif text-lg font-semibold mb-3">Histórico</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma movimentação registrada
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit";
                const isAdjustment = tx.type === "adjustment";
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-card border border-border flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isDeposit ? "bg-essential/10" : isAdjustment ? "bg-muted" : "bg-impulse/10"
                    )}>
                      {isDeposit ? (
                        <TrendingUp className="w-4 h-4 text-essential" />
                      ) : isAdjustment ? (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-impulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{transactionTypeLabels[tx.type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                        {tx.notes && ` • ${tx.notes}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        isDeposit ? "text-essential" : isAdjustment ? "" : "text-impulse"
                      )}>
                        {isDeposit ? "+" : isAdjustment ? "=" : "-"}
                        {formatCryptoQuantity(Number(tx.quantity), wallet.symbol)} {wallet.symbol}
                      </p>
                      {tx.total_value && (
                        <p className="text-xs text-muted-foreground">
                          {formatCryptoValue(Number(tx.total_value), wallet.display_currency)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FadeIn>
      </main>

      {/* Transaction Dialog */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {txType === "deposit" ? "Adicionar investimento" : txType === "withdraw" ? "Retirar investimento" : "Ajustar quantidade"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {txType === "adjustment" ? `Nova quantidade total (${wallet.symbol})` : `Quantidade (${wallet.symbol})`}
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                max={txType === "withdraw" ? Number(wallet.quantity) : undefined}
                placeholder="0.00"
                value={txQuantity}
                onChange={(e) => setTxQuantity(e.target.value)}
                className="h-12 text-lg"
              />
              {txType === "withdraw" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível: {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                </p>
              )}
              {txType === "adjustment" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Atual: {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                </p>
              )}
            </div>

            {txType !== "adjustment" && bankAccounts.length > 0 && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {txType === "deposit" ? "Banco de origem (opcional)" : "Banco de destino (opcional)"}
                </label>
                <Select value={txBankId} onValueChange={setTxBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {bankAccounts.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {txType === "deposit"
                    ? "Se selecionado, o valor será abatido do saldo do banco"
                    : "Se selecionado, o valor será somado ao saldo do banco"
                  }
                </p>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Observação (opcional)</label>
              <Input
                placeholder="Ex: DCA mensal"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                maxLength={100}
              />
            </div>

            <Button
              variant="warm"
              className="w-full"
              onClick={handleSubmitTx}
              disabled={createTransaction.isPending || !txQuantity || parseFloat(txQuantity) <= 0}
            >
              {createTransaction.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Remover carteira cripto"
        description={`Tem certeza que deseja remover a carteira de ${wallet.name}? Todo o histórico será perdido.`}
      />

      <BottomNav />
    </div>
  );
};

export default CryptoWalletDetail;
