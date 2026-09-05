import React from 'react';
import { Card } from '../ui/Card';
import { Zap, CheckCircle2 } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';

interface EarlyDiscountTabProps {
  discInstallmentVal: string;
  setDiscInstallmentVal: (v: string) => void;
  discCount: string;
  setDiscCount: (v: string) => void;
  discRate: string;
  setDiscRate: (v: string) => void;
  discountResults: {
    nominalTotal: number;
    presentValue: number;
    savings: number;
  };
}

export const EarlyDiscountTab: React.FC<EarlyDiscountTabProps> = ({
  discInstallmentVal,
  setDiscInstallmentVal,
  discCount,
  setDiscCount,
  discRate,
  setDiscRate,
  discountResults,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fadeIn">
      <Card className="flex flex-col gap-4 p-5 border-l-4 border-l-[#F59E0B]">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="text-base font-extrabold text-[#F8FAFC]">Quitação Antecipada de Parcelas</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Valor da Parcela Mensal (R$)
          </label>
          <input
            type="number"
            step="50"
            value={discInstallmentVal}
            onChange={(e) => setDiscInstallmentVal(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Qtd de Parcelas a Antecipar
          </label>
          <input
            type="number"
            min="1"
            max="360"
            value={discCount}
            onChange={(e) => setDiscCount(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Taxa de Desconto / Juros (% a.m.)
          </label>
          <input
            type="number"
            step="0.1"
            value={discRate}
            onChange={(e) => setDiscRate(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#00FF88]">
          <h4 className="text-sm font-extrabold text-[#F8FAFC] uppercase tracking-wider">
            Resultado da Antecipação
          </h4>

          <div className="flex flex-col gap-3 py-3 border-y border-[#1E293B]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Valor Sem Desconto (Soma Nominal):</span>
              <span className="font-bold text-[#64748B] line-through">{formatBRL(discountResults.nominalTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Valor a Pagar Hoje (Com Desconto):</span>
              <span className="text-lg font-black text-[#00FF88]">{formatBRL(discountResults.presentValue)}</span>
            </div>
          </div>

          <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
              <span className="text-xs font-extrabold text-[#F8FAFC]">Economia Gerada no Bolso:</span>
            </div>
            <span className="text-lg font-black text-[#00FF88]">{formatBRL(discountResults.savings)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
