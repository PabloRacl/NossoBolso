import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { formatBRL } from '../../utils/formatters';
import {
  Calculator,
  TrendingUp,
  Scale,
  Zap,
  Delete,
  Sparkles,
  CheckCircle2,
  Flame
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { WealthProjectionChart } from './WealthProjectionChart';

type TabType = 'compound' | 'fire' | 'comparison' | 'discount' | 'standard';

export const CalculatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('compound');

  // --- 1. Estado da Calculadora Tradicional ---
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  const [isEvaluated, setIsEvaluated] = useState(false);

  const mathOperators = useMemo(() => ['+', '-', '*', '/', '%'], []);

  const handleCalcClick = (val: string) => {
    // Se a calculadora estiver mostrando erro, reinicia ao digitar
    if (calcDisplay.toLowerCase().includes('erro') || calcExpression.toLowerCase().includes('erro')) {
      if (mathOperators.includes(val)) return;
      setCalcDisplay(val === '.' ? '0.' : val);
      setCalcExpression(val === '.' ? '0.' : val);
      setIsEvaluated(false);
      return;
    }

    if (isEvaluated && !mathOperators.includes(val)) {
      setCalcDisplay(val === '.' ? '0.' : val);
      setCalcExpression(val === '.' ? '0.' : val);
      setIsEvaluated(false);
      return;
    }
    setIsEvaluated(false);

    const lastChar = calcExpression.slice(-1);

    // Impedir operadores (+, -, *, /, %) duplicados consecutivos
    if (mathOperators.includes(val)) {
      if (calcExpression === '' || calcExpression === '0') {
        if (val === '-') {
          setCalcDisplay('-');
          setCalcExpression('-');
        }
        return;
      }
      // Se o último caractere já for um operador, substitui o operador anterior pelo novo em vez de repetir
      if (mathOperators.includes(lastChar)) {
        setCalcDisplay((prev) => prev.slice(0, -1) + val);
        setCalcExpression((prev) => prev.slice(0, -1) + val);
        return;
      }
      if (lastChar === '.') return;
    }

    // Impedir pontos decimais (.) múltiplos no mesmo número
    if (val === '.') {
      if (lastChar === '.' || mathOperators.includes(lastChar)) return;
      const parts = calcExpression.split(/[\+\-\*\/\%]/);
      const currentNum = parts[parts.length - 1];
      if (currentNum.includes('.')) return;
    }

    if ((calcDisplay === '0' || calcDisplay === '') && val !== '.') {
      setCalcDisplay(val);
      setCalcExpression(val);
    } else {
      setCalcDisplay((prev) => prev + val);
      setCalcExpression((prev) => prev + val);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcExpression('');
    setIsEvaluated(false);
  };

  const handleCalcDelete = () => {
    if (calcDisplay.toLowerCase().includes('erro')) {
      handleCalcClear();
      return;
    }
    if (calcExpression.length <= 1) {
      setCalcDisplay('0');
      setCalcExpression('');
    } else {
      setCalcDisplay((prev) => prev.slice(0, -1));
      setCalcExpression((prev) => prev.slice(0, -1));
    }
  };

  const handleCalcEvaluate = () => {
    try {
      if (!calcExpression || calcDisplay.toLowerCase().includes('erro')) return;

      // Limpar qualquer operador pendente no final da expressão antes de calcular
      let cleanExpr = calcExpression.trim();
      while (mathOperators.includes(cleanExpr.slice(-1))) {
        cleanExpr = cleanExpr.slice(0, -1);
      }
      if (!cleanExpr) return;

      const sanitized = cleanExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
      const result = new Function(`"use strict"; return (${sanitized})`)();

      if (isNaN(result) || !isFinite(result)) {
        setCalcDisplay('Erro');
        setIsEvaluated(true);
        return;
      }

      const formattedResult = String(Math.round(result * 10000) / 10000);
      setCalcDisplay(formattedResult);
      setCalcExpression(formattedResult);
      setIsEvaluated(true);
    } catch {
      setCalcDisplay('Erro');
      setIsEvaluated(true);
    }
  };

  // --- 2. Estado do Simulador de Juros Compostos ---
  const [initialAmount, setInitialAmount] = useState('1000');
  const [monthlyDeposit, setMonthlyDeposit] = useState('300');
  const [rate, setRate] = useState('1');
  const [rateType, setRateType] = useState<'monthly' | 'yearly'>('monthly');
  const [period, setPeriod] = useState('10');
  const [periodType, setPeriodType] = useState<'years' | 'months'>('years');

  const compoundResults = useMemo(() => {
    const pInit = parseFloat(initialAmount) || 0;
    const pMonth = parseFloat(monthlyDeposit) || 0;
    const rawRate = parseFloat(rate) || 0;
    const rawPeriod = parseInt(period) || 0;

    const totalMonths = periodType === 'years' ? rawPeriod * 12 : rawPeriod;
    const monthlyRate = rateType === 'yearly' ? Math.pow(1 + rawRate / 100, 1 / 12) - 1 : rawRate / 100;

    const chartData: { month: number; year: string; invested: number; total: number; interest: number }[] = [];
    let currentTotal = pInit;
    let currentInvested = pInit;

    chartData.push({
      month: 0,
      year: 'Início',
      invested: Math.round(currentInvested),
      total: Math.round(currentTotal),
      interest: 0,
    });

    for (let m = 1; m <= totalMonths; m++) {
      currentTotal = (currentTotal + pMonth) * (1 + monthlyRate);
      currentInvested += pMonth;
      const currentInterest = currentTotal - currentInvested;

      if (totalMonths <= 36 || m % 12 === 0 || m === totalMonths) {
        chartData.push({
          month: m,
          year: totalMonths > 36 ? `Ano ${Math.ceil(m / 12)}` : `Mês ${m}`,
          invested: Math.round(currentInvested * 100) / 100,
          total: Math.round(currentTotal * 100) / 100,
          interest: Math.round(currentInterest * 100) / 100,
        });
      }
    }

    const finalTotal = currentTotal;
    const finalInvested = currentInvested;
    const finalInterest = finalTotal - finalInvested;

    return {
      finalTotal,
      finalInvested,
      finalInterest,
      chartData,
    };
  }, [initialAmount, monthlyDeposit, rate, rateType, period, periodType]);

  // --- 3. Estado do Comparador SAC vs PRICE ---
  const [compFinanced, setCompFinanced] = useState('200000');
  const [compRate, setCompRate] = useState('9.5');
  const [compRateType, setCompRateType] = useState<'monthly' | 'yearly'>('yearly');
  const [compInstallments, setCompInstallments] = useState('240');

  const comparisonResults = useMemo(() => {
    const financed = parseFloat(compFinanced) || 0;
    const rawRate = parseFloat(compRate) || 0;
    const n = parseInt(compInstallments) || 1;

    const i = compRateType === 'yearly' ? rawRate / 12 / 100 : rawRate / 100;

    let priceMonthlyInstallment = 0;
    let priceTotal = 0;
    if (i > 0) {
      priceMonthlyInstallment = (financed * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
      priceTotal = priceMonthlyInstallment * n;
    } else {
      priceMonthlyInstallment = financed / n;
      priceTotal = financed;
    }
    const priceInterest = priceTotal - financed;

    const sacAmortization = financed / n;
    const sacFirstInstallment = sacAmortization + financed * i;
    const sacLastInstallment = sacAmortization + sacAmortization * i;
    const sacTotalInterest = ((financed * i) + (sacAmortization * i)) * (n / 2);
    const sacTotal = financed + sacTotalInterest;

    const sacSavings = priceTotal - sacTotal;

    return {
      price: {
        firstInstallment: priceMonthlyInstallment,
        lastInstallment: priceMonthlyInstallment,
        total: priceTotal,
        interest: priceInterest,
      },
      sac: {
        firstInstallment: sacFirstInstallment,
        lastInstallment: sacLastInstallment,
        total: sacTotal,
        interest: sacTotalInterest,
      },
      sacSavings,
    };
  }, [compFinanced, compRate, compRateType, compInstallments]);

  // --- 4. Estado da Quitação / Desconto Antecipado ---
  const [discInstallmentVal, setDiscInstallmentVal] = useState('850');
  const [discCount, setDiscCount] = useState('12');
  const [discRate, setDiscRate] = useState('1.2');

  const discountResults = useMemo(() => {
    const pVal = parseFloat(discInstallmentVal) || 0;
    const count = parseInt(discCount) || 0;
    const r = (parseFloat(discRate) || 0) / 100;

    const nominalTotal = pVal * count;
    let presentValue = 0;

    for (let k = 1; k <= count; k++) {
      presentValue += pVal / Math.pow(1 + r, k);
    }

    const savings = nominalTotal - presentValue;

    return {
      nominalTotal,
      presentValue,
      savings,
    };
  }, [discInstallmentVal, discCount, discRate]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Abas de Ferramentas da Calculadora */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl">
        <button
          onClick={() => setActiveTab('compound')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'compound'
              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Juros Compostos</span>
        </button>

        <button
          onClick={() => setActiveTab('fire')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'fire'
              ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 shadow-md shadow-[#A855F7]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <Flame className="w-4 h-4 text-[#FF4D6D]" />
          <span>Projeção F.I.R.E</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'comparison'
              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Comparador SAC vs PRICE</span>
        </button>

        <button
          onClick={() => setActiveTab('discount')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'discount'
              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Desconto de Quitação</span>
        </button>

        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'standard'
              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculadora Matemática</span>
        </button>
      </div>

      <div className="w-full flex flex-col gap-6">
        {/* TAB 1: JUROS COMPOSTOS */}
        {activeTab === 'compound' && (
          <div className="flex flex-col gap-6 w-full animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Entradas */}
              <Card className="flex flex-col gap-4 p-5 lg:col-span-1 border-l-4 border-l-[#00FF88]">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-[#00FF88]" />
                  <h3 className="text-base font-extrabold text-[#F8FAFC]">Simulador de Investimentos</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Valor Inicial (R$)</label>
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
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Aporte Mensal (R$)</label>
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
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Período de Aplicação</label>
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
                    <div className="text-xl font-black text-[#00FF88] mt-1">{formatBRL(compoundResults.finalTotal)}</div>
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Montante final com juros</span>
                  </Card>

                  <Card className="border-l-4 border-l-[#38BDF8]">
                    <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total Investido do Bolso</span>
                    <div className="text-xl font-black text-[#38BDF8] mt-1">{formatBRL(compoundResults.finalInvested)}</div>
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Capital próprio aportado</span>
                  </Card>

                  <Card className="border-l-4 border-l-[#F59E0B]">
                    <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total Ganho em Juros</span>
                    <div className="text-xl font-black text-[#F59E0B] mt-1">{formatBRL(compoundResults.finalInterest)}</div>
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
                        <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0D1424', borderColor: '#2E3B52', borderRadius: '12px' }}
                          formatter={(value: any) => [formatBRL(Number(value)), '']}
                        />
                        <Area type="monotone" dataKey="total" name="Total Acumulado" stroke="#00FF88" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                        <Area type="monotone" dataKey="invested" name="Capital Investido" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB F.I.R.E: PROJEÇÃO PATRIMONIAL */}
        {activeTab === 'fire' && <WealthProjectionChart />}

        {/* TAB 2: COMPARADOR SAC vs PRICE */}
        {activeTab === 'comparison' && (
          <div className="flex flex-col gap-6 w-full animate-fadeIn">
            {/* Formulário do Comparador */}
            <Card className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border-l-4 border-l-[#38BDF8]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Valor do Financiamento (R$)</label>
                <input
                  type="number"
                  step="5000"
                  value={compFinanced}
                  onChange={(e) => setCompFinanced(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Taxa de Juros</label>
                <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl overflow-hidden h-11 focus-within:border-[#38BDF8]">
                  <input
                    type="number"
                    step="0.1"
                    value={compRate}
                    onChange={(e) => setCompRate(e.target.value)}
                    className="w-full px-4 text-sm bg-transparent text-[#F8FAFC] focus:outline-none"
                  />
                  <select
                    value={compRateType}
                    onChange={(e) => setCompRateType(e.target.value as 'monthly' | 'yearly')}
                    className="px-3 text-xs font-bold bg-[#162032] text-[#94A3B8] h-full focus:outline-none cursor-pointer border-l border-[#2E3B52]"
                  >
                    <option value="yearly">% a.a.</option>
                    <option value="monthly">% a.m.</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Prazo (Parcelas Mensais)</label>
                <input
                  type="number"
                  min="12"
                  max="420"
                  value={compInstallments}
                  onChange={(e) => setCompInstallments(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
                />
              </div>
            </Card>

            {/* Resultado Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PRICE Card */}
              <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#38BDF8]">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
                    <span>🚗 Tabela PRICE</span>
                  </h4>
                  <span className="text-[10px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-1 rounded-full">
                    Parcelas Fixas
                  </span>
                </div>

                <div className="flex flex-col gap-3 py-2 border-y border-[#1E293B]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Valor das Parcelas (1ª à última):</span>
                    <span className="font-bold text-[#F8FAFC]">{formatBRL(comparisonResults.price.firstInstallment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Total Pago em Juros:</span>
                    <span className="font-bold text-[#F59E0B]">{formatBRL(comparisonResults.price.interest)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-black pt-1">
                  <span className="text-[#94A3B8]">Custo Total Final:</span>
                  <span className="text-lg text-[#F8FAFC]">{formatBRL(comparisonResults.price.total)}</span>
                </div>
              </Card>

              {/* SAC Card */}
              <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#00FF88] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
                    <span>🏠 Sistema SAC</span>
                  </h4>
                  <span className="text-[10px] font-bold text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/20 px-2.5 py-1 rounded-full">
                    Parcelas Decrescentes
                  </span>
                </div>

                <div className="flex flex-col gap-3 py-2 border-y border-[#1E293B]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">1ª Parcela (Inicial):</span>
                    <span className="font-bold text-[#F8FAFC]">{formatBRL(comparisonResults.sac.firstInstallment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Última Parcela (Final):</span>
                    <span className="font-bold text-[#00FF88]">{formatBRL(comparisonResults.sac.lastInstallment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Total Pago em Juros:</span>
                    <span className="font-bold text-[#F59E0B]">{formatBRL(comparisonResults.sac.interest)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-black pt-1">
                  <span className="text-[#94A3B8]">Custo Total Final:</span>
                  <span className="text-lg text-[#00FF88]">{formatBRL(comparisonResults.sac.total)}</span>
                </div>
              </Card>
            </div>

            {/* Banner de Economia SAC vs PRICE */}
            <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 to-[#06B6D4]/15 border border-[#00FF88]/30 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#00FF88]/20 text-[#00FF88] rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-extrabold text-[#F8FAFC]">Economia do Sistema SAC</h5>
                  <p className="text-xs text-[#94A3B8]">Escolhendo o SAC você economiza no final do contrato:</p>
                </div>
              </div>
              <div className="text-xl font-black text-[#00FF88]">
                {formatBRL(Math.max(comparisonResults.sacSavings, 0))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DESCONTO DE QUITAÇÃO ANTECIPADA */}
        {activeTab === 'discount' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fadeIn">
            <Card className="flex flex-col gap-4 p-5 border-l-4 border-l-[#F59E0B]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-extrabold text-[#F8FAFC]">Quitação Antecipada de Parcelas</h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Valor da Parcela Mensal (R$)</label>
                <input
                  type="number"
                  step="50"
                  value={discInstallmentVal}
                  onChange={(e) => setDiscInstallmentVal(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Qtd de Parcelas a Antecipar</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={discCount}
                  onChange={(e) => setDiscCount(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Taxa de Desconto / Juros (% a.m.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={discRate}
                  onChange={(e) => setDiscRate(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#00FF88]">
                <h4 className="text-sm font-extrabold text-[#F8FAFC] uppercase tracking-wider">Resultado da Antecipação</h4>

                <div className="flex flex-col gap-3 py-3 border-y border-[#1E293B]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Valor Sem Desconto (Soma Nominal):</span>
                    <span className="font-bold text-[#64748B] line-through">{formatBRL(discountResults.nominalTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Valor a Pagar Hoje (Com Desconto):</span>
                    <span className="text-lg font-black text-[#00FF88]">{formatBRL(discountResults.presentValue)}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
                    <span className="text-xs font-extrabold text-[#F8FAFC]">Economia Gerada no Bolso:</span>
                  </div>
                  <span className="text-lg font-black text-[#00FF88]">{formatBRL(discountResults.savings)}</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: CALCULADORA MATEMÁTICA TRADICIONAL */}
        {activeTab === 'standard' && (
          <div className="flex justify-center w-full animate-fadeIn">
            <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-t-4 border-t-[#00FF88] shadow-2xl">
              {/* Visor Digital */}
              <div className="flex flex-col items-end justify-end p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-2xl h-24 text-right">
                <span className="text-xs font-mono text-[#64748B] h-5">{calcExpression || '0'}</span>
                <span className="text-3xl font-black font-mono text-[#00FF88] tracking-wider overflow-x-auto max-w-full">
                  {calcDisplay}
                </span>
              </div>

              {/* Grid de Teclas */}
              <div className="grid grid-cols-4 gap-2.5">
                <button onClick={handleCalcClear} className="h-12 rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold hover:bg-[#EF4444]/25">C</button>
                <button onClick={() => handleCalcClick('(')} className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC]">(</button>
                <button onClick={() => handleCalcClick(')')} className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC]">)</button>
                <button onClick={() => handleCalcClick('/')} className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25">÷</button>

                <button onClick={() => handleCalcClick('7')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">7</button>
                <button onClick={() => handleCalcClick('8')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">8</button>
                <button onClick={() => handleCalcClick('9')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">9</button>
                <button onClick={() => handleCalcClick('*')} className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25">×</button>

                <button onClick={() => handleCalcClick('4')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">4</button>
                <button onClick={() => handleCalcClick('5')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">5</button>
                <button onClick={() => handleCalcClick('6')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">6</button>
                <button onClick={() => handleCalcClick('-')} className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25">-</button>

                <button onClick={() => handleCalcClick('1')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">1</button>
                <button onClick={() => handleCalcClick('2')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">2</button>
                <button onClick={() => handleCalcClick('3')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">3</button>
                <button onClick={() => handleCalcClick('+')} className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25">+</button>

                <button onClick={() => handleCalcClick('0')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">0</button>
                <button onClick={() => handleCalcClick('.')} className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]">.</button>
                <button onClick={handleCalcDelete} className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC] flex items-center justify-center">
                  <Delete className="w-5 h-5" />
                </button>
                <button onClick={handleCalcEvaluate} className="h-12 rounded-xl bg-[#00FF88] text-[#090D16] font-black text-lg hover:bg-[#00E577] shadow-[0_0_12px_rgba(0,255,136,0.3)]">=</button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
