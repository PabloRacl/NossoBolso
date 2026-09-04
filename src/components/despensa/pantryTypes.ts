import { PantryItem } from '../../types';

export type PantryTab = 'stock' | 'wizard' | 'shopping';
export type PriceCalculationMode = 'unit' | 'combo' | 'discount';

export interface ShoppingSummary {
  totalSpent: number;
  discountNum: number;
  netTotalSpent: number;
  checkedCount: number;
  totalNeeded: number;
  capNum: number;
  isOverBudget: boolean;
  budgetPct: number;
  remainingBudget: number;
}
