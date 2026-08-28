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

  // Estados para amortização SAC
  const [amortizationExtraAmount, setAmortizationExtraAmount] = useState('');
  const [sacImpactType, setSacImpactType] = useState<'prazo' | 'parcela'>('prazo');

  const contract = contracts.find((c) => c.id === amortizacaoContractId);
  const interestRate = contract?.interestRate ?? 0;

  // Build list of future unpaid installments with discount calculation (apenas PRICE)
  const installments: InstallmentInfo[] = useMemo(() => {
    if (!contract || contract.amortizationSystem === 'sac') return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return transactions
      .filter((t) => t.contractId === contract.id && t.date > todayStr)
      .sort((a, b) => b.date.localeCompare(a.date)) // Most distant first
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

  // Selection handlers (PRICE)
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

  // Summary calculations (PRICE)
  const selectedInstallments = installments.filter((i) => selectedIds.has(i.tx.id));
  const totalOriginal = selectedInstallments.reduce((acc, i) => acc + i.originalValue, 0);
  const totalDiscounted = selectedInstallments.reduce((acc, i) => acc + i.discountedValue, 0);
  const totalSavings = totalOriginal - totalDiscounted;

  const handleClose = () => {
    setSelectedIds(new Set());
    setAmortizationExtraAmount('');
    setSacImpactType('prazo');
    setAmortizacaoContractId(null);
    setAmortizacaoModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!contract) return;
    setIsProcessing(true);

    try {
      if (contract.amortizationSystem === 'sac') {
        const extraVal = parseFloat(amortizationExtraAmount);
        if (isNaN(extraVal) || extraVal <= 0) return;

        // 1. Criar transação de despesa extraordinária de amortização
        const amortTxId = 'tx_amort_' + Math.random().toString(36).substring(2, 9);
        const todayStr = new Date().toISOString().split('T')[0];

        await db.transactions.add({
          id: amortTxId,
          description: `Amortização Extra (${contract.title})`,
          amount: extraVal,
          date: todayStr,
          type: 'expense',
          category: contract.category,
          walletId: contract.walletId,
          contractId: contract.id,
          createdAt: new Date().toISOString(),
          notes: `Amortização extraordinária por redução de ${sacImpactType}.`,
        });

        // 2. Obter transações futuras
        const allContractTxs = await db.transactions
          .where('contractId')
          .equals(contract.id)
          .toArray();

        const futureTxs = allContractTxs
          .filter((t) => t.date > todayStr && t.id !== amortTxId)
          .sort((a, b) => a.date.localeCompare(b.date));

        const paidCount = allContractTxs.length - futureTxs.length - 1; // desconta a de amortização recém criada

        const parsedRate = contract.interestRate ?? 0;
        const monthlyRate = contract.interestRateType === 'yearly' ? (parsedRate / 12 / 100) : (parsedRate / 100);
        const parsedInsurance = contract.insuranceAmount ?? 0;

        const startInstallment = contract.startInstallmentNum ?? 1;
        const totalPlannedInstallments = contract.totalInstallments - startInstallment + 1;
        const baseAmortization = contract.totalAmount / totalPlannedInstallments;
        const currentBalance = contract.totalAmount - (paidCount * baseAmortization);

        const newBalance = Math.max(currentBalance - extraVal, 0);

        if (sacImpactType === 'parcela') {
          // Dilui no restante
          const remainingCount = futureTxs.length;
          const newMonthlyAmortization = newBalance / (remainingCount || 1);

          let runningBalance = newBalance;
          for (let i = 0; i < futureTxs.length; i++) {
            const tx = futureTxs[i];
            const periodInterest = runningBalance * monthlyRate;
            const periodTotal = newMonthlyAmortization + periodInterest + parsedInsurance;
            const roundedTotal = Math.round(periodTotal * 100) / 100;

            await db.transactions.update(tx.id, {
              amount: roundedTotal,
            });

            runningBalance -= newMonthlyAmortization;
          }

          // Atualiza saldo total financiado para manter coerência
          await db.debtContracts.update(contract.id, {
            totalAmount: Math.max(contract.totalAmount - extraVal, 0),
          });
        } else {
          // Reduzir prazo
          const newFutureCount = Math.ceil(newBalance / (baseAmortization || 1));
          const txsToKeep = futureTxs.slice(0, newFutureCount);
          const txsToDelete = futureTxs.slice(newFutureCount);

          for (const tx of txsToDelete) {
            await db.transactions.delete(tx.id);
          }

          let runningBalance = newBalance;
          for (let i = 0; i < txsToKeep.length; i++) {
            const tx = txsToKeep[i];
            const isLast = i === txsToKeep.length - 1;
            const currentAmortization = isLast ? runningBalance : baseAmortization;
            const periodInterest = runningBalance * monthlyRate;
            const periodTotal = currentAmortization + periodInterest + parsedInsurance;
            const roundedTotal = Math.round(periodTotal * 100) / 100;

            await db.transactions.update(tx.id, {
              amount: roundedTotal,
            });

            runningBalance -= currentAmortization;
          }

          // Atualiza total de parcelas e valor total no contrato
          const newTotalInstallments = paidCount + txsToKeep.length;
          await db.debtContracts.update(contract.id, {
            totalInstallments: Math.max(newTotalInstallments, 0),
            totalAmount: Math.max(contract.totalAmount - extraVal, 0),
          });

          // Re-rotular transações
          const remainingTxs = await db.transactions
            .where('contractId')
            .equals(contract.id)
            .toArray();

          const sortedRemaining = remainingTxs
            .filter((t) => t.id !== amortTxId && t.date > todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));

          // E as transações passadas
          const pastRemaining = remainingTxs
            .filter((t) => t.id !== amortTxId && t.date <= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));

          const allRemaining = [...pastRemaining, ...sortedRemaining];
          const updatedTotal = allRemaining.length;

          for (let i = 0; i < allRemaining.length; i++) {
            const tx = allRemaining[i];
            const currentNum = i + 1;
            const newDescription = `${contract.title} (${currentNum}/${updatedTotal})`;
            await db.transactions.update(tx.id, {
              description: newDescription,
              installments: {
                current: currentNum,
                total: updatedTotal,
              },
            });
          }
        }

        handleClose();
      } else {
        // PRICE original
        for (const id of selectedIds) {
          await db.transactions.delete(id);
        }

        const newTotalInstallments = contract.totalInstallments - selectedIds.size;
        const newTotalAmount = contract.totalAmount - totalOriginal;

        await db.debtContracts.update(contract.id, {
          totalInstallments: Math.max(newTotalInstallments, 0),
          totalAmount: Math.max(newTotalAmount, 0),
        });

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
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isAmortizacaoModalOpen}
      onClose={handleClose}
      title="Amortização — Reduzir Financiamento"
    >
      <div className="flex flex-col gap-4">
        {/* Info Banner */}
        <div className="p-3 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-[#06B6D4]/20 text-[#06B6D4] rounded-xl shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#94A3B8]">
            {contract?.amortizationSystem === 'sac' ? (
              <>
                No sistema <span className="font-bold text-[#06B6D4]">SAC</span>, a amortização extraordinária reduz diretamente seu saldo devedor principal, recalculando os juros futuros.
              </>
            ) : (
              <>
                Ao antecipar o pagamento das parcelas, você tem{' '}
                <span className="font-bold text-[#06B6D4]">abatimento nos juros</span>.
                {interestRate > 0
                  ? ` Taxa mensal: ${interestRate.toFixed(2)}%`
                  : ' Configure a taxa de juros no contrato para ver o desconto.'}
              </>
            )}
          </p>
        </div>

        {/* Contract Info */}
        {contract && (
          <div className="p-3 bg-[#12141A] border border-[#1E2330] rounded-xl">
            <h4 className="text-sm font-extrabold text-[#F8FAFC]">{contract.title}</h4>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {contract.amortizationSystem === 'sac'
                ? `Sistema SAC • ${contract.interestRate}% de juros`
                : `${contract.totalInstallments}x de ${formatBRL(contract.installmentAmount)} • ${installments.length} parcela(s) a antecipar`}
            </p>
          </div>
        )}

        {contract?.amortizationSystem === 'sac' ? (
          /* SAC Amortization Form */
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Valor a Amortizar Extraordinariamente (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 5.000,00"
                className="w-full h-10 px-3 text-xs bg-[#0A0B0E] border border-[#1E2330] text-[#F8FAFC] rounded-xl focus:border-[#F59E0B] focus:outline-none transition-colors"
                value={amortizationExtraAmount}
                onChange={(e) => setAmortizationExtraAmount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Tipo de Impacto</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSacImpactType('prazo')}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    sacImpactType === 'prazo'
                      ? 'bg-[#00FF88]/5 border-[#00FF88]/40 text-[#F8FAFC]'
                      : 'bg-[#12141A] border-[#1E2330] hover:border-[#2E3B52] text-[#94A3B8]'
                  }`}
                >
                  <span className="text-xs font-bold text-[#F8FAFC]">Reduzir Prazo</span>
                  <span className="text-[10px] text-[#94A3B8]">Reduz os meses restantes.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSacImpactType('parcela')}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    sacImpactType === 'parcela'
                      ? 'bg-[#00FF88]/5 border-[#00FF88]/40 text-[#F8FAFC]'
                      : 'bg-[#12141A] border-[#1E2330] hover:border-[#2E3B52] text-[#94A3B8]'
                  }`}
                >
                  <span className="text-xs font-bold text-[#F8FAFC]">Reduzir Parcela</span>
                  <span className="text-[10px] text-[#94A3B8]">Reduz o valor mensal.</span>
                </button>
              </div>
            </div>

            {parseFloat(amortizationExtraAmount) > 0 && contract && (
              <div className="p-3 bg-[#12141A] border border-[#00FF88]/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Novo Saldo Devedor Estimado:</span>
                <span className="font-black text-[#00FF88]">
                  {(() => {
                    const startInstallment = contract.startInstallmentNum ?? 1;
                    const totalPlannedInstallments = contract.totalInstallments - startInstallment + 1;
                    const baseAmortization = contract.totalAmount / totalPlannedInstallments;
                    const paidCount = transactions.filter((t) => t.contractId === contract.id && new Date(t.date) <= new Date()).length;
                    const currentBalance = contract.totalAmount - (paidCount * baseAmortization);
                    const newBalance = Math.max(currentBalance - parseFloat(amortizationExtraAmount), 0);
                    return newBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  })()}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* PRICE Amortization Selection */
          <>
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
                      <div className="pt-0.5 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#00FF88]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#64748B]" />
                        )}
                      </div>

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
          </>
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
            disabled={
              isProcessing ||
              (contract?.amortizationSystem === 'sac'
                ? !amortizationExtraAmount || parseFloat(amortizationExtraAmount) <= 0
                : selectedIds.size === 0)
            }
          >
            <Zap className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processando...'
                : contract?.amortizationSystem === 'sac'
                ? 'Confirmar Amortização'
                : `Confirmar Antecipação (${selectedIds.size})`}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
