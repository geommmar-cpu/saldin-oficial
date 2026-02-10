import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Goal, GoalInsert, GoalUpdate, GoalTransaction, GoalTransactionInsert } from "@/types/goal";

// Note: These hooks use raw Supabase queries since the goals table
// is not yet in the auto-generated types. After running the migration,
// regenerate types to get full type safety.

export const useGoals = (status?: 'in_progress' | 'completed' | 'paused' | 'all') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["goals", user?.id, status],
    queryFn: async (): Promise<Goal[]> => {
      if (!user) return [];

      let query = supabase
        .from("goals" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        // Table doesn't exist yet - return empty array gracefully
        if (error.code === "PGRST205") {
          console.warn("Goals table not found. Please run the migration SQL.");
          return [];
        }
        console.error("Error fetching goals:", error);
        throw error;
      }

      return (data as unknown as Goal[]) || [];
    },
    enabled: !!user,
    retry: (failureCount, error: any) => {
      // Don't retry if table doesn't exist
      if (error?.code === "PGRST205") return false;
      return failureCount < 3;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useGoalById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["goal", id],
    queryFn: async (): Promise<Goal | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("goals" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching goal:", error);
        throw error;
      }

      return data as unknown as Goal | null;
    },
    enabled: !!user && !!id,
  });
};

export const useGoalStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["goal-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("goals" as any)
        .select("current_amount, target_amount, status, is_personal");

      if (error) {
        // Table doesn't exist yet - return empty stats
        if (error.code === "PGRST205") {
          return {
            totalSaved: 0,
            totalTarget: 0,
            activeCount: 0,
            completedCount: 0,
            totalCount: 0,
          };
        }
        console.error("Error fetching goal stats:", error);
        throw error;
      }

      const goals = (data as unknown as Goal[]) || [];
      // Only count personal goals for balance calculations
      const personalGoals = goals.filter(g => g.is_personal !== false);
      const totalSaved = personalGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
      const totalTarget = personalGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
      const activeCount = goals.filter(g => g.status === 'in_progress').length;
      const completedCount = goals.filter(g => g.status === 'completed').length;

      return {
        totalSaved,
        totalTarget,
        activeCount,
        completedCount,
        totalCount: goals.length,
      };
    },
    enabled: !!user,
    retry: (failureCount, error: any) => {
      if (error?.code === "PGRST205") return false;
      return failureCount < 3;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: GoalInsert): Promise<Goal> => {
      if (!user) throw new Error("Usuário não autenticado");

      const insertData = {
        user_id: user.id,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount || 0,
        target_date: goal.target_date || null,
        color: goal.color || 'green',
        icon: goal.icon || 'target',
        notes: goal.notes || null,
        is_personal: goal.is_personal !== undefined ? goal.is_personal : true,
        status: goal.status || 'in_progress',
      };

      console.log("Creating goal with data:", insertData);

      const { data, error } = await supabase
        .from("goals" as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Goal creation error details:", JSON.stringify(error));
        throw error;
      }
      return data as unknown as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
      toast.error("Erro ao criar meta");
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: GoalUpdate & { id: string }): Promise<Goal> => {
      const { data, error } = await supabase
        .from("goals" as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      console.error("Error updating goal:", error);
      toast.error("Erro ao atualizar meta");
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all transactions for this goal
      await supabase.from("goal_transactions" as any).delete().eq("goal_id", id);
      
      // Then delete the goal
      const { error } = await supabase.from("goals" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      toast.success("Meta removida!");
    },
    onError: (error) => {
      console.error("Error deleting goal:", error);
      toast.error("Erro ao remover meta");
    },
  });
};

// Goal Transactions (deposits and withdrawals)
export const useGoalTransactions = (goalId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["goal-transactions", goalId],
    queryFn: async (): Promise<GoalTransaction[]> => {
      if (!goalId) return [];

      const { data, error } = await supabase
        .from("goal_transactions" as any)
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching goal transactions:", error);
        throw error;
      }

      return (data as unknown as GoalTransaction[]) || [];
    },
    enabled: !!user && !!goalId,
  });
};

export const useAddToGoal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: GoalTransactionInsert) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Create transaction record
      const { error: transError } = await supabase
        .from("goal_transactions" as any)
        .insert({
          ...transaction,
          user_id: user.id,
        });

      if (transError) throw transError;

      // Update goal current_amount
      const { data: goal, error: goalError } = await supabase
        .from("goals" as any)
        .select("current_amount, target_amount")
        .eq("id", transaction.goal_id)
        .single();

      if (goalError) throw goalError;

      const goalData = goal as unknown as { current_amount: number; target_amount: number };
      const currentAmount = Number(goalData.current_amount);
      const newAmount = transaction.type === 'deposit' 
        ? currentAmount + transaction.amount 
        : currentAmount - transaction.amount;

      // Check if goal is completed
      const isCompleted = newAmount >= Number(goalData.target_amount);

      const { error: updateError } = await supabase
        .from("goals" as any)
        .update({ 
          current_amount: Math.max(0, newAmount),
          status: isCompleted ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.goal_id);

      if (updateError) throw updateError;

      return { newAmount, isCompleted };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      queryClient.invalidateQueries({ queryKey: ["goal-transactions"] });
      
      if (variables.type === 'deposit') {
        if (result.isCompleted) {
          toast.success("🎉 Parabéns! Meta atingida!");
        } else {
          toast.success("Valor guardado com sucesso!");
        }
      } else {
        toast.success("Valor resgatado!");
      }
    },
    onError: (error) => {
      console.error("Error with goal transaction:", error);
      toast.error("Erro na operação");
    },
  });
};
