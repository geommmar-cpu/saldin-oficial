import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Edit2, Building2, Calendar, Smartphone, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExpenseById, useDeleteExpense } from "@/hooks/useExpenses";
import { useCreditCardInstallmentById } from "@/hooks/useCreditCards";
import { DeleteExpenseDialog } from "@/components/expense/DeleteExpenseDialog";

const sourceLabels: Record<string, string> = {
  manual: "Registro manual",
  whatsapp: "Mensagem WhatsApp",
  integration: "Integração",
};

export const ExpenseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreditCard = id?.startsWith("cc-");

  // Hooks
  const { data: expense, isLoading: expenseLoading } = useExpenseById(isCreditCard ? undefined : id);
  const { data: installment, isLoading: ccLoading } = useCreditCardInstallmentById(isCreditCard ? id : undefined);

  const deleteExpense = useDeleteExpense();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isLoading = expenseLoading || ccLoading;

  // Normalize data for display
  const displayData = isCreditCard && installment ? {
    amount: installment.amount,
    description: installment.purchase.description,
    date: installment.purchase.purchase_date,
    created_at: installment.created_at,
    status: installment.status === 'paid' ? 'paid' : 'pending',
    source: "cartao",
    emotion: null, // Credit cards might not have this yet
    is_installment: true,
    installment_number: installment.installment_number,
    total_installments: installment.purchase.total_installments,
    card_name: installment.purchase.card.card_name,
  } : expense;

  const isFromIntegration = displayData?.source !== "manual";

  const formattedAmount = displayData
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(displayData.amount))
    : "R$ 0,00";

  const handleDelete = async () => {
    if (!id) return;
    try {
      // TODO: Implement delete for credit card installment/purchase if needed
      // For now, we only support deleting regular expenses
      if (isCreditCard) {
        // Maybe show a toast that it's not supported yet or implement it
        console.log("Delete credit card expense not implemented yet");
        return;
      }

      await deleteExpense.mutateAsync({ id, softDelete: isFromIntegration });
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-muted-foreground mb-4">Gasto não encontrado</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Voltar</Button>
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
          <h1 className="font-serif text-xl font-semibold flex-1">Detalhe do Gasto</h1>
          {!isCreditCard && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/expenses/${id}/edit`)}>
              <Edit2 className="w-5 h-5" />
            </Button>
          )}
          {!isCreditCard && (
            <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        <FadeIn className="text-center mb-8">
          <p className="font-serif text-4xl font-semibold">{formattedAmount}</p>
          <p className="text-muted-foreground mt-1">{displayData.description}</p>
          {displayData.status === "pending" && (
            <span className="inline-block mt-2 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">Pendente</span>
          )}
          {displayData.is_installment && (
            <span className="inline-block mt-2 ml-2 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              Parcela {displayData.installment_number}/{displayData.total_installments}
            </span>
          )}
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="space-y-3">
            {displayData.emotion ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm">
                    {displayData.emotion === "pilar" ? "🏠" : displayData.emotion === "essencial" ? "📋" : "⚡"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classificação</p>
                  <p className="text-sm font-medium capitalize">{displayData.emotion}</p>
                </div>
              </div>
            ) : isCreditCard ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm">💳</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cartão</p>
                  <p className="text-sm font-medium">{(displayData as any).card_name}</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data da Compra</p>
                <p className="text-sm font-medium">
                  {format(new Date(displayData.date || displayData.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-medium">
                  {isCreditCard
                    ? "Cartão de Crédito"
                    : (displayData as any).bank_account?.name || (displayData as any).bank_account?.bank_name || (sourceLabels[displayData.source] || displayData.source)}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      <DeleteExpenseDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isRecurring={displayData.is_installment || false}
        isFromIntegration={isFromIntegration}
        isLoading={deleteExpense.isPending}
      />
    </div>
  );
};

export default ExpenseDetail;
