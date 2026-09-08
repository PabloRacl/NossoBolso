import { describe, it, expect } from 'vitest';
import { formatDate, getMonthYearLabel, getCurrentMonthKey, getTodayStr, addMonthsPreservingDay } from '../dateUtils';
import { formatBRL, formatPercent } from '../formatters';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('deve formatar data ISO YYYY-MM-DD para DD/MM/YYYY', () => {
      expect(formatDate('2026-09-08')).toBe('08/09/2026');
      expect(formatDate('2026-01-01')).toBe('01/01/2026');
    });

    it('deve extrair e formatar apenas a data caso receba timestamp ISO com T', () => {
      expect(formatDate('2026-12-25T14:30:00.000Z')).toBe('25/12/2026');
    });

    it('deve retornar string vazia para entrada vazia ou nula', () => {
      expect(formatDate('')).toBe('');
    });

    it('deve retornar o próprio valor se não for um padrão YYYY-MM-DD', () => {
      expect(formatDate('08/09/2026')).toBe('08/09/2026');
    });
  });

  describe('getMonthYearLabel', () => {
    it('deve retornar mês por extenso e ano em pt-BR', () => {
      const label = getMonthYearLabel('2026-09-08');
      expect(label.toLowerCase()).toContain('setembro');
      expect(label).toContain('2026');
    });

    it('deve retornar vazio se string for vazia', () => {
      expect(getMonthYearLabel('')).toBe('');
    });
  });

  describe('getCurrentMonthKey & getTodayStr', () => {
    it('deve retornar chave de mês no formato YYYY-MM', () => {
      const monthKey = getCurrentMonthKey();
      expect(monthKey).toMatch(/^\d{4}-\d{2}$/);
    });

    it('deve retornar data de hoje no formato YYYY-MM-DD', () => {
      const today = getTodayStr();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('addMonthsPreservingDay (tratamento anti-overflow de fim de mês)', () => {
    it('deve preservar o dia do vencimento quando o mês seguinte comporta o mesmo número de dias', () => {
      const base = new Date(2026, 0, 15); // 15 de Janeiro de 2026
      expect(addMonthsPreservingDay(base, 1)).toBe('2026-02-15');
      expect(addMonthsPreservingDay(base, 2)).toBe('2026-03-15');
    });

    it('deve travar no último dia de fevereiro para dia 31 de janeiro em ano comum', () => {
      const base = new Date(2026, 0, 31); // 31 de Janeiro de 2026 (ano não bissexto)
      // Fevereiro de 2026 tem 28 dias
      expect(addMonthsPreservingDay(base, 1)).toBe('2026-02-28');
    });

    it('deve travar no último dia de fevereiro para dia 31 de janeiro em ano bissexto (ex: 2028)', () => {
      const base = new Date(2028, 0, 31); // 31 de Janeiro de 2028
      // Fevereiro de 2028 tem 29 dias
      expect(addMonthsPreservingDay(base, 1)).toBe('2028-02-29');
    });

    it('deve travar no dia 30 para meses de 30 dias (ex: 31 de março + 1 mês = 30 de abril)', () => {
      const base = new Date(2026, 2, 31); // 31 de Março
      expect(addMonthsPreservingDay(base, 1)).toBe('2026-04-30');
    });

    it('deve avançar corretamente através de viradas de ano', () => {
      const base = new Date(2026, 10, 20); // 20 de Novembro
      expect(addMonthsPreservingDay(base, 2)).toBe('2027-01-20');
    });
  });
});

describe('formatters', () => {
  describe('formatBRL', () => {
    it('deve formatar números em moeda Real brasileira (R$)', () => {
      const formatted = formatBRL(1250.5);
      // Espaço sem quebra ou regular entre R$ e o número
      expect(formatted).toContain('1.250,50');
      expect(formatted).toContain('R$');
    });

    it('deve mascarar valor quando isPrivacy for true', () => {
      expect(formatBRL(5000, true)).toBe('R$ •••••');
    });

    it('deve tratar com segurança NaN e Infinity convertendo para R$ 0,00', () => {
      expect(formatBRL(NaN)).toContain('0,00');
      expect(formatBRL(Infinity)).toContain('0,00');
      expect(formatBRL(-Infinity)).toContain('0,00');
    });

    it('deve formatar valores negativos corretamente', () => {
      const neg = formatBRL(-150);
      expect(neg).toContain('-R$');
      expect(neg).toContain('150,00');
    });
  });

  describe('formatPercent', () => {
    it('deve formatar valor percentual com 1 casa decimal', () => {
      expect(formatPercent(15.78)).toBe('15.8%');
      expect(formatPercent(20)).toBe('20.0%');
    });

    it('deve proteger contra NaN e Infinity retornando 0.0%', () => {
      expect(formatPercent(NaN)).toBe('0.0%');
      expect(formatPercent(Infinity)).toBe('0.0%');
    });
  });
});
