// Tipos para o módulo de Cartão de Crédito

export interface CreditCard {
  id: string;
  user_id: string;
  card_name: string;
  card_brand: string | null;
  last_four_digits: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCardInsert {
  card_name: string;
  card_brand?: string | null;
  last_four_digits?: string | null;
  credit_limit?: number;
  closing_day: number;
  due_day: number;
  color?: string;
  active?: boolean;
}

export interface CreditCardPurchase {
  id: string;
  user_id: string;
  card_id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  category_id: string | null;
  purchase_date: string;
  created_at: string;
}

export interface CreditCardPurchaseInsert {
  card_id: string;
  description: string;
  total_amount: number;
  total_installments?: number;
  category_id?: string | null;
  purchase_date?: string;
}

export type InstallmentStatus = "open" | "paid";

export interface CreditCardInstallment {
  id: string;
  purchase_id: string;
  user_id: string;
  installment_number: number;
  amount: number;
  reference_month: string;
  status: InstallmentStatus;
  paid_at: string | null;
  created_at: string;
}

export type StatementStatus = "open" | "closed" | "paid";

export interface CreditCardStatement {
  id: string;
  card_id: string;
  user_id: string;
  reference_month: string;
  total_amount: number;
  status: StatementStatus;
  paid_at: string | null;
  created_at: string;
}

// Tipos compostos para UI
export interface CreditCardWithStatement extends CreditCard {
  currentStatement?: CreditCardStatement;
  usedLimit?: number;
}

export interface PurchaseWithCard extends CreditCardPurchase {
  card?: CreditCard;
  category?: { name: string; icon: string } | null;
}

export interface InstallmentWithPurchase extends CreditCardInstallment {
  purchase?: CreditCardPurchase;
  card?: CreditCard;
}
