// Core expense types for the financial awareness app
// Prepared for n8n webhook integration

export type EmotionCategory = "essential" | "obligation" | "pleasure" | "impulse";

export type ExpenseSource = "manual" | "bank" | "photo" | "whatsapp" | "audio";

export type ExpenseStatus = "pending" | "confirmed" | "deleted";

export type ExpenseCategory = 
  | "food" 
  | "leisure" 
  | "transport" 
  | "subscriptions" 
  | "housing" 
  | "commitment" // Compromissos recorrentes
  | "other";

// Recurring Commitment (Compromisso Recorrente)
export interface RecurringCommitment {
  isRecurring: boolean;
  monthlyAmount: number;
  durationMonths: number; // How many months this commitment lasts
  startDate: Date;
  endDate: Date;
  remainingMonths: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  emotionCategory?: EmotionCategory;
  expenseCategory?: ExpenseCategory;
  wouldDoAgain?: boolean;
  source: ExpenseSource;
  status: ExpenseStatus;
  createdAt: Date;
  confirmedAt?: Date;
  establishment?: string;
  
  // Recurring commitment fields
  recurringCommitment?: RecurringCommitment;
  
  // WhatsApp integration fields
  whatsappMessageId?: string;
  photoUrl?: string;
  audioUrl?: string;
  extractedText?: string;
  
  // Bank integration fields
  bankTransactionId?: string;
  bankName?: string;
  
  // AI extraction metadata
  aiConfidence?: number;
  rawMessage?: string;
}

// Income types
export type IncomeType = "fixed" | "variable" | "initial_balance";

export type IncomeSource = "manual" | "whatsapp" | "bank";

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: IncomeType;
  source: IncomeSource;
  recurring: boolean;
  createdAt: Date;
}

// Webhook payload types for n8n integration
export interface WhatsAppWebhookPayload {
  messageId: string;
  phoneNumber: string;
  timestamp: string;
  type: "text" | "audio" | "image";
  content: {
    text?: string;
    mediaUrl?: string;
    caption?: string;
  };
  extractedData?: {
    amount?: number;
    description?: string;
    establishment?: string;
    date?: string;
    confidence: number;
  };
}

export interface BankWebhookPayload {
  transactionId: string;
  bankName: string;
  amount: number;
  description: string;
  establishment?: string;
  date: string;
  category?: string;
}

// User preferences
export interface UserPreferences {
  aiName: string;
  userChallenge?: string;
  darkMode: boolean;
  alertFrequency: "high" | "normal" | "low";
  connectedBanks: string[];
  whatsappConnected: boolean;
  onboardingCompleted: boolean;
  fixedIncome?: number;
  variableIncome?: number;
  cryptoEnabled: boolean;
}

// Alert types
export type AlertType = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  dismissible: boolean; // Critical alerts are not dismissible
}

// Filter types for History
export type PeriodFilter = "week" | "month" | "custom";
export type SourceFilter = ExpenseSource | "all";
export type EmotionFilter = EmotionCategory | "all";
export type ItemTypeFilter = "all" | "expense" | "income" | "debt" | "receivable";

// Debt types
export type DebtType = "installment" | "recurring";
export type DebtStatus = "active" | "paid";

export type DebtCategory = 
  | "credit_card"
  | "loan"
  | "financing"
  | "store"
  | "personal"
  | "other";

export interface DebtInstallment {
  number: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAt?: Date;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  totalAmount: number;
  installmentAmount: number;
  installments: number; // Total number of installments
  paidInstallments: number;
  startDate: Date;
  category: DebtCategory;
  status: DebtStatus;
  createdAt: Date;
  installmentsList?: DebtInstallment[]; // Optional detailed list
}

// Receivable types (A Receber)
export type ReceivableStatus = "pending" | "received" | "overdue";
export type ReceivablePaymentType = "single" | "installment";

export interface ReceivableInstallment {
  number: number;
  dueDate: Date;
  amount: number;
  status: ReceivableStatus;
  receivedAt?: Date;
}

export interface Receivable {
  id: string;
  personName: string;
  amount: number; // Total amount
  description?: string;
  paymentType: ReceivablePaymentType;
  // Single payment fields
  dueDate: Date;
  status: ReceivableStatus;
  // Installment fields
  installments?: number; // Total number of installments
  installmentAmount?: number; // Value per installment
  installmentsList?: ReceivableInstallment[]; // Individual installments
  receivedInstallments?: number; // Count of received installments
  // Metadata
  createdAt: Date;
  receivedAt?: Date;
}
