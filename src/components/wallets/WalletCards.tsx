import React from 'react';
import { Wallet } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { db } from '../../services/db';
import { motion } from 'framer-motion';

interface WalletCardsProps {
  wallets: Wallet[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const WalletCards: React.FC<WalletCardsProps> = ({ wallets }) => {
  const { setWalletModalOpen, isPrivacyMode } = useAppStore();

  const handleDelete = async (id: string) => {
    if (wallets.length <= 1) return;
    await db.wallets.delete(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#F8FAFC] font-extrabold text-lg">Minhas Contas e Cartões</h3>
        <Button variant="primary" onClick={() => setWalletModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Nova Carteira</span>
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {wallets.map((w) => (
          <Card key={w.id} className="relative overflow-hidden group hover:border-[#00FF88]/40 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#162032] border border-[#2E3B52] flex items-center justify-center text-2xl shadow-inner">
                  {w.icon}
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#F8FAFC]">{w.name}</h4>
                  <span className="text-xs text-[#94A3B8] capitalize font-medium">
                    {w.type === 'checking'
                      ? 'Conta Corrente'
                      : w.type === 'savings'
                      ? 'Poupança / Reserva'
                      : w.type === 'credit'
                      ? 'Cartão de Crédito'
                      : 'Investimentos'}
                  </span>
                </div>
              </div>

              {wallets.length > 1 && (
                <button
                  onClick={() => handleDelete(w.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#162032] rounded-lg transition-all"
                  title="Excluir carteira"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                {w.type === 'credit' ? 'Fatura Atual (Em Aberto)' : 'Saldo Atual'}
              </span>
              <span className={`text-2xl font-black ${w.balance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'}`}>
                {formatBRL(w.balance, isPrivacyMode)}
              </span>
            </div>

            {w.type === 'credit' && (
              <div className="mt-3 pt-3 border-t border-[#2E3B52] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Limite Disponível:</span>
                  <span className="font-extrabold text-[#00FF88]">
                    {formatBRL(Math.max((w.creditLimit || 0) - Math.abs(w.balance), 0), isPrivacyMode)}
                  </span>
                </div>
                <div className="p-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl flex items-center justify-between text-xs text-[#F59E0B] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Melhor dia de compra:
                  </span>
                  <span className="bg-[#F59E0B]/20 px-2 py-0.5 rounded-md text-[11px] font-black">
                    Dia {((w.id.charCodeAt(0) % 25) + 1)}
                  </span>
                </div>
              </div>
            )}

            {w.type !== 'credit' && w.creditLimit && w.creditLimit > 0 && (
              <div className="mt-4 pt-3 border-t border-[#2E3B52] flex justify-between text-xs text-[#94A3B8]">
                <span>Limite Total:</span>
                <span className="font-extrabold text-[#F8FAFC]">{formatBRL(w.creditLimit, isPrivacyMode)}</span>
              </div>
            )}
          </Card>
        ))}
      </motion.div>
    </div>
  );
};
