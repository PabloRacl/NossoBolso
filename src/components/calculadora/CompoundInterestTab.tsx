import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface CompoundInterestTabProps {
  initialAmount: string;
  setInitialAmount: (v: string) => void;
  monthlyDeposit: string;
  setMonthlyDeposit: (v: string) => void;
  rate: string;
  setRate: (v: string) => void;
  rateType: 'monthly' | 'yearly';
  setRateType: (v: 'monthly' | 'yearly') => void;
  period: string;
  setPeriod: (v: string) => void;
  periodType: 'years' | 'months';
  setPeriodType: (v: 'years' | 'months') => void;
  compoundResults: {
    finalTotal: number;
    finalInvested: number;
    finalInterest: number;
    chartData: {
      month: number;
      year: string;
      invested: number;
      total: number;
      interest: number;
    }[];
  };
}

export const CompoundInterestTab: React.FC<CompoundInterestTabProps> = ({
  initialAmount,
  setInitialAmount,
  monthlyDeposit,
  setMonthlyDeposit,
  rate,
  setRate,
  rateType,
  setRateType,
  period,
  setPeriod,
  periodType,
  setPeriodType,
  compoundResults,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Entradas */}
        <Card className="flex flex-col gap-4 p-5 lg:col-span-1 border-l-4 border-l-[#00FF88]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#00FF88]" />
            <h3 className="text-base font-extrabold text-[#F8FAFC]">Simulador de Investimentos</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
              Valor Inicial (R$)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
              Aporte Mensal (R$)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Taxa de Juros</label>
            <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl overflow-hidden h-11 focus-within:border-[#00FF88]">
              <input
                type="number"
                step="0.1"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-4 text-sm bg-transparent text-[#F8FAFC] focus:outline-none"
              />
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as 'monthly' | 'yearly')}
                className="px-3 text-xs font-bold bg-[#162032] text-[#94A3B8] h-full focus:outline-none cursor-pointer border-l border-[#2E3B52]"
              >
                <option value="monthly">% a.m.</option>
                <option value="yearly">% a.a.</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
              Período de Aplicação
            </label>
            <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl overflow-hidden h-11 focus-within:border-[#00FF88]">
              <input
                type="number"
                min="1"
                max="60"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 text-sm bg-transparent text-[#F8FAFC] focus:outline-none"
              />
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'years' | 'months')}
                className="px-3 text-xs font-bold bg-[#162032] text-[#94A3B8] h-full focus:outline-none cursor-pointer border-l border-[#2E3B52]"
              >
                <option value="years">Anos</option>
                <option value="months">Meses</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Cards de Métricas e Gráfico */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#00FF88]">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Valor Total Acumulado</span>
              <div className="text-xl font-black text-[#00FF88] mt-1">
                {formatBRL(compoundResults.finalTotal)}
              </div>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Montante final com juros</span>
            </Card>

            <Card className="border-l-4 border-l-[#38BDF8]">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total Investido do Bolso</span>
              <div className="text-xl font-black text-[#38BDF8] mt-1">
                {formatBRL(compoundResults.finalInvested)}
              </div>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Capital próprio aportado</span>
            </Card>

            <Card className="border-l-4 border-l-[#F59E0B]">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total Ganho em Juros</span>
              <div className="text-xl font-black text-[#F59E0B] mt-1">
                {formatBRL(compoundResults.finalInterest)}
              </div>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Rendimento gerado</span>
            </Card>
          </div>

          {/* Gráfico de Evolução Patrimonial */}
          <Card className="p-5 flex flex-col gap-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Curva de Crescimento Patrimonial Acumulado
            </h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={compoundResults.chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF88" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00FF88" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1424',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [formatBRL(val), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Montante Total"
                    stroke="#00FF88"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    name="Total Aportado"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInvested)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
