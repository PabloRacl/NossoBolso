import { describe, it, expect } from 'vitest';
import { formatSecondsToTimer, INACTIVITY_TIMEOUT_SECONDS } from '../useAutoLock';

describe('useAutoLock — Formatação e Regras de Timeout de Sessão (15 min)', () => {
  it('deve ter timeout oficial de 15 minutos (900 segundos)', () => {
    expect(INACTIVITY_TIMEOUT_SECONDS).toBe(900);
  });

  it('deve formatar 900 segundos como "15:00"', () => {
    expect(formatSecondsToTimer(900)).toBe('15:00');
  });

  it('deve formatar valores intermediários corretamente', () => {
    expect(formatSecondsToTimer(899)).toBe('14:59');
    expect(formatSecondsToTimer(65)).toBe('01:05');
    expect(formatSecondsToTimer(9)).toBe('00:09');
    expect(formatSecondsToTimer(0)).toBe('00:00');
  });

  it('deve tratar valores negativos ou quebrados limitando em 00:00', () => {
    expect(formatSecondsToTimer(-15)).toBe('00:00');
    expect(formatSecondsToTimer(14.8)).toBe('00:14');
  });
});
