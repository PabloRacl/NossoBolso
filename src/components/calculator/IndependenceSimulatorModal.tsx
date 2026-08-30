import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { formatBRL } from '../../utils/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sparkles, ShieldCheck, Flame, TrendingUp, DollarSign, Calendar, Compass, ArrowUpRight } from 'lucide-react';

export const IndependenceSimulatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isPrivacyMode } = useAppStore();

  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(5000);
  const [currentNetWorth, setCurrentNetWorth] = useState<number>(35000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1500);
  const [realInterestRateYearly, setRealInterestRateYearly] = useState<number>(6.0); // 6% acima da inflação
  const [swrPercent, setSwrPercent] = useState<number>(4.0); // Regra dos 4%

  // 1. Número FIRE (Patrimônio Necessário para Viver de Renda)
  const requiredFireNumber = useMemo(() => {
    const annualIncome = desiredMonthlyIncome * 12;
    return annualIncome / (swrPercent / 100);
  }, [desiredMonthlyIncome, swrPercent]);

  // 2. Projeção Ano a Ano até Atingir a Liberdade Financeira
  const projectionData = useMemo(() => {
    const monthlyRate = Math.pow(1 + realInterestRateYearly / 100, 1 / 12) - 1;
    let balance = currentNetWorth;
    const maxYears = 40;
    const points: { year: number; balance: number; target: number }[] = [];

    points.push({ year: 0, balance, target: requiredFireNumber });

    for (let y = 1; y <= maxYears; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }
      points.push({ year: y, balance: Math.round(balance), target: Math.round(requiredFireNumber) });
      if (balance >= requiredFireNumber && points.length > 5) {
        break; // Atingiu o objetivo
      }
    }
    return points;
  }, [currentNetWorth, monthlyContribution, realInterestRateYearly, requiredFireNumber]);

  const yearsToIndependence = useMemo(() => {
    const found = projectionData.find((p) => p.balance >= requiredFireNumber);
    return found ? found.year : '> 40 anos';
  }, [projectionData, requiredFireNumber]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulador de Independência Financeira (Regra dos 4% FIRE)">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Apresentação */}
        <div className="p-4 bg-gradient-to-r from-[#FFD700]/15 via-[#00FF88]/10 to-[#0D1526] border border-[#FFD700]/30 rounded-2xl flex items-start gap-3">
          <Flame className="w-6 h-6 text-[#FFD700] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Metodologia FIRE (Financial Independence, Retire Early)</h4>
            <p className="mt-1">
              Calcule exatamente o valor de patrimônio investido necessário para viver de renda sustentável aplicando a Regra dos 4% ao ano (Safe Withdrawal Rate) sem nunca consumir o seu capital principal.
            </p>
          </div>
        </div>

        {/* Formulário de Parâmetros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Renda Passiva Desejada (R$/mês)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-bold">R$</span>
              <input
                type="number"
                value={desiredMonthlyIncome}
                onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
                className="w-full h-10 pl-9 pr-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Patrimônio Acumulado Atual (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-bold">R$</span>
              <input
                type="number"
                value={currentNetWorth}
                onChange={(e) => setCurrentNetWorth(Number(e.target.value))}
                className="w-full h-10 pl-9 pr-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Aporte Mensal Previsto (R$/mês)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-bold">R$</span>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full h-10 pl-9 pr-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Rentabilidade Real Líquida (% a.a. acima do IPCA)</label>
            <input
              type="number"
              step="0.5"
              value={realInterestRateYearly}
              onChange={(e) => setRealInterestRateYearly(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>
        </div>

        {/* Telemetria FIRE (Resultados) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#FFD700]">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Patrimônio FIRE Necessário</span>
            <span className="text-2xl font-black text-[#FFD700] my-1 drop-shadow-md">
              {formatBRL(requiredFireNumber, isPrivacyMode)}
            </span>
            <span className="text-[10px] text-[#64748B]">Gerado pela Regra dos 4% a.a. de retirada</span>
          </div>

          <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#00FF88]">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Tempo Estimado até a Liberdade</span>
            <span className="text-2xl font-black text-[#00FF88] my-1 drop-shadow-md">
              {yearsToIndependence} {typeof yearsToIndependence === 'number' ? 'Anos' : ''}
            </span>
            <span className="text-[10px] text-[#64748B]">Com aportes de {formatBRL(monthlyContribution, isPrivacyMode)}/mês</span>
          </div>
        </div>

        {/* Gráfico da Curva de Liberdade Financeira */}
        <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-3">
          <span className="text-xs font-black text-[#F8FAFC] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00FF88]" />
            Curva de Acúmulo de Patrimônio vs Alvo FIRE
          </span>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="year" stroke="#64748B" fontSize={10} tickLine={false} unit=" ano" />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      const yr = payload[0].payload.year;
                      return (
                        <div className="bg-[#0D1424] border border-[#00FF88]/40 p-2.5 rounded-xl text-xs flex flex-col gap-1">
                          <span className="font-bold text-[#00FF88]">Ano {yr}</span>
                          <span className="font-black text-[#F8FAFC]">{formatBRL(val, isPrivacyMode)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="balance" stroke="#00FF88" strokeWidth={3} fillOpacity={1} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Modal>
  );
};
