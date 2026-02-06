import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, RefreshCw, Zap, MessageCircle, Loader2 } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useCreateIncome } from "@/hooks/useIncomes";
import { useAuth } from "@/hooks/useAuth";
import { parseCurrency } from "@/lib/currency";

// Map to database income_type enum
type IncomeTypeDB = "salary" | "freelance" | "investment" | "gift" | "other";

const incomeTypes: { id: IncomeTypeDB; label: string; description: string; icon: React.ElementType; isRecurring: boolean }[] = [
  {
    id: "salary",
    label: "Fixa",
    description: "Salário, aposentadoria, benefícios",
    icon: RefreshCw,
    isRecurring: true,
  },
  {
    id: "freelance",
    label: "Variável",
    description: "Freelance, comissão, bônus",
    icon: Zap,
    isRecurring: false,
  },
];

export const AddIncome = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const { user } = useAuth();
  const createIncome = useCreateIncome();
  
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<IncomeTypeDB | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  const formatCurrencyDisplay = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const number = parseInt(numericValue || "0", 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  const handleAmountChange = (value: string) => {
    // Store raw digits for parsing, but display formatted
    setAmount(value.replace(/\D/g, ""));
  };

  const handleTypeSelect = (typeId: IncomeTypeDB, recurring: boolean) => {
    setSelectedType(typeId);
    setIsRecurring(recurring);
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    const numericAmount = parseCurrency(amount) > 0 ? parseCurrency(amount) : parseInt(amount || "0", 10) / 100;
    if (numericAmount <= 0 || !description.trim() || !selectedType) {
      return;
    }

    try {
      await createIncome.mutateAsync({
        amount: numericAmount,
        description: description.trim(),
        type: selectedType,
        is_recurring: isRecurring,
      });
      
      navigate("/");
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Failed to save income:", error);
    }
  };

  const openWhatsApp = () => {
    const whatsappUrl = "https://wa.me/5511999999999";
    window.open(whatsappUrl, "_blank");
  };

  const canSave = amount && (parseInt(amount, 10) > 0 || parseCurrency(amount) > 0) && description.trim() && selectedType && !createIncome.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Nova Receita</h1>
        </div>
      </header>

      <main className="flex-1 px-5 space-y-6">
        {/* Amount */}
        <FadeIn>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Valor</p>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              inputSize="xl"
              showPrefix={true}
              className="text-center border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </FadeIn>

        {/* Description */}
        <FadeIn delay={0.1}>
          <div>
            <p className="text-sm font-medium mb-2">Descrição</p>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Freelance, Bônus..."
              className="h-12"
              maxLength={50}
            />
          </div>
        </FadeIn>

        {/* Type Selection */}
        <FadeIn delay={0.2}>
          <div>
            <p className="text-sm font-medium mb-3">Tipo de receita</p>
            <div className="grid grid-cols-2 gap-3">
              {incomeTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect(type.id, type.isRecurring)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Recurring Toggle */}
        {selectedType === "salary" && (
          <FadeIn delay={0.3}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                isRecurring
                  ? "border-essential bg-essential/5"
                  : "border-border"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isRecurring ? "bg-essential/20" : "bg-muted"
                }`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    isRecurring ? "text-essential" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Receita recorrente</p>
                <p className="text-sm text-muted-foreground">
                  Será registrada automaticamente todo mês
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isRecurring ? "border-essential bg-essential" : "border-muted-foreground"
                }`}
              >
                {isRecurring && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
            </motion.button>
          </FadeIn>
        )}

        {/* WhatsApp Alternative */}
        <FadeIn delay={0.4}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={openWhatsApp}
            className="w-full p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Registrar via WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Envie para {preferences.aiName}
              </p>
            </div>
          </motion.button>
        </FadeIn>
      </main>

      {/* Save Button */}
      <div className="px-5 pb-8 pb-safe-bottom pt-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Cancelar
          </Button>
          <Button
            variant="warm"
            size="lg"
            className="flex-1"
            onClick={handleSave}
            disabled={!canSave}
          >
            {createIncome.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddIncome;
