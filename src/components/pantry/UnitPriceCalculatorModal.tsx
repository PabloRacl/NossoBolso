import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShoppingBag, Sparkles, CheckCircle2, Scale, ArrowRight } from 'lucide-react';

export const UnitPriceCalculatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  // Produto A
  const [nameA, setNameA] = useState('Embalagem Menor (Ex: 800g)');
  const [priceA, setPriceA] = useState<number>(18.90);
  const [qtyA, setQtyA] = useState<number>(800);
  const [unitA, setUnitA] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  // Produto B
  const [nameB, setNameB] = useState('Embalagem Família (Ex: 1.2kg)');
  const [priceB, setPriceB] = useState<number>(26.50);
  const [qtyB, setQtyB] = useState<number>(1200);
  const [unitB, setUnitB] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  // Normalização de preço por 1kg ou 1L ou 1unidade
  const calcResults = useMemo(() => {
    const normalize = (price: number, qty: number, unit: string) => {
      if (qty <= 0) return 0;
      if (unit === 'g' || unit === 'ml') {
        return (price / qty) * 1000; // preço por 1kg ou 1L
      }
      return price / qty; // preço por 1kg, 1L ou 1un
    };

    const normA = normalize(priceA, qtyA, unitA);
    const normB = normalize(priceB, qtyB, unitB);

    let winner: 'A' | 'B' | 'equal' = 'equal';
    let savingsPct = 0;

    if (normA < normB) {
      winner = 'A';
      savingsPct = ((normB - normA) / normB) * 100;
    } else if (normB < normA) {
      winner = 'B';
      savingsPct = ((normA - normB) / normA) * 100;
    }

    const unitLabel = unitA === 'ml' || unitA === 'L' ? 'Litro (L)' : unitA === 'un' ? 'Unidade (un)' : 'Quilo (KG)';

    return { normA, normB, winner, savingsPct, unitLabel };
  }, [priceA, qtyA, unitA, priceB, qtyB, unitB]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Otimizador de Supermercado (Calculadora de Menor Preço)">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Apresentação */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <Scale className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Comparador de Preço por KG/Litro na Prateleira</h4>
            <p className="mt-1">
              Descubra na hora se vale mais a pena comprar a embalagem menor ou o pacote tamanho família comparando o custo por 1kg ou 1 Litro!
            </p>
          </div>
        </div>

        {/* Inputs de Comparação Lado a Lado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opção A */}
          <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-[#38BDF8] border-b border-[#1E293B] pb-1">
              📦 Opção A
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8]">Preço Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={priceA}
                onChange={(e) => setPriceA(Number(e.target.value))}
                className="w-full h-9 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#94A3B8]">Quantidade</label>
                <input
                  type="number"
                  value={qtyA}
                  onChange={(e) => setQtyA(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#94A3B8]">Unidade</label>
                <select
                  value={unitA}
                  onChange={(e) => setUnitA(e.target.value as any)}
                  className="w-full h-9 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
                >
                  <option value="g">Grama (g)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="L">Litro (L)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Custo Normalizado:</span>
              <strong className="text-[#F8FAFC]">R$ {calcResults.normA.toFixed(2)} / {calcResults.unitLabel}</strong>
            </div>
          </div>

          {/* Opção B */}
          <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-[#F59E0B] border-b border-[#1E293B] pb-1">
              📦 Opção B
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8]">Preço Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={priceB}
                onChange={(e) => setPriceB(Number(e.target.value))}
                className="w-full h-9 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#94A3B8]">Quantidade</label>
                <input
                  type="number"
                  value={qtyB}
                  onChange={(e) => setQtyB(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#94A3B8]">Unidade</label>
                <select
                  value={unitB}
                  onChange={(e) => setUnitB(e.target.value as any)}
                  className="w-full h-9 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC]"
                >
                  <option value="g">Grama (g)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="L">Litro (L)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Custo Normalizado:</span>
              <strong className="text-[#F8FAFC]">R$ {calcResults.normB.toFixed(2)} / {calcResults.unitLabel}</strong>
            </div>
          </div>
        </div>

        {/* Banner com o Vencedor */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            calcResults.winner === 'equal'
              ? 'bg-[#162032] border-[#2E3B52] text-[#94A3B8]'
              : 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00FF88] shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#F8FAFC]">
                {calcResults.winner === 'A'
                  ? '🏆 Opção A é Mais Econômica!'
                  : calcResults.winner === 'B'
                  ? '🏆 Opção B é Mais Econômica!'
                  : 'Mesmo Custo por Unidade!'}
              </span>
              {calcResults.savingsPct > 0 && (
                <span className="text-[11px] text-[#00FF88] font-bold">
                  Economia real de {calcResults.savingsPct.toFixed(1)}% comprando esta opção.
                </span>
              )}
            </div>
          </div>

          <Sparkles className="w-5 h-5 text-[#00FF88]" />
        </div>
      </div>
    </Modal>
  );
};
