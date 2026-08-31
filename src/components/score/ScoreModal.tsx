import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Activity, ShieldCheck, Award, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ isOpen, onClose }) => {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const { score, level, levelColor, breakdown, recommendations } = useMemo(() => {
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

    const recs: string[] = [];
    if (reserveScore < 200) recs.push('Aumente a sua reserva de emergência para cobrir pelo menos 6 meses de custo fixo.');
    if (debtScore < 200) recs.push('Faça amortizações aceleradas no contrato de dívida com maior taxa de juros.');
    if (savingsScore < 150) recs.push('Tente reter ao menos 20% das suas entradas mensais na conta poupança.');
    if (walletScore < 150) recs.push('Cadastre ao menos 3 contas/carteiras para diversificar o patrimônio.');
    if (recs.length === 0) recs.push('Parabéns! Sua saúde financeira está em nível máximo de excelência e proteção.');

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
      recommendations: recs,
    };
  }, [transactions, wallets, debtContracts]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Score de Saúde Financeira & Crédito" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Banner do Score com Medidor Vivo */}
        <div
          className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: `${levelColor}0D`,
            borderColor: `${levelColor}40`,
          }}
        >
          <div className="flex items-center gap-5">
            <div
              className="p-4 rounded-2xl border shadow-lg animate-pulse"
              style={{
                backgroundColor: `${levelColor}20`,
                borderColor: `${levelColor}60`,
                color: levelColor,
              }}
            >
              <Activity className="w-10 h-10" />
            </div>

            <div className="flex flex-col text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#94A3B8]">
                Pontuação Diagnóstica
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2 my-1">
                <span className="text-5xl font-black drop-shadow-md" style={{ color: levelColor }}>
                  {score}
                </span>
                <span className="text-sm font-bold text-[#64748B]">/ 1000 pts</span>
              </div>
              <span className="text-xs font-bold text-[#94A3B8]">
                Nível Atual: <strong style={{ color: levelColor }}>{level}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <span
              className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-2"
              style={{
                backgroundColor: `${levelColor}20`,
                borderColor: `${levelColor}60`,
                color: levelColor,
              }}
            >
              <Award className="w-4 h-4" />
              <span>{level}</span>
            </span>
            <span className="text-[11px] text-[#64748B] font-medium text-center sm:text-right">
              Calculado em tempo real
            </span>
          </div>
        </div>

        {/* Detalhamento dos 4 Pilares de Avaliação */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            <span>Detalhamento dos 4 Pilares Patrimoniais</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#090D18] border border-[#1E293B] rounded-xl flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-bold">Reserva de Emergência</span>
              <span className="text-xs font-black text-[#00FF88]">{breakdown.reserveScore} / 300 pts</span>
            </div>
            <div className="p-3.5 bg-[#090D18] border border-[#1E293B] rounded-xl flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-bold">Saúde de Dívidas</span>
              <span className="text-xs font-black text-[#06B6D4]">{breakdown.debtScore} / 300 pts</span>
            </div>
            <div className="p-3.5 bg-[#090D18] border border-[#1E293B] rounded-xl flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-bold">Retenção de Salário</span>
              <span className="text-xs font-black text-[#F59E0B]">{breakdown.savingsScore} / 200 pts</span>
            </div>
            <div className="p-3.5 bg-[#090D18] border border-[#1E293B] rounded-xl flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-bold">Organização Bancária</span>
              <span className="text-xs font-black text-[#A855F7]">{breakdown.walletScore} / 200 pts</span>
            </div>
          </div>
        </div>

        {/* Recomendações Táticas para Subir o Score */}
        <div className="p-4 bg-[#0A0E1A] border border-[#2E3B52] rounded-2xl flex flex-col gap-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Recomendações Táticas de IA</span>
          </h4>

          <div className="flex flex-col gap-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#CBD5E1] font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88] shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
