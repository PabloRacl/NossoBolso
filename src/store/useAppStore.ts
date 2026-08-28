import { create } from 'zustand';

export type PageType = 'dashboard' | 'transactions' | 'wallets' | 'debts' | 'goals' | 'reports' | 'calculator';

interface AppStore {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modals
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;
  isWalletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
  isGoalModalOpen: boolean;
  setGoalModalOpen: (open: boolean) => void;
  isOfxModalOpen: boolean;
  setOfxModalOpen: (open: boolean) => void;
  isCategoryModalOpen: boolean;
  setCategoryModalOpen: (open: boolean) => void;
  isDebtContractModalOpen: boolean;
  setDebtContractModalOpen: (open: boolean) => void;
  isAmortizacaoModalOpen: boolean;
  setAmortizacaoModalOpen: (open: boolean) => void;
  amortizacaoContractId: string | null;
  setAmortizacaoContractId: (id: string | null) => void;
  isAlertsModalOpen: boolean;
  setAlertsModalOpen: (open: boolean) => void;
  isBudgetModalOpen: boolean;
  setBudgetModalOpen: (open: boolean) => void;
  isRecurringModalOpen: boolean;
  setRecurringModalOpen: (open: boolean) => void;

  // Privacy Mode
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;

  // Editing targets
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  editingDebtContractId: string | null;
  setEditingDebtContractId: (id: string | null) => void;
}

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useAppStore = create<AppStore>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  selectedMonth: getCurrentMonthKey(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isTransactionModalOpen: false,
  setTransactionModalOpen: (open) => set({ isTransactionModalOpen: open }),
  isWalletModalOpen: false,
  setWalletModalOpen: (open) => set({ isWalletModalOpen: open }),
  isGoalModalOpen: false,
  setGoalModalOpen: (open) => set({ isGoalModalOpen: open }),
  isOfxModalOpen: false,
  setOfxModalOpen: (open) => set({ isOfxModalOpen: open }),
  isCategoryModalOpen: false,
  setCategoryModalOpen: (open) => set({ isCategoryModalOpen: open }),
  isDebtContractModalOpen: false,
  setDebtContractModalOpen: (open) => set({ isDebtContractModalOpen: open }),
  isAmortizacaoModalOpen: false,
  setAmortizacaoModalOpen: (open) => set({ isAmortizacaoModalOpen: open }),
  amortizacaoContractId: null,
  setAmortizacaoContractId: (id) => set({ amortizacaoContractId: id }),
  isAlertsModalOpen: false,
  setAlertsModalOpen: (open) => set({ isAlertsModalOpen: open }),
  isBudgetModalOpen: false,
  setBudgetModalOpen: (open) => set({ isBudgetModalOpen: open }),
  isRecurringModalOpen: false,
  setRecurringModalOpen: (open) => set({ isRecurringModalOpen: open }),

  isPrivacyMode: false,
  togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

  editingTransactionId: null,
  setEditingTransactionId: (id) => set({ editingTransactionId: id }),
  editingDebtContractId: null,
  setEditingDebtContractId: (id) => set({ editingDebtContractId: id }),
}));
