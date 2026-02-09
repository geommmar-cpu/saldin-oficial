import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, ArrowDown, Check, Loader2 } from "lucide-react";
import { BankAccountSelector } from "@/components/bank/BankAccountSelector";
import { useCreateBankTransfer } from "@/hooks/useBankAccounts";
import { parseCurrency } from "@/lib/currency";

export const BankTransfer = () => {
  const navigate = useNavigate();
  const createTransfer = useCreateBankTransfer();

  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const parsedAmount = parseCurrency(amount);
  const canSave =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    parsedAmount > 0 &&
    !createTransfer.isPending;

  const handleSave = async () => {
    if (!canSave) return;

    await createTransfer.mutateAsync({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: parsedAmount,
      description: description.trim() || "Transferência entre contas",
      date: new Date().toISOString().split("T")[0],
    });

    navigate("/banks");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Transferência</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        {/* Amount */}
        <FadeIn className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Valor</label>
          <CurrencyInput value={amount} onChange={setAmount} inputSize="xl" />
        </FadeIn>

        {/* From account */}
        <FadeIn delay={0.05}>
          <BankAccountSelector
            selectedId={fromAccountId}
            onSelect={setFromAccountId}
            label="De (conta origem)"
          />
        </FadeIn>

        {/* Arrow */}
        <FadeIn delay={0.08} className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowDown className="w-5 h-5 text-muted-foreground" />
          </div>
        </FadeIn>

        {/* To account */}
        <FadeIn delay={0.1}>
          <BankAccountSelector
            selectedId={toAccountId}
            onSelect={setToAccountId}
            label="Para (conta destino)"
            excludeId={fromAccountId}
          />
        </FadeIn>

        {/* Description */}
        <FadeIn delay={0.15} className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            Descrição (opcional)
          </label>
          <Input
            placeholder="Ex: Transferência para poupança"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={50}
            className="h-12"
          />
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          variant="warm"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={!canSave}
        >
          {createTransfer.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Confirmar transferência
        </Button>
      </div>
    </div>
  );
};

export default BankTransfer;
