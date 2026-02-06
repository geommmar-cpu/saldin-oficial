import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  Calendar,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateDebt } from "@/hooks/useDebts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type DebtType = "installment" | "recurring";

const debtTypes: { id: DebtType; label: string; description: string }[] = [
  { id: "installment", label: "Parcelada", description: "Tem início e fim definidos" },
  { id: "recurring", label: "Recorrente", description: "Se repete todo mês" },
];

export const ConfirmDebt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const createDebt = useCreateDebt();

  const amount = location.state?.amount || 0;

  const [creditorName, setCreditorName] = useState("");
  const [type, setType] = useState<DebtType>("installment");
  const [installments, setInstallments] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate installment amount
  const installmentAmount = type === "installment" && installments
    ? amount / parseInt(installments)
    : amount;

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const formattedInstallment = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(installmentAmount);

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
      const numInstallments = parseInt(installments);
      if (!numInstallments || numInstallments < 1 || numInstallments > 120) {
        setValidationError("Digite uma quantidade de parcelas válida (1-120).");
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  const isValid = () => {
    if (!creditorName.trim()) return false;
    if (type === "installment") {
      return installments && parseInt(installments) > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const parsedInstallments = type === "installment" 
        ? parseInt(installments) 
        : 12;
      
      const parsedInstallmentAmount = type === "installment"
        ? amount / parsedInstallments
        : amount;

      await createDebt.mutateAsync({
        creditor_name: creditorName.trim(),
        description: type === "recurring" ? "Dívida recorrente" : `${parsedInstallments}x`,
        total_amount: type === "installment" ? amount : amount * 12,
        total_installments: parsedInstallments,
        installment_amount: parsedInstallmentAmount,
        current_installment: 1,
        due_date: dueDate,
        is_installment: type === "installment",
        paid_amount: 0,
        status: "active",
      });

      toast.success("Dívida registrada!");
      navigate("/");
    } catch (error) {
      console.error("Failed to save debt:", error);
      toast.error("Erro ao salvar dívida. Tente novamente.");
    }
  };

  // Redirect if no amount
  if (!amount) {
    navigate("/debts/add");
    return null;
  }

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
              Detalhes do compromisso
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Amount Display */}
        <FadeIn>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Valor total</p>
            <p className="font-serif text-4xl font-semibold">{formattedAmount}</p>
          </div>
        </FadeIn>

        {/* Name */}
        <FadeIn delay={0.05}>
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
        <FadeIn delay={0.1}>
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

        {/* Installments (only for installment type) */}
        {type === "installment" && (
          <FadeIn delay={0.15}>
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
                placeholder="Ex: 12"
                className="h-12"
                min="1"
                max="120"
              />
            </div>
          </FadeIn>
        )}

        {/* Calculated Installment Value */}
        {type === "installment" && installments && parseInt(installments) > 0 && (
          <FadeIn delay={0.2}>
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">
                Valor da parcela:{" "}
                <span className="font-semibold text-foreground">
                  {formattedInstallment}
                </span>
              </p>
            </div>
          </FadeIn>
        )}

        {/* Due Date */}
        <FadeIn delay={0.25}>
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
          <FadeIn delay={0.3}>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{validationError}</p>
            </div>
          </FadeIn>
        )}

        {/* Submit Button */}
        <FadeIn delay={0.35}>
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

export default ConfirmDebt;
