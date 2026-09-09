import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { Activity, ShieldCheck, Award, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

import { calculateFinancialHealthScore } from '../../utilidades/financialScore';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ isOpen, onClose }) => {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const { score, level, levelColor, breakdown, recommendations } = useMemo(() => {
    return calculateFinancialHealthScore(transactions, wallets, debtContracts);
  }, [transactions, wallets, debtContracts]);

  const levelTheme: Record<string, { banner: string; iconBox: string; text: string; badge: string }> = {
    EXCELENTE: {
      banner: 'bg-[#00FF88]/5 border-[#00FF88]/30',
      iconBox: 'bg-[#00FF88]/20 border-[#00FF88]/40 text-[#00FF88]',
      text: 'text-[#00FF88]',
      badge: 'bg-[#00FF88]/20 border-[#00FF88]/40 text-[#00FF88]',
    },
    BOM: {
      banner: 'bg-[#06B6D4]/5 border-[#06B6D4]/30',
      iconBox: 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]',
      text: 'text-[#06B6D4]',
      badge: 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]',
    },
    ATENCAO: {
      banner: 'bg-[#F59E0B]/5 border-[#F59E0B]/30',
      iconBox: 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#F59E0B]',
      text: 'text-[#F59E0B]',
      badge: 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#F59E0B]',
    },
    CRITICO: {
      banner: 'bg-[#FF4D6D]/5 border-[#FF4D6D]/30',
      iconBox: 'bg-[#FF4D6D]/20 border-[#FF4D6D]/40 text-[#FF4D6D]',
      text: 'text-[#FF4D6D]',
      badge: 'bg-[#FF4D6D]/20 border-[#FF4D6D]/40 text-[#FF4D6D]',
    },
  };

  const currentTheme = levelTheme[level] || levelTheme.EXCELENTE;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auditoria de Saúde Financeira & Score" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner do Score com Medidor Vivo */}
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden ${currentTheme.banner}`}
        >
          <div className="flex items-center gap-5">
            <div
              className={`p-4 rounded-2xl border shadow-lg animate-pulse ${currentTheme.iconBox}`}
            >
              <Activity className="w-10 h-10" />
            </div>

            <div className="flex flex-col text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#94A3B8]">
                Pontuação Diagnóstica
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2 my-1">
                <span className={`text-5xl font-black drop-shadow-md ${currentTheme.text}`}>
                  {score}
                </span>
                <span className="text-sm font-bold text-[#64748B]">/ 1000 pts</span>
              </div>
              <span className="text-xs font-bold text-[#94A3B8]">
                Nível Atual: <strong className={currentTheme.text}>{level}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-2 ${currentTheme.badge}`}
            >
              <Award className="w-4 h-4" />
              <span>{level}</span>
            </span>
            <span className="text-[11px] text-[#64748B] font-bold">Base de Cálculo v2.0</span>
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
