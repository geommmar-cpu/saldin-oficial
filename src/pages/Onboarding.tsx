import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ChevronRight, Brain, MessageCircle, Smartphone, Check, Wallet, Loader2, CreditCard, Upload, SkipForward, Landmark } from "lucide-react";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BANK_LIST } from "@/lib/cardBranding";
import { accountTypeOptions, type BankAccountType } from "@/types/bankAccount";
import { parseCurrency } from "@/lib/currency";

type IncomeType = "fixed" | "variable" | "later";

const onboardingSteps = [
  { id: "welcome" },
  { id: "concept" },
  { id: "income" },
  { id: "bank-account" },
  { id: "import-prompt" },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null);
  const [fixedIncome, setFixedIncome] = useState("");
  const [variableIncome, setVariableIncome] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Bank account state
  const [bankKey, setBankKey] = useState<string>("");
  const [customBankName, setCustomBankName] = useState("");
  const [accountType, setAccountType] = useState<BankAccountType>("checking");
  const [initialBalance, setInitialBalance] = useState("");
  const [skipBank, setSkipBank] = useState(false);

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const number = parseInt(numericValue || "0", 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  const handleIncomeChange = (value: string, setter: (v: string) => void) => {
    const numericValue = value.replace(/\D/g, "");
    setter(numericValue);
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

      // Create income records only if user chose to inform
      if (incomeType !== "later" && incomeType !== null) {
        const totalFixedIncome = parseInt(fixedIncome || "0", 10) / 100;
        const totalVariableIncome = parseInt(variableIncome || "0", 10) / 100;

        if (totalFixedIncome > 0) {
          await supabase.from("incomes").insert({
            user_id: user.id,
            amount: totalFixedIncome,
            description: "Receita fixa mensal",
            type: "salary",
            is_recurring: true,
          });
        }

        if (totalVariableIncome > 0) {
          await supabase.from("incomes").insert({
            user_id: user.id,
            amount: totalVariableIncome,
            description: "Receita variável mensal",
            type: "freelance",
            is_recurring: false,
          });
        }
      }

      // Create bank account if user filled one
      if (!skipBank && bankKey) {
        const selectedBank = BANK_LIST.find((b) => b.key === bankKey);
        const bankName = bankKey === "outros" ? customBankName : selectedBank?.name || customBankName;
        const balance = parseCurrency(initialBalance);

        if (bankName.trim()) {
          await (supabase as any).from("bank_accounts").insert({
            user_id: user.id,
            bank_name: bankName.trim(),
            bank_key: bankKey || null,
            account_type: accountType,
            initial_balance: balance,
            current_balance: balance,
            color: selectedBank?.color || null,
            active: true,
          });
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
      // Last step is import-prompt; "Pular" triggers this
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
    // Save profile first, then redirect to add card (card creation → auto import)
    await saveProfileToSupabase();
    markOnboardingComplete();
    navigate("/cards/add", { state: { fromOnboarding: true } });
  };

  const canProceed = () => {
    if (step.id === "income") {
      if (!incomeType) return false;
      if (incomeType === "later") return true;
      if (incomeType === "fixed") return fixedIncome && parseInt(fixedIncome, 10) > 0;
      if (incomeType === "variable") return variableIncome && parseInt(variableIncome, 10) > 0;
      return true;
    }
    if (step.id === "bank-account") {
      if (skipBank) return true;
      const selectedBank = BANK_LIST.find((b) => b.key === bankKey);
      const bankName = bankKey === "outros" ? customBankName : selectedBank?.name || "";
      return bankName.trim().length > 0;
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
      <div className="flex-1 flex flex-col px-6 py-8">
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

            {step.id === "income" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-essential/20 flex items-center justify-center mb-6"
                >
                  <Wallet className="w-10 h-10 text-essential" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold mb-2 text-center">Sua renda mensal</h1>
                <p className="text-muted-foreground text-center mb-6 max-w-xs">
                  Isso nos ajuda a mostrar o quanto você já comprometeu. Totalmente opcional.
                </p>

                {/* Income type selector */}
                <div className="w-full max-w-xs space-y-3 mb-6">
                  {([
                    { type: "fixed" as IncomeType, label: "Renda fixa", desc: "Salário, aposentadoria" },
                    { type: "variable" as IncomeType, label: "Renda variável", desc: "Freelance, comissões" },
                    { type: "later" as IncomeType, label: "Prefiro informar depois", desc: "Você pode adicionar a qualquer momento" },
                  ]).map((opt) => (
                    <motion.button
                      key={opt.type}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIncomeType(opt.type)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        incomeType === opt.type
                          ? "border-primary bg-primary/5 shadow-medium"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        incomeType === opt.type ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                        {incomeType === opt.type && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Income value inputs */}
                <AnimatePresence>
                  {incomeType === "fixed" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="w-full max-w-xs overflow-hidden"
                    >
                      <div>
                        <label className="text-sm font-medium mb-2 block">Valor da renda fixa</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={fixedIncome ? formatCurrency(fixedIncome) : ""}
                          onChange={(e) => handleIncomeChange(e.target.value, setFixedIncome)}
                          placeholder="R$ 0,00"
                          className="text-center text-xl h-14 font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                  {incomeType === "variable" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="w-full max-w-xs overflow-hidden"
                    >
                      <div>
                        <label className="text-sm font-medium mb-2 block">Valor médio da renda variável</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={variableIncome ? formatCurrency(variableIncome) : ""}
                          onChange={(e) => handleIncomeChange(e.target.value, setVariableIncome)}
                          placeholder="R$ 0,00"
                          className="text-center text-xl h-14 font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <h1 className="font-serif text-3xl font-semibold mb-2">Sua conta bancária</h1>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Cadastre sua conta principal para acompanhar seu saldo real.
                  </p>
                </div>

                {!skipBank ? (
                  <>
                    {/* Bank selector */}
                    <div className="mb-5">
                      <label className="text-sm text-muted-foreground mb-3 block">Banco</label>
                      <div className="grid grid-cols-3 gap-2">
                        {BANK_LIST.filter((b) => b.key !== "outros").slice(0, 9).map((bank) => (
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
                    </div>

                    {/* Custom bank name */}
                    <AnimatePresence>
                      {bankKey === "outros" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-5 overflow-hidden"
                        >
                          <label className="text-sm text-muted-foreground mb-2 block">Nome do banco</label>
                          <Input
                            placeholder="Ex: Banco Safra, BTG..."
                            value={customBankName}
                            onChange={(e) => setCustomBankName(e.target.value)}
                            maxLength={40}
                            className="h-12"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Account type */}
                    {bankKey && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5"
                      >
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
                      </motion.div>
                    )}

                    {/* Initial balance */}
                    {bankKey && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5"
                      >
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Saldo inicial (opcional)
                        </label>
                        <CurrencyInput value={initialBalance} onChange={setInitialBalance} />
                        <p className="text-xs text-muted-foreground mt-2">
                          Este valor não será contabilizado como receita
                        </p>
                      </motion.div>
                    )}

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
