import React from 'react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { Target, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface BudgetProgressWidgetProps {
  selectedMonth: string;
}

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({ selectedMonth }) => {
  const { setBudgetModalOpen, isPrivacyMode } = useAppStore();

  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  // Filter transactions by selected month
  const monthlyExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    if (selectedMonth === 'all') return true;
    return tx.date.startsWith(selectedMonth);
  });

  // Aggregate spending by category
  const spendingByCategory = monthlyExpenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  if (budgets.length === 0) {
    return (
      <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
        <div className="flex items-center justify-between mb-3 border-b border-[#2E3B52]/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
              <Target className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">RADAR DE TETOS DE ORÇAMENTO</h3>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Monitoramento de estresse financeiro por categoria</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setBudgetModalOpen(true)} className="border-[#00FF88]/40 text-[#00FF88]">
            <Target className="w-4 h-4" />
            <span>Ativar Tetos</span>
          </Button>
        </div>
        <div className="p-4 bg-[#090D18]/80 border border-[#1E293B] rounded-xl flex items-center justify-between gap-4">
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
            💡 Você ainda não possui limites estipulados. Defina tetos de gastos para Alimentação, Lazer e Moradia para ter leituras preditivas no radar!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between gap-4 border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <Target className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">RADAR DE TETOS DE ORÇAMENTO</h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Gastos executados vs Limites de teto estipulados</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setBudgetModalOpen(true)} className="text-[#00FF88] hover:bg-[#00FF88]/10 text-xs font-bold">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
          Gerenciar
        </Button>
      </div>

      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 w-full">
        {budgets.map((b) => {
          const categoryObj = categories.find((c) => c.name === b.category);
          const spent = spendingByCategory[b.category] || 0;
          const limit = b.monthlyLimit;
          const pct = Math.min(Math.round((spent / limit) * 100), 999);
          const isOver = spent > limit;
          const isWarning = !isOver && pct >= 80;

          const progressColor = isOver
            ? 'bg-gradient-to-r from-[#FF4D6D] to-[#EF4444] shadow-[0_0_12px_rgba(255,77,109,0.5)]'
            : isWarning
            ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFB300] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
            : 'bg-gradient-to-r from-[#00FF88] to-[#06B6D4] shadow-[0_0_12px_rgba(0,255,136,0.5)]';

          return (
            <div
              key={b.id}
              className="w-full p-3.5 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#00FF88]/40 rounded-xl flex flex-col gap-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryObj?.emoji || '📂'}</span>
                  <span className="text-xs font-black text-[#F8FAFC] tracking-wide">{b.category}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  {isOver ? (
                    <span className="flex items-center gap-1 text-[#FF4D6D] bg-[#FF4D6D]/15 px-2 py-0.5 rounded-md border border-[#FF4D6D]/40 text-[9px] font-black uppercase tracking-wider animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      TETO EXCEDIDO ({pct}%)
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md border border-[#F59E0B]/40 text-[9px] font-black uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" />
                      ATENÇÃO ({pct}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#00FF88] bg-[#00FF88]/15 px-2 py-0.5 rounded-md border border-[#00FF88]/40 text-[9px] font-black uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      {pct}% UTILIZADO
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar com Neon Laser */}
              <div className="w-full h-2.5 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]/80 p-0.5">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
                <span>Executado: <strong className="text-[#F8FAFC]">{formatBRL(spent, isPrivacyMode)}</strong></span>
                <span>Teto Limite: <strong className="text-[#00FF88]">{formatBRL(limit, isPrivacyMode)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
