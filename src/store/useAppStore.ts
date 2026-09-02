import { create } from 'zustand';
import { UserProfile } from '../types';
import { authService } from '../services/authService';

export type PageType = 'dashboard' | 'transactions' | 'wallets' | 'debts' | 'goals' | 'pantry' | 'vehicles' | 'reports' | 'calculator' | 'calendar' | 'settings';

interface AppStore {
  // Auth & User State
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register' | 'forgot';
  setAuthMode: (mode: 'login' | 'register' | 'forgot') => void;
  isUserProfileModalOpen: boolean;
  setUserProfileModalOpen: (open: boolean) => void;

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
  isContrachequeModalOpen: boolean;
  setContrachequeModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isBackupModalOpen: boolean;
  setBackupModalOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setVoiceModalOpen: (open: boolean) => void;
  isQrCodeModalOpen: boolean;
  setQrCodeModalOpen: (open: boolean) => void;
  isWhatIfModalOpen: boolean;
  setWhatIfModalOpen: (open: boolean) => void;
  isFireModalOpen: boolean;
  setFireModalOpen: (open: boolean) => void;
  isThemeModalOpen: boolean;
  setThemeModalOpen: (open: boolean) => void;
  isReceiptModalOpen: boolean;
  setReceiptModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setShortcutsModalOpen: (open: boolean) => void;
  isPmpeConsignadoModalOpen: boolean;
  setPmpeConsignadoModalOpen: (open: boolean) => void;
  isPwaModalOpen: boolean;
  setPwaModalOpen: (open: boolean) => void;
  isScoreModalOpen: boolean;
  setScoreModalOpen: (open: boolean) => void;

  // Privacy & Layout
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isHistoryDrawerOpen: boolean;
  setHistoryDrawerOpen: (open: boolean) => void;
  toggleHistoryDrawer: () => void;

  // Editing targets
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  editingDebtContractId: string | null;
  setEditingDebtContractId: (id: string | null) => void;
  editingWalletId: string | null;
  setEditingWalletId: (id: string | null) => void;
  editingGoalId: string | null;
  setEditingGoalId: (id: string | null) => void;

  // Particle Coin Animations
  activeParticleAnimation: {
    id: string;
    type: 'income' | 'expense';
    amount?: number;
    title?: string;
  } | null;
  triggerTransactionAnimation: (type: 'income' | 'expense', amount?: number, title?: string) => void;
}

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useAppStore = create<AppStore>((set) => ({
  user: authService.getCurrentUser(),
  setUser: (user) => set({ user }),
  isAuthModalOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  authMode: 'login',
  setAuthMode: (mode) => set({ authMode: mode }),
  isUserProfileModalOpen: false,
  setUserProfileModalOpen: (open) => set({ isUserProfileModalOpen: open }),

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
  isContrachequeModalOpen: false,
  setContrachequeModalOpen: (open) => set({ isContrachequeModalOpen: open }),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isBackupModalOpen: false,
  setBackupModalOpen: (open) => set({ isBackupModalOpen: open }),
  isVoiceModalOpen: false,
  setVoiceModalOpen: (open) => set({ isVoiceModalOpen: open }),
  isQrCodeModalOpen: false,
  setQrCodeModalOpen: (open) => set({ isQrCodeModalOpen: open }),
  isWhatIfModalOpen: false,
  setWhatIfModalOpen: (open) => set({ isWhatIfModalOpen: open }),
  isFireModalOpen: false,
  setFireModalOpen: (open) => set({ isFireModalOpen: open }),
  isThemeModalOpen: false,
  setThemeModalOpen: (open) => set({ isThemeModalOpen: open }),
  isReceiptModalOpen: false,
  setReceiptModalOpen: (open) => set({ isReceiptModalOpen: open }),
  isShortcutsModalOpen: false,
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
  isPmpeConsignadoModalOpen: false,
  setPmpeConsignadoModalOpen: (open) => set({ isPmpeConsignadoModalOpen: open }),
  isPwaModalOpen: false,
  setPwaModalOpen: (open) => set({ isPwaModalOpen: open }),
  isScoreModalOpen: false,
  setScoreModalOpen: (open) => set({ isScoreModalOpen: open }),

  isPrivacyMode: false,
  togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
  isSidebarCollapsed: false,
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  isHistoryDrawerOpen: false,
  setHistoryDrawerOpen: (open) => set({ isHistoryDrawerOpen: open }),
  toggleHistoryDrawer: () => set((state) => ({ isHistoryDrawerOpen: !state.isHistoryDrawerOpen })),

  editingTransactionId: null,
  setEditingTransactionId: (id) => set({ editingTransactionId: id }),
  editingDebtContractId: null,
  setEditingDebtContractId: (id) => set({ editingDebtContractId: id }),
  editingWalletId: null,
  setEditingWalletId: (id) => set({ editingWalletId: id }),
  editingGoalId: null,
  setEditingGoalId: (id) => set({ editingGoalId: id }),

  activeParticleAnimation: null,
  triggerTransactionAnimation: (type, amount, title) => {
    const id = `anim_${Date.now()}`;
    set({ activeParticleAnimation: { id, type, amount, title } });
    setTimeout(() => {
      set({ activeParticleAnimation: null });
    }, 2800);
  },
}));
