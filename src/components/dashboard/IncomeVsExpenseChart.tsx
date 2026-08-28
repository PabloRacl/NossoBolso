import React from 'react';
import { Card } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatBRL } from '../../utils/formatters';

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
}

const CustomBarTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
    const balance = income - expense;

    return (
      <div className="bg-[#0F172A]/95 border border-[#1E293B] shadow-2xl backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-2 min-w-[200px] z-50">
        <span className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider border-b border-[#1E293B] pb-1.5">
          📅 Mês de {label}
        </span>
        <div className="flex items-center justify-between gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]" />
            Receitas:
          </span>
          <span className="font-extrabold text-[#F8FAFC]">{formatBRL(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#FF4D6D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D] shadow-[0_0_8px_#FF4D6D]" />
            Despesas:
          </span>
          <span className="font-extrabold text-[#F8FAFC]">{formatBRL(expense)}</span>
        </div>
        <div className="pt-1.5 border-t border-[#1E293B] flex items-center justify-between text-xs font-bold">
          <span className="text-[#94A3B8]">Resultado:</span>
          <span className={balance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'}>
            {formatBRL(balance)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({ data }) => {
  return (
    <Card className="flex flex-col min-h-[380px] hover:border-[#00FF88]/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Receitas vs Despesas</h3>
          <p className="text-xs text-[#94A3B8] font-medium">Histórico dos últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#00FF88]" />
            <span className="text-[#F8FAFC]">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#FF4D6D]" />
            <span className="text-[#F8FAFC]">Despesas</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF88" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4D6D" stopOpacity={1} />
                <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.85} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" vertical={false} opacity={0.6} />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            
            <Tooltip
              content={<CustomBarTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)', rx: 8 }}
            />

            <Bar dataKey="income" name="Receitas" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} maxBarSize={45} />
            <Bar dataKey="expense" name="Despesas" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
