export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["bank_account_type"] | null
          active: boolean | null
          bank_key: string | null
          bank_name: string
          color: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["bank_account_type"] | null
          active?: boolean | null
          bank_key?: string | null
          bank_name: string
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["bank_account_type"] | null
          active?: boolean | null
          bank_key?: string | null
          bank_name?: string
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          description: string | null
          from_account_id: string
          id: string
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          description?: string | null
          from_account_id: string
          id?: string
          to_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          description?: string | null
          from_account_id?: string
          id?: string
          to_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          allow_card: boolean | null
          allow_expense: boolean | null
          allow_import: boolean | null
          allow_subscription: boolean | null
          color: string | null
          created_at: string
          group_name: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          nature: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          allow_card?: boolean | null
          allow_expense?: boolean | null
          allow_import?: boolean | null
          allow_subscription?: boolean | null
          color?: string | null
          created_at?: string
          group_name?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          nature?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          allow_card?: boolean | null
          allow_expense?: boolean | null
          allow_import?: boolean | null
          allow_subscription?: boolean | null
          color?: string | null
          created_at?: string
          group_name?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          nature?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_card_installments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          installment_number: number
          paid_at: string | null
          purchase_id: string
          reference_month: string
          status: Database["public"]["Enums"]["installment_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          installment_number: number
          paid_at?: string | null
          purchase_id: string
          reference_month: string
          status?: Database["public"]["Enums"]["installment_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          installment_number?: number
          paid_at?: string | null
          purchase_id?: string
          reference_month?: string
          status?: Database["public"]["Enums"]["installment_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_installments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "credit_card_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_purchases: {
        Row: {
          card_id: string
          category_id: string | null
          created_at: string | null
          description: string
          id: string
          purchase_date: string
          total_amount: number
          total_installments: number
          user_id: string
        }
        Insert: {
          card_id: string
          category_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          purchase_date?: string
          total_amount: number
          total_installments?: number
          user_id: string
        }
        Update: {
          card_id?: string
          category_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          purchase_date?: string
          total_amount?: number
          total_installments?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_purchases_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_statements: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          paid_at: string | null
          reference_month: string
          status: Database["public"]["Enums"]["statement_status"] | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["statement_status"] | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["statement_status"] | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_statements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          active: boolean | null
          card_brand: string | null
          card_name: string
          closing_day: number
          color: string | null
          created_at: string | null
          credit_limit: number | null
          due_day: number
          id: string
          last_four_digits: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          card_brand?: string | null
          card_name: string
          closing_day: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_day: number
          id?: string
          last_four_digits?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          card_brand?: string | null
          card_name?: string
          closing_day?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_day?: number
          id?: string
          last_four_digits?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_transactions: {
        Row: {
          bank_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          price_at_time: number | null
          quantity: number
          total_value: number | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_at_time?: number | null
          quantity: number
          total_value?: number | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_at_time?: number | null
          quantity?: number
          total_value?: number | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crypto_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "crypto_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_wallets: {
        Row: {
          active: boolean
          created_at: string
          crypto_id: string
          display_currency: string
          id: string
          last_price: number | null
          last_price_updated_at: string | null
          name: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          crypto_id: string
          display_currency?: string
          id?: string
          last_price?: number | null
          last_price_updated_at?: string | null
          name: string
          quantity?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          crypto_id?: string
          display_currency?: string
          id?: string
          last_price?: number | null
          last_price_updated_at?: string | null
          name?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          creditor_name: string
          current_installment: number | null
          description: string | null
          due_date: string | null
          id: string
          installment_amount: number | null
          is_installment: boolean
          notes: string | null
          paid_amount: number
          status: Database["public"]["Enums"]["debt_status"]
          total_amount: number
          total_installments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor_name: string
          current_installment?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount: number
          total_installments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creditor_name?: string
          current_installment?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount?: number
          total_installments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          emotion: Database["public"]["Enums"]["expense_emotion"] | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_installment: boolean
          notes: string | null
          source: Database["public"]["Enums"]["expense_source"]
          status: Database["public"]["Enums"]["expense_status"]
          total_installments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          emotion?: Database["public"]["Enums"]["expense_emotion"] | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          notes?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          status?: Database["public"]["Enums"]["expense_status"]
          total_installments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          emotion?: Database["public"]["Enums"]["expense_emotion"] | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          notes?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          status?: Database["public"]["Enums"]["expense_status"]
          total_installments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          goal_id: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          goal_id: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number
          icon: string | null
          id: string
          is_personal: boolean
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          icon?: string | null
          id?: string
          is_personal?: boolean
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          icon?: string | null
          id?: string
          is_personal?: boolean
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          type: Database["public"]["Enums"]["income_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_name: string | null
          avatar_url: string | null
          created_at: string
          crypto_enabled: boolean
          dark_mode: boolean
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_name?: string | null
          avatar_url?: string | null
          created_at?: string
          crypto_enabled?: boolean
          dark_mode?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_name?: string | null
          avatar_url?: string | null
          created_at?: string
          crypto_enabled?: boolean
          dark_mode?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          debtor_name: string
          description: string | null
          due_date: string | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_installment: boolean | null
          notes: string | null
          received_at: string | null
          source_account_id: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          total_installments: number | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          debtor_name: string
          description?: string | null
          due_date?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean | null
          notes?: string | null
          received_at?: string | null
          source_account_id?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          total_installments?: number | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          debtor_name?: string
          description?: string | null
          due_date?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean | null
          notes?: string | null
          received_at?: string | null
          source_account_id?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          total_installments?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean
          amount: number
          bank_account_id: string | null
          billing_date: number
          card_id: string | null
          category_id: string | null
          created_at: string
          custom_frequency_days: number | null
          frequency: string
          id: string
          last_generated_date: string | null
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          bank_account_id?: string | null
          billing_date: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          custom_frequency_days?: number | null
          frequency?: string
          id?: string
          last_generated_date?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          bank_account_id?: string | null
          billing_date?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          custom_frequency_days?: number | null
          frequency?: string
          id?: string
          last_generated_date?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_expenses_stats: {
        Args: { month_input: number; year_input: number }
        Returns: {
          count: number
          impulse_percentage: number
          impulse_total: number
          total: number
        }[]
      }
    }
    Enums: {
      bank_account_type: "checking" | "savings" | "payment" | "cash"
      debt_status: "active" | "paid" | "cancelled"
      expense_emotion: "pilar" | "essencial" | "impulso"
      expense_source: "manual" | "whatsapp" | "integration"
      expense_status: "pending" | "confirmed" | "deleted"
      goal_status: "in_progress" | "completed" | "paused"
      income_type:
      | "salary"
      | "freelance"
      | "investment"
      | "gift"
      | "other"
      | "initial_balance"
      installment_status: "open" | "paid"
      receivable_status: "pending" | "received" | "cancelled"
      statement_status: "open" | "closed" | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      bank_account_type: ["checking", "savings", "payment", "cash"],
      debt_status: ["active", "paid", "cancelled"],
      expense_emotion: ["pilar", "essencial", "impulso"],
      expense_source: ["manual", "whatsapp", "integration"],
      expense_status: ["pending", "confirmed", "deleted"],
      goal_status: ["in_progress", "completed", "paused"],
      income_type: [
        "salary",
        "freelance",
        "investment",
        "gift",
        "other",
        "initial_balance",
      ],
      installment_status: ["open", "paid"],
      receivable_status: ["pending", "received", "cancelled"],
      statement_status: ["open", "closed", "paid"],
    },
  },
} as const
