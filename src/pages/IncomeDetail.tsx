import { useState } from "react";
import { parseLocalDate } from "@/lib/dateUtils";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Edit2, Trash2, RefreshCw, Zap, Calendar, Pencil, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIncomeById, useDeleteIncome } from "@/hooks/useIncomes";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

// Map database income_type to display categories
const isFixedType = (type: string) => ["salary"].includes(type);

const typeLabels: Record<string, string> = {
  salary: "Salário",
  freelance: "Freelance",
  investment: "Investimento",
  gift: "Presente",
  initial_balance: "Saldo inicial",
  other: "Outros",
};

export const IncomeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: income, isLoading } = useIncomeById(id);
  const deleteIncome = useDeleteIncome();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteIncome.mutateAsync(id);
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!income) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-muted-foreground mb-4">Receita não encontrada</p>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Voltar
        </Button>
      </div>
    );
  }

  const isFixed = isFixedType(income.type);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold flex-1">Detalhe da Receita</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/income/${id}/edit`)}
          >
            <Edit2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6">
        {/* Amount */}
        <FadeIn className="text-center">
          <p className="font-serif text-4xl font-semibold text-essential">
            +{formatCurrency(Number(income.amount))}
          </p>
          <p className="text-muted-foreground mt-1">{income.description}</p>
        </FadeIn>

        {/* Type Section */}
        <FadeIn delay={0.1}>
          <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tipo de receita</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-essential/15 flex items-center justify-center">
                {isFixed ? (
                  <RefreshCw className="w-5 h-5 text-essential" />
                ) : (
                  <Zap className="w-5 h-5 text-accent" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {typeLabels[income.type] || income.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {income.is_recurring ? "Mensal" : "Pontual"}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Details */}
        <FadeIn delay={0.15}>
          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm font-medium">
                  {format(income.date ? parseLocalDate(income.date) : new Date(income.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Source */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-medium">Registro manual</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir receita?"
        description="Esta ação não pode ser desfeita. A receita será removida permanentemente."
        isLoading={deleteIncome.isPending}
        entityName="receita"
      />
    </div>
  );
};

export default IncomeDetail;
