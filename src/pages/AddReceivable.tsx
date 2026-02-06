import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Calendar as CalendarIcon, User, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateReceivable } from "@/hooks/useReceivables";
import { useAuth } from "@/hooks/useAuth";
import { parseCurrency, isValidCurrency } from "@/lib/currency";
import { toast } from "sonner";

const AddReceivable = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const createReceivable = useCreateReceivable();

  const [debtorName, setDebtorName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Parse amount using currency utility for consistency
  const parsedAmount = useMemo(() => parseCurrency(amount), [amount]);

  const isFormValid = useMemo(() => {
    return debtorName.trim() && isValidCurrency(parsedAmount) && dueDate;
  }, [debtorName, parsedAmount, dueDate]);

  const validateForm = (): boolean => {
    if (!user) {
      setValidationError("Você precisa estar logado para salvar.");
      return false;
    }
    
    if (!debtorName.trim()) {
      setValidationError("Digite o nome da pessoa.");
      return false;
    }
    
    if (!isValidCurrency(parsedAmount)) {
      setValidationError("Digite um valor válido (maior que zero).");
      return false;
    }
    
    if (!dueDate) {
      setValidationError("Selecione a data de pagamento.");
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createReceivable.mutateAsync({
        debtor_name: debtorName.trim(),
        amount: parsedAmount,
        description: description.trim() || null,
        due_date: format(dueDate!, "yyyy-MM-dd"),
        status: "pending",
      });

      navigate("/");
    } catch (error) {
      console.error("Failed to save receivable:", error);
      toast.error("Erro ao salvar valor a receber. Tente novamente.");
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setValidationError(null);
  };

  const formatCurrencyDisplay = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-4">
          <FadeIn>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-serif text-2xl font-semibold">
                Adicionar valor a receber
              </h1>
            </div>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 pb-8 space-y-6">
        {/* Person Name */}
        <FadeIn delay={0.05}>
          <div className="space-y-2">
            <Label htmlFor="debtorName" className="text-base">
              Nome da pessoa
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="debtorName"
                type="text"
                placeholder="Quem deve para você?"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                className="pl-11 h-12 text-base"
                maxLength={100}
              />
            </div>
          </div>
        </FadeIn>

        {/* Amount */}
        <FadeIn delay={0.1}>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base">
              Valor
            </Label>
            <CurrencyInput
              value={amount}
              onChange={handleAmountChange}
              inputSize="lg"
            />
          </div>
        </FadeIn>

        {/* Due Date */}
        <FadeIn delay={0.15}>
          <div className="space-y-2">
            <Label className="text-base">Data combinada para pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {dueDate
                    ? format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </FadeIn>

        {/* Description (Optional) */}
        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Almoço dividido, empréstimo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] text-base resize-none"
              maxLength={200}
            />
          </div>
        </FadeIn>

        {/* Preview Card */}
        {debtorName && parsedAmount > 0 && (
          <FadeIn delay={0.25}>
            <Card className="p-4 bg-essential/5 border-essential/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-essential/15 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-essential" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{debtorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {dueDate
                      ? `Pagamento até ${format(dueDate, "dd/MM/yyyy")}`
                      : "Data não definida"}
                  </p>
                </div>
                <p className="font-serif text-xl font-semibold text-essential">
                  {formatCurrencyDisplay(parsedAmount)}
                </p>
              </div>
            </Card>
          </FadeIn>
        )}

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
              className="flex-1 h-12 text-base"
              onClick={() => navigate("/")}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 text-base"
              disabled={!isFormValid || createReceivable.isPending}
              onClick={handleSubmit}
            >
              {createReceivable.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </FadeIn>

        {/* Info Note */}
        <FadeIn delay={0.35}>
          <p className="text-sm text-muted-foreground text-center">
            Quando o valor for recebido, será registrado como receita automaticamente.
          </p>
        </FadeIn>
      </main>
    </div>
  );
};

export default AddReceivable;
