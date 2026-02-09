// Bank Account types for the Saldin financial app

export type BankAccountType = "checking" | "savings" | "payment";

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  bank_key?: string | null;
  account_type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  color?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type BankAccountInsert = Omit<BankAccount, "id" | "created_at" | "updated_at" | "user_id"> & {
  user_id?: string;
};

export type BankAccountUpdate = Partial<Omit<BankAccount, "id" | "user_id" | "created_at">>;

export interface BankTransfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string | null;
  date: string;
  created_at: string;
}

export type BankTransferInsert = Omit<BankTransfer, "id" | "created_at" | "user_id"> & {
  user_id?: string;
};

// Labels for account types
export const accountTypeLabels: Record<BankAccountType, string> = {
  checking: "Corrente",
  savings: "Poupança",
  payment: "Pagamento",
};

export const accountTypeOptions: { value: BankAccountType; label: string }[] = [
  { value: "checking", label: "Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "payment", label: "Pagamento" },
];
