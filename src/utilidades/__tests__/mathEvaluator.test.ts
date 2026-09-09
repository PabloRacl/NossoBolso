import { describe, it, expect } from 'vitest';
import { evaluateMathExpression } from '../mathEvaluator';

describe('mathEvaluator — Avaliador Aritmético Seguro', () => {
  it('deve realizar operações básicas (+, -, *, /)', () => {
    expect(evaluateMathExpression('2 + 3')).toBe(5);
    expect(evaluateMathExpression('10 - 4')).toBe(6);
    expect(evaluateMathExpression('6 * 7')).toBe(42);
    expect(evaluateMathExpression('20 / 4')).toBe(5);
  });

  it('deve respeitar a precedência correta de operadores', () => {
    expect(evaluateMathExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateMathExpression('10 - 2 * 3')).toBe(4);
    expect(evaluateMathExpression('20 / 2 + 5')).toBe(15);
  });

  it('deve respeitar parênteses aninhados', () => {
    expect(evaluateMathExpression('(2 + 3) * 4')).toBe(20);
    expect(evaluateMathExpression('((10 + 5) * 2) / 3')).toBe(10);
  });

  it('deve suportar decimais com ponto ou vírgula', () => {
    expect(evaluateMathExpression('2.5 + 1.5')).toBe(4);
    expect(evaluateMathExpression('2,5 * 2')).toBe(5);
  });

  it('deve suportar operadores de exibição visual (× e ÷)', () => {
    expect(evaluateMathExpression('10 × 5')).toBe(50);
    expect(evaluateMathExpression('50 ÷ 2')).toBe(25);
  });

  it('deve suportar cálculo de porcentagem', () => {
    expect(evaluateMathExpression('200 * 10%')).toBe(20);
    expect(evaluateMathExpression('50% * 100')).toBe(50);
  });

  it('deve suportar números negativos', () => {
    expect(evaluateMathExpression('-5 + 10')).toBe(5);
    expect(evaluateMathExpression('10 + -3')).toBe(7);
  });

  it('deve lançar erro em divisão por zero', () => {
    expect(() => evaluateMathExpression('10 / 0')).toThrow('Divisão por zero.');
  });

  it('deve lançar erro para caracteres não permitidos ou código malicioso', () => {
    expect(() => evaluateMathExpression('window.alert(1)')).toThrow();
    expect(() => evaluateMathExpression('console.log(123)')).toThrow();
    expect(() => evaluateMathExpression('2 + [1, 2]')).toThrow();
  });
});
