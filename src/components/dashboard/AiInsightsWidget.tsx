import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, Zap, Lightbulb } from 'lucide-react';

interface AiInsightsWidgetProps {
  selectedMonth: string;
}

export const AiInsightsWidget: React.FC<AiInsightsWidgetProps> = ({ selectedMonth }) => {
  const { setActivePage, setBudgetModalOpen, isPrivacyMode } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];

  const insights = useMemo(() => {
    const monthTxs = transactions.filter((t) => {
      if (selectedMonth === 'all') return true;
      return t.date.startsWith(selectedMonth);
    });

    const inc = monthTxs.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const exp = monthTxs.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const net = inc - exp;
    const savingsRate = inc > 0 ? (net / inc) * 100 : 0;

    // Highest expense category
    const expCatMap: Record<string, number> = {};
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => {
      expCatMap[t.category] = (expCatMap[t.category] || 0) + t.amount;
    });

    let topCategory = '';
    let topCatAmount = 0;
    Object.entries(expCatMap).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCatAmount = val;
        topCategory = cat;
      }
    });

    const list = [];

    // Insight 1: Taxa de Poupança / Saúde Financeira
    if (inc > 0) {
      if (savingsRate >= 20) {
        list.push({
          id: 'ins_savings_high',
          type: 'positive',
          icon: <ShieldCheck className="w-5 h-5 text-[#00FF88]" />,
          title: 'Excelência Financeira!',
          message: `Sua taxa de poupança no mês está em excelentes ${formatPercent(savingsRate)}. Você guardou ${formatBRL(net, isPrivacyMode)}.`,
          badge: 'Saúde 10/10',
          badgeColor: 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30',
          actionText: 'Ver Metas',
          onAction: () => setActivePage('goals'),
        });
      } else if (savingsRate > 0) {
        list.push({
          id: 'ins_savings_mid',
          type: 'warning',
          icon: <Lightbulb className="w-5 h-5 text-[#F59E0B]" />,
          title: 'Oportunidade de Aporte',
          message: `Você poupou ${formatPercent(savingsRate)} da sua renda (${formatBRL(net, isPrivacyMode)}). A meta ideal da regra 50-30-20 é poupar ao menos 20%.`,
          badge: 'Meta 20%',
          badgeColor: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
          actionText: 'Simular F.I.R.E',
          onAction: () => setActivePage('calculator'),
        });
      } else {
        list.push({
          id: 'ins_savings_neg',
          type: 'danger',
          icon: <AlertTriangle className="w-5 h-5 text-[#FF4D6D]" />,
          title: 'Déficit no Período',
          message: `Suas despesas superaram suas receitas em ${formatBRL(Math.abs(net), isPrivacyMode)}. Revise os gastos de maior impacto.`,
          badge: 'Alerta Vermelho',
          badgeColor: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border-[#FF4D6D]/30',
          actionText: 'Ajustar Orçamentos',
          onAction: () => setBudgetModalOpen(true),
        });
      }
    }

    // Insight 2: Categoria de Maior Impacto
    if (topCategory && topCatAmount > 0) {
      const topCatPct = exp > 0 ? (topCatAmount / exp) * 100 : 0;
      list.push({
        id: 'ins_top_cat',
        type: 'info',
        icon: <Zap className="w-5 h-5 text-[#06B6D4]" />,
        title: `Maior Ofensor: ${topCategory}`,
        message: `A categoria ${topCategory} consome ${formatPercent(topCatPct)} do total das suas despesas (${formatBRL(topCatAmount, isPrivacyMode)}).`,
        badge: `${formatPercent(topCatPct)} das Despesas`,
        badgeColor: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30',
        actionText: 'Definir Teto',
        onAction: () => setBudgetModalOpen(true),
      });
    }

    // Insight 3: Dica de Orçamento Inteligente
    if (budgets.length === 0) {
      list.push({
        id: 'ins_budget_hint',
        type: 'info',
        icon: <Sparkles className="w-5 h-5 text-[#A855F7]" />,
        title: 'Inteligência de Orçamento',
        message: 'Defina limites de orçamento por categoria para receber notificações preditivas antes de estourar seus gastos.',
        badge: 'Recurso Premium',
        badgeColor: 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/30',
        actionText: 'Ativar Orçamentos',
        onAction: () => setBudgetModalOpen(true),
      });
    }

    return list;
  }, [transactions, budgets, selectedMonth, isPrivacyMode, setActivePage, setBudgetModalOpen]);

  if (insights.length === 0) return null;

  return (
    <Card glow glowColor="#A855F7" className="hover:border-[#A855F7]/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#A855F7]/15 text-[#A855F7] rounded-xl border border-[#A855F7]/30 shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
              IaFinanceira Insights
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-[#A855F7]/30 to-[#00FF88]/30 border border-[#A855F7]/50 text-[#F8FAFC]">
                IA Ativa
              </span>
            </h3>
            <p className="text-xs text-[#94A3B8] font-medium">Recomendações financeiras personalizadas em tempo real</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-[#0A0B0E]/80 border border-[#1E2330] hover:border-[#3B4C6A] rounded-xl flex flex-col justify-between gap-3 transition-all group"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed font-medium">
                {item.message}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={item.onAction}
              className="w-full text-xs justify-between border-[#2E3B52] hover:border-[#00FF88]/40 hover:bg-[#00FF88]/10 text-[#F8FAFC] hover:text-[#00FF88]"
            >
              <span>{item.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
