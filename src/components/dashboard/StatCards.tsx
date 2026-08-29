import React from 'react';
import { Card } from '../ui/Card';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, CreditCard, Info } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useAppStore';

interface StatCardsProps {
  totalBalance: number;
  totalDebt: number;
  periodIncome: number;
  periodExpense: number;
  totalIncome: number;
  totalExpense: number;
  periodLabel: string;
  incomeCount: number;
  expenseCount: number;
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

export const StatCards: React.FC<StatCardsProps> = ({
  totalBalance,
  totalDebt,
  periodIncome,
  periodExpense,
  totalIncome,
  totalExpense,
  periodLabel,
}) => {
  const { isPrivacyMode } = useAppStore();
  const periodSavings = periodIncome - periodExpense;
  const savingsPercent = periodIncome > 0 ? (periodSavings / periodIncome) * 100 : 0;
  const netWorth = totalBalance - totalDebt;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6"
    >
      {/* 1. Saldo Patrimonial Acumulado Total */}
      <Card glow glowColor="#00FF88" className="border-l-4 border-l-[#00FF88] hover:border-[#00FF88]/60 hover:shadow-[0_8px_25px_rgba(0,255,136,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold uppercase text-[#94A3B8] tracking-wider group-hover:text-[#F8FAFC] transition-colors">
              Patrimônio Total
            </span>
            <div className="group/tooltip relative cursor-pointer">
              <Info className="w-3.5 h-3.5 text-[#64748B] hover:text-[#00FF88] transition-colors" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-[#94A3B8] shadow-2xl z-50 backdrop-blur-xl">
                <p className="font-semibold text-[#F8FAFC] mb-1">🏦 Patrimônio Líquido Real</p>
                Soma acumulada de todo o saldo em contas e investimentos, descontando cartões de crédito e dívidas ativas.
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-[#00FF88]/10 text-[#00FF88] rounded-xl group-hover:scale-110 group-hover:bg-[#00FF88]/20 transition-all">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#00FF88] tracking-tight drop-shadow-[0_2px_10px_rgba(0,255,136,0.2)]">
          {formatBRL(netWorth, isPrivacyMode)}
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium leading-tight">
          Acumulado em todas as contas (Bancos + Investimentos)
        </p>
      </Card>

      {/* 2. Receitas do Período */}
      <Card glow glowColor="#10B981" className="border-l-4 border-l-[#10B981] hover:border-[#10B981]/60 hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase text-[#94A3B8] tracking-wider group-hover:text-[#F8FAFC] transition-colors">
            Receitas
          </span>
          <div className="p-2.5 bg-[#10B981]/10 text-[#10B981] rounded-xl group-hover:scale-110 group-hover:bg-[#10B981]/20 transition-all">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#10B981] tracking-tight drop-shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
          {formatBRL(periodIncome, isPrivacyMode)}
        </div>
        <div className="mt-1.5 flex flex-col text-[11px] font-medium">
          <span className="text-[#F8FAFC] font-semibold">{periodLabel}</span>
          <span className="text-[#94A3B8]">Total Histórico: {formatBRL(totalIncome, isPrivacyMode)}</span>
        </div>
      </Card>

      {/* 3. Despesas do Período */}
      <Card glow glowColor="#FF4D6D" className="border-l-4 border-l-[#FF4D6D] hover:border-[#FF4D6D]/60 hover:shadow-[0_8px_25px_rgba(255,77,109,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase text-[#94A3B8] tracking-wider group-hover:text-[#F8FAFC] transition-colors">
            Despesas
          </span>
          <div className="p-2.5 bg-[#FF4D6D]/10 text-[#FF4D6D] rounded-xl group-hover:scale-110 group-hover:bg-[#FF4D6D]/20 transition-all">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#FF4D6D] tracking-tight drop-shadow-[0_2px_10px_rgba(255,77,109,0.2)]">
          {formatBRL(periodExpense, isPrivacyMode)}
        </div>
        <div className="mt-1.5 flex flex-col text-[11px] font-medium">
          <span className="text-[#F8FAFC] font-semibold">{periodLabel}</span>
          <span className="text-[#94A3B8]">Total Histórico: {formatBRL(totalExpense, isPrivacyMode)}</span>
        </div>
      </Card>

      {/* 4. Dívidas & Cartões */}
      <Card glow glowColor="#F59E0B" className="border-l-4 border-l-[#F59E0B] hover:border-[#F59E0B]/60 hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase text-[#94A3B8] tracking-wider group-hover:text-[#F8FAFC] transition-colors">
            Dívidas & Cartões
          </span>
          <div className="p-2.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-xl group-hover:scale-110 group-hover:bg-[#F59E0B]/20 transition-all">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#F59E0B] tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
          {formatBRL(totalDebt, isPrivacyMode)}
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium leading-tight">
          Saldo devedor em cartões e lançamentos em dívidas
        </p>
      </Card>

      {/* 5. Resultado do Período */}
      <Card glow glowColor="#06B6D4" className="border-l-4 border-l-[#06B6D4] hover:border-[#06B6D4]/60 hover:shadow-[0_8px_25px_rgba(6,182,212,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase text-[#94A3B8] tracking-wider group-hover:text-[#F8FAFC] transition-colors">
            Balanço Período
          </span>
          <div className="p-2.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded-xl group-hover:scale-110 group-hover:bg-[#06B6D4]/20 transition-all">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight drop-shadow-md ${periodSavings >= 0 ? 'text-[#06B6D4]' : 'text-red-400'}`}>
          {formatBRL(periodSavings, isPrivacyMode)}
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">
          {formatPercent(savingsPercent)} da receita do período salva
        </p>
      </Card>
    </motion.div>
  );
};
