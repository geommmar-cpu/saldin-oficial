import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  MessageCircle,
  Loader2,
  Landmark,
  Handshake
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useReceivableById, useUpdateReceivable, useDeleteReceivable } from "@/hooks/useReceivables";
import { DeleteConfirmDialog, DeleteScope } from "@/components/shared/DeleteConfirmDialog";

type ReceivableStatus = "pending" | "received" | "cancelled";

const statusConfig: Record<ReceivableStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: {
    label: "Em aberto",
    color: "text-accent",
    bgColor: "bg-accent/10",
    icon: Clock
  },
  received: {
    label: "Recebido",
    color: "text-essential",
    bgColor: "bg-essential/10",
    icon: CheckCircle2
  },
  cancelled: {
    label: "Cancelado",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Clock
  },
};

const getDueDateInfo = (dueDate: Date | null) => {
  if (!dueDate) return { isOverdue: false, isDueSoon: false, daysText: "Sem data" };

  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);

  if (daysUntilDue < 0) {
    return { isOverdue: true, isDueSoon: false, daysText: `${Math.abs(daysUntilDue)} dias atrasado` };
  } else if (daysUntilDue === 0) {
    return { isOverdue: false, isDueSoon: true, daysText: "Vence hoje" };
  } else if (daysUntilDue <= 3) {
    return { isOverdue: false, isDueSoon: true, daysText: `Vence em ${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""}` };
  }
  return { isOverdue: false, isDueSoon: false, daysText: `Vence em ${daysUntilDue} dias` };
};

const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: receivable, isLoading } = useReceivableById(id);
  const updateReceivable = useUpdateReceivable();
  const deleteReceivable = useDeleteReceivable();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const dueDateInfo = useMemo(() => {
    if (!receivable?.due_date) return { isOverdue: false, isDueSoon: false, daysText: "Sem data" };
    return getDueDateInfo(new Date(receivable.due_date));
  }, [receivable]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleMarkAsReceived = async () => {
    if (!id || !receivable) return;

    try {
      await updateReceivable.mutateAsync({
        id,
        status: "received",
        received_at: new Date().toISOString(),
      });
      toast.success("Valor marcado como recebido!");
      navigate("/");
    } catch (error) {
      console.error("Error marking as received:", error);
    }
  };

  const handleDelete = async (scope: DeleteScope = "current") => {
    if (!id) return;

    try {
      await deleteReceivable.mutateAsync({
        id,
        scope,
        groupId: (receivable as any).installment_group_id,
        dueDate: receivable.due_date
      });
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting receivable:", error);
    }
  };

  const handleSendReminder = () => {
    if (!receivable) return;

    const formattedAmount = formatCurrency(Number(receivable.amount));
    const formattedDate = receivable.due_date
      ? format(new Date(receivable.due_date), "dd/MM/yyyy")
      : "a combinar";

    const message = dueDateInfo.isOverdue
      ? `Olá ${receivable.debtor_name}! Tudo bem? Passando para lembrar sobre o valor de ${formattedAmount}${receivable.description ? ` referente a "${receivable.description}"` : ""}. O pagamento estava previsto para ${formattedDate}. Consegue me retornar sobre isso?`
      : `Olá ${receivable.debtor_name}! Tudo bem? Passando para lembrar sobre o valor de ${formattedAmount}${receivable.description ? ` referente a "${receivable.description}"` : ""}, combinado para ${formattedDate}. Só para confirmar que está tudo certo!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

    toast.success("WhatsApp aberto! Selecione o contato.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!receivable) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-muted-foreground mb-4">Valor a receber não encontrado</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  const config = statusConfig[receivable.status as ReceivableStatus] || statusConfig.pending;
  const StatusIcon = config.icon;
  const isOverdue = dueDateInfo.isOverdue;
  const allReceived = receivable.status === "received";

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
              <h1 className="font-serif text-2xl font-semibold flex-1">
                Detalhes
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/receivables/${id}/edit`)}
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
          </FadeIn>
        </div>
      </header>

      <main className="px-5 pb-8 space-y-6">
        {/* Main Card */}
        <FadeIn delay={0.05}>
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-soft",
                (receivable as any).type === "loan" ? "bg-primary/10" : "bg-muted"
              )}>
                {(receivable as any).type === "loan" ? (
                  <Handshake className="w-8 h-8 text-primary" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-serif text-2xl font-semibold flex items-center gap-2">
                  {receivable.debtor_name}
                  {(receivable as any).is_installment && (
                    <span className="text-sm font-sans font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg">
                      {(receivable as any).installment_number}/{(receivable as any).total_installments}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    allReceived ? statusConfig.received.bgColor : isOverdue ? "bg-impulse/10" : config.bgColor
                  )}>
                    {allReceived ? (
                      <CheckCircle2 className="w-3 h-3 text-essential" />
                    ) : (
                      <StatusIcon className={cn("w-3 h-3", isOverdue ? "text-impulse" : config.color)} />
                    )}
                    <span className={allReceived ? "text-essential" : isOverdue ? "text-impulse" : config.color}>
                      {allReceived ? "Quitado" : isOverdue ? "Atrasado" : config.label}
                    </span>
                  </div>

                  {(receivable as any).type === "loan" && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <Handshake className="w-3 h-3" />
                      <span>Empréstimo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-6 border-y border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Valor Total</p>
              <p className="font-serif text-4xl font-semibold text-essential">
                {formatCurrency(Number(receivable.amount))}
              </p>
            </div>

            {/* Details Grid */}
            <div className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isOverdue && !allReceived ? "bg-impulse/10 text-impulse" : "bg-card text-muted-foreground"
                  )}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vencimento</p>
                    <p className={cn("text-sm font-semibold", isOverdue && !allReceived && "text-impulse")}>
                      {receivable.due_date
                        ? format(new Date(receivable.due_date), "dd/MM/yyyy")
                        : "A combinar"}
                    </p>
                  </div>
                </div>

                {/* Account (Destination) */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20">
                  <div className="w-10 h-10 rounded-xl bg-card text-muted-foreground flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-essential" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receber na conta</p>
                    <p className="text-sm font-semibold">
                      {(receivable as any).bank_account
                        ? ((receivable as any).bank_account.name || (receivable as any).bank_account.bank_name)
                        : (receivable as any).bank_account_id ? "Conta Vinculada" : "Não definida"}
                    </p>
                  </div>
                </div>

                {/* Source Account (If loan) */}
                {(receivable as any).type === "loan" && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20">
                    <div className="w-10 h-10 rounded-xl bg-card text-muted-foreground flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-impulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saiu da conta</p>
                      <p className="text-sm font-semibold">
                        {(receivable as any).source_account
                          ? ((receivable as any).source_account.name || (receivable as any).source_account.bank_name)
                          : (receivable as any).source_account_id ? "Conta de Origem" : "Não definida"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {receivable.description && (
                <div className="p-4 rounded-2xl bg-secondary/10 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{receivable.description}</p>
                </div>
              )}
            </div>
          </Card>
        </FadeIn>

        {/* Action Buttons */}
        {!allReceived && (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-base gap-2"
                onClick={handleMarkAsReceived}
                disabled={updateReceivable.isPending}
              >
                <CheckCircle2 className="w-5 h-5" />
                Marcar como recebido
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base gap-2"
                onClick={handleSendReminder}
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Enviar cobrança via WhatsApp
              </Button>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isInstallment={!!(receivable as any).installment_group_id}
        title={(receivable as any).installment_group_id ? "Excluir parcelas?" : "Excluir valor a receber?"}
        description="Esta ação não pode ser desfeita."
        isLoading={deleteReceivable.isPending}
        entityName="valor a receber"
      />
    </div>
  );
};

export default ReceivableDetail;
