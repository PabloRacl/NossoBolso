import React from 'react';
import { CheckSquare, Square, Edit3, Zap } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';
import { formatDate } from '../../utilidades/dateUtils';
import type { Transaction } from '../../tipos';

export interface InstallmentInfo {
  tx: Transaction;
  installmentNumber: number;
  dueDate: string;
  originalValue: number;
  discountedValue: number;
  monthsAhead: number;
}

interface AmortizacaoInstallmentsListProps {
  installments: InstallmentInfo[];
  selectedIds: Set<string>;
  allSelected: boolean;
  customInstallmentValues: Record<string, string>;
  onToggleAll: () => void;
  onToggleInstallment: (txId: string) => void;
  onCustomValueChange: (txId: string, val: string) => void;
}

export const AmortizacaoInstallmentsList: React.FC<AmortizacaoInstallmentsListProps> = ({
  installments,
  selectedIds,
  allSelected,
  customInstallmentValues,
  onToggleAll,
  onToggleInstallment,
  onCustomValueChange,
}) => {
  if (installments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Zap className="w-10 h-10 text-[#64748B] mb-2" />
        <p className="text-sm font-bold text-[#F8FAFC]">Nenhuma parcela futura</p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Este contrato não possui parcelas futuras para antecipar.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Selecionar Todas */}
      <button
        type="button"
        onClick={onToggleAll}
        className="flex items-center gap-2.5 py-2 px-1 border-b border-[#1E2330] hover:bg-[#12141A]/50 transition-colors rounded-lg"
      >
        {allSelected ? (
          <CheckSquare className="w-5 h-5 text-[#00FF88] shrink-0" />
        ) : (
          <Square className="w-5 h-5 text-[#64748B] shrink-0" />
        )}
        <span className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider">
          Selecionar todas as parcelas
        </span>
      </button>

      {/* Lista de Parcelas com Input Editável de Valor Hoje */}
      <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        {installments.map((inst) => {
          const isSelected = selectedIds.has(inst.tx.id);
          const currentCustomStr = customInstallmentValues[inst.tx.id] ?? '';

          return (
            <div
              key={inst.tx.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-[#00FF88]/10 border-[#00FF88]/50 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                  : 'bg-[#090D18] border-[#1E293B] hover:border-[#3B4C6A]'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleInstallment(inst.tx.id)}
                className="flex items-center gap-3.5 min-w-0 flex-1"
              >
                <div className="shrink-0">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#00FF88]" />
                  ) : (
                    <Square className="w-5 h-5 text-[#64748B]" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-[#F8FAFC]">
                    Parcela {inst.installmentNumber}{' '}
                    <span className="font-normal text-[#94A3B8]">
                      ({formatDate(inst.dueDate)})
                    </span>
                  </span>
                  <span className="text-[10px] text-[#64748B] font-medium mt-0.5">
                    Antecipação de {Math.round(inst.monthsAhead)} mês(es)
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-4 shrink-0 text-right">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[9px] font-black text-[#94A3B8] uppercase">PARCELA</span>
                  <span className="text-xs font-black text-[#F8FAFC]">
                    {formatBRL(inst.originalValue)}
                  </span>
                </div>

                {/* Campo Editável para Valor Hoje Preciso */}
                <div
                  className={`flex flex-col items-end p-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#00FF88]/15 border-[#00FF88]/50 shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                      : 'bg-[#121929] border-[#2E3B52]'
                  }`}
                >
                  <span className="text-[9px] font-black text-[#00FF88] uppercase flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" />
                    VALOR HOJE
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-black text-[#00FF88]">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={inst.discountedValue.toFixed(2)}
                      className="w-20 bg-transparent text-xs font-black text-[#00FF88] text-right focus:outline-none focus:bg-[#00FF88]/10 rounded px-1"
                      value={currentCustomStr}
                      onChange={(e) => onCustomValueChange(inst.tx.id, e.target.value)}
                      title="Digite o valor exato cobrado pelo seu banco para esta parcela"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
