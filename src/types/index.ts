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

export type VehicleRecordType = 'refuel' | 'maintenance' | 'tax' | 'insurance';
export type ComponentCategory = 'oil' | 'timing_belt' | 'tires' | 'brakes' | 'spark_plugs' | 'filters' | 'coolant' | 'battery' | 'general';

export interface VehicleRecord {
  id: string;
  vehicleName: string; // Ex: 'Chevrolet Onix 1.0 LT 2017/2018'
  type: VehicleRecordType;
  componentCategory?: ComponentCategory;
  date: string; // YYYY-MM-DD
  odometerKm: number; // Quilometragem atual
  totalCost: number; // Valor em R$
  liters?: number; // Para abastecimentos
  pricePerLiter?: number; // Preço do litro
  fuelType?: 'gasoline' | 'ethanol' | 'diesel' | 'gnv';
  description?: string; // Ex: 'Troca de Óleo ACDelco 5W30', 'IPVA 2026'
  partNumber?: string; // Código/Modelo da peça (ex: ACDelco 88905845 / NGK BR7ES-D)
  nextDueKm?: number; // Próxima troca em KM (ex: 55400 KM)
  nextDueDate?: string; // Próxima data de revisão (ex: 2027-08-15)
  walletId?: string; // Carteira usada para o pagamento
  createdAt: string;
}

