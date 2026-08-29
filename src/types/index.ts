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
  interestRate?: number; // Taxa de juros
  interestRateType?: 'monthly' | 'yearly';
  amortizationSystem?: 'price' | 'sac';
  insuranceAmount?: number; // Seguro / taxas embutidas por parcela
  startInstallmentNum?: number; // Parcela inicial para contratos em andamento
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

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  walletId: string;
  dayOfMonth: number; // 1 a 31
  lastGeneratedMonth?: string; // YYYY-MM
}

export interface PantryItem {
  id: string;
  name: string;
  category: string; // Ex: 'Alimentos', 'Laticínios', 'Higiene', 'Limpeza', 'Bebidas'
  unit: string; // 'un', 'kg', 'L', 'cx', 'pct'
  idealQuantity: number; // Quantidade alvo (ex: 12)
  currentQuantity: number; // Quantidade em estoque (ex: 2)
  lastPrice: number; // Último preço unitário pago (ex: 5.50)
  createdAt: string;
  updatedAt?: string;
}

