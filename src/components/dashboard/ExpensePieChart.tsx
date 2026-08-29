import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { PieChart as PieIcon, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ExpensePieChartProps {
  data: { name: string; value: number }[];
}

const VIBRANT_PALETTE = [
  '#FF3B30', // Crimson / Coral Red
  '#00F5D4', // Neon Mint Green
  '#7B2CBF', // Vivid Electric Violet
  '#FFB703', // Golden Amber
  '#3A86FF', // Royal Electric Blue
  '#FF007F', // Hot Neon Pink
  '#00BBF9', // Bright Cyan
  '#9D4EDD', // Bright Purple
  '#F15BB5', // Soft Magenta
  '#52B788', // Emerald Green
];

interface PieSectorProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

const renderActiveShape = (props: PieSectorProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0px 0px 15px ${fill})` }}
      />
    </g>
  );
};

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
  const { isPrivacyMode } = useAppStore();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const totalExpense = data.reduce((acc, d) => acc + d.value, 0);

  if (!data || data.length === 0) {
    return (
      <div className="cyber-hud-card hud-corner flex flex-col items-center justify-center p-8 min-h-[380px] border border-[#2E3B52]">
        <div className="w-16 h-16 rounded-2xl bg-[#1E2330]/50 border border-[#2A3042] flex items-center justify-center mb-3 text-3xl">
          <PieIcon className="w-8 h-8 text-[#64748B]" />
        </div>
        <p className="text-sm font-bold text-[#F8FAFC]">Nenhuma despesa no período</p>
        <p className="text-xs text-[#64748B] mt-1">Adicione transações para ver o gráfico de categorias</p>
      </div>
    );
  }

  const activeItem = activeIndex !== undefined ? data[activeIndex] : null;
  const activePercent = activeItem && totalExpense > 0 ? (activeItem.value / totalExpense) * 100 : 0;
  const activeColor = activeIndex !== undefined ? VIBRANT_PALETTE[activeIndex % VIBRANT_PALETTE.length] : '#00FF88';

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col min-h-[380px] border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      <div className="flex items-center justify-between mb-2 border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#FF4D6D]/15 text-[#FF4D6D] rounded-xl border border-[#FF4D6D]/30">
            <PieIcon className="w-5 h-5 text-[#FF4D6D]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">DISTRIBUIÇÃO DE SAÍDAS POR CATEGORIA</h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Anel holográfico de alocação de caixa</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-2">
        {/* Donut Chart Holográfico */}
        <div className="relative w-full h-[240px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={92}
                paddingAngle={4}
                dataKey="value"
                activeIndex={activeIndex}
                activeShape={(props: unknown) => renderActiveShape(props as PieSectorProps)}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={VIBRANT_PALETTE[index % VIBRANT_PALETTE.length]}
                    className="transition-all duration-300 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Holographic Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2 z-10">
            {activeItem ? (
              <div className="flex flex-col items-center animate-fadeIn">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] max-w-[120px] truncate">
                  {activeItem.name}
                </span>
                <span
                  className="text-base font-black tracking-tight mt-0.5 drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]"
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
                  TOTAL DESPESAS
                </span>
                <span className="text-base font-black text-[#F8FAFC] tracking-tight mt-0.5">
                  {formatBRL(totalExpense, isPrivacyMode)}
                </span>
                <span className="text-[10px] text-[#00FF88] font-bold mt-1 bg-[#00FF88]/15 px-2 py-0.5 rounded-md border border-[#00FF88]/30">
                  {data.length} Categorias
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend Pills Futuristas */}
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
          {data.map((item, index) => {
            const color = VIBRANT_PALETTE[index % VIBRANT_PALETTE.length];
            const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-[#162238] border-[#00FF88] scale-[1.02] shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                    : 'bg-[#090D18]/90 border-[#1E293B] hover:bg-[#121929] hover:border-[#06B6D4]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: color }} />
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
    </div>
  );
};
