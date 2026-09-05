import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialData, processRecurringTransactions } from './servicos/db';
import { useAppStore } from './estado/useAppStore';
import { AppLayout } from './components/estrutura/AppLayout';
import { BioCyberLogo } from './components/estrutura/BioCyberLogo';
import { StatCards } from './components/painel/StatCards';
import { IncomeVsExpenseChart } from './components/painel/IncomeVsExpenseChart';
import { ExpensePieChart } from './components/painel/ExpensePieChart';
import { RecentTransactions } from './components/painel/RecentTransactions';
import { BudgetProgressWidget } from './components/painel/BudgetProgressWidget';
import { AiInsightsWidget } from './components/painel/AiInsightsWidget';
import { FinancialBadgesWidget } from './components/painel/FinancialBadgesWidget';
import { TransactionTable } from './components/transacoes/TransactionTable';
import { WalletCards } from './components/carteiras/WalletCards';
import { GoalCards } from './components/metas/GoalCards';
import { ReportsView } from './components/relatorios/ReportsView';
import { CalculatorView } from './components/calculadora/CalculatorView';
import { SettingsView } from './components/configuracoes/SettingsView';
import { TransactionModal } from './components/transacoes/TransactionModal';
import { WalletModal } from './components/carteiras/WalletModal';
import { GoalModal } from './components/metas/GoalModal';
import { OfxImportModal } from './components/transacoes/OfxImportModal';
import { CategoryModal } from './components/categorias/CategoryModal';
import { DebtsView } from './components/dividas/DebtsView';
import { DebtContractModal } from './components/dividas/DebtContractModal';
import { AmortizacaoModal } from './components/dividas/AmortizacaoModal';
import { AlertsModal } from './components/alertas/AlertsModal';
import { BudgetModal } from './components/orcamentos/BudgetModal';
import { ContrachequeModal } from './components/transacoes/ContrachequeModal';
import { CommandPalette } from './components/estrutura/CommandPalette';
import { TransactionParticleAnimation } from './components/estrutura/TransactionParticleAnimation';
import { HistoryDrawer } from './components/estrutura/HistoryDrawer';
import { BackupModal } from './components/configuracoes/BackupModal';
import { PantryView } from './components/despensa/PantryView';
import { AutomotiveView } from './components/veiculos/AutomotiveView';
import { CashFlowCalendarView } from './components/calendario/CashFlowCalendarView';
import { CurrencyMarketWidget } from './components/modulos/CurrencyMarketWidget';
import { VoiceCommandModal } from './components/voz/VoiceCommandModal';
import { QrCodeScannerModal } from './components/comprovantes/QrCodeScannerModal';
import { WhatIfSimulatorModal } from './components/simulador/WhatIfSimulatorModal';
import { IndependenceSimulatorModal } from './components/calculadora/IndependenceSimulatorModal';
import { ScoreModal } from './components/pontuacao/ScoreModal';
import { UserProfileModal } from './components/autenticacao/UserProfileModal';
import { AuthScreen } from './components/autenticacao/AuthScreen';
import { authService } from './servicos/authService';
import { supabase } from './servicos/supabase';
import { ThemeSelectorModal } from './components/tema/ThemeSelectorModal';
import { ReceiptGeneratorModal } from './components/comprovantes/ReceiptGeneratorModal';
import { ShortcutsModal } from './components/estrutura/ShortcutsModal';
import { PmpeConsignadoSimulatorModal } from './components/calculadora/PmpeConsignadoSimulatorModal';
import { InstallPwaModal } from './components/configuracoes/InstallPwaModal';
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
    user,
    isCheckingAuth,
    setIsCheckingAuth,
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
    isPwaModalOpen,
    setPwaModalOpen,
    isScoreModalOpen,
    setScoreModalOpen,
  } = useAppStore();

  // Sincronizar sessão OAuth do Supabase sem flicker inicial
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const suUser = await authService.syncSupabaseSession();
        if (suUser && isMounted) {
          useAppStore.getState().setUser(suUser);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão Supabase:', err);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isMounted) {
        const suUser = await authService.syncSupabaseSession();
        if (suUser && isMounted) {
          useAppStore.getState().setUser(suUser);
          setIsCheckingAuth(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setIsCheckingAuth]);

  // Seeding e sincronização de saldos baseado no usuário ativo
  useEffect(() => {
    seedInitialData(user).then(async () => {
      processRecurringTransactions();
      // Sincronizar o saldo da carteira principal com as transações reais acumuladas
      const allWallets = await db.wallets.toArray();
      const allTxs = await db.transactions.toArray();
      if (allWallets.length > 0 && allTxs.length > 0) {
        const w1 = allWallets.find((w) => w.id === 'w1') || allWallets[0];
        const calcIncome = allTxs.filter((t) => t.type === 'income' && (t.walletId === w1.id || !t.walletId)).reduce((acc, t) => acc + t.amount, 0);
        const calcExpense = allTxs.filter((t) => t.type === 'expense' && new Date(t.date) <= new Date() && (t.walletId === w1.id || !t.walletId)).reduce((acc, t) => acc + t.amount, 0);
        const realCalcBalance = calcIncome - calcExpense;
        if (Math.abs(w1.balance - realCalcBalance) > 0.01) {
          await db.wallets.update(w1.id, { balance: realCalcBalance });
        }
      }
    });
  }, [user?.id, user?.role]);

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
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  // Total Balances & Debt Calculations (Passivos Imediatos: Cartões + Parcela do Mês)
  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance > 0 ? w.balance : 0), 0);
  
  const walletDebts = wallets.reduce((acc, w) => acc + (w.balance < 0 ? Math.abs(w.balance) : 0), 0);
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7);
  
  const currentMonthContractDebt = transactions
    .filter((t) => t.contractId && t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebt = walletDebts + currentMonthContractDebt;

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#05070E] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4 z-10"
        >
          <BioCyberLogo size="lg" />
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl mt-2">
            <div className="w-3.5 h-3.5 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase">
              Verificando Sessão Segura...
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="auth-screen-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            filter: 'blur(10px)',
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          }}
          className="w-full min-h-screen"
        >
          <AuthScreen />
        </motion.div>
      ) : (
        <motion.div
          key={`app-layout-${user.id || 'guest'}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.4, ease: 'easeOut' },
          }}
          className="w-full min-h-screen"
        >
          <AppLayout>
            {user.role === 'guest' && (
              <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-slate-900/40 border border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs mb-5 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-amber-300 font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    <strong>Modo Convidado (Demonstração):</strong> Você está explorando dados fictícios em ambiente de teste isolado. Recursos em nuvem e backups são restritos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    useAppStore.getState().setUser(null);
                    useAppStore.getState().setAuthMode('register');
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  Criar Conta Gratuita
                </button>
              </div>
            )}
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
              {/* 1. Deck Central de Métricas de Saldos & Fluxos */}
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

              {/* 2. Análise Visual Gráfica (Entradas vs Saídas & Distribuição por Categoria) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncomeVsExpenseChart transactions={transactions} data={sixMonthsData} />
                <ExpensePieChart transactions={transactions} selectedMonth={selectedMonth} data={pieChartData} />
              </div>

              {/* 3. Telemetria de IA & Tetos de Orçamento por Categoria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AiInsightsWidget selectedMonth={selectedMonth} />
                <BudgetProgressWidget selectedMonth={selectedMonth} />
              </div>

              {/* 4. Badges de Conquistas & Indicadores de Mercado Financeiro */}
              <FinancialBadgesWidget />

              <CurrencyMarketWidget />
            </>
          )}

          {activePage === 'transactions' && (
            <TransactionTable
              transactions={transactions}
              selectedMonth={selectedMonth}
              onDelete={handleDeleteTransaction}
            />
          )}

          {activePage === 'calendar' && <CashFlowCalendarView />}

          {activePage === 'wallets' && <WalletCards wallets={wallets} />}

          {activePage === 'debts' && <DebtsView />}

          {activePage === 'goals' && <GoalCards goals={goals} />}

          {activePage === 'pantry' && <PantryView />}

          {activePage === 'vehicles' && <AutomotiveView />}

          {activePage === 'reports' && <ReportsView transactions={transactions} goals={goals} />}

          {activePage === 'calculator' && <CalculatorView />}

          {activePage === 'settings' && <SettingsView />}
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
      <InstallPwaModal isOpen={isPwaModalOpen} onClose={() => setPwaModalOpen(false)} />
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
      <ScoreModal isOpen={isScoreModalOpen} onClose={() => setScoreModalOpen(false)} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <UserProfileModal />
    </AppLayout>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
