import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { db } from '../../servicos/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatBRL } from '../../utilidades/formatters';
import { formatDate } from '../../utilidades/dateUtils';
import { Zap, Info, Percent } from 'lucide-react';
import type { Transaction } from '../../tipos';
import { getMonthsDiff, calcDiscountedValue } from '../../utilidades/debtCalculations';
import { AmortizacaoInstallmentsList, InstallmentInfo } from './AmortizacaoInstallmentsList';

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

  // Taxa Mensal Personalizável
  const [customMonthlyRate, setCustomMonthlyRate] = useState<string>('');

  // Mapeamento de Valores Customizados por Parcela (ID da Transação -> Valor Digito pelo Usuário)
  const [customInstallmentValues, setCustomInstallmentValues] = useState<Record<string, string>>({});

  // Estados para amortização SAC
  const [amortizationExtraAmount, setAmortizationExtraAmount] = useState('');
  const [sacImpactType, setSacImpactType] = useState<'prazo' | 'parcela'>('prazo');

  const contract = contracts.find((c) => c.id === amortizacaoContractId);

  // Detecta taxa mensal do contrato
  const detectedMonthlyRate = useMemo(() => {
    if (!contract || !contract.interestRate) return 1.43;
    const rate = contract.interestRate;
    if (contract.interestRateType === 'yearly' || rate > 6) {
      return Math.round((rate / 12) * 1000) / 1000;
    }
    return rate;
  }, [contract]);

  const activeMonthlyRate = useMemo(() => {
    const parsed = parseFloat(customMonthlyRate);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    return detectedMonthlyRate;
  }, [customMonthlyRate, detectedMonthlyRate]);

  useEffect(() => {
    setCustomMonthlyRate(String(detectedMonthlyRate));
    setCustomInstallmentValues({});
  }, [detectedMonthlyRate, amortizacaoContractId]);

  // Lista de parcelas com deságio calculado ou valor customizado inserido pelo usuário
  const installments: InstallmentInfo[] = useMemo(() => {
    if (!contract || contract.amortizationSystem === 'sac') return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return transactions
      .filter((t) => t.contractId === contract.id && t.date > todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((tx) => {
        const dueDate = new Date(tx.date + 'T12:00:00');
        const monthsAhead = getMonthsDiff(today, dueDate);
        
        // Verificar se há valor customizado digitado pelo usuário para esta parcela
        const userTyped = customInstallmentValues[tx.id];
        let discountedValue: number;

        if (userTyped !== undefined && userTyped !== '') {
          const parsed = parseFloat(userTyped.replace(',', '.'));
          discountedValue = !isNaN(parsed) ? parsed : calcDiscountedValue(tx.amount, activeMonthlyRate, monthsAhead);
        } else {
          discountedValue = calcDiscountedValue(tx.amount, activeMonthlyRate, monthsAhead);
        }

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
  }, [contract, transactions, activeMonthlyRate, customInstallmentValues]);

  // Handler de seleção
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

  const handleCustomValueChange = (txId: string, val: string) => {
    setCustomInstallmentValues((prev) => ({
      ...prev,
      [txId]: val,
    }));
    // Garante que ao digitar o valor a parcela seja marcada como selecionada
    if (!selectedIds.has(txId)) {
      setSelectedIds((prev) => new Set(prev).add(txId));
    }
  };

  // Totais do resumo
  const selectedInstallments = installments.filter((i) => selectedIds.has(i.tx.id));
  const totalOriginal = selectedInstallments.reduce((acc, i) => acc + i.originalValue, 0);
  const totalDiscounted = selectedInstallments.reduce((acc, i) => acc + i.discountedValue, 0);
  const totalSavings = Math.max(totalOriginal - totalDiscounted, 0);

  const handleClose = () => {
    setSelectedIds(new Set());
    setAmortizationExtraAmount('');
    setSacImpactType('prazo');
    setCustomInstallmentValues({});
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

        const allContractTxs = await db.transactions
          .where('contractId')
          .equals(contract.id)
          .toArray();

        const futureTxs = allContractTxs
          .filter((t) => t.date > todayStr && t.id !== amortTxId)
          .sort((a, b) => a.date.localeCompare(b.date));

        const paidCount = allContractTxs.length - futureTxs.length - 1;

        const parsedRate = activeMonthlyRate;
        const monthlyRate = parsedRate / 100;
        const parsedInsurance = contract.insuranceAmount ?? 0;

        const startInstallment = contract.startInstallmentNum ?? 1;
        const totalPlannedInstallments = contract.totalInstallments - startInstallment + 1;
        const baseAmortization = contract.totalAmount / totalPlannedInstallments;
        const currentBalance = contract.totalAmount - (paidCount * baseAmortization);

        const newBalance = Math.max(currentBalance - extraVal, 0);

        if (sacImpactType === 'parcela') {
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

          const newTotalInstallments = paidCount + txsToKeep.length;
          await db.debtContracts.update(contract.id, {
            totalInstallments: Math.max(newTotalInstallments, 0),
            totalAmount: Math.max(contract.totalAmount - extraVal, 0),
          });

          const remainingTxs = await db.transactions
            .where('contractId')
            .equals(contract.id)
            .toArray();

          const sortedRemaining = remainingTxs
            .filter((t) => t.id !== amortTxId && t.date > todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));

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
        // Antecipação PRICE com o valor exato pago (cria despesa real com valor descontado e remove parcelas futuras)
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Criar lançamento da antecipação com o valor real com desconto
        const amortTxId = 'tx_antecip_' + Math.random().toString(36).substring(2, 9);
        await db.transactions.add({
          id: amortTxId,
          description: `Antecipação (${selectedIds.size}x parcelas - ${contract.title})`,
          amount: totalDiscounted,
          date: todayStr,
          type: 'expense',
          category: contract.category,
          walletId: contract.walletId,
          contractId: contract.id,
          createdAt: new Date().toISOString(),
          notes: `Antecipação de ${selectedIds.size} parcelas com economia de ${formatBRL(totalSavings)}.`,
        });

        // 2. Deletar as parcelas futuras selecionadas
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

        const sortedRemaining = remainingTxs
          .filter((t) => t.id !== amortTxId)
          .sort((a, b) => a.date.localeCompare(b.date));
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
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        {/* Banner Informativo */}
        <div className="p-3.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#06B6D4]/20 text-[#06B6D4] rounded-xl shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#F8FAFC]">
                {contract?.amortizationSystem === 'sac' ? 'Amortização de Saldo Devedor (SAC)' : 'Abatimento Proporcional de Juros'}
              </p>
              <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                Você pode usar a taxa mensal simulada ou digitar o valor exato no campo "VALOR HOJE".
              </p>
            </div>
          </div>
        </div>

        {/* Dados do Contrato & Ajuste da Taxa Mensal */}
        {contract && (
          <div className="p-4 bg-[#12141A] border border-[#1E293B] rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-[#F8FAFC]">{contract.title}</h4>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                {contract.amortizationSystem === 'sac'
                  ? `Sistema SAC • Taxa: ${contract.interestRate || 1.8}% a.m.`
                  : `${contract.totalInstallments}x de ${formatBRL(contract.installmentAmount)} • ${installments.length} parcelas a antecipar`}
              </p>
            </div>

            {/* Ajuste Global da Taxa Mensal (PRICE) */}
            {contract.amortizationSystem === 'price' && (
              <div className="flex items-center gap-2 bg-[#090D18] border border-[#00FF88]/40 px-3 py-1.5 rounded-xl shadow-inner">
                <Percent className="w-3.5 h-3.5 text-[#00FF88]" />
                <span className="text-[10px] font-black text-[#94A3B8] uppercase">Taxa a.m.:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10"
                  className="w-16 bg-transparent text-xs font-black text-[#00FF88] text-right focus:outline-none"
                  value={customMonthlyRate}
                  onChange={(e) => setCustomMonthlyRate(e.target.value)}
                  title="Taxa mensal estimada de deságio"
                />
                <span className="text-xs font-black text-[#00FF88]">%</span>
              </div>
            )}
          </div>
        )}

        {contract?.amortizationSystem === 'sac' ? (
          /* Formulário SAC */
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Valor a Amortizar Extraordinariamente (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 5.000,00"
                className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:border-[#F59E0B] focus:outline-none transition-colors font-bold"
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
                      ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#F8FAFC]'
                      : 'bg-[#12141A] border-[#1E2330] hover:border-[#2E3B52] text-[#94A3B8]'
                  }`}
                >
                  <span className="text-xs font-bold text-[#F8FAFC]">Reduzir Prazo</span>
                  <span className="text-[10px] text-[#94A3B8]">Elimina meses finais da dívida.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSacImpactType('parcela')}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    sacImpactType === 'parcela'
                      ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#F8FAFC]'
                      : 'bg-[#12141A] border-[#1E2330] hover:border-[#2E3B52] text-[#94A3B8]'
                  }`}
                >
                  <span className="text-xs font-bold text-[#F8FAFC]">Reduzir Parcela</span>
                  <span className="text-[10px] text-[#94A3B8]">Baixa o valor pago todo mês.</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <AmortizacaoInstallmentsList
              installments={installments}
              selectedIds={selectedIds}
              allSelected={allSelected}
              customInstallmentValues={customInstallmentValues}
              onToggleAll={toggleAll}
              onToggleInstallment={toggleInstallment}
              onCustomValueChange={handleCustomValueChange}
            />

            {/* Resumo com Valor a Pagar Hoje */}
            {selectedIds.size > 0 && (
              <div className="p-4 bg-gradient-to-br from-[#090D18] to-[#121929] border border-[#00FF88]/30 rounded-2xl flex flex-col gap-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#94A3B8]">
                  <span>Parcelas selecionadas:</span>
                  <span className="font-black text-[#F8FAFC]">{selectedIds.size}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Valor original total:</span>
                  <span className="font-bold text-[#94A3B8] line-through">
                    {formatBRL(totalOriginal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Economia nos juros (Abatimento):</span>
                  <span className="font-black text-[#10B981]">
                    -{formatBRL(totalSavings)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
                  <span className="text-xs font-black text-[#F8FAFC]">Valor a pagar hoje:</span>
                  <span className="text-xl font-black text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                    {formatBRL(totalDiscounted)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rodapé de Ações */}
        <div className="flex justify-end gap-3.5 pt-3 border-t border-[#1E293B]">
          <Button type="button" variant="ghost" onClick={handleClose} className="font-bold text-sm">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="font-bold text-sm bg-[#00FF88] hover:bg-[#00E577] text-[#090D16] shadow-[0_4px_14px_rgba(0,255,136,0.2)] rounded-xl px-5"
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
