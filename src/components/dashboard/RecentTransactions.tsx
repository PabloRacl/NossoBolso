import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Transaction } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { ArrowUpRight, ArrowDownRight, Inbox, Edit3, Trash2 } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onDelete }) => {
  const { setActivePage, setEditingTransactionId, setTransactionModalOpen, isPrivacyMode } = useAppStore();

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setTransactionModalOpen(true);
  };

  return (
    <Card className="hover:border-[#00FF88]/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Últimas Transações</h3>
          <p className="text-xs text-[#94A3B8] font-medium">Lançamentos mais recentes no período</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setActivePage('transactions')} className="hover:text-[#00FF88]">
          Ver todas
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-[#0A0B0E]/40 border border-[#1E2330] rounded-2xl">
          <Inbox className="w-10 h-10 text-[#64748B] mb-2" />
          <p className="text-sm font-bold text-[#F8FAFC]">Nenhuma transação cadastrada ainda.</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Clique em "Nova Transação" para começar!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1E293B]/50 border border-transparent hover:border-[#1E293B] transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-sm transition-transform group-hover:scale-110 ${
                    tx.type === 'income'
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                  }`}
                >
                  {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                    {tx.description}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-medium mt-0.5">
                    <span className="bg-[#12141A] px-2 py-0.5 rounded-md border border-[#1E2330] text-[11px]">{tx.category}</span>
                    <span>•</span>
                    <span>{formatDate(tx.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-sm font-black tracking-tight ${
                    tx.type === 'income' ? 'text-[#10B981]' : 'text-[#FF4D6D]'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount, isPrivacyMode)}
                </span>
                
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => handleEdit(tx.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#12141A] rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#12141A] rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
