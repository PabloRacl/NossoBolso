import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { Target, AlertTriangle, CheckCircle2, SlidersHorizontal, Plus, ShieldAlert } from 'lucide-react';

interface BudgetProgressWidgetProps {
  selectedMonth: string;
}

const DEFAULT_SUGGESTED_BUDGETS = [
  { category: 'Alimentação & Mercado', monthlyLimit: 1200 },
  { category: 'Transporte & Combustível', monthlyLimit: 600 },
  { category: 'Lazer & Restaurantes', monthlyLimit: 400 },
];

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({ selectedMonth }) => {
  const { setBudgetModalOpen, isPrivacyMode } = useAppStore();

  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  // Filtrar despesas do mês selecionado
  const monthlyExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    if (selectedMonth === 'all') return true;
    return tx.date && tx.date.startsWith(selectedMonth);
  });

  // Somar despesas por categoria
  const spendingByCategory = monthlyExpenses.reduce((acc, tx) => {
    const cat = tx.category || 'Outros';
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // Totais Consolidados de Tetos
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpentInBudgets = budgets.reduce((acc, b) => acc + (spendingByCategory[b.category] || 0), 0);
  const remainingBudgetTotal = Math.max(totalBudgetLimit - totalSpentInBudgets, 0);
  const totalBudgetUsagePercent = totalBudgetLimit > 0 ? (totalSpentInBudgets / totalBudgetLimit) * 100 : 0;

  // Função para criar tetos sugeridos com 1 clique
  const handleAddSuggestedBudgets = async () => {
    for (const b of DEFAULT_SUGGESTED_BUDGETS) {
      const exists = budgets.some((item) => item.category === b.category);
      if (!exists) {
        await db.budgets.add({
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: b.category,
          monthlyLimit: b.monthlyLimit,
        });
      }
    }
  };

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between gap-4 border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2E3B52]/80 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <Target className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">RADAR DE TETOS DE ORÇAMENTO</h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Limites de gastos estipulados por categoria vs valor executado</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budgets.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSuggestedBudgets}
              className="border-[#00FF88]/40 text-[#00FF88] text-xs font-bold hover:bg-[#00FF88]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tetos Sugeridos</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBudgetModalOpen(true)}
            className="text-[#00FF88] hover:bg-[#00FF88]/10 text-xs font-bold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Gerenciar Tetos
          </Button>
        </div>
      </div>

      {/* Telemetria Consolidada dos Tetos */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#090D18]/90 border border-[#1E293B] rounded-xl text-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Teto Estipulado</span>
            <span className="text-xs font-black text-[#F8FAFC] mt-0.5">
              {formatBRL(totalBudgetLimit, isPrivacyMode)}
            </span>
          </div>

          <div className="flex flex-col border-x border-[#1E293B]">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Gasto Executado</span>
            <span
              className={`text-xs font-black mt-0.5 ${
                totalSpentInBudgets > totalBudgetLimit ? 'text-[#FF4D6D]' : 'text-[#00FF88]'
              }`}
            >
              {formatBRL(totalSpentInBudgets, isPrivacyMode)} ({formatPercent(totalBudgetUsagePercent)})
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Saldo Livre Restante</span>
            <span className="text-xs font-black text-[#00FF88] mt-0.5">
              {formatBRL(remainingBudgetTotal, isPrivacyMode)}
            </span>
          </div>
        </div>
      )}

      {/* Lista dos Tetos por Categoria */}
      {budgets.length === 0 ? (
        <div className="p-4 bg-[#090D18]/80 border border-[#1E293B] rounded-xl flex flex-col gap-3">
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
            💡 Você ainda não possui limites estipulados. Defina tetos de gastos para <strong>Alimentação</strong>, <strong>Lazer</strong> e <strong>Transporte</strong> para ter leituras preditivas no radar!
          </p>
          <Button variant="primary" size="sm" onClick={handleAddSuggestedBudgets} className="w-full">
            <Plus className="w-4 h-4" />
            <span>Criar Tetos de Orçamento Recomendados</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 w-full">
          {budgets.map((b) => {
            const categoryObj = categories.find((c) => c.name === b.category);
            const spent = spendingByCategory[b.category] || 0;
            const limit = b.monthlyLimit;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const remaining = Math.max(limit - spent, 0);
            const isOver = spent > limit;
            const isWarning = !isOver && pct >= 80;

            return (
              <div
                key={b.id}
                className={`w-full p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                  isOver
                    ? 'bg-[#18090C]/90 border-[#FF4D6D]/60 shadow-[0_0_20px_rgba(255,77,109,0.2)]'
                    : isWarning
                    ? 'bg-[#181309]/90 border-[#F59E0B]/50'
                    : 'bg-[#090D18]/90 border-[#1E293B] hover:border-[#00FF88]/40'
                }`}
              >
                {/* Linha 1: Ícone + Nome da Categoria + Badge de Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{categoryObj?.emoji || '📂'}</span>
                    <span className="text-xs font-black text-[#F8FAFC] tracking-wide">{b.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-extrabold">
                    {isOver ? (
                      <Badge variant="danger" size="sm" className="animate-pulse flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        EXCEDIDO EM {formatBRL(spent - limit, isPrivacyMode)} ({pct}%)
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="warning" size="sm" className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        ATENÇÃO ({pct}%)
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pct}% UTILIZADO
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso Padronizada do Design System */}
                <ProgressBar
                  value={pct}
                  variant={isOver ? 'rose' : isWarning ? 'amber' : 'emerald'}
                  size="md"
                />

                {/* Linha 2: Valores com Restante Livre Claro */}
                <div className="flex items-center justify-between text-[11px] font-bold text-[#94A3B8]">
                  <span>
                    Gasto Executado: <strong className="text-[#F8FAFC]">{formatBRL(spent, isPrivacyMode)}</strong> de{' '}
                    <strong className="text-[#00FF88]">{formatBRL(limit, isPrivacyMode)}</strong>
                  </span>
                  <span>
                    Disponível:{' '}
                    <strong className={isOver ? 'text-[#FF4D6D]' : 'text-[#00FF88]'}>
                      {isOver ? 'R$ 0,00' : formatBRL(remaining, isPrivacyMode)}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
