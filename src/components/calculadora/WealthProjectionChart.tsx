import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { formatBRL } from '../../utilidades/formatters';
import { Flame, Sparkles, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const WealthProjectionChart: React.FC = () => {
  const [initialWealth, setInitialWealth] = useState('25000');
  const [monthlyContribution, setMonthlyContribution] = useState('1500');
  const [annualReturn, setAnnualReturn] = useState('8.5'); // Real return above inflation
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState('8000');

  const projection = useMemo(() => {
    const init = parseFloat(initialWealth) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const rAnn = parseFloat(annualReturn) || 0;
    const desiredInc = parseFloat(desiredMonthlyIncome) || 0;

    // F.I.R.E target wealth = 300x desired monthly income (4% rule)
    const targetWealth = desiredInc * 300;

    const monthlyRate = Math.pow(1 + rAnn / 100, 1 / 12) - 1;

    const chartData = [];
    let currentWealth = init;
    let totalInvested = init;
    let monthsToTarget = 0;
    let targetReachedMonth = -1;

    // Simulate up to 35 years (420 months)
    for (let m = 0; m <= 420; m++) {
      if (m > 0) {
        currentWealth = (currentWealth + monthly) * (1 + monthlyRate);
        totalInvested += monthly;
      }

      if (targetReachedMonth === -1 && currentWealth >= targetWealth) {
        targetReachedMonth = m;
      }

      if (m % 12 === 0 || m === 420) {
        const year = m / 12;
        chartData.push({
          year: `Ano ${year}`,
          total: Math.round(currentWealth),
          invested: Math.round(totalInvested),
          interest: Math.round(Math.max(currentWealth - totalInvested, 0)),
        });
      }
    }

    const yearsToTarget = targetReachedMonth >= 0 ? (targetReachedMonth / 12).toFixed(1) : null;

    return {
      targetWealth,
      yearsToTarget,
      targetReachedMonth,
      chartData,
    };
  }, [initialWealth, monthlyContribution, annualReturn, desiredMonthlyIncome]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Banner F.I.R.E Header */}
      <div className="p-4 bg-gradient-to-r from-[#A855F7]/15 via-[#00FF88]/15 to-[#06B6D4]/15 border border-[#A855F7]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#A855F7]/20 text-[#A855F7] rounded-2xl border border-[#A855F7]/40 shadow-md">
            <Flame className="w-6 h-6 animate-pulse text-[#FF4D6D]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#F8FAFC]">Simulador de Liberdade Financeira (F.I.R.E)</h3>
            <p className="text-xs text-[#94A3B8] font-medium">Projeção patrimonial de longo prazo e regra dos 4%</p>
          </div>
        </div>

        {projection.yearsToTarget ? (
          <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/30 px-3.5 py-2 rounded-xl text-[#00FF88]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black">
              Liberdade em ~{projection.yearsToTarget} anos!
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3.5 py-2 rounded-xl text-[#F59E0B]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Aumente o aporte para acelerar a meta</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entradas da Projeção */}
        <Card className="flex flex-col gap-4 p-5 lg:col-span-1 border-l-4 border-l-[#A855F7]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#A855F7]" />
            <h4 className="text-sm font-extrabold text-[#F8FAFC]">Parâmetros de Independência</h4>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase">Patrimônio Atual (R$)</label>
            <input
              type="number"
              value={initialWealth}
              onChange={(e) => setInitialWealth(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#A855F7] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase">Aporte Mensal Previsto (R$)</label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#A855F7] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase">Rendimento Anual Real (% a.a. acima da inflação)</label>
            <input
              type="number"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#A855F7] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] uppercase">Renda Passiva Desejada (R$/mês)</label>
            <input
              type="number"
              step="500"
              value={desiredMonthlyIncome}
              onChange={(e) => setDesiredMonthlyIncome(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#00FF88] font-bold focus:border-[#00FF88] focus:outline-none"
            />
          </div>
        </Card>

        {/* Métricas e Gráfico F.I.R.E */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-[#00FF88]">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Patrimônio Alvo (Regra dos 4%)</span>
              <div className="text-xl font-black text-[#00FF88] mt-1">{formatBRL(projection.targetWealth)}</div>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Capital necessário para viver de renda</span>
            </Card>

            <Card className="border-l-4 border-l-[#A855F7]">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Tempo Estimado para o Alvo</span>
              <div className="text-xl font-black text-[#A855F7] mt-1">
                {projection.yearsToTarget ? `${projection.yearsToTarget} Anos` : 'Acima de 35 anos'}
              </div>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Considerando aportes e juros compostos</span>
            </Card>
          </div>

          {/* Gráfico de Área Acumulada */}
          <Card className="p-5 flex flex-col gap-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Evolução Patrimonial Acumulada até 35 Anos
            </h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.chartData}>
                  <defs>
                    <linearGradient id="colorTotalWealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FF88" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1424', borderColor: '#2E3B52', borderRadius: '12px' }}
                    formatter={(val: number | string | Array<number | string>) => [formatBRL(Number(val)), '']}
                  />
                  <Area type="monotone" dataKey="total" name="Patrimônio Total" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotalWealth)" />
                  <Area type="monotone" dataKey="invested" name="Total Aportado" stroke="#38BDF8" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
