import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { Zap, CheckSquare, Square, Info } from 'lucide-react';
import type { Transaction } from '../../types';

interface InstallmentInfo {
  tx: Transaction;
  installmentNumber: number;
  dueDate: string;
  originalValue: number;
  discountedValue: number;
  monthsAhead: number;
}

/**
 * Calcula o valor presente (valor hoje) de uma parcela futura,
 * removendo os juros embutidos nos meses restantes até o vencimento.
 *
 * Fórmula: valorHoje = valorParcela / (1 + taxaMensal)^meses
 */
function calcDiscountedValue(originalValue: number, monthlyRate: number, monthsAhead: number): number {
  if (monthlyRate <= 0 || monthsAhead <= 0) return originalValue;
  return originalValue / Math.pow(1 + monthlyRate / 100, monthsAhead);
}

function getMonthsDiff(fromDate: Date, toDate: Date): number {
  const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
  const monthDiff = toDate.getMonth() - fromDate.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;
  return Math.max(totalMonths, 0);
}

export const AmortizacaoModal: React.FC = () => {
  const {
    isAmortizacaoModalOpen,
    setAmortizacaoModalOpen,
    amortizacaoContractId,
    setAmortizacaoContractId,
  } = useAppStore();

  const contracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const contract = contracts.find((c) => c.id === amortizacaoContractId);
  const interestRate = contract?.interestRate ?? 0;

  // Build list of future unpaid installments with discount calculation
  const installments: InstallmentInfo[] = useMemo(() => {
    if (!contract) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return transactions
      .filter((t) => t.contractId === contract.id && t.date > todayStr)
      .sort((a, b) => b.date.localeCompare(a.date)) // Most distant first (like the bank app)
      .map((tx) => {
        const dueDate = new Date(tx.date + 'T12:00:00');
        const monthsAhead = getMonthsDiff(today, dueDate);
        const discountedValue = calcDiscountedValue(tx.amount, interestRate, monthsAhead);
        const installmentNumber = tx.installments?.current ?? 0;

        return {
          tx,
          installmentNumber,
          dueDate: tx.date,
          originalValue: tx.amount,
          discountedValue: Math.round(discountedValue * 100) / 100,
          monthsAhead,
        };
      });
  }, [contract, transactions, interestRate]);

  // Selection handlers
  const toggleInstallment = (txId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === installments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(installments.map((i) => i.tx.id)));
    }
  };

  const allSelected = installments.length > 0 && selectedIds.size === installments.length;

  // Summary calculations
  const selectedInstallments = installments.filter((i) => selectedIds.has(i.tx.id));
  const totalOriginal = selectedInstallments.reduce((acc, i) => acc + i.originalValue, 0);
  const totalDiscounted = selectedInstallments.reduce((acc, i) => acc + i.discountedValue, 0);
  const totalSavings = totalOriginal - totalDiscounted;

  const handleClose = () => {
    setSelectedIds(new Set());
    setAmortizacaoContractId(null);
    setAmortizacaoModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!contract || selectedIds.size === 0) return;
    setIsProcessing(true);

    try {
      // Delete selected future installments
      for (const id of selectedIds) {
        await db.transactions.delete(id);
      }

      // Update contract totals
      const newTotalInstallments = contract.totalInstallments - selectedIds.size;
      const newTotalAmount = contract.totalAmount - totalOriginal;

      await db.debtContracts.update(contract.id, {
        totalInstallments: Math.max(newTotalInstallments, 0),
        totalAmount: Math.max(newTotalAmount, 0),
      });

      // Re-label remaining transactions with correct (X/Y) numbering
      const remainingTxs = await db.transactions
        .where('contractId')
        .equals(contract.id)
        .toArray();

      const sortedRemaining = remainingTxs.sort((a, b) => a.date.localeCompare(b.date));
      const updatedTotal = sortedRemaining.length;

      for (let i = 0; i < sortedRemaining.length; i++) {
        const tx = sortedRemaining[i];
        const newDescription = `${contract.title} (${i + 1}/${updatedTotal})`;
        await db.transactions.update(tx.id, {
          description: newDescription,
          installments: {
            current: i + 1,
            total: updatedTotal,
          },
        });
      }

      handleClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isAmortizacaoModalOpen}
      onClose={handleClose}
      title="Amortização — Antecipar Parcelas"
    >
      <div className="flex flex-col gap-4">
        {/* Info Banner */}
        <div className="p-3 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-[#06B6D4]/20 text-[#06B6D4] rounded-xl shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#94A3B8]">
            Ao antecipar o pagamento das parcelas, você tem{' '}
            <span className="font-bold text-[#06B6D4]">abatimento nos juros</span>.
            {interestRate > 0
              ? ` Taxa mensal: ${interestRate.toFixed(2)}%`
              : ' Configure a taxa de juros no contrato para ver o desconto.'}
          </p>
        </div>

        {/* Contract Info */}
        {contract && (
          <div className="p-3 bg-[#12141A] border border-[#1E2330] rounded-xl">
            <h4 className="text-sm font-extrabold text-[#F8FAFC]">{contract.title}</h4>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {contract.totalInstallments}x de {formatBRL(contract.installmentAmount)} •{' '}
              {installments.length} parcela(s) futura(s) disponível(eis) para antecipação
            </p>
          </div>
        )}

        {/* Select All */}
        {installments.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2.5 py-2 px-1 border-b border-[#1E2330] hover:bg-[#12141A]/50 transition-colors rounded-lg"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-[#00FF88] shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-[#64748B] shrink-0" />
            )}
            <span className="text-sm font-bold text-[#F8FAFC]">Selecionar todas</span>
          </button>
        )}

        {/* Installments List */}
        {installments.length > 0 ? (
          <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {installments.map((inst) => {
              const isSelected = selectedIds.has(inst.tx.id);
              const hasDiscount = interestRate > 0 && inst.monthsAhead > 0;

              return (
                <button
                  key={inst.tx.id}
                  type="button"
                  onClick={() => toggleInstallment(inst.tx.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#00FF88]/5 border-[#00FF88]/30'
                      : 'bg-[#12141A] border-[#1E2330] hover:border-[#2E3B52]'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="pt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#00FF88]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#64748B]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#F8FAFC]">
                      Parcela {inst.installmentNumber}{' '}
                      <span className="font-normal text-[#64748B]">
                        ({formatDate(inst.dueDate)})
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-1.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-[#64748B] uppercase">
                          Valor da parcela
                        </span>
                        <span className="text-sm font-black text-[#F8FAFC]">
                          {formatBRL(inst.originalValue)}
                        </span>
                      </div>

                      {hasDiscount && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-[#64748B] uppercase">
                            Valor hoje
                          </span>
                          <span className="text-sm font-black text-[#00FF88]">
                            {formatBRL(inst.discountedValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Zap className="w-10 h-10 text-[#64748B] mb-2" />
            <p className="text-sm font-bold text-[#F8FAFC]">Nenhuma parcela futura</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Este contrato não possui parcelas futuras para antecipar.
            </p>
          </div>
        )}

        {/* Summary Footer */}
        {selectedIds.size > 0 && (
          <div className="p-4 bg-gradient-to-br from-[#0A0B0E] to-[#12141A] border border-[#00FF88]/20 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Parcelas selecionadas</span>
              <span className="font-black text-[#F8FAFC]">{selectedIds.size}</span>
            </div>

            {interestRate > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Valor original total</span>
                  <span className="font-bold text-[#94A3B8] line-through">
                    {formatBRL(totalOriginal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Economia nos juros</span>
                  <span className="font-black text-[#10B981]">
                    -{formatBRL(totalSavings)}
                  </span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-[#1E2330] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">
                {interestRate > 0 ? 'Valor a pagar hoje' : 'Total das parcelas selecionadas'}
              </span>
              <span className="text-lg font-black text-[#00FF88]">
                {formatBRL(interestRate > 0 ? totalDiscounted : totalOriginal)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || isProcessing}
          >
            <Zap className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processando...'
                : `Confirmar Antecipação (${selectedIds.size})`}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
