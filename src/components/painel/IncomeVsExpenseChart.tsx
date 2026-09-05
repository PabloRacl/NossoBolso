import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatBRL, formatPercent } from '../../utilidades/formatters';
import { useAppStore, getCurrentMonthKey } from '../../estado/useAppStore';
import { getTodayStr } from '../../utilidades/dateUtils';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Transaction } from '../../tipos';

interface IncomeVsExpenseChartProps {
  transactions?: Transaction[];
  data?: { month: string; income: number; expense: number }[];
}

type TimeframeType = '6m' | '12m' | 'all';
type ViewModeType = 'bar' | 'area';

interface TooltipItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  isPrivacyMode?: boolean;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isPrivacyMode }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return (
      <div className="bg-[#090D18]/95 border border-[#00FF88]/40 shadow-[0_0_30px_rgba(0,255,136,0.25)] backdrop-blur-2xl rounded-2xl p-4 flex flex-col gap-2 min-w-[230px] z-50">
        <span className="text-[11px] font-black text-[#00FF88] uppercase tracking-widest border-b border-[#2E3B52] pb-1.5 flex items-center justify-between">
          <span>📅 {label?.toUpperCase()}</span>
          <Activity className="w-3.5 h-3.5 text-[#00FF88] animate-pulse" />
        </span>

        <div className="flex items-center justify-between gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]" />
            Entradas:
          </span>
          <span className="font-black text-[#F8FAFC]">{formatBRL(income, isPrivacyMode)}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-[#FF4D6D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D] shadow-[0_0_8px_#FF4D6D]" />
            Saídas Realizadas:
          </span>
          <span className="font-black text-[#F8FAFC]">{formatBRL(expense, isPrivacyMode)}</span>
        </div>

        <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs font-black">
          <span className="text-[#94A3B8] uppercase text-[10px]">Resultado Líquido:</span>
          <span className={balance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'}>
            {formatBRL(balance, isPrivacyMode)}
          </span>
        </div>

        {income > 0 && (
          <div className="flex items-center justify-between text-[10px] text-[#06B6D4] font-extrabold pt-1">
            <span>Taxa de Poupança:</span>
            <span>{formatPercent(savingsRate)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({ transactions = [], data }) => {
  const { isPrivacyMode, selectedMonth } = useAppStore();
  const [timeframe, setTimeframe] = useState<TimeframeType>('6m');
  const [viewMode, setViewMode] = useState<ViewModeType>('bar');

  const todayStr = getTodayStr();

  // Processamento Dinâmico Centrado no Mês Selecionado / Atual (Sem saltar para 2029)
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return data || [];
    }

    const targetMonthKey = (selectedMonth && selectedMonth !== 'all') ? selectedMonth : getCurrentMonthKey();
    const [targetY, targetM] = targetMonthKey.split('-').map(Number);
    const monthsCount = timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : 12;

    const monthKeys: string[] = [];

    if (timeframe === 'all') {
      // Coletar meses até a data atual / selecionada
      const monthsSet = new Set<string>();
      transactions.forEach((t) => {
        if (t.date && t.date <= todayStr && t.date.length >= 7) {
          monthsSet.add(t.date.substring(0, 7));
        }
      });
      monthsSet.add(targetMonthKey);
      monthKeys.push(...Array.from(monthsSet).sort());
    } else {
      // Gerar N meses anteriores terminando no targetMonthKey
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(targetY, targetM - 1 - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthKeys.push(`${y}-${m}`);
      }
    }

    return monthKeys.map((mKey) => {
      const [y, m] = mKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, 1);
      const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      // Filtrar transações do mês
      const monthTxs = transactions.filter((t) => t.date && t.date.startsWith(mKey));
      const inc = monthTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const exp = monthTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      return {
        monthKey: mKey,
        month: monthName,
        income: inc,
        expense: exp,
        balance: inc - exp,
      };
    });
  }, [transactions, data, timeframe, selectedMonth, todayStr]);

  // Totais do Período para a Telemetria Superior
  const periodTotals = useMemo(() => {
    const totalInc = chartData.reduce((acc, d) => acc + d.income, 0);
    const totalExp = chartData.reduce((acc, d) => acc + d.expense, 0);
    const netBalance = totalInc - totalExp;
    const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

    return {
      totalInc,
      totalExp,
      netBalance,
      savingsRate,
    };
  }, [chartData]);

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col min-h-[420px] border border-[#00FF88]/30 shadow-[0_0_25px_rgba(0,255,136,0.1)]">
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-col gap-3 mb-4 border-b border-[#2E3B52]/80 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
              <BarChart3 className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">HISTOGRAMA DE FLUXO & VELOCIDADE</h3>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Análise de entradas e saídas realizadas</p>
            </div>
          </div>

          {/* Controles de Filtro de Período (6M / 12M / Todo Histórico) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setTimeframe('6m')}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                  timeframe === '6m'
                    ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                6 Meses
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('12m')}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                  timeframe === '12m'
                    ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                1 Ano (12M)
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                  timeframe === 'all'
                    ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Todo Histórico
              </button>
            </div>

            {/* Alternador de Modo Visual (Barras / Áreas) */}
            <div className="flex items-center p-1 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setViewMode('bar')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'bar' ? 'bg-[#162032] text-[#00FF88]' : 'text-[#64748B]'
                }`}
                title="Visão por Barras"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('area')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'area' ? 'bg-[#162032] text-[#00FF88]' : 'text-[#64748B]'
                }`}
                title="Visão por Área"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Telemetria Resumida do Período */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 bg-[#090D18] border border-[#00FF88]/20 rounded-xl flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Entradas Período</span>
            <span className="text-xs font-black text-[#00FF88] mt-0.5">
              {formatBRL(periodTotals.totalInc, isPrivacyMode)}
            </span>
          </div>

          <div className="p-2 bg-[#090D18] border border-[#FF4D6D]/20 rounded-xl flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Saídas Período</span>
            <span className="text-xs font-black text-[#FF4D6D] mt-0.5">
              {formatBRL(periodTotals.totalExp, isPrivacyMode)}
            </span>
          </div>

          <div className="p-2 bg-[#090D18] border border-[#06B6D4]/20 rounded-xl flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Saldo Acumulado</span>
            <span
              className={`text-xs font-black mt-0.5 ${
                periodTotals.netBalance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
              }`}
            >
              {formatBRL(periodTotals.netBalance, isPrivacyMode)}
            </span>
          </div>

          <div className="p-2 bg-[#090D18] border border-[#A855F7]/20 rounded-xl flex flex-col">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase">Taxa de Economia</span>
            <span className="text-xs font-black text-[#A855F7] mt-0.5">
              {formatPercent(periodTotals.savingsRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="flex-1 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyberIncomeGradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cyberExpenseGradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D6D" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF4D6D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} opacity={0.6} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (isPrivacyMode ? '•••••' : `R$${v}`)} />
              <Tooltip content={<CustomChartTooltip isPrivacyMode={isPrivacyMode} />} />
              <Area type="monotone" dataKey="income" name="Entradas" stroke="#00FF88" strokeWidth={3} fillOpacity={1} fill="url(#cyberIncomeGradArea)" />
              <Area type="monotone" dataKey="expense" name="Saídas" stroke="#FF4D6D" strokeWidth={2.5} fillOpacity={1} fill="url(#cyberExpenseGradArea)" />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyberIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity={1} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="cyberExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D6D" stopOpacity={1} />
                  <stop offset="100%" stopColor="#991B1B" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} opacity={0.6} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (isPrivacyMode ? '•••••' : `R$${v}`)}
              />
              <Tooltip
                content={<CustomChartTooltip isPrivacyMode={isPrivacyMode} />}
                cursor={{ fill: 'rgba(0, 255, 136, 0.05)', rx: 8 }}
              />
              <Bar dataKey="income" name="Entradas" fill="url(#cyberIncomeGrad)" radius={[8, 8, 0, 0]} maxBarSize={38} />
              <Bar dataKey="expense" name="Saídas" fill="url(#cyberExpenseGrad)" radius={[8, 8, 0, 0]} maxBarSize={38} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
