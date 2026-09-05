/**
 * debtCalculations.ts
 * Motor matemático financeiro unificado do NossoBolso OS.
 * Centraliza cálculos de amortização SAC, PRICE, juros compostos e antecipação a valor presente.
 */

export interface AmortizationScheduleItem {
  installmentNumber: number;
  offsetMonths: number;
  dueDate: string;
  installmentAmount: number;
  amortization: number;
  interest: number;
  insurance: number;
  remainingBalance: number;
}

export interface DebtContractScheduleParams {
  system: 'price' | 'sac';
  totalInstallments: number;
  startInstallmentNum: number;
  financedAmount: number;
  fixedInstallmentAmount?: number;
  interestRate: number;
  interestRateType: 'monthly' | 'yearly';
  insuranceAmount: number;
  baseDate: Date;
}

/**
 * Calcula a taxa de juros mensal decimal a partir de percentual mensal ou anual.
 */
export function getMonthlyInterestRateDecimal(ratePercent: number, type: 'monthly' | 'yearly'): number {
  if (ratePercent <= 0) return 0;
  return type === 'yearly' ? ratePercent / 12 / 100 : ratePercent / 100;
}

/**
 * Calcula a diferença em meses (com fração de dias) entre duas datas.
 */
export function getMonthsDiff(fromDate: Date, toDate: Date): number {
  const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
  const monthDiff = toDate.getMonth() - fromDate.getMonth();
  const dayDiff = (toDate.getDate() - fromDate.getDate()) / 30;
  const totalMonths = yearDiff * 12 + monthDiff + dayDiff;
  return Math.max(totalMonths, 0);
}

/**
 * Calcula o valor presente descontado de uma parcela futura:
 * VP = PMT / (1 + i/100)^n
 */
export function calcDiscountedValue(originalValue: number, monthlyRatePercent: number, monthsAhead: number): number {
  if (monthlyRatePercent <= 0 || monthsAhead <= 0) return originalValue;
  const rateFraction = monthlyRatePercent / 100;
  const presentValue = originalValue / Math.pow(1 + rateFraction, monthsAhead);
  return Math.max(presentValue, 0);
}

/**
 * Compara os sistemas PRICE e SAC para um determinado financiamento.
 */
export function calculateAmortizationComparison(params: {
  financedAmount: number;
  interestRate: number;
  interestRateType: 'monthly' | 'yearly';
  totalInstallments: number;
}) {
  const financed = Math.max(params.financedAmount, 0);
  const n = Math.max(params.totalInstallments, 1);
  const i = getMonthlyInterestRateDecimal(params.interestRate, params.interestRateType);

  // PRICE
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

  // SAC
  const sacAmortization = financed / n;
  const sacFirstInstallment = sacAmortization + financed * i;
  const sacLastInstallment = sacAmortization + sacAmortization * i;
  const sacTotalInterest = ((financed * i) + (sacAmortization * i)) * (n / 2);
  const sacTotal = financed + sacTotalInterest;

  const sacSavings = priceTotal - sacTotal;

  return {
    price: {
      monthlyInstallment: priceMonthlyInstallment,
      interest: priceInterest,
      total: priceTotal,
    },
    sac: {
      firstInstallment: sacFirstInstallment,
      lastInstallment: sacLastInstallment,
      interest: sacTotalInterest,
      total: sacTotal,
    },
    sacSavings,
  };
}

/**
 * Gera o cronograma completo de parcelas (SAC ou PRICE) para criação ou auditoria de contratos.
 */
export function generateDebtSchedule(params: DebtContractScheduleParams): {
  items: AmortizationScheduleItem[];
  totalContractCost: number;
} {
  const {
    system,
    totalInstallments,
    startInstallmentNum,
    financedAmount,
    fixedInstallmentAmount = 0,
    interestRate,
    interestRateType,
    insuranceAmount,
    baseDate,
  } = params;

  const items: AmortizationScheduleItem[] = [];
  const monthlyRate = getMonthlyInterestRateDecimal(interestRate, interestRateType);
  let totalContractCost = 0;

  if (system === 'price') {
    const singleVal = fixedInstallmentAmount + insuranceAmount;
    totalContractCost = totalInstallments * singleVal;

    for (let currentNum = 1; currentNum <= totalInstallments; currentNum++) {
      const offsetMonths = currentNum - startInstallmentNum;
      const txDate = new Date(baseDate);
      txDate.setMonth(baseDate.getMonth() + offsetMonths);

      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      items.push({
        installmentNumber: currentNum,
        offsetMonths,
        dueDate: formattedDate,
        installmentAmount: singleVal,
        amortization: fixedInstallmentAmount,
        interest: 0,
        insurance: insuranceAmount,
        remainingBalance: 0,
      });
    }
  } else {
    // Sistema SAC
    const monthlyAmortization = financedAmount / totalInstallments;
    let runningBalance = financedAmount;

    for (let currentNum = 1; currentNum <= totalInstallments; currentNum++) {
      const offsetMonths = currentNum - startInstallmentNum;
      const txDate = new Date(baseDate);
      txDate.setMonth(baseDate.getMonth() + offsetMonths);

      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const periodInterest = runningBalance * monthlyRate;
      const periodTotal = monthlyAmortization + periodInterest + insuranceAmount;
      const roundedTotal = fixedInstallmentAmount > 0 ? fixedInstallmentAmount : Math.round(periodTotal * 100) / 100;

      items.push({
        installmentNumber: currentNum,
        offsetMonths,
        dueDate: formattedDate,
        installmentAmount: roundedTotal,
        amortization: monthlyAmortization,
        interest: periodInterest,
        insurance: insuranceAmount,
        remainingBalance: Math.max(runningBalance - monthlyAmortization, 0),
      });

      runningBalance -= monthlyAmortization;
      totalContractCost += roundedTotal;
    }
  }

  return { items, totalContractCost };
}
