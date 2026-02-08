import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { 
  Plus, 
  Target, 
  ChevronRight, 
  Loader2,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useGoals, useGoalStats } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";

// Cores disponíveis para metas
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

type FilterStatus = 'all' | 'in_progress' | 'completed';

export default function Goals() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const { data: goals = [], isLoading } = useGoals(filterStatus === 'all' ? 'all' : filterStatus);
  const { data: stats, isLoading: statsLoading } = useGoalStats();

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getColorClasses = (color: string | null) => {
    return goalColors[color || 'green'] || goalColors.green;
  };

  const getIcon = (icon: string | null) => {
    return goalIcons[icon || 'target'] || Target;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <FadeIn>
            <div>
              <h1 className="font-serif text-2xl font-bold">Metas</h1>
              <p className="text-sm text-muted-foreground">
                Organize seu dinheiro em caixinhas
              </p>
            </div>
          </FadeIn>
          <Button 
            onClick={() => navigate("/goals/add")}
            size="sm"
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-5 pt-4">
        {/* Stats Card */}
        <FadeIn delay={0.1}>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-essential/10 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-essential" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total guardado</p>
                <p className="font-serif text-2xl font-bold text-essential">
                  {formatCurrency(stats?.totalSaved || 0)}
                </p>
              </div>
            </div>
            
            {stats && stats.totalTarget > 0 && (
              <>
                <Progress 
                  value={Math.min((stats.totalSaved / stats.totalTarget) * 100, 100)} 
                  className="h-2 mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.totalSaved / stats.totalTarget) * 100)}% do objetivo total ({formatCurrency(stats.totalTarget)})
                </p>
              </>
            )}

            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{stats?.activeCount || 0}</strong> em andamento
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-essential" />
                <span className="text-sm">
                  <strong>{stats?.completedCount || 0}</strong> concluídas
                </span>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Filter Tabs */}
        <FadeIn delay={0.15}>
          <div className="flex gap-2">
            {(['all', 'in_progress', 'completed'] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="flex-1"
              >
                {status === 'all' && 'Todas'}
                {status === 'in_progress' && 'Em andamento'}
                {status === 'completed' && 'Concluídas'}
              </Button>
            ))}
          </div>
        </FadeIn>

        {/* Goals List */}
        <FadeIn delay={0.2}>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Nenhuma meta encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie sua primeira meta para começar a guardar dinheiro
                </p>
                <Button onClick={() => navigate("/goals/add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar meta
                </Button>
              </Card>
            ) : (
              <AnimatePresence>
                {goals.map((goal, index) => {
                  const colorClasses = getColorClasses(goal.color);
                  const Icon = getIcon(goal.icon);
                  const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        variant="interactive"
                        className={cn(
                          "p-4 border-2",
                          colorClasses.border,
                          goal.status === 'completed' && "opacity-80"
                        )}
                        onClick={() => navigate(`/goals/${goal.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            colorClasses.bg
                          )}>
                            <Icon className={cn("w-6 h-6", colorClasses.text)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold truncate">{goal.name}</h3>
                              {goal.status === 'completed' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-essential/10 text-essential font-medium shrink-0">
                                  ✓ Concluída
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className={cn("font-semibold", colorClasses.text)}>
                                {formatCurrency(Number(goal.current_amount))}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                de {formatCurrency(Number(goal.target_amount))}
                              </span>
                            </div>
                            
                            <Progress 
                              value={progress} 
                              className="h-2 mb-2"
                            />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {Math.round(progress)}% guardado
                              </span>
                              {goal.status !== 'completed' && remaining > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Faltam {formatCurrency(remaining)}
                                </span>
                              )}
                            </div>
                            
                            {goal.target_date && goal.status !== 'completed' && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Meta para {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </FadeIn>

        {/* Coming Soon Features */}
        <FadeIn delay={0.3}>
          <Card className="p-4 bg-muted/30 border-dashed">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Em breve</p>
                <p className="text-xs text-muted-foreground">
                  Sugestões automáticas de metas e lembretes
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                Em breve
              </span>
            </div>
          </Card>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
}
