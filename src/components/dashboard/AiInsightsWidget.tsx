import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { Sparkles, ShieldCheck, AlertTriangle, ArrowRight, Zap, Lightbulb, Bot, Terminal } from 'lucide-react';
import { Button } from '../ui/Button';

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
          title: 'EXCELÊNCIA DE RETENÇÃO DE CAIXA',
          message: `Sua taxa de poupança no mês atingiu ${formatPercent(savingsRate)}. Você reservou ${formatBRL(net, isPrivacyMode)} do seu faturamento total.`,
          badge: 'SCORE 10/10',
          badgeColor: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-[0_0_10px_rgba(0,255,136,0.2)]',
          actionText: 'Acessar Metas',
          onAction: () => setActivePage('goals'),
        });
      } else if (savingsRate > 0) {
        list.push({
          id: 'ins_savings_mid',
          type: 'warning',
          icon: <Lightbulb className="w-5 h-5 text-[#F59E0B]" />,
          title: 'OPORTUNIDADE DE REAPORTES',
          message: `Você acumulou ${formatPercent(savingsRate)} da sua renda (${formatBRL(net, isPrivacyMode)}). A diretriz ideal da Regra 50/30/20 indica ao menos 20%.`,
          badge: 'META 20%',
          badgeColor: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
          actionText: 'Simulador F.I.R.E',
          onAction: () => setActivePage('calculator'),
        });
      } else {
        list.push({
          id: 'ins_savings_neg',
          type: 'danger',
          icon: <AlertTriangle className="w-5 h-5 text-[#FF4D6D]" />,
          title: 'ALERTA DE BURN RATE ELEVADO',
          message: `Suas saídas superaram os aportes em ${formatBRL(Math.abs(net), isPrivacyMode)}. Recomendamos estipular limites de teto de gastos.`,
          badge: 'DÉFICIT CRÍTICO',
          badgeColor: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/40 animate-pulse',
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
        title: `MAIOR CONSUMIDOR DE CAIXA: ${topCategory.toUpperCase()}`,
        message: `A categoria ${topCategory} absorve ${formatPercent(topCatPct)} das suas saídas no mês (${formatBRL(topCatAmount, isPrivacyMode)}).`,
        badge: `${formatPercent(topCatPct)} DAS SAÍDAS`,
        badgeColor: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/40',
        actionText: 'Definir Teto de Categoria',
        onAction: () => setBudgetModalOpen(true),
      });
    }

    // Insight 3: Dica de Orçamento Inteligente
    if (budgets.length === 0) {
      list.push({
        id: 'ins_budget_hint',
        type: 'info',
        icon: <Sparkles className="w-5 h-5 text-[#A855F7]" />,
        title: 'MONITORAMENTO PREDITIVO DE TETO',
        message: 'Cadastre limites de gastos por categoria para ativar notificações preditivas do robô antes de comprometer seu balanço.',
        badge: 'RECURSO IA ATIVO',
        badgeColor: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/40',
        actionText: 'Ativar Tetos de Gastos',
        onAction: () => setBudgetModalOpen(true),
      });
    }

    return list;
  }, [transactions, budgets, selectedMonth, isPrivacyMode, setActivePage, setBudgetModalOpen]);

  if (insights.length === 0) return null;

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between gap-4 border border-[#A855F7]/40 hover:border-[#A855F7]/70 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
      {/* Header com Ícone de IA Preditiva */}
      <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-[#A855F7]/25 to-[#00FF88]/25 text-[#A855F7] rounded-xl border border-[#A855F7]/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Bot className="w-5 h-5 animate-pulse text-[#A855F7]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
              IA FINANCIAL CORE
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#A855F7]/20 border border-[#A855F7]/50 text-[#A855F7]">
                REDES NEURAIS ATIVAS
              </span>
            </h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Análise preditiva e recomendações financeiras vetoriais</p>
          </div>
        </div>
      </div>

      {/* Lista de Cards de Insights Preditivos */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#A855F7]/50 rounded-xl flex flex-col justify-between gap-3 transition-all group hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-xs font-black text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors tracking-wide">
                    {item.title}
                  </span>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border tracking-wider ${item.badgeColor}`}>
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
              className="w-full text-xs justify-between border-[#2E3B52] hover:border-[#A855F7]/50 hover:bg-[#A855F7]/15 text-[#F8FAFC] hover:text-[#A855F7] transition-all"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-[#A855F7]" />
                {item.actionText}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
