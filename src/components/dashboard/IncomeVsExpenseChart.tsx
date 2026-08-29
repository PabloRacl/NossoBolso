import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { BarChart3, Activity } from 'lucide-react';

interface IncomeVsExpenseChartProps {
  data: { month: string; income: number; expense: number }[];
}

interface TooltipItem {
  dataKey: string;
  value: number;
}

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  isPrivacyMode?: boolean;
}

const CustomBarTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload, label, isPrivacyMode }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
    const balance = income - expense;

    return (
      <div className="bg-[#090D18]/95 border border-[#00FF88]/40 shadow-[0_0_25px_rgba(0,255,136,0.2)] backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-2 min-w-[210px] z-50">
        <span className="text-[10px] font-black text-[#00FF88] uppercase tracking-widest border-b border-[#2E3B52] pb-1.5 flex items-center justify-between">
          <span>📅 MÊS DE {label?.toUpperCase()}</span>
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
            Saídas:
          </span>
          <span className="font-black text-[#F8FAFC]">{formatBRL(expense, isPrivacyMode)}</span>
        </div>

        <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs font-black">
          <span className="text-[#94A3B8] uppercase text-[10px]">Resultado Líquido:</span>
          <span className={balance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'}>
            {formatBRL(balance, isPrivacyMode)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({ data }) => {
  const { isPrivacyMode } = useAppStore();

  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col min-h-[380px] border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      <div className="flex items-center justify-between mb-4 border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <BarChart3 className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">HISTOGRAMA DE FLUXO & VELOCIDADE</h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">Comparativo quadrimestral de receitas e despesas</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-extrabold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_6px_#00FF88]" />
            <span>Entradas</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-[#FF4D6D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D] shadow-[0_0_6px_#FF4D6D]" />
            <span>Saídas</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
              content={<CustomBarTooltip isPrivacyMode={isPrivacyMode} />}
              cursor={{ fill: 'rgba(0, 255, 136, 0.05)', rx: 8 }}
            />

            <Bar dataKey="income" name="Entradas" fill="url(#cyberIncomeGrad)" radius={[8, 8, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" name="Saídas" fill="url(#cyberExpenseGrad)" radius={[8, 8, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
