import { motion } from "framer-motion";
import { PiggyBank, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { Goal } from "@/types/goal";

interface GoalsSummaryProps {
  goals: Goal[];
  totalSaved: number;
  totalTarget: number;
}

export const GoalsSummary = ({ goals, totalSaved, totalTarget }: GoalsSummaryProps) => {
  const navigate = useNavigate();
  const activeGoals = goals.filter(g => g.status === "in_progress");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-essential" />
          Metas
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1"
          onClick={() => navigate("/goals/add")}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova
        </Button>
      </div>

      {activeGoals.length > 0 ? (
        <div className="space-y-2">
          {activeGoals.slice(0, 3).map((goal, index) => {
            const progress = goal.target_amount > 0
              ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              : 0;

            const goalColors: Record<string, string> = {
              green: "bg-essential",
              blue: "bg-obligation",
              orange: "bg-pleasure",
              red: "bg-impulse",
              purple: "bg-primary",
            };
            const barColor = goalColors[goal.color || "green"] || "bg-primary";

            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="w-full p-4 rounded-xl bg-card border border-border shadow-soft text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{goal.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn("h-full rounded-full", barColor)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(goal.current_amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    de {formatCurrency(goal.target_amount)}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {activeGoals.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-8 gap-1"
              onClick={() => navigate("/goals")}
            >
              Ver todas ({activeGoals.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/goals/add")}
          className="w-full p-4 rounded-xl border-2 border-dashed border-border text-center"
        >
          <PiggyBank className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Comece a guardar</p>
          <p className="text-xs text-muted-foreground">Crie sua primeira caixinha</p>
        </motion.button>
      )}
    </div>
  );
};
