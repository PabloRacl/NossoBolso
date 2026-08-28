import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Plus, Upload, Calendar, Tag, Cloud } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { isSupabaseConfigured } from '../../services/supabase';
import { CloudSyncModal } from '../cloud/CloudSyncModal';

export const Topbar: React.FC = () => {
  const { activePage, setTransactionModalOpen, setOfxModalOpen, selectedMonth, setSelectedMonth } = useAppStore();
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const [isCloudModalOpen, setCloudModalOpen] = useState(false);

  // Generate available months list from database transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const nowKey = new Date().toISOString().substring(0, 7);
    monthsSet.add(nowKey);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  const formatMonthLabel = (key: string) => {
    if (key === 'all') return '🌐 Todos os Períodos (Acumulado Total)';
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `📅 ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
  };

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Visão geral das suas finanças, patrimônio e despesas' },
    transactions: { title: 'Transações', subtitle: 'Histórico completo de entradas, saídas e dívidas' },
    wallets: { title: 'Carteiras & Cartões', subtitle: 'Gerencie suas contas bancárias, cartões e dívidas' },
    debts: { title: 'Financiamentos & Dívidas', subtitle: 'Gestão de contratos parcelados de longo prazo (Veículos, Empréstimos, Imóveis)' },
    goals: { title: 'Metas Financeiras', subtitle: 'Acompanhe seu progresso e conquistas' },
    reports: { title: 'Relatórios & Análises', subtitle: 'Resumo detalhado e exportação de dados' },
  };

  const current = pageTitles[activePage] || { title: 'NossoBolso', subtitle: 'Gestão Inteligente' };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[#0D1424]/85 backdrop-blur-xl border-b border-[#2E3B52]/60 sticky top-0 z-30">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">{current.title}</h2>
        <p className="text-xs text-[#94A3B8] font-medium mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Month / Period Filter Dropdown */}
        <div className="relative flex items-center bg-[#162032] border border-[#2E3B52] rounded-xl px-3 py-1.5 focus-within:border-[#00FF88] transition-all">
          <Calendar className="w-4 h-4 text-[#00FF88] mr-2 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#F8FAFC] focus:outline-none cursor-pointer pr-2"
          >
            <option value="all" className="bg-[#162032] text-[#F8FAFC]">
              🌐 Todos os Períodos (Acumulado Total)
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-[#162032] text-[#F8FAFC]">
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          onClick={() => setCloudModalOpen(true)}
          className={`border-[#2E3B52] ${
            isSupabaseConfigured ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' : 'bg-[#162032]'
          }`}
        >
          <Cloud className={`w-4 h-4 ${isSupabaseConfigured ? 'text-[#10B981]' : 'text-[#3B82F6]'}`} />
          <span>{isSupabaseConfigured ? 'Nuvem OK' : 'Banco Online'}</span>
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

      <CloudSyncModal isOpen={isCloudModalOpen} onClose={() => setCloudModalOpen(false)} />
    </header>
  );
};
