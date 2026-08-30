import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import {
  History,
  X,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  Plus,
  Inbox,
  Sparkles,
  Filter
} from 'lucide-react';

export const HistoryDrawer: React.FC = () => {
  const {
    isHistoryDrawerOpen,
    setHistoryDrawerOpen,
    toggleHistoryDrawer,
    setEditingTransactionId,
    setTransactionModalOpen,
    isPrivacyMode,
    activePage,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) || [];

  // Filtragem local no drawer
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || tx.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setTransactionModalOpen(true);
  };

  const handleDelete = async (id: string) => {
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
    <>
      {/* Botão Flutuante Lateral no Canto Direito (Alinhado Logo Abaixo do Topbar, Sem Cobrir os Cards) */}
      <button
        onClick={toggleHistoryDrawer}
        className="fixed top-[68px] right-0 z-40 px-3 py-2 bg-[#090D18]/95 border-l-2 border-y border-[#00FF88] rounded-l-2xl shadow-[0_0_20px_rgba(0,255,136,0.3)] backdrop-blur-xl flex items-center gap-2 hover:bg-[#00FF88]/20 transition-all duration-300 group cursor-pointer"
        title="Abrir Histórico Lateral de Lançamentos"
      >
        <div className="p-1 rounded-lg bg-[#00FF88]/20 text-[#00FF88]">
          <History className="w-4 h-4 text-[#00FF88] group-hover:rotate-45 transition-transform" />
        </div>
        <span className="text-xs font-black text-[#F8FAFC] hidden sm:inline tracking-wide">Histórico</span>
        <span className="px-1.5 py-0.5 rounded-full bg-[#00FF88] text-[#090D16] text-[10px] font-black">
          {transactions.length}
        </span>
      </button>

      {/* Painel Lateral Deslizante (Right Drawer) */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <div className="fixed inset-0 z-[90] flex justify-end">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryDrawerOpen(false)}
              className="absolute inset-0 bg-[#090D16]/70 backdrop-blur-md cursor-pointer"
            />

            {/* Painel do Sidebar Direito */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-md h-full bg-[#0A0E1A]/95 border-l border-[#00FF88]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between z-10"
            >
              {/* Header do Drawer */}
              <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0E1526]/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
                    <History className="w-5 h-5 text-[#00FF88]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#F8FAFC] tracking-tight">Histórico Lateral</h3>
                    <p className="text-[11px] text-[#94A3B8] font-semibold">Lançamentos recentes e consultas rápidas</p>
                  </div>
                </div>

                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="p-2 text-[#64748B] hover:text-[#FF4D6D] hover:bg-[#1E293B] rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtros e Busca */}
              <div className="p-4 border-b border-[#1E293B] flex flex-col gap-3 bg-[#080B14]">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar histórico..."
                    className="w-full h-10 pl-9 pr-4 bg-[#0D1424] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
                  />
                </div>

                {/* Filtro de Tipo (Todas / Entradas / Saídas) */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTypeFilter === 'all'
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                        : 'bg-[#121929] text-[#94A3B8] border border-[#1E293B]'
                    }`}
                  >
                    Todas ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTypeFilter('income')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTypeFilter === 'income'
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                        : 'bg-[#121929] text-[#94A3B8] border border-[#1E293B]'
                    }`}
                  >
                    🟢 Receitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTypeFilter('expense')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTypeFilter === 'expense'
                        ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40'
                        : 'bg-[#121929] text-[#94A3B8] border border-[#1E293B]'
                    }`}
                  >
                    🔴 Despesas
                  </button>
                </div>
              </div>

              {/* Lista de Transações */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {filteredTxs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-[#090D18]/40 border border-[#1E293B] rounded-2xl my-auto">
                    <Inbox className="w-10 h-10 text-[#64748B] mb-2" />
                    <p className="text-xs font-bold text-[#F8FAFC]">Nenhum histórico localizado.</p>
                  </div>
                ) : (
                  filteredTxs.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => handleEdit(tx.id)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#090D18]/90 hover:bg-[#162032] border border-[#1E293B] hover:border-[#00FF88]/40 transition-all duration-200 group cursor-pointer"
                      title="Clique para editar este lançamento"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30'
                              : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                          }`}
                        >
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs font-bold text-[#F8FAFC] truncate group-hover:text-[#00FF88] transition-colors">
                            {tx.description}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-medium mt-0.5">
                            <span className="bg-[#12141A] px-1.5 py-0.5 rounded border border-[#1E2330] truncate">
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span>{formatDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-black tracking-tight ${
                            tx.type === 'income' ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount, isPrivacyMode)}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() => handleEdit(tx.id)}
                            className="p-1 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#12141A] rounded transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#12141A] rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rodapé do Drawer com Botão Nova Transação */}
              <div className="p-4 border-t border-[#1E293B] bg-[#0E1526]/90 flex items-center justify-between gap-3">
                <span className="text-xs text-[#94A3B8] font-semibold">
                  Exibindo <strong>{filteredTxs.length}</strong> de {transactions.length}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTransactionId(null);
                    setTransactionModalOpen(true);
                    setHistoryDrawerOpen(false);
                  }}
                  className="px-4 py-2 bg-[#00FF88] text-[#090D16] rounded-xl text-xs font-black hover:bg-[#00E577] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,136,0.3)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Transação</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
