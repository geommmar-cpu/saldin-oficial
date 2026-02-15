import { useMemo } from "react";
import { parseLocalDate } from "@/lib/dateUtils";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppChargeButton } from "@/components/WhatsAppChargeButton";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  Plus,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HandCoins,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReceivables, useReceivableStats } from "@/hooks/useReceivables";
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pending: { label: "Em aberto", color: "text-accent", icon: Clock },
  received: { label: "Recebido", color: "text-essential", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "text-muted-foreground", icon: Clock },
};

const Receivables = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get selected month from navigation state, fallback to current month
  const selectedMonth = useMemo(() => {
    const stateMonth = location.state?.selectedMonth;
    return stateMonth ? new Date(stateMonth) : new Date();
  }, [location.state?.selectedMonth]);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch real data from Supabase
  const { data: allReceivables = [], isLoading } = useReceivables("all");
  const { data: stats } = useReceivableStats();

  // Filter receivables by due date in selected month
  const receivables = useMemo(() => {
    return allReceivables.filter(receivable => {
      const dueDate = receivable.due_date ? parseLocalDate(receivable.due_date) : null;
      if (!dueDate) return false;
      return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
    });
  }, [allReceivables, monthStart, monthEnd]);

  // Get month name from selected month
  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: ptBR });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Sem data";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(date));
  };

  // Calculate totals from filtered data
  const pendingReceivables = useMemo(
    () => receivables.filter((r) => r.status !== "received" && r.status !== "cancelled"),
    [receivables]
  );

  const totalPending = pendingReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const overdueCount = pendingReceivables.filter(r => {
    const dueDate = r.due_date ? parseLocalDate(r.due_date) : null;
    return dueDate && dueDate < new Date();
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="-ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">A Receber</h1>
          </div>
          <Button variant="warm" size="sm" className="gap-1" onClick={() => navigate("/receivables/add")}>
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Summary Card */}
        <FadeIn delay={0.05}>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-essential/15 flex items-center justify-center">
                <HandCoins className="w-5 h-5 text-essential" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total a receber</p>
                <p className="font-serif text-2xl font-semibold text-essential">
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex-1">
                <p className="text-2xl font-semibold">{pendingReceivables.length}</p>
                <p className="text-xs text-muted-foreground">pendências</p>
              </div>
              {overdueCount > 0 && (
                <div className="flex-1">
                  <p className="text-2xl font-semibold text-impulse">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">atrasadas</p>
                </div>
              )}
            </div>
          </Card>
        </FadeIn>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Receivables List */}
        {/* Receivables List */}
        <FadeIn delay={0.15}>
          <div>
            <h2 className="font-serif text-lg font-semibold mb-3">
              Valores em aberto
            </h2>
            <div className="space-y-3">
              {pendingReceivables.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-2xl border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <HandCoins className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Nenhum valor a receber no momento
                  </p>
                </div>
              ) : (
                pendingReceivables.map((receivable, index) => {
                  const isOverdue = receivable.due_date && parseLocalDate(receivable.due_date)! < new Date();
                  const isLoan = receivable.type === "loan";

                  return (
                    <motion.div
                      key={receivable.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => navigate(`/receivables/${receivable.id}`)}
                        className="w-full text-left bg-card rounded-xl border border-border p-4 shadow-sm active:scale-[0.98] transition-all hover:shadow-md group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                              isLoan ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {isLoan ? "Empréstimo" : "A Receber"}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Atrasado
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-lg font-semibold tabular-nums">
                            {formatCurrency(Number(receivable.amount))}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{receivable.debtor_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Vence {formatDate(receivable.due_date)}</span>
                              {receivable.is_installment && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  <span>{receivable.installment_number}/{receivable.total_installments}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </FadeIn>

        {/* Received History - Show if any exist */}
        {receivables.some((r) => r.status === "received") && (
          <FadeIn delay={0.2}>
            <div className="mt-8">
              <h2 className="font-serif text-lg font-semibold mb-3 text-muted-foreground">
                Recebidos Recentemente
              </h2>
              <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                {receivables
                  .filter((r) => r.status === "received")
                  .map((receivable) => (
                    <div
                      key={receivable.id}
                      className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-essential/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-essential" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate line-through text-muted-foreground">{receivable.debtor_name}</p>
                        <p className="text-xs text-muted-foreground">Confirmado</p>
                      </div>
                      <p className="font-semibold text-muted-foreground line-through">
                        {formatCurrency(Number(receivable.amount))}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Receivables;
