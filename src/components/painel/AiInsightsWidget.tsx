import React, { useMemo } from 'react';
import { useAppStore } from '../../estado/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { formatBRL, formatPercent } from '../../utilidades/formatters';
import { ShieldCheck, AlertTriangle, ArrowRight, Zap, Lightbulb, Bot, Terminal, TrendingUp, PiggyBank } from 'lucide-react';
import { Button } from '../ui/Button';

interface AiInsightsWidgetProps {
  selectedMonth: string;
}

export const AiInsightsWidget: React.FC<AiInsightsWidgetProps> = ({ selectedMonth }) => {
  const { setActivePage, setBudgetModalOpen, isPrivacyMode } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];

  const analysis = useMemo(() => {
    const monthTxs = transactions.filter((t) => {
      if (selectedMonth === 'all') return true;
      return t.date.startsWith(selectedMonth);
    });

    const inc = monthTxs.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const exp = monthTxs.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const net = inc - exp;
    const retentionRate = inc > 0 ? (net / inc) * 100 : 0;

    // Categoria de maior gasto no mês
    const expCatMap: Record<string, number> = {};
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => {
      const cat = t.category || 'Outros';
      expCatMap[cat] = (expCatMap[cat] || 0) + t.amount;
    });

    let topCategory = '';
    let topCatAmount = 0;
    Object.entries(expCatMap).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCatAmount = val;
        topCategory = cat;
      }
    });

    const topCatPct = exp > 0 ? (topCatAmount / exp) * 100 : 0;

    // Status geral de saúde financeira
    let healthStatus: 'excellent' | 'warning' | 'critical' = 'excellent';
    if (net < 0) healthStatus = 'critical';
    else if (retentionRate < 20) healthStatus = 'warning';

    return {
      inc,
      exp,
      net,
      retentionRate,
      topCategory,
      topCatAmount,
      topCatPct,
      healthStatus,
      monthTxsCount: monthTxs.length,
    };
  }, [transactions, selectedMonth]);

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between gap-4 border border-[#A855F7]/40 hover:border-[#A855F7]/70 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
      {/* Cabeçalho Limpo & Claro */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2E3B52]/80 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-[#A855F7]/25 to-[#00FF88]/25 text-[#A855F7] rounded-xl border border-[#A855F7]/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Bot className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
              DIAGNÓSTICO FINANCEIRO DO MÊS
            </h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Resumo automático de saldo, retenção de caixa e alertas</p>
          </div>
        </div>

        {/* Badge Claro de Saúde Financeira */}
        <div>
          {analysis.healthStatus === 'excellent' ? (
            <span className="px-2.5 py-1 rounded-lg bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Saúde Financeira Forte
            </span>
          ) : analysis.healthStatus === 'warning' ? (
            <span className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              Retenção Baixa (Abaixo 20%)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Gastos Acima das Receitas
            </span>
          )}
        </div>
      </div>

      {/* Medidor Visual de Retenção de Salário */}
      <div className="p-3 bg-[#090D18]/90 border border-[#1E293B] rounded-xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#94A3B8] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#00FF88]" />
            Capacidade de Sobra / Poupança:
          </span>
          <span className={analysis.net >= 0 ? 'text-[#00FF88] font-black' : 'text-[#FF4D6D] font-black'}>
            {formatBRL(analysis.net, isPrivacyMode)} ({formatPercent(analysis.retentionRate)})
          </span>
        </div>

        <div className="w-full h-2 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.net < 0
                ? 'bg-[#FF4D6D]'
                : analysis.retentionRate >= 20
                ? 'bg-[#00FF88] shadow-[0_0_10px_#00FF88]'
                : 'bg-[#F59E0B]'
            }`}
            style={{ width: `${Math.max(Math.min(analysis.retentionRate, 100), 5)}%` }}
          />
        </div>
      </div>

      {/* Cards Práticos e Diretos */}
      <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
        {/* Card 1: Saldo Líquido */}
        <div className="p-3 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#00FF88]/40 rounded-xl flex items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00FF88]/15 text-[#00FF88] rounded-lg border border-[#00FF88]/30 shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#F8FAFC]">Balanço Mensal</span>
              <span className="text-[11px] text-[#94A3B8]">
                Recebido {formatBRL(analysis.inc, isPrivacyMode)} • Gastos {formatBRL(analysis.exp, isPrivacyMode)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage('goals')}
            className="text-[11px] font-bold border-[#2E3B52] hover:border-[#00FF88]/50 text-[#00FF88] shrink-0"
          >
            Ver Metas
          </Button>
        </div>

        {/* Card 2: Maior Gasto */}
        {analysis.topCategory && (
          <div className="p-3 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#06B6D4]/40 rounded-xl flex items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#06B6D4]/15 text-[#06B6D4] rounded-lg border border-[#06B6D4]/30 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#F8FAFC]">
                  Maior Categoria: <span className="text-[#06B6D4]">{analysis.topCategory}</span>
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Consome {formatPercent(analysis.topCatPct)} do total das despesas ({formatBRL(analysis.topCatAmount, isPrivacyMode)})
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBudgetModalOpen(true)}
              className="text-[11px] font-bold border-[#2E3B52] hover:border-[#06B6D4]/50 text-[#06B6D4] shrink-0"
            >
              Criar Teto
            </Button>
          </div>
        )}

        {/* Card 3: Recomendação Prática */}
        <div className="p-3 bg-[#090D18]/90 border border-[#1E293B] hover:border-[#A855F7]/40 rounded-xl flex items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#A855F7]/15 text-[#A855F7] rounded-lg border border-[#A855F7]/30 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#F8FAFC]">Dica de Rendimento</span>
              <span className="text-[11px] text-[#94A3B8]">
                {analysis.net > 0
                  ? `Mova os ${formatBRL(analysis.net, isPrivacyMode)} para render 100% CDI no banco.`
                  : 'Ajuste os tetos de gastos por categoria para evitar deficit.'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage('calculator')}
            className="text-[11px] font-bold border-[#2E3B52] hover:border-[#A855F7]/50 text-[#A855F7] shrink-0"
          >
            Simular CDI
          </Button>
        </div>
      </div>
    </div>
  );
};
