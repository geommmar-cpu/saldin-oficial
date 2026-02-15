import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  Target,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGoalById, useAddToGoal, useDeleteGoal, useGoalTransactions } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";

// Cores disponíveis
const goalColors: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: "bg-essential/10", text: "text-essential", border: "border-essential/30" },
  blue: { bg: "bg-calm/10", text: "text-calm", border: "border-calm/30" },
  purple: { bg: "bg-pleasure/10", text: "text-pleasure", border: "border-pleasure/30" },
  orange: { bg: "bg-obligation/10", text: "text-obligation", border: "border-obligation/30" },
  red: { bg: "bg-impulse/10", text: "text-impulse", border: "border-impulse/30" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/30" },
};

// Ícones disponíveis
const goalIcons: Record<string, React.ElementType> = {
  target: Target,
  piggy: PiggyBank,
  trending: TrendingUp,
  sparkles: Sparkles,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: goal, isLoading } = useGoalById(id);
  const { data: transactions = [], isLoading: transLoading } = useGoalTransactions(id);
  const addToGoal = useAddToGoal();
  const deleteGoal = useDeleteGoal();

  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [amount, setAmount] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Meta não encontrada</h2>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  const colorClasses = goalColors[goal.color || 'green'] || goalColors.green;
  const Icon = goalIcons[goal.icon || 'target'] || Target;
  const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  const isCompleted = goal.status === 'completed';

  const handleDeposit = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) return;

    await addToGoal.mutateAsync({
      goal_id: goal.id,
      amount: value,
      type: 'deposit',
      description: null,
    });

    setAmount('');
    setShowDepositDialog(false);
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) return;
    if (value > Number(goal.current_amount)) return;

    await addToGoal.mutateAsync({
      goal_id: goal.id,
      amount: value,
      type: 'withdrawal',
      description: null,
    });

    setAmount('');
    setShowWithdrawDialog(false);
  };

  const handleDelete = async () => {
    await deleteGoal.mutateAsync(goal.id);
    navigate('/');
  };

  // Helper to determine theme based on goal name (same as Home)
  const getGoalTheme = (name: string) => {
    const lowerName = name.toLowerCase();

    // Images from Unsplash
    if (lowerName.includes("viagem") || lowerName.includes("férias") || lowerName.includes("trip") || lowerName.includes("passeio") || lowerName.includes("mundo") || lowerName.includes("praia")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-blue-900/40"
      };
    }
    if (lowerName.includes("carro") || lowerName.includes("moto") || lowerName.includes("veículo") || lowerName.includes("uber") || lowerName.includes("automóvel")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-slate-900/50"
      };
    }
    if (lowerName.includes("casa") || lowerName.includes("apt") || lowerName.includes("imóvel") || lowerName.includes("reforma") || lowerName.includes("móveis") || lowerName.includes("construção")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-orange-900/40"
      };
    }
    if (lowerName.includes("reserva") || lowerName.includes("emergência") || lowerName.includes("poupança") || lowerName.includes("investimento") || lowerName.includes("milhão")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-emerald-900/50"
      };
    }
    if (lowerName.includes("pc") || lowerName.includes("computador") || lowerName.includes("notebook") || lowerName.includes("tech") || lowerName.includes("setup")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-indigo-900/60"
      };
    }
    if (lowerName.includes("celular") || lowerName.includes("iphone") || lowerName.includes("samsung")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-zinc-900/50"
      };
    }
    if (lowerName.includes("estudo") || lowerName.includes("faculdade") || lowerName.includes("curso") || lowerName.includes("pós")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-blue-900/50"
      };
    }
    if (lowerName.includes("casamento") || lowerName.includes("festa") || lowerName.includes("aliança")) {
      return {
        icon: Icon,
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=500&auto=format&fit=crop",
        overlay: "bg-pink-900/40"
      };
    }

    // Default Theme (Abstract)
    return {
      icon: Icon,
      image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop",
      overlay: "bg-purple-900/40"
    };
  };

  const theme = getGoalTheme(goal.name);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-bold">{goal.name}</h1>
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <span className="text-xs text-essential flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Concluída
                  </span>
                )}
                {goal.is_personal === false && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> Para terceiro
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/goals/${id}/edit`)}
            >
              <Edit className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
        {/* Main Card */}
        <FadeIn>
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 p-6 min-h-[220px] flex flex-col justify-end text-white"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url(${theme.image})` }}
            />

            {/* Overlays */}
            <div className={cn("absolute inset-0 z-10", theme.overlay)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

            {/* Content */}
            <div className="relative z-20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80 font-medium">Guardado</p>
                  <p className="font-serif text-3xl font-bold text-white drop-shadow-md">
                    {formatCurrency(Number(goal.current_amount))}
                  </p>
                </div>
              </div>

              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-md mb-3">
                <div
                  className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/90 font-medium">
                  {Math.round(progress)}% do objetivo
                </span>
                <span className="font-medium text-white/90">
                  Meta: {formatCurrency(Number(goal.target_amount))}
                </span>
              </div>
            </div>
          </div>

          {!isCompleted && remaining > 0 && (
            <p className="text-sm text-muted-foreground mt-3 px-1">
              Faltam <strong>{formatCurrency(remaining)}</strong> para atingir a meta
            </p>
          )}

          {goal.target_date && !isCompleted && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1 px-1">
              <Clock className="w-4 h-4" />
              Objetivo para {new Date(goal.target_date).toLocaleDateString('pt-BR')}
            </p>
          )}

        </FadeIn>

        {/* Action Buttons */}
        <FadeIn delay={0.1}>
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              variant="default"
              onClick={() => setShowDepositDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Guardar valor
            </Button>
            <Button
              className="flex-1 gap-2"
              variant="outline"
              onClick={() => setShowWithdrawDialog(true)}
              disabled={Number(goal.current_amount) <= 0}
            >
              <Minus className="w-4 h-4" />
              Resgatar
            </Button>
          </div>
        </FadeIn>

        {/* Notes */}
        {goal.notes && (
          <FadeIn delay={0.15}>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Observação</p>
              <p className="text-sm">{goal.notes}</p>
            </Card>
          </FadeIn>
        )}

        {/* Transaction History */}
        <FadeIn delay={0.2}>
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <History className="w-4 h-4" />
              Histórico
            </h3>

            {transLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma movimentação ainda
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {transactions.map((trans) => (
                  <Card key={trans.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        trans.type === 'deposit' ? "bg-essential/10" : "bg-muted"
                      )}>
                        {trans.type === 'deposit' ? (
                          <Plus className="w-4 h-4 text-essential" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {trans.type === 'deposit' ? 'Depósito' : 'Resgate'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trans.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "font-semibold",
                      trans.type === 'deposit' ? "text-essential" : "text-muted-foreground"
                    )}>
                      {trans.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(trans.amount))}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </main>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar valor</DialogTitle>
            <DialogDescription>
              Quanto você quer guardar nesta meta?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-10 text-lg"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {goal.is_personal !== false
                ? "Este valor será subtraído do seu Saldo Livre"
                : "Meta para terceiro — não afeta seu saldo"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={addToGoal.isPending || !amount}
            >
              {addToGoal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar valor</DialogTitle>
            <DialogDescription>
              Quanto você quer resgatar desta meta?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={Number(goal.current_amount)}
                className="pl-10 text-lg"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Disponível: {formatCurrency(Number(goal.current_amount))}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {goal.is_personal !== false
                ? "Este valor voltará para seu Saldo Livre"
                : "Meta para terceiro — não afeta seu saldo"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={addToGoal.isPending || !amount || parseFloat(amount.replace(',', '.')) > Number(goal.current_amount)}
            >
              {addToGoal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Resgatar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goal.name}"?
              {Number(goal.current_amount) > 0 && (
                <strong className="block mt-2">
                  O valor guardado ({formatCurrency(Number(goal.current_amount))}) voltará para seu Saldo Livre.
                </strong>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGoal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
