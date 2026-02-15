import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FadeIn, ScaleIn } from "@/components/ui/motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar as CalendarIcon, User, DollarSign, Loader2, AlertCircle, Landmark, Handshake, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateReceivable } from "@/hooks/useReceivables";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ConfirmReceivable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const createReceivable = useCreateReceivable();
  const { data: bankAccounts = [] } = useBankAccounts();

  const amount = location.state?.amount || 0;

  const [debtorName, setDebtorName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isLoan, setIsLoan] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("2");
  const [bankAccountId, setBankAccountId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const isFormValid = useMemo(() => {
    const baseValid = debtorName.trim() && dueDate && bankAccountId;
    if (isLoan) return baseValid && sourceAccountId;
    return baseValid;
  }, [debtorName, dueDate, bankAccountId, isLoan, sourceAccountId]);

  const validateForm = (): boolean => {
    if (!user) {
      setValidationError("Você precisa estar logado para salvar.");
      return false;
    }

    if (!debtorName.trim()) {
      setValidationError("Digite o nome da pessoa.");
      return false;
    }

    if (!dueDate) {
      setValidationError("Selecione a data de pagamento.");
      return false;
    }

    // For loans, destination is optional (might not know yet). For simple receivables, it is required.
    if (!isLoan && !bankAccountId) {
      setValidationError("Selecione a conta onde o dinheiro deve entrar.");
      return false;
    }

    if (isLoan && !sourceAccountId) {
      setValidationError("Selecione a conta de onde o dinheiro está saindo.");
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
        amount,
        description: description.trim() || null,
        due_date: format(dueDate!, "yyyy-MM-dd"),
        status: "pending",
        type: isLoan ? "loan" : "simple",
        is_installment: isInstallment,
        total_installments: isInstallment ? parseInt(totalInstallments) : 1,
        // For non-loans, destination is required. For loans, it is optional (can be decided later).
        bank_account_id: isLoan ? (bankAccountId || null) : bankAccountId,
        source_account_id: isLoan ? sourceAccountId : null,
      });

      toast.success(isLoan ? "Empréstimo registrado com sucesso!" : "Valor a receber registrado!");
      navigate("/");
    } catch (error: any) {
      console.error("Failed to save receivable:", error);
      const errorMessage = error?.message || "Erro desconhecido";
      toast.error(`Erro ao salvar: ${errorMessage}`);
    }
  };

  if (!amount) {
    navigate("/receivables/add");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-4">
          <FadeIn>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-serif text-2xl font-semibold">
                {isLoan ? "Conceder Empréstimo" : "Valor a receber"}
              </h1>
            </div>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 space-y-6">
        <FadeIn>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="font-serif text-4xl font-semibold text-essential">{formattedAmount}</p>
          </div>
        </FadeIn>

        <div className="space-y-5">
          {/* Debtor Name */}
          <FadeIn delay={0.05} className="space-y-2">
            <Label htmlFor="debtorName" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
              Nome da pessoa
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="debtorName"
                placeholder="Quem deve para você?"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                className="pl-11 h-12 bg-secondary/30 border-none shadow-none focus-visible:ring-primary"
              />
            </div>
          </FadeIn>

          {/* Loan Toggle */}
          <FadeIn delay={0.1}>
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Handshake className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">É um empréstimo?</p>
                  <p className="text-[10px] text-muted-foreground">O dinheiro sairá da sua conta agora.</p>
                </div>
              </div>
              <Switch checked={isLoan} onCheckedChange={setIsLoan} />
            </div>
          </FadeIn>

          {/* Accounts Section */}
          <FadeIn delay={0.15} className="space-y-4">
            {isLoan && (
              <ScaleIn className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Conta de Origem (Saída)</Label>
                <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                  <SelectTrigger className="h-12 bg-secondary/30 border-none focus:ring-primary">
                    <SelectValue placeholder="De onde sai o dinheiro?" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4" />
                          <span>{acc.bank_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ScaleIn>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
                  {isLoan ? "Conta de Destino (Opcional)" : "Conta de Destino (Futuro)"}
                </Label>
                {isLoan && bankAccountId && (
                  <Button variant="ghost" size="sm" onClick={() => setBankAccountId("")} className="h-6 px-2 text-xs">
                    Limpar
                  </Button>
                )}
              </div>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="h-12 bg-secondary/30 border-none focus:ring-primary">
                  <SelectValue placeholder={isLoan ? "Onde deve entrar (se souber)" : "Onde o dinheiro vai entrar?"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        <span>{acc.bank_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FadeIn>

          {/* Date Picker */}
          <FadeIn delay={0.2} className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
              {isInstallment ? "Data da 1ª Parcela" : "Data do Recebimento"}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-secondary/30 border-none",
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
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </FadeIn>

          {/* Installment Section */}
          <FadeIn delay={0.25} className="space-y-4">
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Repeat className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold">Parcelado?</p>
                  <p className="text-[10px] text-muted-foreground">Serão criados registros mensais.</p>
                </div>
              </div>
              <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
            </div>

            {isInstallment && (
              <ScaleIn className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  max="120"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  className="h-12 bg-secondary/30 border-none shadow-none"
                />
              </ScaleIn>
            )}
          </FadeIn>

          {/* Description */}
          <FadeIn delay={0.3} className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Almoço, presente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/30 border-none resize-none focus-visible:ring-primary min-h-[100px]"
            />
          </FadeIn>

          {/* Validation & Submit */}
          <FadeIn delay={0.35} className="pt-4 pb-8">
            {validationError && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm mb-4 border border-destructive/20 scale-in-sm">
                <AlertCircle className="w-5 h-5" />
                {validationError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
                onClick={() => navigate("/")}
              >
                Cancelar
              </Button>
              <Button
                variant="warm"
                className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                disabled={!isFormValid || createReceivable.isPending}
                onClick={handleSubmit}
              >
                {createReceivable.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
};

export default ConfirmReceivable;
