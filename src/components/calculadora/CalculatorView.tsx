import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Scale,
  Zap,
  Flame
} from 'lucide-react';
import { WealthProjectionChart } from './WealthProjectionChart';
import { CompoundInterestTab } from './CompoundInterestTab';
import { SacVsPriceComparisonTab } from './SacVsPriceComparisonTab';
import { EarlyDiscountTab } from './EarlyDiscountTab';
import { StandardCalculatorTab } from './StandardCalculatorTab';
import { calculateAmortizationComparison } from '../../utilidades/debtCalculations';

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

    const res = calculateAmortizationComparison({
      financedAmount: financed,
      interestRate: rawRate,
      interestRateType: compRateType,
      totalInstallments: n,
    });

    return {
      price: {
        firstInstallment: res.price.monthlyInstallment,
        lastInstallment: res.price.monthlyInstallment,
        total: res.price.total,
        interest: res.price.interest,
      },
      sac: {
        firstInstallment: res.sac.firstInstallment,
        lastInstallment: res.sac.lastInstallment,
        total: res.sac.total,
        interest: res.sac.interest,
      },
      sacSavings: res.sacSavings,
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
          <CompoundInterestTab
            initialAmount={initialAmount}
            setInitialAmount={setInitialAmount}
            monthlyDeposit={monthlyDeposit}
            setMonthlyDeposit={setMonthlyDeposit}
            rate={rate}
            setRate={setRate}
            rateType={rateType}
            setRateType={setRateType}
            period={period}
            setPeriod={setPeriod}
            periodType={periodType}
            setPeriodType={setPeriodType}
            compoundResults={compoundResults}
          />
        )}

        {/* TAB F.I.R.E: PROJEÇÃO PATRIMONIAL */}
        {activeTab === 'fire' && <WealthProjectionChart />}

        {/* TAB 2: COMPARADOR SAC vs PRICE */}
        {activeTab === 'comparison' && (
          <SacVsPriceComparisonTab
            compFinanced={compFinanced}
            setCompFinanced={setCompFinanced}
            compRate={compRate}
            setCompRate={setCompRate}
            compRateType={compRateType}
            setCompRateType={setCompRateType}
            compInstallments={compInstallments}
            setCompInstallments={setCompInstallments}
            comparisonResults={comparisonResults}
          />
        )}

        {/* TAB 3: DESCONTO DE QUITAÇÃO ANTECIPADA */}
        {activeTab === 'discount' && (
          <EarlyDiscountTab
            discInstallmentVal={discInstallmentVal}
            setDiscInstallmentVal={setDiscInstallmentVal}
            discCount={discCount}
            setDiscCount={setDiscCount}
            discRate={discRate}
            setDiscRate={setDiscRate}
            discountResults={discountResults}
          />
        )}

        {/* TAB 4: CALCULADORA MATEMÁTICA TRADICIONAL */}
        {activeTab === 'standard' && (
          <StandardCalculatorTab
            calcDisplay={calcDisplay}
            calcExpression={calcExpression}
            onClear={handleCalcClear}
            onDelete={handleCalcDelete}
            onEvaluate={handleCalcEvaluate}
            onClickValue={handleCalcClick}
          />
        )}
      </div>
    </div>
  );
};
