import React from 'react';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, CreditCard, ShieldCheck, Activity, Zap, Cpu } from 'lucide-react';
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
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
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
  const savingsPercent = periodIncome > 0 ? Math.max((periodSavings / periodIncome) * 100, 0) : 0;
  const netWorth = totalBalance - totalDebt;
  const burnRatePct = periodIncome > 0 ? Math.min(Math.round((periodExpense / periodIncome) * 100), 100) : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6"
    >
      {/* 🛸 DECK CENTRAL: PAINEL HUD DE PATRIMÔNIO LÍQUIDO (5 colunas) */}
      <div className="lg:col-span-5 cyber-hud-card hud-corner p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0D1526]/90 via-[#0A0E1A]/95 to-[#060A14] border border-[#00FF88]/30 shadow-[0_0_35px_rgba(0,255,136,0.12)]">
        {/* Ambient Orbit Spotlight Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00FF88]/15 rounded-full blur-3xl pointer-events-none radar-pulse-ring" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00FF88] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              TELEMETRIA OPERACIONAL ATIVA
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 text-[10px] font-black text-[#00FF88] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00FF88]" />
            ESTÁVEL
          </span>
        </div>

        <div className="my-5 z-10 flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#00FF88]" />
            PATRIMÔNIO LÍQUIDO REAL
          </span>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">
              {formatBRL(netWorth, isPrivacyMode)}
            </span>
          </div>

          <p className="text-[11px] text-[#94A3B8] font-medium mt-1">
            Saldo acumulado em contas e investimentos descontando passivos e faturas.
          </p>
        </div>

        {/* Barras de Desempenho do HUD */}
        <div className="pt-3 border-t border-[#2E3B52]/60 z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-[#94A3B8]">Capacidade de Retenção:</span>
            <span className="text-[#00FF88]">{savingsPercent.toFixed(1)}% Guardado</span>
          </div>
          <div className="w-full h-2 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#00FF88] via-[#06B6D4] to-[#3B82F6] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,255,136,0.5)]"
              style={{ width: `${Math.min(savingsPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🛸 DECK DE MÉTRICAS CIBERNÉTICAS (7 colunas em grid 2x2) */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. RECEITAS DO PERÍODO */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#10B981] hover:border-[#10B981]/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">
              Fluxo de Entradas
            </span>
            <div className="p-2.5 bg-[#10B981]/15 text-[#10B981] rounded-xl border border-[#10B981]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-[#10B981] tracking-tight drop-shadow-[0_2px_10px_rgba(16,185,129,0.25)]">
              {formatBRL(periodIncome, isPrivacyMode)}
            </span>
            <div className="text-[11px] font-bold text-[#94A3B8] mt-1">
              Período: <span className="text-[#F8FAFC]">{periodLabel}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#64748B] pt-2 border-t border-[#1E293B]">
            Total acumulado: {formatBRL(totalIncome, isPrivacyMode)}
          </div>
        </div>

        {/* 2. DESPESAS & BURN RATE */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#FF4D6D] hover:border-[#FF4D6D]/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">
              Burn Rate (Saídas)
            </span>
            <div className="p-2.5 bg-[#FF4D6D]/15 text-[#FF4D6D] rounded-xl border border-[#FF4D6D]/30">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-[#FF4D6D] tracking-tight drop-shadow-[0_2px_10px_rgba(255,77,109,0.25)]">
              {formatBRL(periodExpense, isPrivacyMode)}
            </span>
            <div className="text-[11px] font-bold text-[#94A3B8] mt-1">
              Consome <strong className="text-[#FF4D6D]">{burnRatePct}%</strong> da receita
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]">
            <div
              className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FF4D6D] rounded-full"
              style={{ width: `${burnRatePct}%` }}
            />
          </div>
        </div>

        {/* 3. DÍVIDAS & CARTÕES */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#F59E0B] hover:border-[#F59E0B]/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">
              Passivos & Cartões
            </span>
            <div className="p-2.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-[#F59E0B] tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
              {formatBRL(totalDebt, isPrivacyMode)}
            </span>
            <div className="text-[11px] font-medium text-[#94A3B8] mt-1">
              Faturas em aberto e empréstimos
            </div>
          </div>
          <div className="text-[10px] text-[#F59E0B] font-bold pt-2 border-t border-[#1E293B]">
            Status: Sob Controle
          </div>
        </div>

        {/* 4. BALANÇO LÍQUIDO MENSAL */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#06B6D4] hover:border-[#06B6D4]/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">
              Superávit do Período
            </span>
            <div className="p-2.5 bg-[#06B6D4]/15 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className={`text-2xl font-black tracking-tight drop-shadow-md ${periodSavings >= 0 ? 'text-[#06B6D4]' : 'text-[#FF4D6D]'}`}>
              {formatBRL(periodSavings, isPrivacyMode)}
            </span>
            <div className="text-[11px] font-bold text-[#94A3B8] mt-1">
              {periodSavings >= 0 ? '✨ Superávit Positivo' : '⚠️ Déficit no Mês'}
            </div>
          </div>
          <div className="text-[10px] text-[#06B6D4] font-bold pt-2 border-t border-[#1E293B]">
            {formatPercent(savingsPercent)} de margem financeira
          </div>
        </div>
      </div>
    </motion.div>
  );
};
