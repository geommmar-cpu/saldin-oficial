import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  CreditCard, 
  Building, 
  ShoppingBag,
  Calendar,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateDebt } from "@/hooks/useDebts";
import { useAuth } from "@/hooks/useAuth";
import { parseCurrency, isValidCurrency } from "@/lib/currency";
import { toast } from "sonner";

type DebtType = "installment" | "recurring";
type DebtCategory = "credit_card" | "loan" | "financing" | "store" | "personal" | "other";

const debtTypes: { id: DebtType; label: string; description: string }[] = [
  { id: "installment", label: "Parcelada", description: "Tem início e fim definidos" },
  { id: "recurring", label: "Recorrente", description: "Se repete todo mês" },
];

const categories: { id: DebtCategory; label: string; icon: React.ElementType }[] = [
  { id: "credit_card", label: "Cartão de crédito", icon: CreditCard },
  { id: "loan", label: "Empréstimo", icon: Building },
  { id: "financing", label: "Financiamento", icon: Building },
  { id: "store", label: "Loja", icon: ShoppingBag },
  { id: "personal", label: "Pessoal", icon: CreditCard },
  { id: "other", label: "Outros", icon: CreditCard },
];

export const AddDebt = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const createDebt = useCreateDebt();

  const [creditorName, setCreditorName] = useState("");
  const [type, setType] = useState<DebtType>("installment");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-calculate installment value
  useEffect(() => {
    if (type === "installment" && totalAmount && installments) {
      const total = parseCurrency(totalAmount);
      const numInstallments = parseInt(installments);
      if (total > 0 && numInstallments > 0) {
        const calculated = total / numInstallments;
        setInstallmentAmount(calculated.toFixed(2).replace(".", ","));
      }
    }
  }, [totalAmount, installments, type]);

  const handleTotalChange = (value: string) => {
    setTotalAmount(value);
    setValidationError(null);
  };

  const handleInstallmentAmountChange = (value: string) => {
    setInstallmentAmount(value);
    setValidationError(null);
  };

  const validateForm = (): boolean => {
    if (!user) {
      setValidationError("Você precisa estar logado para salvar.");
      return false;
    }
    
    if (!creditorName.trim()) {
      setValidationError("Digite o nome do credor/dívida.");
      return false;
    }
    
    if (type === "installment") {
      const total = parseCurrency(totalAmount);
      if (!isValidCurrency(total)) {
        setValidationError("Digite um valor total válido (maior que zero).");
        return false;
      }
      
      const numInstallments = parseInt(installments);
      if (!numInstallments || numInstallments < 1 || numInstallments > 120) {
        setValidationError("Digite uma quantidade de parcelas válida (1-120).");
        return false;
      }
    } else {
      const monthly = parseCurrency(installmentAmount);
      if (!isValidCurrency(monthly)) {
        setValidationError("Digite um valor mensal válido (maior que zero).");
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  const isValid = () => {
    if (!creditorName.trim()) return false;
    if (type === "installment") {
      const total = parseCurrency(totalAmount);
      return total > 0 && installments && parseInt(installments) > 0;
    }
    const monthly = parseCurrency(installmentAmount);
    return monthly > 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Parse and normalize amounts using the currency utility
      const parsedTotalAmount = type === "installment" 
        ? parseCurrency(totalAmount)
        : parseCurrency(installmentAmount) * 12; // Recurring = 12 months estimate
      
      const parsedInstallments = type === "installment" 
        ? parseInt(installments) 
        : 12;
      
      const parsedInstallmentAmount = type === "installment"
        ? parsedTotalAmount / parsedInstallments
        : parseCurrency(installmentAmount);

      // Final validation before saving
      if (!isValidCurrency(parsedTotalAmount) || !isValidCurrency(parsedInstallmentAmount)) {
        toast.error("Valores monetários inválidos. Verifique os campos.");
        return;
      }

      await createDebt.mutateAsync({
        creditor_name: creditorName.trim(),
        description: type === "recurring" ? "Dívida recorrente" : `${parsedInstallments}x`,
        total_amount: parsedTotalAmount,
        total_installments: parsedInstallments,
        installment_amount: parsedInstallmentAmount,
        current_installment: 1,
        due_date: dueDate,
        is_installment: type === "installment",
        paid_amount: 0,
        status: "active",
      });

      navigate("/");
    } catch (error) {
      console.error("Failed to save debt:", error);
      toast.error("Erro ao salvar dívida. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-xl font-semibold">Nova dívida</h1>
            <p className="text-xs text-muted-foreground">
              Registre um compromisso financeiro
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Name */}
        <FadeIn>
          <div className="space-y-2">
            <Label htmlFor="name">Nome da dívida / credor</Label>
            <Input
              id="name"
              value={creditorName}
              onChange={(e) => setCreditorName(e.target.value)}
              placeholder="Ex: Cartão Nubank, Empréstimo..."
              className="h-12"
            />
          </div>
        </FadeIn>

        {/* Type Selector */}
        <FadeIn delay={0.05}>
          <div className="space-y-2">
            <Label>Tipo da dívida</Label>
            <div className="grid grid-cols-2 gap-2">
              {debtTypes.map((dt) => (
                <motion.button
                  key={dt.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setType(dt.id)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all border-2",
                    type === dt.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <p className="font-medium text-sm">{dt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dt.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Amount Fields */}
        <FadeIn delay={0.1}>
          {type === "installment" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="total">Valor total</Label>
                <CurrencyInput
                  value={totalAmount}
                  onChange={handleTotalChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Quantidade de parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  inputMode="numeric"
                  value={installments}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= 120)) {
                      setInstallments(val);
                    }
                  }}
                  placeholder="Ex: 5"
                  className="h-12"
                  min="1"
                  max="120"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="monthly">Valor mensal</Label>
              <CurrencyInput
                value={installmentAmount}
                onChange={handleInstallmentAmountChange}
              />
            </div>
          )}
        </FadeIn>

        {/* Calculated Installment Value */}
        {type === "installment" && installmentAmount && (
          <FadeIn delay={0.15}>
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">
                Valor da parcela:{" "}
                <span className="font-semibold text-foreground">
                  R$ {installmentAmount}
                </span>
              </p>
            </div>
          </FadeIn>
        )}

        {/* Due Date */}
        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de vencimento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
          </div>
        </FadeIn>

        {/* Validation Error */}
        {validationError && (
          <FadeIn delay={0.28}>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{validationError}</p>
            </div>
          </FadeIn>
        )}

        {/* Submit Button */}
        <FadeIn delay={0.3}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-base"
              onClick={() => navigate("/")}
            >
              Cancelar
            </Button>
            <Button
              variant="warm"
              size="lg"
              className="flex-1 h-14 text-base gap-2"
              onClick={handleSubmit}
              disabled={!isValid() || createDebt.isPending}
            >
              {createDebt.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </FadeIn>
      </main>
    </div>
  );
};

export default AddDebt;
