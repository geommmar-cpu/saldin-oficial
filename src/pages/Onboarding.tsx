import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ChevronRight, Brain, MessageCircle, Smartphone, Loader2, CreditCard, Upload, SkipForward, Landmark, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BANK_LIST } from "@/lib/cardBranding";
import { accountTypeOptions, type BankAccountType } from "@/types/bankAccount";
import { parseCurrency } from "@/lib/currency";

interface BankAccountEntry {
  id: string;
  bankKey: string;
  customBankName: string;
  accountType: BankAccountType;
  initialBalance: string;
}

const createEmptyBankAccount = (): BankAccountEntry => ({
  id: crypto.randomUUID(),
  bankKey: "",
  customBankName: "",
  accountType: "checking",
  initialBalance: "",
});

const onboardingSteps = [
  { id: "welcome" },
  { id: "concept" },
  { id: "bank-account" },
  { id: "import-prompt" },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Multiple bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccountEntry[]>([createEmptyBankAccount()]);
  const [skipBank, setSkipBank] = useState(false);

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const updateBankAccount = (id: string, updates: Partial<BankAccountEntry>) => {
    setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, createEmptyBankAccount()]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(prev => prev.length > 1 ? prev.filter(acc => acc.id !== id) : prev);
  };

  const markOnboardingComplete = () => {
    queryClient.setQueryData(["onboarding-status", user?.id], true);
    if (user?.id) {
      sessionStorage.setItem(`onboarding_override_${user.id}`, "true");
    }
  };

  const saveProfileToSupabase = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return false;
    }

    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          ai_name: "Saldin",
          full_name: user.email?.split("@")[0] || "Usuário",
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      // Create bank accounts
      if (!skipBank) {
        for (const acc of bankAccounts) {
          if (!acc.bankKey) continue;
          const selectedBank = BANK_LIST.find((b) => b.key === acc.bankKey);
          const bankName = acc.bankKey === "outros" ? acc.customBankName : selectedBank?.name || acc.customBankName;
          const balance = parseCurrency(acc.initialBalance);

          if (bankName.trim()) {
            await (supabase as any).from("bank_accounts").insert({
              user_id: user.id,
              bank_name: bankName.trim(),
              bank_key: acc.bankKey || null,
              account_type: acc.accountType,
              initial_balance: balance,
              current_balance: balance,
              color: selectedBank?.color || null,
              active: true,
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      const success = await saveProfileToSupabase();
      if (success) {
        markOnboardingComplete();
        navigate("/");
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      navigate("/");
      return;
    }

    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          ai_name: "Saldin",
          full_name: user.email?.split("@")[0] || "Usuário",
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      markOnboardingComplete();
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    } finally {
      setIsSaving(false);
      navigate("/");
    }
  };

  const handleImportNow = async () => {
    await saveProfileToSupabase();
    markOnboardingComplete();
    navigate("/cards/add", { state: { fromOnboarding: true } });
  };

  const canProceed = () => {
    if (step.id === "bank-account") {
      if (skipBank) return true;
      return bankAccounts.some(acc => {
        const selectedBank = BANK_LIST.find((b) => b.key === acc.bankKey);
        const bankName = acc.bankKey === "outros" ? acc.customBankName : selectedBank?.name || "";
        return bankName.trim().length > 0;
      });
    }
    return true;
  };

  const conceptCards = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Converse com o Saldin. Envie gastos por texto, áudio ou foto. Ele extrai tudo automaticamente.",
      color: "essential",
    },
    {
      icon: Smartphone,
      title: "App",
      description: "Encare a verdade. Veja padrões, confirme emoções e entenda pra onde vai seu dinheiro.",
      color: "accent",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress */}
      <div className="px-6 pt-safe-top">
        <div className="flex gap-2 pt-4">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? "gradient-warm" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step.id === "welcome" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 rounded-full gradient-warm flex items-center justify-center mb-8 shadow-large"
                >
                  <Brain className="w-12 h-12 text-primary-foreground" />
                </motion.div>
                <h1 className="font-serif text-4xl font-semibold mb-3">Saldin</h1>
                <p className="text-xl text-primary font-medium mb-4">Seu assistente financeiro inteligente.</p>
                <p className="text-muted-foreground text-lg max-w-xs">
                  Ele te ajuda a registrar gastos, entender seus hábitos e mudar sua relação com o dinheiro.
                </p>
              </div>
            )}

            {step.id === "concept" && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <h1 className="font-serif text-3xl font-semibold mb-2">Como funciona</h1>
                  <p className="text-muted-foreground">Dois ambientes, um propósito</p>
                </div>
                <div className="space-y-4 mb-6">
                  {conceptCards.map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="p-5 rounded-xl bg-card border border-border shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(var(--${card.color}) / 0.15)` }}
                        >
                          <card.icon className="w-6 h-6" style={{ color: `hsl(var(--${card.color}))` }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center">
                  <p className="text-lg font-medium text-primary italic">
                    "Você fala com o Saldin. Você encara a verdade no app."
                  </p>
                </motion.div>
              </div>
            )}

            {step.id === "bank-account" && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto"
                  >
                    <Landmark className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h1 className="font-serif text-3xl font-semibold mb-2">Suas contas bancárias</h1>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Cadastre suas contas para acompanhar seu saldo real. O saldo começa com o valor que você informar.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                    Você pode adicionar sua renda e outras informações depois.
                  </p>
                </div>

                {!skipBank ? (
                  <>
                    <div className="space-y-6">
                      {bankAccounts.map((acc, accIndex) => (
                        <motion.div
                          key={acc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-border bg-card"
                        >
                          {/* Account header */}
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">
                              Conta {accIndex + 1}
                            </p>
                            {bankAccounts.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeBankAccount(acc.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>

                          {/* Bank selector */}
                          <div className="mb-4">
                            <label className="text-xs text-muted-foreground mb-2 block">Banco</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {BANK_LIST.filter((b) => b.key !== "outros").slice(0, 7).map((bank) => (
                                <motion.button
                                  key={bank.key}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => updateBankAccount(acc.id, { bankKey: bank.key, customBankName: "" })}
                                  className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                                    acc.bankKey === bank.key
                                      ? "border-primary bg-primary/10"
                                      : "border-border bg-card hover:bg-secondary"
                                  )}
                                >
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center"
                                    style={{ backgroundColor: bank.color + "20" }}
                                  >
                                    <Landmark className="w-3 h-3" style={{ color: bank.color }} />
                                  </div>
                                  <span className="text-[10px] font-medium truncate w-full text-center">{bank.name}</span>
                                </motion.button>
                              ))}
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateBankAccount(acc.id, { bankKey: "outros" })}
                                className={cn(
                                  "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                                  acc.bankKey === "outros"
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card hover:bg-secondary"
                                )}
                              >
                                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted">
                                  <Landmark className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span className="text-[10px] font-medium">Outro</span>
                              </motion.button>
                            </div>
                          </div>

                          {/* Custom bank name */}
                          <AnimatePresence>
                            {acc.bankKey === "outros" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-4 overflow-hidden"
                              >
                                <label className="text-xs text-muted-foreground mb-1.5 block">Nome do banco</label>
                                <Input
                                  placeholder="Ex: Banco Safra, BTG..."
                                  value={acc.customBankName}
                                  onChange={(e) => updateBankAccount(acc.id, { customBankName: e.target.value })}
                                  maxLength={40}
                                  className="h-10"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Account type + balance */}
                          {acc.bankKey && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-3"
                            >
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Tipo de conta</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {accountTypeOptions.map((opt) => (
                                    <motion.button
                                      key={opt.value}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => updateBankAccount(acc.id, { accountType: opt.value })}
                                      className={cn(
                                        "p-2 rounded-lg border-2 text-center transition-all",
                                        acc.accountType === opt.value
                                          ? "border-primary bg-primary/10 text-primary font-medium"
                                          : "border-border bg-card hover:bg-secondary"
                                      )}
                                    >
                                      <span className="text-xs">{opt.label}</span>
                                    </motion.button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">
                                  Saldo inicial (opcional)
                                </label>
                                <CurrencyInput
                                  value={acc.initialBalance}
                                  onChange={(val) => updateBankAccount(acc.id, { initialBalance: val })}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Você pode informar o saldo agora ou adicionar depois.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Add another account */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2 mx-auto"
                      onClick={addBankAccount}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar outra conta
                    </Button>

                    {/* Skip option */}
                    <div className="mt-auto pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground gap-2"
                        onClick={() => setSkipBank(true)}
                      >
                        <SkipForward className="w-4 h-4" />
                        Cadastrar depois
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Tudo bem! Você pode cadastrar suas contas a qualquer momento.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSkipBank(false)}
                    >
                      Quero cadastrar agora
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step.id === "import-prompt" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                >
                  <CreditCard className="w-10 h-10 text-primary" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold mb-3">Importar fatura do cartão?</h1>
                <p className="text-muted-foreground max-w-xs mb-2">
                  Importe sua fatura atual em PDF ou CSV para já começar com seus gastos registrados.
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mb-8">
                  Você precisará cadastrar um cartão primeiro. Essa etapa é totalmente opcional.
                </p>

                <div className="w-full max-w-xs space-y-3">
                  <Button
                    variant="warm"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleImportNow}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Importar agora
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full text-muted-foreground gap-2"
                    onClick={handleNext}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <SkipForward className="w-4 h-4" />
                        Pular esta etapa
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      {step.id !== "import-prompt" && (
        <div className="px-6 pb-8 pb-safe-bottom space-y-3">
          <Button
            variant="warm"
            size="lg"
            className="w-full"
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
          {currentStep < 2 && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
            >
              Pular introdução
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
