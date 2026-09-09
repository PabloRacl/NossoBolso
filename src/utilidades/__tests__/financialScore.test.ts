import { describe, it, expect } from 'vitest';
import { calculateFinancialHealthScore } from '../financialScore';
import type { Transaction, Wallet, DebtContract } from '../../tipos';

describe('calculateFinancialHealthScore', () => {
  it('deve calcular score máximo (1000 pts) e nível EXCELENTE para perfil com alta reserva e sem dívidas', () => {
    const wallets: Wallet[] = [
      { id: 'w1', name: 'Nubank', type: 'checking', balance: 10000, color: '#8A05BE', icon: 'wallet' },
      { id: 'w2', name: 'Tesouro Selic', type: 'savings', balance: 30000, color: '#00FF88', icon: 'piggy-bank' },
      { id: 'w3', name: 'Inter Invest', type: 'investment', balance: 20000, color: '#FF7A00', icon: 'trending-up' },
      { id: 'w4', name: 'Cartão Black', type: 'credit', balance: 1000, color: '#000000', icon: 'credit-card' },
    ];

    const transactions: Transaction[] = [
      { id: 't1', description: 'Salário', amount: 15000, date: '2026-09-01', type: 'income', category: 'Salário', walletId: 'w1', createdAt: '' },
      { id: 't2', description: 'Aluguel', amount: 2500, date: '2026-09-05', type: 'expense', category: 'Moradia', walletId: 'w1', createdAt: '' },
      { id: 't3', description: 'Mercado', amount: 1500, date: '2026-09-06', type: 'expense', category: 'Alimentação', walletId: 'w1', createdAt: '' },
    ];

    const debtContracts: DebtContract[] = [];

    const result = calculateFinancialHealthScore(transactions, wallets, debtContracts);

    expect(result.score).toBe(1000);
    expect(result.level).toBe('EXCELENTE');
    expect(result.levelColor).toBe('#00FF88');
    expect(result.breakdown.reserveScore).toBe(300);
    expect(result.breakdown.debtScore).toBe(300);
    expect(result.breakdown.savingsScore).toBe(200);
    expect(result.breakdown.walletScore).toBe(200);
  });

  it('deve penalizar score quando dívidas excedem a reserva de emergência', () => {
    const wallets: Wallet[] = [
      { id: 'w1', name: 'Conta Corrente', type: 'checking', balance: 2000, color: '#00FF88', icon: 'wallet' },
    ];

    const transactions: Transaction[] = [
      { id: 't1', description: 'Salário', amount: 3000, date: '2026-09-01', type: 'income', category: 'Salário', walletId: 'w1', createdAt: '' },
      { id: 't2', description: 'Gastos', amount: 2800, date: '2026-09-05', type: 'expense', category: 'Geral', walletId: 'w1', createdAt: '' },
    ];

    const debtContracts: DebtContract[] = [
      {
        id: 'd1',
        title: 'Empréstimo Pessoal',
        totalAmount: 15000,
        installmentAmount: 500,
        totalInstallments: 36,
        startDate: '2026-01-01',
        category: 'Dívidas',
        walletId: 'w1',
        interestRate: 2.5,
        amortizationSystem: 'price',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const result = calculateFinancialHealthScore(transactions, wallets, debtContracts);

    expect(result.breakdown.debtScore).toBe(50);
    expect(result.score).toBeLessThan(500);
    expect(result.level).toBe('CRITICO');
    expect(result.levelColor).toBe('#FF4D6D');
    expect(result.recommendations.some((r) => r.includes('reserva'))).toBe(true);
  });

  it('deve funcionar normalmente com arrays vazios sem lançar exceções nem retornar NaN', () => {
    const result = calculateFinancialHealthScore([], [], []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1000);
    expect(isNaN(result.score)).toBe(false);
  });
});
