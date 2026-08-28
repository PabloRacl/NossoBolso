import React, { useMemo } from 'react';
import { useAppStore, getCurrentMonthKey } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Plus, Upload, Calendar, Tag, ChevronLeft, ChevronRight, Sparkles, Eye, EyeOff, Bell, Target } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';

export const Topbar: React.FC = () => {
  const {
    activePage,
    setTransactionModalOpen,
    setOfxModalOpen,
    selectedMonth,
    setSelectedMonth,
    isPrivacyMode,
    togglePrivacyMode,
    setAlertsModalOpen,
    setBudgetModalOpen,
  } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const currentMonthKey = getCurrentMonthKey();

  // Quantidade de contas vencendo nos próximos 7 dias para o badge do Sino
  const upcomingAlertCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate >= today && txDate <= nextWeek;
    }).length;
  }, [transactions]);

  // Generate available months list from database transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions, currentMonthKey]);

  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonthKey);
      return;
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const prevKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevKey);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonthKey);
      return;
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const nextKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextKey);
  };

  const formatMonthLabel = (key: string) => {
    if (key === 'all') return '🌐 Todos os Períodos (Acumulado Total)';
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Visão geral das suas finanças, patrimônio e despesas' },
    transactions: { title: 'Transações', subtitle: 'Histórico completo de entradas, saídas e dívidas' },
    wallets: { title: 'Carteiras & Cartões', subtitle: 'Gerencie suas contas bancárias, cartões e dívidas' },
    debts: { title: 'Financiamentos & Dívidas', subtitle: 'Gestão de contratos parcelados de longo prazo (Veículos, Empréstimos, Imóveis)' },
    goals: { title: 'Metas Financeiras', subtitle: 'Acompanhe seu progresso e conquistas' },
    reports: { title: 'Relatórios & Análises', subtitle: 'Resumo detalhado e exportação de dados' },
    calculator: { title: 'Calculadora Financeira', subtitle: 'Ferramentas de matemática financeira, juros compostos, amortização e comparador SAC vs PRICE' },
  };

  const current = pageTitles[activePage] || { title: 'Nosso Bolso', subtitle: 'Gestão Inteligente' };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[#0D1424]/85 backdrop-blur-xl border-b border-[#2E3B52]/60 sticky top-0 z-30">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">{current.title}</h2>
        <p className="text-xs text-[#94A3B8] font-medium mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Widget da Agenda / Navegação Temporal Destacada */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#121929] to-[#18253B] border border-[#00FF88]/40 shadow-[0_0_15px_rgba(0,255,136,0.12)] rounded-2xl p-1 transition-all hover:border-[#00FF88]/70">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/10 rounded-xl transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center px-2">
            <div className="w-7 h-7 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center mr-2 text-[#00FF88] shadow-inner">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-[#F8FAFC] focus:outline-none cursor-pointer pr-3 py-1"
            >
              <option value="all" className="bg-[#121929] text-[#F8FAFC]">
                🌐 Todos os Períodos
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#121929] text-[#F8FAFC]">
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/10 rounded-xl transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedMonth !== currentMonthKey && (
            <button
              onClick={() => setSelectedMonth(currentMonthKey)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-black text-[#00FF88] bg-[#00FF88]/15 border border-[#00FF88]/30 hover:bg-[#00FF88]/25 rounded-lg transition-all ml-1"
              title="Voltar para o Mês Atual"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hoje</span>
            </button>
          )}
        </div>

        {/* Botão de Modo Privacidade (Olho) */}
        <button
          onClick={togglePrivacyMode}
          className={`p-2.5 rounded-xl border transition-all ${
            isPrivacyMode
              ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-md shadow-[#00FF88]/10'
              : 'bg-[#162032] text-[#94A3B8] border-[#2E3B52] hover:text-[#F8FAFC]'
          }`}
          title={isPrivacyMode ? 'Desativar Modo Privacidade' : 'Ativar Modo Privacidade (Ocultar Valores)'}
        >
          {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Botão de Alertas (Sino) com Badge */}
        <button
          onClick={() => setAlertsModalOpen(true)}
          className="relative p-2.5 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
          title="Central de Alertas & Vencimentos"
        >
          <Bell className="w-4 h-4 text-[#F59E0B]" />
          {upcomingAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#0D1424] animate-pulse">
              {upcomingAlertCount}
            </span>
          )}
        </button>

        {/* Botão de Orçamentos (Alvo) */}
        <Button
          variant="outline"
          onClick={() => setBudgetModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52]"
          title="Definir Orçamento por Categoria"
        >
          <Target className="w-4 h-4 text-[#00FF88]" />
          <span>Orçamento</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => useAppStore.getState().setCategoryModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52]"
        >
          <Tag className="w-4 h-4 text-[#F59E0B]" />
          <span>Categorias</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setOfxModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52]"
        >
          <Upload className="w-4 h-4 text-[#06B6D4]" />
          <span>Importar OFX</span>
        </Button>

        <Button
          variant="primary"
          onClick={() => setTransactionModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Transação</span>
        </Button>
      </div>
    </header>
  );
};
