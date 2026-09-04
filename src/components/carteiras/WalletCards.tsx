import React, { useState } from 'react';
import { Wallet } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CreditCard,
  Building2,
  TrendingUp,
  Landmark,
  PiggyBank,
  Wallet as WalletIcon,
  Wifi
} from 'lucide-react';
import { db } from '../../services/db';
import { motion } from 'framer-motion';
import { TransferBetweenWalletsModal } from './TransferBetweenWalletsModal';

interface WalletCardsProps {
  wallets: Wallet[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const WalletCards: React.FC<WalletCardsProps> = ({ wallets }) => {
  const { setWalletModalOpen, setEditingWalletId, isPrivacyMode } = useAppStore();
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);

  const handleEdit = (id: string) => {
    setEditingWalletId(id);
    setWalletModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (wallets.length <= 1) {
      alert('Você precisa ter pelo menos uma carteira ativa no sistema.');
      return;
    }
    if (confirm('Deseja realmente excluir esta carteira? As transações vinculadas serão mantidas.')) {
      await db.wallets.delete(id);
    }
  };

  // Métricas Totais
  const checkingTotal = wallets
    .filter((w) => w.type === 'checking')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const savingsTotal = wallets
    .filter((w) => w.type === 'savings' || w.type === 'investment')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const netWorthTotal = checkingTotal + savingsTotal;

  const totalCreditLimit = wallets
    .filter((w) => w.type === 'credit' || w.creditLimit)
    .reduce((acc, curr) => acc + (curr.creditLimit || 0), 0);

  const openCreditInvoices = wallets
    .filter((w) => w.type === 'credit')
    .reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header com Telemetria Bancária */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00FF88] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">Patrimônio Líquido</span>
            <Landmark className="w-4 h-4 text-[#00FF88]" />
          </div>
          <div className="text-xl font-black text-[#00FF88] mt-1">
            {formatBRL(netWorthTotal, isPrivacyMode)}
          </div>
          <span className="text-[10px] text-[#64748B] mt-0.5">Soma de contas + reservas</span>
        </Card>

        <Card className="border-l-4 border-l-[#06B6D4] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">Reservas & Investimentos</span>
            <PiggyBank className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="text-xl font-black text-[#06B6D4] mt-1">
            {formatBRL(savingsTotal, isPrivacyMode)}
          </div>
          <span className="text-[10px] text-[#64748B] mt-0.5">Poupança e fundos rendendo</span>
        </Card>

        <Card className="border-l-4 border-l-[#A855F7] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">Limite de Crédito Total</span>
            <CreditCard className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div className="text-xl font-black text-[#A855F7] mt-1">
            {formatBRL(totalCreditLimit, isPrivacyMode)}
          </div>
          <span className="text-[10px] text-[#64748B] mt-0.5">Limite aprovado nos cartões</span>
        </Card>

        <Card className="border-l-4 border-l-[#FF4D6D] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">Faturas Abertas (Cartões)</span>
            <ShieldCheck className="w-4 h-4 text-[#FF4D6D]" />
          </div>
          <div className="text-xl font-black text-[#FF4D6D] mt-1">
            {formatBRL(openCreditInvoices, isPrivacyMode)}
          </div>
          <span className="text-[10px] text-[#64748B] mt-0.5">Total a vencer nos cartões</span>
        </Card>
      </div>

      {/* 2. Barra de Ações & Título */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[#F8FAFC] font-extrabold text-lg flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-[#00FF88]" />
            <span>Gestão de Contas Bancárias & Cartões</span>
          </h3>
          <p className="text-xs text-[#94A3B8]">Organize suas instituições bancárias, limites e movimentações.</p>
        </div>

        <div className="flex items-center gap-2">
          {wallets.length >= 2 && (
            <Button
              variant="outline"
              onClick={() => setTransferModalOpen(true)}
              className="border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/10"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transferir Entre Contas</span>
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => {
              setEditingWalletId(null);
              setWalletModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Carteira / Cartão</span>
          </Button>
        </div>
      </div>

      {/* 3. Grid dos Cartões Bancários Cyber-HUD */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {wallets.map((w) => {
          const isCredit = w.type === 'credit';
          const cardColor = w.color || '#00FF88';
          const limit = w.creditLimit || 0;
          const usedCredit = Math.abs(w.balance);
          const availableCredit = Math.max(limit - usedCredit, 0);
          const creditUsagePercent = limit > 0 ? Math.min((usedCredit / limit) * 100, 100) : 0;

          return (
            <motion.div
              key={w.id}
              className="relative rounded-2xl p-5 border bg-gradient-to-b from-[#0E1526]/90 to-[#0A0E1A]/90 backdrop-blur-xl shadow-xl flex flex-col justify-between min-h-[220px] overflow-hidden group hover:border-[#00FF88]/50 transition-all duration-300"
              style={{
                borderColor: `${cardColor}40`,
              }}
            >
              {/* Efeito Glow de Fundo */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full filter blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                style={{ backgroundColor: cardColor }}
              />

              {/* Cabeçalho do Cartão */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shadow-lg relative"
                      style={{
                        backgroundColor: `${cardColor}15`,
                        borderColor: `${cardColor}50`,
                      }}
                    >
                      {w.icon || '🏦'}
                    </div>

                    <div className="flex flex-col">
                      <h4 className="font-extrabold text-base text-[#F8FAFC] flex items-center gap-1.5">
                        <span>{w.name}</span>
                      </h4>
                      <span className="text-[11px] text-[#94A3B8] font-semibold">
                        {w.type === 'checking'
                          ? '🏦 Conta Corrente'
                          : w.type === 'savings'
                          ? '🐷 Poupança / Reserva'
                          : w.type === 'credit'
                          ? '💳 Cartão de Crédito'
                          : '📊 Investimento / Fundos'}
                      </span>
                    </div>
                  </div>

                  {/* Ações de Edição */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(w.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#162032] rounded-lg transition-all"
                      title="Editar carteira"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#162032] rounded-lg transition-all"
                        title="Excluir carteira"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grafismo do Chip EMV & Contactless */}
                <div className="flex items-center justify-between my-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-[#F59E0B] via-[#FCD34D] to-[#B45309] border border-[#FEF08A]/60 flex items-center justify-center shadow-sm">
                      <div className="w-5 h-4 border border-[#78350F]/40 rounded-sm" />
                    </div>
                    <Wifi className="w-4 h-4 text-[#64748B] rotate-90" />
                  </div>

                  <span className="text-[10px] font-mono text-[#64748B] tracking-widest uppercase">
                    •••• {w.lastDigits || '4829'}
                  </span>
                </div>
              </div>

              {/* Saldo / Fatura Principal */}
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  {isCredit ? 'Fatura Atual (Em Aberto)' : 'Saldo Disponível em Conta'}
                </span>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-black ${
                      isCredit
                        ? 'text-[#FF4D6D]'
                        : w.balance >= 0
                        ? 'text-[#00FF88]'
                        : 'text-[#FF4D6D]'
                    }`}
                  >
                    {formatBRL(w.balance, isPrivacyMode)}
                  </span>

                  {w.yieldRateCdi && (
                    <span className="text-[10px] font-bold text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {w.yieldRateCdi}% CDI
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Progresso de Limite (Cartão de Crédito) */}
              {isCredit && limit > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1E293B] flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Limite Disponível:</span>
                    <span className="font-extrabold text-[#00FF88]">
                      {formatBRL(availableCredit, isPrivacyMode)}
                    </span>
                  </div>

                  {/* Barra visual de uso */}
                  <div className="w-full bg-[#162032] rounded-full h-2 overflow-hidden border border-[#2E3B52]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        creditUsagePercent > 85
                          ? 'bg-[#FF4D6D]'
                          : creditUsagePercent > 60
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#00FF88]'
                      }`}
                      style={{ width: `${creditUsagePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                    <span>Vencimento: dia {w.dueDay || 27}</span>
                    <span>Fechamento: dia {w.closingDay || 20}</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Modal de Transferência */}
      <TransferBetweenWalletsModal
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        wallets={wallets}
      />
    </div>
  );
};
