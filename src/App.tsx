import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialData, processRecurringTransactions } from './services/db';
import { useAppStore } from './store/useAppStore';
import { AppLayout } from './components/layout/AppLayout';
import { StatCards } from './components/dashboard/StatCards';
import { IncomeVsExpenseChart } from './components/dashboard/IncomeVsExpenseChart';
import { ExpensePieChart } from './components/dashboard/ExpensePieChart';
import { RecentTransactions } from './components/dashboard/RecentTransactions';
import { BudgetProgressWidget } from './components/dashboard/BudgetProgressWidget';
import { AiInsightsWidget } from './components/dashboard/AiInsightsWidget';
import { FinancialBadgesWidget } from './components/dashboard/FinancialBadgesWidget';
import { TransactionTable } from './components/transactions/TransactionTable';
import { WalletCards } from './components/wallets/WalletCards';
import { GoalCards } from './components/goals/GoalCards';
import { ReportsView } from './components/reports/ReportsView';
import { CalculatorView } from './components/calculator/CalculatorView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { WalletModal } from './components/wallets/WalletModal';
import { GoalModal } from './components/goals/GoalModal';
import { OfxImportModal } from './components/transactions/OfxImportModal';
import { CategoryModal } from './components/categories/CategoryModal';
import { DebtsView } from './components/debts/DebtsView';
import { DebtContractModal } from './components/debts/DebtContractModal';
import { AmortizacaoModal } from './components/debts/AmortizacaoModal';
import { AlertsModal } from './components/alerts/AlertsModal';
import { BudgetModal } from './components/budgets/BudgetModal';
import { ContrachequeModal } from './components/transactions/ContrachequeModal';
import { CommandPalette } from './components/layout/CommandPalette';
import { TransactionParticleAnimation } from './components/layout/TransactionParticleAnimation';
import { HistoryDrawer } from './components/layout/HistoryDrawer';
import { BackupModal } from './components/backup/BackupModal';
import { PantryView } from './components/pantry/PantryView';
import { AutomotiveView } from './components/vehicles/AutomotiveView';
import { CashFlowCalendarView } from './components/calendar/CashFlowCalendarView';
import { CurrencyMarketWidget } from './components/widgets/CurrencyMarketWidget';
import { VoiceCommandModal } from './components/voice/VoiceCommandModal';
import { QrCodeScannerModal } from './components/scanner/QrCodeScannerModal';
import { WhatIfSimulatorModal } from './components/simulator/WhatIfSimulatorModal';
import { IndependenceSimulatorModal } from './components/calculator/IndependenceSimulatorModal';
import { FinancialHealthScoreWidget } from './components/dashboard/FinancialHealthScoreWidget';
import { ThemeSelectorModal } from './components/theme/ThemeSelectorModal';
import { ReceiptGeneratorModal } from './components/receipts/ReceiptGeneratorModal';
import { ShortcutsModal } from './components/layout/ShortcutsModal';
import { PmpeConsignadoSimulatorModal } from './components/calculator/PmpeConsignadoSimulatorModal';
import { motion, AnimatePresence } from 'framer-motion';

const pageTransitionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

export const App: React.FC = () => {
  const {
    activePage,
    selectedMonth,
    setSelectedMonth,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isVoiceModalOpen,
    setVoiceModalOpen,
    isQrCodeModalOpen,
    setQrCodeModalOpen,
    isWhatIfModalOpen,
    setWhatIfModalOpen,
    isFireModalOpen,
    setFireModalOpen,
    isThemeModalOpen,
    setThemeModalOpen,
    isReceiptModalOpen,
    setReceiptModalOpen,
    isShortcutsModalOpen,
    setShortcutsModalOpen,
    isPmpeConsignadoModalOpen,
    setPmpeConsignadoModalOpen,
  } = useAppStore();

  useEffect(() => {
    seedInitialData().then(() => {
      processRecurringTransactions();
    });
  }, []);

  // Ouvinte global de teclas de atalho inteligentes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input ou textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!useAppStore.getState().isCommandPaletteOpen);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsModalOpen(!useAppStore.getState().isShortcutsModalOpen);
        return;
      }

      if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        const store = useAppStore.getState();

        if (k === 'm') {
          e.preventDefault();
          store.setVoiceModalOpen(!store.isVoiceModalOpen);
        } else if (k === 'q') {
          e.preventDefault();
          store.setQrCodeModalOpen(!store.isQrCodeModalOpen);
        } else if (k === 'e') {
          e.preventDefault();
          store.setWhatIfModalOpen(!store.isWhatIfModalOpen);
        } else if (k === 'h') {
          e.preventDefault();
          store.toggleHistoryDrawer();
        } else if (k === 'b') {
          e.preventDefault();
          store.setBackupModalOpen(!store.isBackupModalOpen);
        } else if (k === 't') {
          e.preventDefault();
          store.setThemeModalOpen(!store.isThemeModalOpen);
        } else if (k === 'r') {
          e.preventDefault();
          store.setReceiptModalOpen(!store.isReceiptModalOpen);
        } else if (k === 'p') {
          e.preventDefault();
          store.togglePrivacyMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen, setShortcutsModalOpen]);

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];

  // Auto-switch selectedMonth if current selected month has no transactions but other transactions exist
  useEffect(() => {
    if (transactions.length > 0 && selectedMonth !== 'all') {
      const hasTxInSelected = transactions.some((t) => t.date.startsWith(selectedMonth));
      if (!hasTxInSelected) {
        const latestTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0];
        if (latestTx && latestTx.date) {
          setSelectedMonth(latestTx.date.substring(0, 7));
        }
      }
    }
  }, [transactions, selectedMonth, setSelectedMonth]);

  // Total Balances & Debt Calculations
  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance > 0 ? w.balance : 0), 0);
  
  // Total Debt = Negative wallet balances (credit card balance used) + Expenses in Debt categories
  const walletDebts = wallets.reduce((acc, w) => acc + (w.balance < 0 ? Math.abs(w.balance) : 0), 0);
  const debtTxTotal = transactions
    .filter((t) => t.type === 'expense' && (t.category.toLowerCase().includes('dívida') || t.category.toLowerCase().includes('fatura') || t.category.toLowerCase().includes('empréstimo')))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDebt = walletDebts + debtTxTotal;

  // Historic Totals (All Time)
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  // Period Calculations (based on selectedMonth)
  const periodTxs = selectedMonth === 'all'
    ? transactions
    : transactions.filter((t) => t.date.startsWith(selectedMonth));

  const periodIncome = periodTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const periodExpense = periodTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const incomeCount = periodTxs.filter((t) => t.type === 'income').length;
  const expenseCount = periodTxs.filter((t) => t.type === 'expense').length;

  // Period Label Formatting
  const getPeriodLabel = () => {
    if (selectedMonth === 'all') return 'Acumulado Geral (Todos os Períodos)';
    const [y, m] = selectedMonth.split('-');
    if (!y || !m) return selectedMonth;
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  const periodLabel = getPeriodLabel();

  // Category Breakdown for Pie Chart
  const categoryTotals: Record<string, number> = {};
  periodTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // Historical Data for Bar Chart (Dynamic last 6 months or transaction months)
  const availableMonthKeys = Array.from(new Set(transactions.map((t) => t.date.substring(0, 7)))).sort();
  const last6Months = availableMonthKeys.length > 0 
    ? availableMonthKeys.slice(-6)
    : Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toISOString().substring(0, 7);
      });

  const sixMonthsData = last6Months.map((mKey) => {
    const [y, m] = mKey.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' });

    const monthTxs = transactions.filter((t) => t.date.startsWith(mKey));
    const inc = monthTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = monthTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return {
      month: monthName,
      income: inc,
      expense: exp,
    };
  });

  const handleDeleteTransaction = async (id: string) => {
    const tx = await db.transactions.get(id);
    if (tx && tx.walletId) {
      const wallet = await db.wallets.get(tx.walletId);
      if (wallet) {
        const revertDelta = tx.type === 'income' ? -tx.amount : tx.amount;
        await db.wallets.update(tx.walletId, { balance: wallet.balance + revertDelta });
      }
    }
    await db.transactions.delete(id);
  };

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={pageTransitionVariants}
          className="w-full flex flex-col gap-6"
        >
          {activePage === 'dashboard' && (
            <>
              <StatCards
                totalBalance={totalBalance}
                totalDebt={totalDebt}
                periodIncome={periodIncome}
                periodExpense={periodExpense}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                periodLabel={periodLabel}
                incomeCount={incomeCount}
                expenseCount={expenseCount}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AiInsightsWidget selectedMonth={selectedMonth} />
                <BudgetProgressWidget selectedMonth={selectedMonth} />
              </div>

              <FinancialHealthScoreWidget />

              <FinancialBadgesWidget />

              <CurrencyMarketWidget />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncomeVsExpenseChart transactions={transactions} data={sixMonthsData} />
                <ExpensePieChart transactions={transactions} selectedMonth={selectedMonth} data={pieChartData} />
              </div>
            </>
          )}

          {activePage === 'transactions' && (
            <TransactionTable transactions={transactions} onDelete={handleDeleteTransaction} />
          )}

          {activePage === 'calendar' && <CashFlowCalendarView />}

          {activePage === 'wallets' && <WalletCards wallets={wallets} />}

          {activePage === 'debts' && <DebtsView />}

          {activePage === 'goals' && <GoalCards goals={goals} />}

          {activePage === 'pantry' && <PantryView />}

          {activePage === 'vehicles' && <AutomotiveView />}

          {activePage === 'reports' && <ReportsView transactions={transactions} goals={goals} />}

          {activePage === 'calculator' && <CalculatorView />}
        </motion.div>
      </AnimatePresence>

      {/* Global Modals & Side Drawers */}
      <HistoryDrawer />
      <BackupModal />
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
      <ThemeSelectorModal isOpen={isThemeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <ReceiptGeneratorModal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} />
      <VoiceCommandModal isOpen={isVoiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
      <QrCodeScannerModal isOpen={isQrCodeModalOpen} onClose={() => setQrCodeModalOpen(false)} />
      <WhatIfSimulatorModal isOpen={isWhatIfModalOpen} onClose={() => setWhatIfModalOpen(false)} />
      <IndependenceSimulatorModal isOpen={isFireModalOpen} onClose={() => setFireModalOpen(false)} />
      <PmpeConsignadoSimulatorModal isOpen={isPmpeConsignadoModalOpen} onClose={() => setPmpeConsignadoModalOpen(false)} />
      <TransactionParticleAnimation />
      <TransactionModal />
      <WalletModal />
      <GoalModal />
      <OfxImportModal />
      <CategoryModal />
      <DebtContractModal />
      <AmortizacaoModal />
      <AlertsModal />
      <BudgetModal />
      <ContrachequeModal />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </AppLayout>
  );
};
