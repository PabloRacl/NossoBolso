import React, { useMemo } from 'react';
import { useAppStore, getCurrentMonthKey } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Plus, Upload, Calendar, Tag, ChevronLeft, ChevronRight, Sparkles, Eye, EyeOff, Bell, Target, FileCheck, Search, Menu } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';

export const Topbar: React.FC = () => {
  const {
    activePage,
    setTransactionModalOpen,
    setOfxModalOpen,
    setContrachequeModalOpen,
    selectedMonth,
    setSelectedMonth,
    isPrivacyMode,
    togglePrivacyMode,
    setAlertsModalOpen,
    setBudgetModalOpen,
    toggleMobileMenu,
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
    pantry: { title: 'Mercado & Estoque Doméstico', subtitle: 'Gestão de despensa, checklist pré-feira e carrinho ao vivo com comparativo de preços' },
    vehicles: { title: 'Veículos, Garagem & Combustível', subtitle: 'Controle de abastecimentos, consumo (KM/L), manutenções, IPVA e seguro' },
    reports: { title: 'Relatórios & Análises', subtitle: 'Resumo detalhado e exportação de dados' },
    calculator: { title: 'Calculadora Financeira', subtitle: 'Ferramentas de matemática financeira, juros compostos, amortização e comparador SAC vs PRICE' },
  };

  const current = pageTitles[activePage] || { title: 'Nosso Bolso', subtitle: 'Gestão Inteligente' };

  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-4 py-3.5 px-6 bg-[#0D1424]/95 backdrop-blur-xl border-b border-[#2E3B52]/60 sticky top-0 z-40">
      {/* Canto Esquerdo: Botão Hambúrguer Mobile + Logo com Folha de Ouro Cintilante */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-[#162032] text-[#00FF88] border border-[#2E3B52] hover:bg-[#00FF88]/10 transition-all"
          title="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/25 via-[#F59E0B]/20 to-[#B45309]/30 border border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] gold-shimmer cursor-pointer">
          <span className="text-2xl drop-shadow-[0_2px_10px_rgba(255,215,0,0.8)]">🍃</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#F8FAFC] leading-none">NossoBolso</h1>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FFD700]/20 to-[#F59E0B]/20 border border-[#FFD700]/40 gold-text-gradient shadow-sm">
              FINANCE OS
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] font-medium mt-1 flex items-center gap-1.5">
            <strong className="text-[#00FF88] font-extrabold">{current.title}</strong>
            <span className="text-[#475569]">•</span>
            <span className="truncate max-w-xs sm:max-w-md">{current.subtitle}</span>
          </p>
        </div>
      </div>

      {/* Canto Direito: Ações e Botões em Linha Única */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Widget da Agenda / Navegação Temporal */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-[#121929] to-[#18253B] border border-[#00FF88]/40 shadow-[0_0_12px_rgba(0,255,136,0.12)] rounded-xl p-1 transition-all hover:border-[#00FF88]/70">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/10 rounded-lg transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex items-center px-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center mr-1.5 text-[#00FF88]">
              <Calendar className="w-3 h-3" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-[#F8FAFC] focus:outline-none cursor-pointer pr-2 py-0.5"
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
            className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/10 rounded-lg transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {selectedMonth !== currentMonthKey && (
            <button
              onClick={() => setSelectedMonth(currentMonthKey)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-[#00FF88] bg-[#00FF88]/15 border border-[#00FF88]/30 hover:bg-[#00FF88]/25 rounded-md transition-all ml-0.5"
              title="Voltar para o Mês Atual"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hoje</span>
            </button>
          )}
        </div>

        {/* Botão de Busca / Command Palette (Ctrl+K) */}
        <button
          onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#00FF88]/40 transition-all group"
          title="Abrir Busca Rápida (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-[#00FF88] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="px-1.5 py-0.5 bg-[#0D1424] border border-[#2E3B52] rounded text-[10px] font-mono text-[#00FF88]">
            Ctrl K
          </kbd>
        </button>

        {/* Botão de Modo Privacidade (Olho) */}
        <button
          onClick={togglePrivacyMode}
          className={`p-2 rounded-xl border transition-all ${
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
          className="relative p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
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
          size="sm"
          onClick={() => setBudgetModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs"
          title="Definir Orçamento por Categoria"
        >
          <Target className="w-3.5 h-3.5 text-[#00FF88]" />
          <span>Orçamento</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => useAppStore.getState().setCategoryModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs"
        >
          <Tag className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Categorias</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOfxModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Importar OFX</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setContrachequeModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs"
          title="Importar e Ler Holerite/Contracheque"
        >
          <FileCheck className="w-3.5 h-3.5 text-[#00FF88]" />
          <span>Contracheque</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setTransactionModalOpen(true)}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Transação</span>
        </Button>
      </div>
    </header>
  );
};
