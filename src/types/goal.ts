// Tipos para Metas Financeiras (Goals)

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string | null;
  icon: string | null;
  notes: string | null;
  is_personal: boolean;
  status: 'in_progress' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface GoalInsert {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  is_personal?: boolean;
  status?: 'in_progress' | 'completed' | 'paused';
}

export interface GoalUpdate {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  is_personal?: boolean;
  status?: 'in_progress' | 'completed' | 'paused';
}

export interface GoalTransaction {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string | null;
  created_at: string;
}

export interface GoalTransactionInsert {
  goal_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description?: string | null;
}
