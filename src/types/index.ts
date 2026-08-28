export type TransactionType = 'income' | 'expense';

export type RecurrenceFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurrenceEndType = 'indefinite' | 'count' | 'until_date';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  endType: RecurrenceEndType;
  count?: number;
  untilDate?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  type: TransactionType;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  color: string;
  icon: string;
  creditLimit?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  walletId: string;
  isRecurring?: boolean;
  recurrence?: RecurrenceConfig;
  contractId?: string; // Link to long term financing contract
  installments?: {
    current: number;
    total: number;
  };
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface DebtContract {
  id: string;
  title: string;
  totalInstallments: number;
  installmentAmount: number;
  totalAmount: number;
  interestRate?: number; // Taxa de juros mensal (ex: 1.5 = 1.5% ao mês)
  startDate: string; // YYYY-MM-DD
  category: string;
  walletId: string;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color?: string;
  createdAt: string;
}

export interface OFXTransaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  suggestedCategory: string;
}
