import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Landmark, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateBankAccount } from "@/hooks/useBankAccounts";
import { BANK_LIST, detectBank } from "@/lib/cardBranding";
import { accountTypeOptions, type BankAccountType } from "@/types/bankAccount";
import { parseCurrency } from "@/lib/currency";

export const AddBankAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const createAccount = useCreateBankAccount();
  const returnTo = location.state?.returnTo as string | undefined;
  const returnState = location.state?.returnState as Record<string, any> | undefined;

  const [bankKey, setBankKey] = useState<string>("");
  const [customBankName, setCustomBankName] = useState("");
  const [accountType, setAccountType] = useState<BankAccountType>("checking");
  const [initialBalance, setInitialBalance] = useState("");

  const selectedBank = BANK_LIST.find((b) => b.key === bankKey);
  const bankName = bankKey === "outros" ? customBankName : selectedBank?.name || customBankName;

  const canSave = bankName.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    const balance = parseCurrency(initialBalance);

    const result = await createAccount.mutateAsync({
      bank_name: bankName.trim(),
      bank_key: bankKey || null,
      account_type: accountType,
      initial_balance: balance,
      current_balance: balance,
      color: selectedBank?.color || null,
      active: true,
    });

    if (returnTo) {
      navigate(returnTo, { state: { ...returnState, preSelectedBankId: result?.id || "latest" } });
    } else {
      navigate("/banks");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Nova Conta Bancária</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        {/* Bank selector */}
        <FadeIn className="mb-6">
          <label className="text-sm text-muted-foreground mb-3 block">Banco</label>
          <div className="grid grid-cols-3 gap-2">
            {BANK_LIST.filter((b) => b.key !== "outros").map((bank) => (
              <motion.button
                key={bank.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBankKey(bank.key);
                  setCustomBankName("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  bankKey === bank.key
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: bank.color + "20" }}
                >
                  <Landmark className="w-4 h-4" style={{ color: bank.color }} />
                </div>
                <span className="text-xs font-medium truncate w-full text-center">{bank.name}</span>
              </motion.button>
            ))}
            {/* Outro */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setBankKey("outros")}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                bankKey === "outros"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-secondary"
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                <Landmark className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">Outro</span>
            </motion.button>
          </div>
        </FadeIn>

        {/* Custom bank name */}
        {bankKey === "outros" && (
          <FadeIn className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">Nome do banco</label>
            <Input
              placeholder="Ex: Banco Safra, BTG..."
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              maxLength={40}
              className="h-12"
            />
          </FadeIn>
        )}

        {/* Account type */}
        <FadeIn delay={0.05} className="mb-6">
          <label className="text-sm text-muted-foreground mb-3 block">Tipo de conta</label>
          <div className="grid grid-cols-3 gap-2">
            {accountTypeOptions.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAccountType(opt.value)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all",
                  accountType === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                <span className="text-sm">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Initial balance */}
        <FadeIn delay={0.1} className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            Saldo inicial (opcional)
          </label>
          <CurrencyInput value={initialBalance} onChange={setInitialBalance} />
          <p className="text-xs text-muted-foreground mt-2">
            Este valor não será contabilizado como receita
          </p>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          variant="warm"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={!canSave || createAccount.isPending}
        >
          {createAccount.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Cadastrar conta
        </Button>
      </div>
    </div>
  );
};

export default AddBankAccount;
