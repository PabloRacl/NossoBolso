import React, { useMemo } from 'react';
import { useAppStore, getCurrentMonthKey } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Plus, Upload, Calendar, Tag, ChevronLeft, ChevronRight, Sparkles, Eye, EyeOff, Bell, Target, FileCheck, Search, Menu, History, Database, Mic, QrCode, Compass, Palette, FileText, Keyboard, Smartphone } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { BioCyberLogo } from './BioCyberLogo';
import { requestNotificationPermission } from '../../services/notificationService';

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
    setCommandPaletteOpen,
    toggleHistoryDrawer,
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
      {/* Canto Esquerdo: Botão Hambúrguer Mobile + Logo Cyber Emerald Wallet */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-[#162032] text-[#00FF88] border border-[#2E3B52] hover:bg-[#00FF88]/10 transition-all"
          title="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <BioCyberLogo />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#F8FAFC] leading-none">NossoBolso</h1>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FFD700]/20 to-[#F59E0B]/20 border border-[#FFD700]/40 gold-text-gradient shadow-sm">
              FINANCE OS
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] font-medium mt-1 flex items-center gap-1.5">
            <strong className="text-[#00FF88] font-extrabold">{current.title}</strong>
            <span className="text-[#475569] hidden xl:inline">•</span>
            <span className="truncate max-w-[180px] 2xl:max-w-[400px] hidden 2xl:inline">{current.subtitle}</span>
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

        {/* Botão de Comando por Voz (IA) */}
        <button
          onClick={() => useAppStore.getState().setVoiceModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all cursor-pointer"
          title="Assistente de Comando de Voz por IA"
        >
          <Mic className="w-4 h-4 text-[#00FF88]" />
        </button>

        {/* Botão de Leitor de Nota Fiscal (QRCode) */}
        <button
          onClick={() => useAppStore.getState().setQrCodeModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#06B6D4] hover:border-[#06B6D4]/40 transition-all cursor-pointer"
          title="Escanear Nota Fiscal NFC-e por QRCode"
        >
          <QrCode className="w-4 h-4 text-[#06B6D4]" />
        </button>

        {/* Botão de Simulador "E Se?" */}
        <button
          onClick={() => useAppStore.getState().setWhatIfModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 transition-all cursor-pointer"
          title="Simulador de Cenários Estratégicos 'E Se?'"
        >
          <Compass className="w-4 h-4 text-[#F59E0B]" />
        </button>

        {/* Botão de Temas Customizáveis */}
        <button
          onClick={() => useAppStore.getState().setThemeModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#A855F7] hover:border-[#A855F7]/40 transition-all cursor-pointer"
          title="Central de Temas Customizáveis (Neon)"
        >
          <Palette className="w-4 h-4 text-[#A855F7]" />
        </button>

        {/* Botão de Central de Atalhos de Teclado */}
        <button
          onClick={() => useAppStore.getState().setShortcutsModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all cursor-pointer"
          title="Central de Teclas de Atalho Globais (Ctrl + /)"
        >
          <Keyboard className="w-4 h-4 text-[#00FF88]" />
        </button>

        {/* Botão de Instalar App no Celular (PWA) */}
        <button
          onClick={() => useAppStore.getState().setPwaModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all cursor-pointer"
          title="Instalar NossoBolso no Celular / Tablet"
        >
          <Smartphone className="w-4 h-4 text-[#00FF88]" />
        </button>

        {/* Botão de Gerador de Recibos */}
        <button
          onClick={() => useAppStore.getState().setReceiptModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all cursor-pointer"
          title="Gerador de Recibos & Comprovantes"
        >
          <FileText className="w-4 h-4 text-[#00FF88]" />
        </button>

        {/* Botão de Backup & Segurança */}
        <button
          onClick={() => useAppStore.getState().setBackupModalOpen(true)}
          className="p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all cursor-pointer"
          title="Backup & Segurança em JSON"
        >
          <Database className="w-4 h-4 text-[#00FF88]" />
        </button>

        {/* Botão de Alertas (Sino) com Badge */}
        <button
          onClick={async () => {
            await requestNotificationPermission();
            setAlertsModalOpen(true);
          }}
          className="relative p-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] transition-all cursor-pointer"
          title="Central de Alertas & Vencimentos do Navegador"
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
          className="bg-[#162032] border-[#2E3B52] text-xs px-2 sm:px-2.5"
          title="Definir Orçamento por Categoria"
        >
          <Target className="w-3.5 h-3.5 text-[#00FF88]" />
          <span className="hidden 2xl:inline">Orçamento</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => useAppStore.getState().setCategoryModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs px-2 sm:px-2.5"
          title="Gerenciar Categorias"
        >
          <Tag className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="hidden 2xl:inline">Categorias</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOfxModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs px-2 sm:px-2.5"
          title="Importar Arquivo OFX Bancário"
        >
          <Upload className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span className="hidden 2xl:inline">OFX</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setContrachequeModalOpen(true)}
          className="bg-[#162032] border-[#2E3B52] text-xs px-2 sm:px-2.5"
          title="Importar e Ler Holerite/Contracheque"
        >
          <FileCheck className="w-3.5 h-3.5 text-[#00FF88]" />
          <span className="hidden 2xl:inline">Holerite</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setTransactionModalOpen(true)}
          className="text-xs px-2.5 sm:px-3 shadow-md shadow-[#00FF88]/20"
          title="Nova Transação"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Transação</span>
        </Button>
      </div>
    </header>
  );
};
