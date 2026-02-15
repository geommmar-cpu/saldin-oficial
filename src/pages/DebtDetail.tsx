import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  CreditCard,
  Check,
  Circle,
  Trash2,
  Edit2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebtById, useUpdateDebt, useDeleteDebt } from "@/hooks/useDebts";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface DebtInstallment {
  number: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
}

export const DebtDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: debt, isLoading } = useDebtById(id);
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Generate installments from debt data
  const installmentsList = useMemo<DebtInstallment[]>(() => {
    if (!debt || !debt.is_installment) return [];

    const installments: DebtInstallment[] = [];
    const startDate = debt.due_date ? new Date(debt.due_date) : new Date();
    const totalInstallments = debt.total_installments || 1;
    const currentInstallment = debt.current_installment || 1;

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i - 1);

      installments.push({
        number: i,
        dueDate,
        amount: Number(debt.installment_amount || 0),
        paid: i < currentInstallment,
      });
    }

    return installments;
  }, [debt]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const handleToggleInstallment = async (installmentNumber: number, currentlyPaid: boolean) => {
    if (!debt || !id) return;

    const newCurrentInstallment = currentlyPaid
      ? installmentNumber
      : installmentNumber + 1;

    try {
      await updateDebt.mutateAsync({
        id,
        current_installment: Math.max(1, newCurrentInstallment),
        status: newCurrentInstallment > (debt.total_installments || 1) ? "paid" : "active",
      });
    } catch (error) {
      console.error("Error updating installment:", error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id || !debt) return;

    try {
      await updateDebt.mutateAsync({
        id,
        status: "paid",
        current_installment: (debt.total_installments || 1) + 1,
        paid_amount: debt.total_amount,
      });
      toast.success("Dívida marcada como quitada!");
      navigate("/");
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteDebt.mutateAsync(id);
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting debt:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-muted-foreground mb-4">Dívida não encontrada</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  const isRecurring = !debt.is_installment;
  const isPaid = debt.status === "paid";
  const progress = isRecurring
    ? 0
    : Math.round(((debt.current_installment || 1) / (debt.total_installments || 1)) * 100);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold">{debt.creditor_name}</h1>
            <p className="text-xs text-muted-foreground">
              {debt.description || "Dívida"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/debts/${id}/edit`)}
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

      <main className="px-5 space-y-6">
        {/* Summary Card */}
        <FadeIn>
          <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full flex-shrink-0",
                  isPaid ? "bg-essential/15" : "bg-impulse/15"
                )}
              >
                <CreditCard
                  className={cn(
                    "w-7 h-7",
                    isPaid ? "text-essential" : "text-impulse"
                  )}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {isPaid && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-essential/10 text-essential font-medium">
                      Quitada
                    </span>
                  )}
                  {isRecurring && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Recorrente
                    </span>
                  )}
                </div>
                <p className="font-serif text-3xl font-semibold">
                  {formatCurrency(Number(debt.installment_amount || 0))}
                  <span className="text-base text-muted-foreground font-normal">
                    /mês
                  </span>
                </p>
                {!isRecurring && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: {formatCurrency(Number(debt.total_amount))}
                  </p>
                )}
              </div>
            </div>

            {/* Progress */}
            {!isRecurring && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">
                    {(debt.current_installment || 1) - 1}/{debt.total_installments} parcelas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "h-full rounded-full",
                      isPaid ? "bg-essential" : "bg-primary"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Installments List */}
        {!isRecurring && installmentsList.length > 0 && (
          <FadeIn delay={0.1}>
            <h2 className="font-serif text-lg font-semibold mb-3">Parcelas</h2>
            <div className="space-y-2">
              {installmentsList.map((installment, index) => (
                <motion.button
                  key={installment.number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleToggleInstallment(installment.number, installment.paid)}
                  disabled={updateDebt.isPending}
                  className={cn(
                    "w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all",
                    "bg-card border shadow-soft hover:shadow-medium",
                    installment.paid
                      ? "border-essential/30 bg-essential/5"
                      : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      installment.paid
                        ? "bg-essential text-white"
                        : "bg-muted"
                    )}
                  >
                    {installment.paid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-medium text-sm",
                        installment.paid && "line-through text-muted-foreground"
                      )}
                    >
                      Parcela {installment.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(installment.dueDate)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      installment.paid && "text-muted-foreground"
                    )}
                  >
                    {formatCurrency(installment.amount)}
                  </p>
                </motion.button>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Mark as Paid Button */}
        {!isPaid && (
          <FadeIn delay={0.2}>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base gap-2 border-essential text-essential hover:bg-essential/5"
              onClick={handleMarkAsPaid}
              disabled={updateDebt.isPending}
            >
              <Check className="w-5 h-5" />
              Marcar como quitada
            </Button>
          </FadeIn>
        )}
      </main>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir dívida?"
        description="Esta ação não pode ser desfeita."
        isInstallment={debt.is_installment && (debt.total_installments || 1) > 1}
        isLoading={deleteDebt.isPending}
        entityName="dívida"
      />
    </div>
  );
};

export default DebtDetail;
