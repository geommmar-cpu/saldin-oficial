import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenseById, useUpdateExpense } from "@/hooks/useExpenses";
import { toast } from "sonner";
import { parseCurrency, formatCurrency } from "@/lib/currency";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EditExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: expense, isLoading: isLoadingExpense } = useExpenseById(id);
  const updateExpense = useUpdateExpense();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (expense) {
      setAmount(formatCurrency(Number(expense.amount), false));
      setDescription(expense.description || "");
      setDate(new Date(expense.date || expense.created_at));
    }
  }, [expense]);

  const handleSave = async () => {
    if (!id) return;
    const parsedAmount = parseCurrency(amount);
    if (parsedAmount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      await updateExpense.mutateAsync({
        id,
        amount: parsedAmount,
        description: description.trim() || "Gasto",
        date: date?.toISOString().split("T")[0],
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  if (isLoadingExpense) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="text-muted-foreground">Gasto não encontrado</p>
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
          <h1 className="font-serif text-xl font-semibold">Editar Gasto</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        <FadeIn className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Valor</Label>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            inputSize="xl"
          />
        </FadeIn>

        <FadeIn delay={0.05} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Descrição</Label>
          <Textarea placeholder="Detalhes do gasto..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="resize-none" rows={2} />
        </FadeIn>

        <FadeIn delay={0.1} className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
            </PopoverContent>
          </Popover>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button variant="warm" size="lg" className="w-full gap-2" onClick={handleSave} disabled={updateExpense.isPending}>
          {updateExpense.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default EditExpense;
