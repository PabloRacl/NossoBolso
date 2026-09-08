import { describe, it, expect } from 'vitest';
import {
  getMonthlyInterestRateDecimal,
  getMonthsDiff,
  calcDiscountedValue,
  calculateAmortizationComparison,
  generateDebtSchedule,
} from '../debtCalculations';

describe('debtCalculations - Motor Matemático de Financiamento e Amortização', () => {
  describe('getMonthlyInterestRateDecimal', () => {
    it('deve converter taxa mensal percentual para decimal', () => {
      expect(getMonthlyInterestRateDecimal(1.5, 'monthly')).toBeCloseTo(0.015, 6);
      expect(getMonthlyInterestRateDecimal(0.85, 'monthly')).toBeCloseTo(0.0085, 6);
    });

    it('deve converter taxa anual percentual para taxa mensal linear decimal', () => {
      // 12% a.a. / 12 = 1% a.m. = 0.01
      expect(getMonthlyInterestRateDecimal(12, 'yearly')).toBeCloseTo(0.01, 6);
      // 9.6% a.a. / 12 = 0.8% a.m. = 0.008
      expect(getMonthlyInterestRateDecimal(9.6, 'yearly')).toBeCloseTo(0.008, 6);
    });

    it('deve retornar 0 para taxas nulas ou negativas', () => {
      expect(getMonthlyInterestRateDecimal(0, 'monthly')).toBe(0);
      expect(getMonthlyInterestRateDecimal(-5, 'yearly')).toBe(0);
    });
  });

  describe('getMonthsDiff', () => {
    it('deve calcular a diferença de meses exatos entre duas datas', () => {
      const d1 = new Date(2026, 0, 15);
      const d2 = new Date(2026, 5, 15);
      expect(getMonthsDiff(d1, d2)).toBeCloseTo(5, 1);
    });

    it('deve retornar 0 se a data de destino for anterior à de origem', () => {
      const d1 = new Date(2026, 5, 15);
      const d2 = new Date(2026, 0, 15);
      expect(getMonthsDiff(d1, d2)).toBe(0);
    });
  });

  describe('calcDiscountedValue (Antecipação a Valor Presente)', () => {
    it('deve calcular o valor presente descapitalizado corretamente', () => {
      // VP = 1000 / (1 + 0.01)^12 ≈ 887.45
      const vp = calcDiscountedValue(1000, 1.0, 12);
      expect(vp).toBeCloseTo(887.45, 1);
    });

    it('deve retornar o valor original se meses ou taxa forem zero', () => {
      expect(calcDiscountedValue(1500, 0, 10)).toBe(1500);
      expect(calcDiscountedValue(1500, 1.5, 0)).toBe(1500);
    });
  });

  describe('calculateAmortizationComparison (SAC vs PRICE)', () => {
    it('deve projetar corretamente o comparativo SAC vs PRICE para R$ 100.000 em 120 meses a 1% a.m.', () => {
      const financedAmount = 100000;
      const totalInstallments = 120;
      const result = calculateAmortizationComparison({
        financedAmount,
        interestRate: 1.0,
        interestRateType: 'monthly',
        totalInstallments,
      });

      // Validações PRICE
      expect(result.price.monthlyInstallment).toBeGreaterThan(0);
      expect(result.price.total).toBeCloseTo(result.price.monthlyInstallment * totalInstallments, 2);
      expect(result.price.interest).toBeCloseTo(result.price.total - financedAmount, 2);

      // Validações SAC
      // Primeira parcela: 100.000 / 120 + 100.000 * 0.01 = 833.33 + 1000 = 1833.33
      expect(result.sac.firstInstallment).toBeCloseTo(1833.33, 1);
      // Última parcela: 100.000 / 120 + (100.000 / 120) * 0.01 ≈ 833.33 + 8.33 = 841.67
      expect(result.sac.lastInstallment).toBeCloseTo(841.67, 1);

      // A primeira parcela do SAC deve ser maior que a do PRICE
      expect(result.sac.firstInstallment).toBeGreaterThan(result.price.monthlyInstallment);
      // A última parcela do SAC deve ser menor que a do PRICE
      expect(result.sac.lastInstallment).toBeLessThan(result.price.monthlyInstallment);

      // SAC deve gerar economia financeira total em relação ao PRICE
      expect(result.sac.total).toBeLessThan(result.price.total);
      expect(result.sacSavings).toBeGreaterThan(0);
      expect(result.sacSavings).toBeCloseTo(result.price.total - result.sac.total, 2);
    });

    it('deve lidar graciosamente com taxa zero', () => {
      const result = calculateAmortizationComparison({
        financedAmount: 12000,
        interestRate: 0,
        interestRateType: 'monthly',
        totalInstallments: 12,
      });

      expect(result.price.monthlyInstallment).toBe(1000);
      expect(result.price.interest).toBe(0);
      expect(result.sac.firstInstallment).toBe(1000);
      expect(result.sac.lastInstallment).toBe(1000);
      expect(result.sacSavings).toBe(0);
    });
  });

  describe('generateDebtSchedule (Cronograma Contratual de Parcelas)', () => {
    it('deve gerar cronograma SAC com amortizações constantes e saldo devedor zerado ao final', () => {
      const financedAmount = 24000;
      const totalInstallments = 24;
      const insuranceAmount = 25;
      const schedule = generateDebtSchedule({
        system: 'sac',
        totalInstallments,
        startInstallmentNum: 1,
        financedAmount,
        interestRate: 1.0,
        interestRateType: 'monthly',
        insuranceAmount,
        baseDate: new Date('2026-01-10T12:00:00Z'),
      });

      expect(schedule.items.length).toBe(totalInstallments);

      // Amortização mensal constante = 24.000 / 24 = 1.000
      const totalAmortization = schedule.items.reduce((acc, item) => acc + item.amortization, 0);
      expect(totalAmortization).toBeCloseTo(financedAmount, 2);

      // Cada item deve ter exatamente R$ 1.000 de amortização
      schedule.items.forEach((item) => {
        expect(item.amortization).toBeCloseTo(1000, 2);
        expect(item.insurance).toBe(insuranceAmount);
      });

      // Primeira parcela: 1000 (amort) + 240 (juros 1% de 24k) + 25 (seguro) = 1265
      expect(schedule.items[0].installmentAmount).toBeCloseTo(1265, 2);

      // Última parcela: saldo devedor final deve ser zero
      const lastItem = schedule.items[totalInstallments - 1];
      expect(lastItem.remainingBalance).toBe(0);

      // Total acumulado
      expect(schedule.totalContractCost).toBeGreaterThan(financedAmount);
    });

    it('deve gerar cronograma PRICE com parcelas uniformes e datas incrementais', () => {
      const fixedInstallmentAmount = 850.50;
      const insuranceAmount = 15.00;
      const totalInstallments = 12;

      const schedule = generateDebtSchedule({
        system: 'price',
        totalInstallments,
        startInstallmentNum: 1,
        financedAmount: 9000,
        fixedInstallmentAmount,
        interestRate: 1.2,
        interestRateType: 'monthly',
        insuranceAmount,
        baseDate: new Date('2026-03-01T12:00:00Z'),
      });

      expect(schedule.items.length).toBe(totalInstallments);
      const expectedSingleAmount = fixedInstallmentAmount + insuranceAmount;

      schedule.items.forEach((item, index) => {
        expect(item.installmentNumber).toBe(index + 1);
        expect(item.installmentAmount).toBeCloseTo(expectedSingleAmount, 2);
        expect(item.insurance).toBe(insuranceAmount);
      });

      expect(schedule.totalContractCost).toBeCloseTo(expectedSingleAmount * totalInstallments, 2);
    });

    it('deve preservar o dia de vencimento sem overflow em meses mais curtos (ex: 31 de janeiro -> 28 de fevereiro)', () => {
      const schedule = generateDebtSchedule({
        system: 'price',
        totalInstallments: 3,
        startInstallmentNum: 1,
        financedAmount: 3000,
        interestRate: 1.0,
        interestRateType: 'monthly',
        insuranceAmount: 0,
        baseDate: new Date(2026, 0, 31), // 31 de janeiro de 2026
      });

      expect(schedule.items.length).toBe(3);
      expect(schedule.items[0].dueDate).toBe('2026-01-31');
      expect(schedule.items[1].dueDate).toBe('2026-02-28'); // Fevereiro limitado ao último dia válido, sem pular para março
      expect(schedule.items[2].dueDate).toBe('2026-03-31'); // Março volta a ter dia 31
    });
  });
});
