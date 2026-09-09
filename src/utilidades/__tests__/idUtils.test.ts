import { describe, it, expect } from 'vitest';
import { generateId } from '../idUtils';

describe('idUtils', () => {
  it('deve gerar identificadores únicos não vazios', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('deve aplicar prefixo customizado corretamente', () => {
    const txId = generateId('tx');
    const catId = generateId('cat');
    const debtId = generateId('debt');

    expect(txId).toMatch(/^tx_/);
    expect(catId).toMatch(/^cat_/);
    expect(debtId).toMatch(/^debt_/);
  });

  it('deve gerar sequências sem colisões em lote', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateId('test'));
    }
    expect(set.size).toBe(100);
  });
});
