import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { PieChart as PieIcon, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Transaction } from '../../types';

interface ExpensePieChartProps {
  transactions?: Transaction[];
  selectedMonth?: string;
  data?: { name: string; value: number }[];
}

// Paletas Suaves e Confortáveis para a Visão (Anti-Fadiga Visual)
const INCOME_PALETTE = [
  '#00FF88', // Cyber Emerald (Salário / Renda Principal)
  '#06B6D4', // Cyan
  '#10B981', // Soft Emerald
  '#34D399', // Mint Green
  '#00F5D4', // Aqua
  '#2DD4BF', // Turquoise
  '#3B82F6', // Royal Blue
  '#A7F3D0', // Pale Mint
];

const EXPENSE_PALETTE = [
  '#3B82F6', // Royal Blue (Transporte / Geral)
  '#F59E0B', // Amber (Alimentação / Mercado)
  '#8B5CF6', // Soft Violet (Moradia / Contas)
  '#EC4899', // Soft Rose (Saúde)
  '#06B6D4', // Soft Cyan (Lazer)
  '#6366F1', // Indigo (Educação)
  '#F43F5E', // Soft Crimson (Impostos / Dívidas)
  '#10B981', // Emerald
  '#D97706', // Warm Amber
  '#A855F7', // Purple
];

// Mapeamento Inteligente por Nome de Categoria para Garantir Cores Semânticas
const getCategoryColor = (name: string, type: 'income' | 'expense', index: number): string => {
  const normalizedName = name.toLowerCase();

  if (type === 'income') {
    if (normalizedName.includes('salário') || normalizedName.includes('salario') || normalizedName.includes('holerite')) {
      return '#00FF88'; // Verde Esmeralda Vibrante para Salário
    }
    if (normalizedName.includes('investimento') || normalizedName.includes('rendimento')) {
      return '#06B6D4'; // Ciano para Investimentos
    }
    if (normalizedName.includes('extra') || normalizedName.includes('freelance')) {
      return '#10B981'; // Esmeralda Suave
    }
    if (normalizedName.includes('venda') || normalizedName.includes('restituição')) {
      return '#34D399'; // Menta
    }
    return INCOME_PALETTE[index % INCOME_PALETTE.length];
  }

  // Saídas (Expenses)
  if (normalizedName.includes('alimentação') || normalizedName.includes('mercado') || normalizedName.includes('feira')) {
    return '#F59E0B'; // Âmbar Suave
  }
  if (normalizedName.includes('transporte') || normalizedName.includes('veículo') || normalizedName.includes('combustível')) {
    return '#3B82F6'; // Azul Real
  }
  if (normalizedName.includes('moradia') || normalizedName.includes('contas') || normalizedName.includes('aluguel')) {
    return '#8B5CF6'; // Violeta Suave
  }
  if (normalizedName.includes('saúde') || normalizedName.includes('farmácia')) {
    return '#EC4899'; // Rosa Suave
  }
  if (normalizedName.includes('lazer') || normalizedName.includes('viagem')) {
    return '#06B6D4'; // Ciano
  }
  if (normalizedName.includes('imposto') || normalizedName.includes('dívida') || normalizedName.includes('financiamento')) {
    return '#F43F5E'; // Carmim Suave
  }

  return EXPENSE_PALETTE[index % EXPENSE_PALETTE.length];
};

interface PieSectorProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

const isPieSectorProps = (p: unknown): p is PieSectorProps => {
  return typeof p === 'object' && p !== null && 'cx' in p && 'cy' in p && 'fill' in p;
};

const renderActiveShape = (props: PieSectorProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0px 0px 8px ${fill}A0)` }}
      />
    </g>
  );
};

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  transactions = [],
  selectedMonth,
  data,
}) => {
  const { isPrivacyMode } = useAppStore();
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [periodFilter, setPeriodFilter] = useState<'month' | 'all'>('month');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Processamento Dinâmico das Categorias
  const processedData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return data || [];
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    let filtered = transactions.filter((t) => t.type === txType);

    if (periodFilter === 'month' && selectedMonth && selectedMonth !== 'all') {
      filtered = filtered.filter((t) => t.date && t.date.startsWith(selectedMonth));
    } else if (txType === 'expense') {
      // No histórico geral de despesas, considerar lançamentos realizados (date <= hoje)
      filtered = filtered.filter((t) => t.date && t.date <= todayStr);
    }

    const categoryTotals: Record<string, number> = {};
    filtered.forEach((t) => {
      const cat = t.category || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedMonth, txType, periodFilter, data]);

  const totalAmount = useMemo(() => processedData.reduce((acc, d) => acc + d.value, 0), [processedData]);

  const activeItem = activeIndex !== undefined ? processedData[activeIndex] : null;
  const activePercent = activeItem && totalAmount > 0 ? (activeItem.value / totalAmount) * 100 : 0;
  const activeColor = activeItem && activeIndex !== undefined ? getCategoryColor(activeItem.name, txType, activeIndex) : (txType === 'income' ? '#00FF88' : '#3B82F6');

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col min-h-[420px] border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              txType === 'expense'
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30'
                : 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30'
            }`}
          >
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight uppercase">
              DISTRIBUIÇÃO DE {txType === 'expense' ? 'SAÍDAS' : 'ENTRADAS'} POR CATEGORIA
            </h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Anel holográfico de alocação de recursos</p>
          </div>
        </div>

        {/* Controles: Saídas vs Entradas & Mês vs Geral */}
        <div className="flex items-center gap-2">
          {/* Alternador Despesas / Receitas */}
          <div className="flex items-center p-1 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setActiveIndex(undefined);
              }}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1 transition-all ${
                txType === 'expense'
                  ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Saídas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setActiveIndex(undefined);
                // Se não houver entradas no mês selecionado, mudar para histórico geral automaticamente
                const monthHasIncome = transactions.some((t) => t.type === 'income' && selectedMonth && t.date.startsWith(selectedMonth));
                if (!monthHasIncome) {
                  setPeriodFilter('all');
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1 transition-all ${
                txType === 'income'
                  ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Entradas</span>
            </button>
          </div>

          {/* Alternador Mês Atual / Todo Histórico */}
          {selectedMonth && (
            <div className="flex items-center p-1 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPeriodFilter('month')}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                  periodFilter === 'month'
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                  periodFilter === 'all'
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Geral
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal do Gráfico de Rosca */}
      {processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 flex-1 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2330]/50 border border-[#2A3042] flex items-center justify-center mb-2 text-2xl text-[#64748B]">
            📊
          </div>
          <p className="text-xs font-bold text-[#F8FAFC]">
            Nenhum lançamento de {txType === 'income' ? 'entrada' : 'saída'} registrado {periodFilter === 'month' ? 'neste mês' : ''}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5 mb-3">
            {periodFilter === 'month'
              ? 'Você pode visualizar os lançamentos acumulados de todo o histórico alternando para Geral'
              : 'Adicione transações nesta categoria para visualizar a rosca'}
          </p>

          {periodFilter === 'month' && (
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className="px-3.5 py-1.5 bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/25 font-extrabold text-xs rounded-xl transition-all shadow-md"
            >
              🌐 Ver Entradas em Todo Histórico (Geral)
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-1">
          {/* Donut Chart Holográfico */}
          <div className="relative w-full h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={(props: unknown) => isPieSectorProps(props) ? renderActiveShape(props) : <g />}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {processedData.map((entry, index) => {
                    const cellColor = getCategoryColor(entry.name, txType, index);
                    return (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={cellColor}
                        className="transition-all duration-300 cursor-pointer"
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centro Holográfico */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2 z-10">
              {activeItem ? (
                <div className="flex flex-col items-center animate-fadeIn">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] max-w-[130px] truncate">
                    {activeItem.name}
                  </span>
                  <span
                    className="text-base font-black tracking-tight mt-0.5 drop-shadow-md"
                    style={{ color: activeColor }}
                  >
                    {formatBRL(activeItem.value, isPrivacyMode)}
                  </span>
                  <span className="text-[10px] text-[#F8FAFC] font-black bg-[#1E293B] border border-[#334155] px-2 py-0.5 rounded-md mt-1 shadow-md">
                    {formatPercent(activePercent)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                    {txType === 'expense' ? 'TOTAL SAÍDAS' : 'TOTAL ENTRADAS'}
                  </span>
                  <span
                    className={`text-base font-black tracking-tight mt-0.5 ${
                      txType === 'expense' ? 'text-[#3B82F6]' : 'text-[#00FF88]'
                    }`}
                  >
                    {formatBRL(totalAmount, isPrivacyMode)}
                  </span>
                  <span className="text-[10px] text-[#06B6D4] font-bold mt-1 bg-[#06B6D4]/15 px-2 py-0.5 rounded-md border border-[#06B6D4]/30">
                    {processedData.length} Categorias
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Legenda Interativa com Ranking */}
          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
            {processedData.map((item, index) => {
              const color = getCategoryColor(item.name, txType, index);
              const pct = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0;
              const isHovered = activeIndex === index;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-[#162238] border-[#00FF88] scale-[1.01] shadow-[0_0_12px_rgba(0,255,136,0.15)]'
                      : 'bg-[#090D18]/90 border-[#1E293B] hover:bg-[#121929] hover:border-[#06B6D4]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-black text-[#64748B]">#{index + 1}</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-black text-[#F8FAFC] truncate tracking-wide">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-black shrink-0">
                    <span className="text-[#06B6D4] font-extrabold bg-[#06B6D4]/15 px-2 py-0.5 rounded-md border border-[#06B6D4]/30 text-[10px]">
                      {formatPercent(pct)}
                    </span>
                    <span className="text-[#F8FAFC] font-black">{formatBRL(item.value, isPrivacyMode)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
