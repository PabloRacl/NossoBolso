import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressWidgetProps {
  selectedMonth: string;
}

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({ selectedMonth }) => {
  const { setBudgetModalOpen, isPrivacyMode } = useAppStore();

  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  // Filter transactions by selected month (or all if selectedMonth === 'all')
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
      <Card className="hover:border-[#00FF88]/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#00FF88]/10 text-[#00FF88] rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Teto de Orçamentos</h3>
              <p className="text-xs text-[#94A3B8] font-medium">Controle de limites por categoria</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setBudgetModalOpen(true)} className="border-[#00FF88]/40 text-[#00FF88]">
            <Target className="w-4 h-4" />
            <span>Definir Limites</span>
          </Button>
        </div>
        <div className="p-4 bg-[#0A0B0E]/60 border border-[#1E2330] rounded-xl flex items-center justify-between gap-4">
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
            💡 Você ainda não definiu um teto de gastos. Defina metas para Alimentação, Lazer e Transporte para evitar estouros no mês!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:border-[#00FF88]/20 transition-all duration-300 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#00FF88]/10 text-[#00FF88] rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Acompanhamento do Orçamento</h3>
            <p className="text-xs text-[#94A3B8] font-medium">Gastos reais vs Teto estipulado</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setBudgetModalOpen(true)} className="text-[#00FF88] hover:bg-[#00FF88]/10">
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
            ? 'bg-[#FF4D6D]'
            : isWarning
            ? 'bg-[#F59E0B]'
            : 'bg-[#00FF88]';

          return (
            <div
              key={b.id}
              className="w-full p-3.5 bg-[#0A0B0E]/80 border border-[#1E2330] hover:border-[#2E3B52] rounded-xl flex flex-col gap-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryObj?.emoji || '📂'}</span>
                  <span className="text-xs font-bold text-[#F8FAFC]">{b.category}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  {isOver ? (
                    <span className="flex items-center gap-1 text-[#FF4D6D] bg-[#FF4D6D]/10 px-2 py-0.5 rounded-md border border-[#FF4D6D]/30 text-[10px]">
                      <AlertTriangle className="w-3 h-3" />
                      Estourou ({pct}%)
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-md border border-[#F59E0B]/30 text-[10px]">
                      <AlertTriangle className="w-3 h-3" />
                      Atenção ({pct}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-md border border-[#00FF88]/30 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {pct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-[#94A3B8]">
                <span>Gasto: <strong className="text-[#F8FAFC]">{formatBRL(spent, isPrivacyMode)}</strong></span>
                <span>Teto: <strong className="text-[#94A3B8]">{formatBRL(limit, isPrivacyMode)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
