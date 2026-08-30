import React, { useState, useEffect } from 'react';
import { useAppStore, PageType } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateFullTestDataset } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import {
  Search,
  Command,
  LayoutDashboard,
  Receipt,
  Wallet as WalletIcon,
  PiggyBank,
  Target,
  BarChart3,
  Calculator,
  Plus,
  Upload,
  FileCheck,
  Tag,
  Bell,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    setActivePage,
    setTransactionModalOpen,
    setOfxModalOpen,
    setContrachequeModalOpen,
    setCategoryModalOpen,
    setBudgetModalOpen,
    setAlertsModalOpen,
    setWalletModalOpen,
    setGoalModalOpen,
    isPrivacyMode,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pages: { id: PageType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Ir para Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-[#00FF88]" /> },
    { id: 'transactions', label: 'Ir para Transações', icon: <Receipt className="w-4 h-4 text-[#06B6D4]" /> },
    { id: 'wallets', label: 'Ir para Carteiras & Cartões', icon: <WalletIcon className="w-4 h-4 text-[#10B981]" /> },
    { id: 'debts', label: 'Ir para Financiamentos & Dívidas', icon: <PiggyBank className="w-4 h-4 text-[#FF4D6D]" /> },
    { id: 'goals', label: 'Ir para Metas Financeiras', icon: <Target className="w-4 h-4 text-[#F59E0B]" /> },
    { id: 'reports', label: 'Ir para Relatórios & Análises', icon: <BarChart3 className="w-4 h-4 text-[#9333EA]" /> },
    { id: 'calculator', label: 'Ir para Calculadora Financeira', icon: <Calculator className="w-4 h-4 text-[#3B82F6]" /> },
  ];

  const actions = [
    { id: 'act_new_tx', label: 'Nova Transação', icon: <Plus className="w-4 h-4 text-[#00FF88]" />, run: () => setTransactionModalOpen(true) },
    { id: 'act_seed_test_db', label: '🧪 Gerar / Carregar Banco de Dados de Testes', icon: <Sparkles className="w-4 h-4 text-[#00FF88]" />, run: async () => {
        if (confirm('Deseja carregar a massa completa de dados bancários, contracheque e veículos para teste?')) {
          await generateFullTestDataset();
          alert('✅ Banco de dados local de testes gerado com sucesso!');
          window.location.reload();
        }
      }
    },
    { id: 'act_ofx', label: 'Importar Extrato OFX', icon: <Upload className="w-4 h-4 text-[#06B6D4]" />, run: () => setOfxModalOpen(true) },
    { id: 'act_holerite', label: 'Importar e Ler Contracheque / Holerite', icon: <FileCheck className="w-4 h-4 text-[#10B981]" />, run: () => setContrachequeModalOpen(true) },
    { id: 'act_budget', label: 'Gerenciar Orçamentos por Categoria', icon: <Target className="w-4 h-4 text-[#F59E0B]" />, run: () => setBudgetModalOpen(true) },
    { id: 'act_category', label: 'Gerenciar Categorias', icon: <Tag className="w-4 h-4 text-[#FF4D6D]" />, run: () => setCategoryModalOpen(true) },
    { id: 'act_alerts', label: 'Abrir Central de Alertas', icon: <Bell className="w-4 h-4 text-[#F59E0B]" />, run: () => setAlertsModalOpen(true) },
    { id: 'act_wallet', label: 'Criar Nova Carteira', icon: <WalletIcon className="w-4 h-4 text-[#00FF88]" />, run: () => setWalletModalOpen(true) },
    { id: 'act_goal', label: 'Criar Nova Meta', icon: <Target className="w-4 h-4 text-[#06B6D4]" />, run: () => setGoalModalOpen(true) },
  ];

  const filteredPages = pages.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()));
  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
  const filteredTransactions = query.trim().length > 1
    ? transactions.filter((t) => t.description.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectPage = (page: PageType) => {
    setActivePage(page);
    onClose();
  };

  const handleSelectAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0D1424] border border-[#2E3B52] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E293B]">
          <Search className="w-5 h-5 text-[#00FF88]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o que deseja fazer ou buscar (ex: Transação, Orçamento, Meta)..."
            className="w-full bg-transparent text-sm font-semibold text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
          />
          <kbd className="px-2 py-1 bg-[#162032] border border-[#2E3B52] rounded-md text-[10px] font-mono text-[#94A3B8]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-3">
          {/* Páginas */}
          {filteredPages.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 py-1">
                Navegação
              </span>
              {filteredPages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPage(p.id)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#162032] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    {p.icon}
                    <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                      {p.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#00FF88] transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Ações Rápidas */}
          {filteredActions.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 py-1">
                Ações Rápidas
              </span>
              {filteredActions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAction(a.run)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#162032] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    {a.icon}
                    <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                      {a.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#00FF88] transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Transações Encontradas */}
          {filteredTransactions.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 py-1">
                Transações Encontradas
              </span>
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    setActivePage('transactions');
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#162032] transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {tx.category} • {tx.date}
                    </span>
                  </div>
                  <span className={`text-xs font-black ${tx.type === 'income' ? 'text-[#10B981]' : 'text-[#FF4D6D]'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount, isPrivacyMode)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredPages.length === 0 && filteredActions.length === 0 && filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-xs text-[#64748B]">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0A0B0E] border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-[#00FF88]" />
            <span>NossoBolso Command Palette</span>
          </div>
          <span>Pressione <strong>ESC</strong> para fechar</span>
        </div>
      </div>
    </div>
  );
};
