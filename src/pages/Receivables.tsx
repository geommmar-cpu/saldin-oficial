import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppChargeButton } from "@/components/WhatsAppChargeButton";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
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
      const dueDate = receivable.due_date ? new Date(receivable.due_date) : null;
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
    const dueDate = r.due_date ? new Date(r.due_date) : null;
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
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
        <FadeIn delay={0.15}>
          <div>
            <h2 className="font-serif text-lg font-semibold mb-3">
              Valores em aberto
            </h2>
            <div className="space-y-3">
              {pendingReceivables.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <HandCoins className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Nenhum valor a receber no momento
                  </p>
                </Card>
              ) : (
                pendingReceivables.map((receivable) => {
                  const config = statusConfig[receivable.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  
                  return (
                    <motion.button
                      key={receivable.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => navigate(`/receivables/${receivable.id}`)}
                      className="w-full"
                    >
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{receivable.debtor_name}</p>
                            {receivable.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {receivable.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(Number(receivable.amount))}
                            </p>
                            <div className={cn("flex items-center gap-1 text-xs", config.color)}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{formatDate(receivable.due_date)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Botão Cobrar */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <WhatsAppChargeButton
                            debtorName={receivable.debtor_name}
                            amount={Number(receivable.amount)}
                            description={receivable.description || undefined}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      </Card>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </FadeIn>

        {/* Received History - Show if any exist */}
        {receivables.some((r) => r.status === "received") && (
          <FadeIn delay={0.2}>
            <div>
              <h2 className="font-serif text-lg font-semibold mb-3 text-muted-foreground">
                Recebidos
              </h2>
              <div className="space-y-3">
                {receivables
                  .filter((r) => r.status === "received")
                  .map((receivable) => (
                    <Card key={receivable.id} className="p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-essential/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-essential" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{receivable.debtor_name}</p>
                          {receivable.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {receivable.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-essential">
                            {formatCurrency(Number(receivable.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recebido
                          </p>
                        </div>
                      </div>
                    </Card>
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
