import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Calendar as CalendarIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReceivableById, useUpdateReceivable } from "@/hooks/useReceivables";
import { toast } from "sonner";
import { parseCurrency, formatCurrency } from "@/lib/currency";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EditReceivable = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: receivable, isLoading: isLoadingReceivable } = useReceivableById(id);
  const updateReceivable = useUpdateReceivable();

  const [debtorName, setDebtorName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (receivable) {
      setDebtorName(receivable.debtor_name || "");
      setAmount(formatCurrency(Number(receivable.amount), false));
      setDescription(receivable.description || "");
      if (receivable.due_date) setDueDate(new Date(receivable.due_date));
    }
  }, [receivable]);

  const handleSave = async () => {
    if (!id) return;
    const parsedAmount = parseCurrency(amount);
    if (parsedAmount <= 0 || !debtorName.trim() || !dueDate) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await updateReceivable.mutateAsync({
        id,
        debtor_name: debtorName.trim(),
        amount: parsedAmount,
        description: description.trim() || null,
        due_date: dueDate.toISOString().split("T")[0],
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating receivable:", error);
    }
  };

  if (isLoadingReceivable) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!receivable) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="text-muted-foreground">Valor a receber não encontrado</p>
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
          <h1 className="font-serif text-xl font-semibold">Editar Valor a Receber</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        <FadeIn className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Quem deve?</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Nome da pessoa" value={debtorName} onChange={(e) => setDebtorName(e.target.value)} maxLength={50} className="pl-10" />
          </div>
        </FadeIn>

        <FadeIn delay={0.05} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Valor</Label>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            inputSize="lg"
          />
        </FadeIn>

        <FadeIn delay={0.1} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Descrição (opcional)</Label>
          <Textarea placeholder="Ex: Almoço dividido..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} className="resize-none" rows={2} />
        </FadeIn>

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
        <Button variant="warm" size="lg" className="w-full gap-2" onClick={handleSave} disabled={updateReceivable.isPending}>
          {updateReceivable.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default EditReceivable;
