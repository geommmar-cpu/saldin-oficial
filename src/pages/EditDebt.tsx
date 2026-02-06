import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebtById, useUpdateDebt } from "@/hooks/useDebts";
import { toast } from "sonner";
import { parseCurrency, formatCurrency } from "@/lib/currency";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EditDebt = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: debt, isLoading: isLoadingDebt } = useDebtById(id);
  const updateDebt = useUpdateDebt();

  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const isRecurring = debt ? !debt.is_installment : false;

  useEffect(() => {
    if (debt) {
      setCreditorName(debt.creditor_name || "");
      setTotalAmount(formatCurrency(Number(debt.total_amount), false));
      setInstallments((debt.total_installments || 1).toString());
      setInstallmentAmount(formatCurrency(Number(debt.installment_amount || 0), false));
      if (debt.due_date) setDueDate(new Date(debt.due_date));
    }
  }, [debt]);

  const handleSave = async () => {
    if (!id) return;
    const parsedTotal = parseCurrency(totalAmount);
    const parsedInstallments = parseInt(installments) || 1;

    if (parsedTotal <= 0 || !creditorName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await updateDebt.mutateAsync({
        id,
        creditor_name: creditorName.trim(),
        total_amount: parsedTotal,
        total_installments: parsedInstallments,
        installment_amount: parsedTotal / parsedInstallments,
        due_date: dueDate?.toISOString().split("T")[0],
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating debt:", error);
    }
  };

  if (isLoadingDebt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="text-muted-foreground">Dívida não encontrada</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Editar Dívida</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        <FadeIn className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Nome da dívida</Label>
          <Input placeholder="Ex: Cartão Nubank..." value={creditorName} onChange={(e) => setCreditorName(e.target.value)} maxLength={50} />
        </FadeIn>

        <FadeIn delay={0.05} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Valor total</Label>
          <CurrencyInput
            value={totalAmount}
            onChange={setTotalAmount}
            inputSize="lg"
          />
        </FadeIn>

        {!isRecurring && (
          <FadeIn delay={0.1} className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Nº de parcelas</Label>
                <Input type="number" inputMode="numeric" value={installments} onChange={(e) => setInstallments(e.target.value)} min={1} max={120} className="h-12" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Valor da parcela</Label>
                <CurrencyInput
                  value={installmentAmount}
                  onChange={setInstallmentAmount}
                />
              </div>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={0.15} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Data de vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !dueDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus locale={ptBR} />
            </PopoverContent>
          </Popover>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button variant="warm" size="lg" className="w-full gap-2" onClick={handleSave} disabled={updateDebt.isPending}>
          {updateDebt.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default EditDebt;
