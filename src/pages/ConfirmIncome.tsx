import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, RefreshCw, Zap, Loader2, CalendarClock, Info } from "lucide-react";
import { useCreateIncome } from "@/hooks/useIncomes";
import { useBankAccounts, useUpdateBankBalance } from "@/hooks/useBankAccounts";
import { BankAccountSelector } from "@/components/bank/BankAccountSelector";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const paymentDays = Array.from({ length: 31 }, (_, i) => i + 1);

function getNextPaymentDate(day: number): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) {
    target.setMonth(target.getMonth() + 1);
  }
  return target;
}

export const ConfirmIncome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const createIncome = useCreateIncome();
  const { data: bankAccounts = [] } = useBankAccounts();
  const updateBankBalance = useUpdateBankBalance();
  
  const amount = location.state?.amount || 0;
  
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<IncomeTypeDB | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [paymentDay, setPaymentDay] = useState<string>("");

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const handleTypeSelect = (typeId: IncomeTypeDB, recurring: boolean) => {
    setSelectedType(typeId);
    setIsRecurring(recurring);
    if (!recurring) {
      setPaymentDay("");
    }
  };

  // Check if payment date is today or past (within the month)
  const isFutureIncome = isRecurring && paymentDay ? getNextPaymentDate(Number(paymentDay)) > new Date() : false;

  const handleSave = async () => {
    if (!user) return;
    
    if (amount <= 0 || !description.trim() || !selectedType) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!selectedBankId) {
      toast.error("Selecione uma conta bancária de destino");
      return;
    }

    if (isRecurring && !paymentDay) {
      toast.error("Informe o dia do recebimento");
      return;
    }

    try {
      // Calculate income date
      let incomeDate: string | undefined;
      if (isRecurring && paymentDay) {
        const nextDate = getNextPaymentDate(Number(paymentDay));
        incomeDate = nextDate.toISOString().split("T")[0];
      }

      await createIncome.mutateAsync({
        amount,
        description: description.trim(),
        type: selectedType,
        is_recurring: isRecurring,
        bank_account_id: selectedBankId || undefined,
        ...(incomeDate ? { date: incomeDate } : {}),
        ...(paymentDay ? { notes: `payment_day:${paymentDay}` } : {}),
      } as any);

      // Only update bank balance for non-future incomes
      if (selectedBankId && !isFutureIncome) {
        await updateBankBalance.mutateAsync({
          accountId: selectedBankId,
          delta: amount,
        });
      }
      
      toast.success(isFutureIncome 
        ? "Receita agendada! Será registrada no dia do recebimento." 
        : "Receita adicionada!"
      );
      navigate("/");
    } catch (error) {
      console.error("Failed to save income:", error);
      toast.error("Erro ao salvar receita");
    }
  };

  const canSave = amount > 0 && description.trim() && selectedType && selectedBankId && (!isRecurring || paymentDay) && !createIncome.isPending;

  // Redirect if no amount
  if (!amount) {
    navigate("/income/add");
    return null;
  }

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

      <main className="flex-1 px-5 space-y-6 overflow-y-auto pb-32">
        {/* Amount Display */}
        <FadeIn>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Valor</p>
            <p className="font-serif text-4xl font-semibold">{formattedAmount}</p>
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

        {/* Recurring Toggle & Payment Day */}
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

        {/* Payment Day Selector - shown when recurring */}
        {isRecurring && (
          <FadeIn delay={0.35}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Dia do recebimento *</p>
              </div>
              <Select value={paymentDay} onValueChange={setPaymentDay}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o dia do mês" />
                </SelectTrigger>
                <SelectContent>
                  {paymentDays.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {paymentDay && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Essa receita será registrada e somada ao saldo apenas no dia {paymentDay} de cada mês. Até lá, ela aparecerá como receita prevista.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Bank Account Selector */}
        <FadeIn delay={0.4}>
          <BankAccountSelector
            selectedId={selectedBankId}
            onSelect={(id) => setSelectedBankId(selectedBankId === id ? "" : id)}
            label={isRecurring ? "Conta de destino (quando receber) *" : "Conta de destino *"}
          />
        </FadeIn>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pb-safe-bottom pt-4 bg-background/95 backdrop-blur-sm border-t border-border">
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
              isFutureIncome ? "Agendar" : "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmIncome;
