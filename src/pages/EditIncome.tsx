import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useIncomeById, useUpdateIncome } from "@/hooks/useIncomes";
import { toast } from "sonner";
import { parseCurrency, formatCurrency } from "@/lib/currency";

export const EditIncome = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: income, isLoading: isLoadingIncome } = useIncomeById(id);
  const updateIncome = useUpdateIncome();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (income) {
      setAmount(formatCurrency(Number(income.amount), false));
      setDescription(income.description || "");
      setIsRecurring(income.is_recurring || false);
    }
  }, [income]);

  const handleSave = async () => {
    if (!id) return;
    const parsedAmount = parseCurrency(amount);
    if (parsedAmount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      await updateIncome.mutateAsync({
        id,
        amount: parsedAmount,
        description: description.trim() || "Receita",
        is_recurring: isRecurring,
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating income:", error);
    }
  };

  if (isLoadingIncome) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!income) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="text-muted-foreground">Receita não encontrada</p>
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
          <h1 className="font-serif text-xl font-semibold">Editar Receita</h1>
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
          <Textarea placeholder="Ex: Salário, Freelance..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} className="resize-none" rows={2} />
        </FadeIn>

        <FadeIn delay={0.1} className="mb-6">
          <div className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer ${isRecurring ? "border-essential bg-essential/5" : "border-border bg-card"}`} onClick={() => setIsRecurring(!isRecurring)}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isRecurring ? "border-essential bg-essential" : "border-muted-foreground"}`}>
              {isRecurring && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="font-medium">Receita recorrente</p>
              <p className="text-xs text-muted-foreground">Se repete todo mês</p>
            </div>
          </div>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button variant="warm" size="lg" className="w-full gap-2" onClick={handleSave} disabled={updateIncome.isPending}>
          {updateIncome.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default EditIncome;
