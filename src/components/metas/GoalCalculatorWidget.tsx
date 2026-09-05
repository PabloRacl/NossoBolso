import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Goal } from '../../tipos';
import { formatBRL } from '../../utilidades/formatters';
import { useAppStore } from '../../estado/useAppStore';
import { Target, Calendar, Clock, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export const GoalCalculatorWidget: React.FC<{ goals: Goal[] }> = ({ goals }) => {
  const { isPrivacyMode } = useAppStore();

  const metrics = useMemo(() => {
    if (!goals.length) return [];

    const today = new Date();

    return goals.map((g) => {
      const targetDate = g.deadline ? new Date(g.deadline) : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
      const diffMonths = Math.max(Math.ceil(diffDays / 30), 1);

      const remainingAmount = Math.max(g.targetAmount - g.currentAmount, 0);
      const dailyNeeded = remainingAmount / diffDays;
      const monthlyNeeded = remainingAmount / diffMonths;

      const progressPct = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);

      return {
        ...g,
        diffDays,
        diffMonths,
        remainingAmount,
        dailyNeeded,
        monthlyNeeded,
        progressPct,
      };
    });
  }, [goals]);

  if (!goals.length) return null;

  return (
    <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-[#A855F7] hover:border-[#A855F7]/60 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#A855F7]/15 text-[#A855F7] rounded-xl border border-[#A855F7]/30">
            <Target className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Calculadora de Aportes & Contagem Regressiva de Metas</h3>
            <p className="text-[11px] text-[#94A3B8] font-medium">Ritmo diário e mensal necessário para conquistar seus objetivos no prazo</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-[#A855F7]/15 border border-[#A855F7]/30 rounded-full text-xs font-black text-[#A855F7]">
          {goals.length} Meta(s) Ativa(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.id} className="p-3.5 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#A855F7]/40 rounded-xl flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <h4 className="text-xs font-black text-[#F8FAFC]">{m.name}</h4>
                <span className="text-[10px] text-[#94A3B8] font-semibold">Alvo: {formatBRL(m.targetAmount, isPrivacyMode)}</span>
              </div>
              <span className="text-[10px] font-black text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded border border-[#00FF88]/20">
                {m.progressPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-[#0A0D1A] border border-[#1E293B] rounded-lg">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#94A3B8] font-bold">Aporte Diário:</span>
                <strong className="text-[#00FF88] font-black">{formatBRL(m.dailyNeeded, isPrivacyMode)}/dia</strong>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] text-[#94A3B8] font-bold">Aporte Mensal:</span>
                <strong className="text-[#06B6D4] font-black">{formatBRL(m.monthlyNeeded, isPrivacyMode)}/mês</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#1E293B]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#A855F7]" />
                {m.diffDays} dias restantes
              </span>
              <span className="font-bold text-[#94A3B8]">Faltam {formatBRL(m.remainingAmount, isPrivacyMode)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
