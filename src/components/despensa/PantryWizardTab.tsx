import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { PantryItem } from '../../types';

interface PantryWizardTabProps {
  items: PantryItem[];
  wizardIndex: number;
  onSelectQuantity: (qty: number) => void;
  onPrevious: () => void;
  onKeepCurrent: () => void;
  onBackToStock: () => void;
}

export const PantryWizardTab: React.FC<PantryWizardTabProps> = ({
  items,
  wizardIndex,
  onSelectQuantity,
  onPrevious,
  onKeepCurrent,
  onBackToStock,
}) => {
  const currentWizardItem = items[wizardIndex];

  const formatQtyDisplay = (val: number) => {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2).replace('.', ',');
  };

  if (items.length === 0) {
    return (
      <div className="flex justify-center w-full animate-fadeIn">
        <Card className="p-8 text-center max-w-md flex flex-col gap-3">
          <p className="text-sm text-[#94A3B8]">
            Cadastre itens no seu estoque primeiro para utilizar a conferência rápida.
          </p>
          <Button variant="primary" onClick={onBackToStock}>
            Voltar para o Estoque
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentWizardItem) return null;

  const progressPct = Math.round(((wizardIndex + 1) / items.length) * 100);

  return (
    <div className="flex justify-center w-full animate-fadeIn">
      <Card
        glow
        glowColor="#06B6D4"
        className="w-full max-w-lg p-5 sm:p-6 flex flex-col gap-5 border-t-4 border-t-[#06B6D4] shadow-2xl"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-extrabold text-[#06B6D4] uppercase tracking-wider">
              Conferência Pré-Feira ({wizardIndex + 1} de {items.length})
            </span>
            <span>{progressPct}% concluído</span>
          </div>
          <ProgressBar value={progressPct} variant="gradient" size="sm" />
        </div>

        <div className="flex flex-col items-center text-center gap-3 p-5 sm:p-6 bg-[#0A0B0E] border border-[#2E3B52] rounded-2xl">
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
            {currentWizardItem.category}
          </span>

          <h3 className="text-lg sm:text-xl font-black text-[#F8FAFC]">
            Quantos <strong className="text-[#00FF88]">{currentWizardItem.name}</strong> tem no armário/geladeira atualmente?
          </h3>

          <p className="text-xs text-[#94A3B8]">
            Estoque ideal cadastrado:{' '}
            <strong className="text-[#00FF88]">
              {formatQtyDisplay(currentWizardItem.idealQuantity)} {currentWizardItem.unit}
            </strong>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase text-center">
            Selecione a quantidade atual restante:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {[0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
              <button
                key={num}
                onClick={() => onSelectQuantity(num)}
                className={`h-11 rounded-xl text-xs sm:text-sm font-black border active:scale-95 transition-all touch-manipulation cursor-pointer ${
                  num === 0
                    ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/30'
                    : num < currentWizardItem.idealQuantity
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/30'
                    : 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30 hover:bg-[#00FF88]/30'
                }`}
              >
                {formatQtyDisplay(num)} {currentWizardItem.unit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#1E2330]">
          <button
            onClick={onPrevious}
            disabled={wizardIndex === 0}
            className="px-4 py-2.5 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 cursor-pointer"
          >
            Anterior
          </button>

          <button
            onClick={onKeepCurrent}
            className="px-4 py-2.5 text-xs font-bold text-[#06B6D4] hover:underline cursor-pointer"
          >
            Manter Atual ({formatQtyDisplay(currentWizardItem.currentQuantity)} {currentWizardItem.unit}) ➔
          </button>
        </div>
      </Card>
    </div>
  );
};
