import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Activity, ShieldCheck, TrendingUp, AlertCircle, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export const FinancialHealthScoreWidget: React.FC = () => {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const { score, level, levelColor, breakdown } = useMemo(() => {
    // 1. Reserva de Emergência (300 pts)
    const savingsBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpensesEst = Math.max(totalExpenses, 3000);
    const monthsOfReserve = savingsBalance / monthlyExpensesEst;
    const reserveScore = Math.min(Math.round((monthsOfReserve / 6) * 300), 300);

    // 2. Comprometimento de Dívida (300 pts)
    const totalDebt = debtContracts.reduce((acc, d) => acc + (d.totalAmount || d.installmentAmount * d.totalInstallments), 0);
    const debtRatio = savingsBalance > 0 ? (totalDebt / savingsBalance) : 1;
    let debtScore = 300;
    if (debtRatio > 2) debtScore = 50;
    else if (debtRatio > 1) debtScore = 150;
    else if (debtRatio > 0.5) debtScore = 220;

    // 3. Taxa de Retenção de Poupança (200 pts)
    const income = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const savingsRate = income > 0 ? Math.max((income - totalExpenses) / income, 0) : 0.15;
    const savingsScore = Math.min(Math.round((savingsRate / 0.3) * 200), 200);

    // 4. Diversificação de Carteiras (200 pts)
    const walletScore = Math.min(wallets.length * 66, 200);

    const totalScore = Math.min(reserveScore + debtScore + savingsScore + walletScore, 1000);

    let lvl = 'EXCELENTE';
    let color = '#00FF88';
    if (totalScore < 500) {
      lvl = 'CRÍTICO';
      color = '#FF4D6D';
    } else if (totalScore < 700) {
      lvl = 'ATENÇÃO';
      color = '#F59E0B';
    } else if (totalScore < 850) {
      lvl = 'BOM';
      color = '#06B6D4';
    }

    return {
      score: totalScore,
      level: lvl,
      levelColor: color,
      breakdown: {
        reserveScore,
        debtScore,
        savingsScore,
        walletScore,
      },
    };
  }, [transactions, wallets, debtContracts]);

  const levelBadgeStyles: Record<string, string> = {
    EXCELENTE: 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]',
    BOM: 'bg-[#06B6D4]/15 border-[#06B6D4]/40 text-[#06B6D4]',
    ATENÇÃO: 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]',
    CRÍTICO: 'bg-[#FF4D6D]/15 border-[#FF4D6D]/40 text-[#FF4D6D]',
  };

  const levelTextStyles: Record<string, string> = {
    EXCELENTE: 'text-[#00FF88]',
    BOM: 'text-[#06B6D4]',
    ATENÇÃO: 'text-[#F59E0B]',
    CRÍTICO: 'text-[#FF4D6D]',
  };

  return (
    <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-[#00FF88] hover:border-[#00FF88]/60 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <Activity className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Score de Saúde Financeira & Crédito</h3>
            <p className="text-[11px] text-[#94A3B8] font-medium">Diagnóstico patrimonial calculado de 0 a 1000 Pontos</p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border ${levelBadgeStyles[level] || 'text-[#00FF88]'}`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{level}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Mostrador Numérico do Score */}
        <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase">Pontuação Atual</span>
          <span className={`text-4xl font-black my-1 drop-shadow-md ${levelTextStyles[level] || 'text-[#00FF88]'}`}>
            {score}
          </span>
          <span className="text-[10px] text-[#64748B] font-bold">de 1000 pontos possíveis</span>
        </div>

        {/* Detalhamento dos Pilares */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-[#0A0D1A] border border-[#1E293B] rounded-xl flex justify-between items-center">
            <span className="text-[#94A3B8]">Reserva de Emergência:</span>
            <strong className="text-[#00FF88]">{breakdown.reserveScore} / 300 pts</strong>
          </div>
          <div className="p-2.5 bg-[#0A0D1A] border border-[#1E293B] rounded-xl flex justify-between items-center">
            <span className="text-[#94A3B8]">Saúde de Dívidas:</span>
            <strong className="text-[#06B6D4]">{breakdown.debtScore} / 300 pts</strong>
          </div>
          <div className="p-2.5 bg-[#0A0D1A] border border-[#1E293B] rounded-xl flex justify-between items-center">
            <span className="text-[#94A3B8]">Retenção de Salário:</span>
            <strong className="text-[#F59E0B]">{breakdown.savingsScore} / 200 pts</strong>
          </div>
          <div className="p-2.5 bg-[#0A0D1A] border border-[#1E293B] rounded-xl flex justify-between items-center">
            <span className="text-[#94A3B8]">Organização Bancária:</span>
            <strong className="text-[#A855F7]">{breakdown.walletScore} / 200 pts</strong>
          </div>
        </div>
      </div>
    </Card>
  );
};
