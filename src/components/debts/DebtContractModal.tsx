import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTodayStr } from '../../utils/dateUtils';
import { Car, Landmark, CreditCard, ShieldCheck } from 'lucide-react';

export const DebtContractModal: React.FC = () => {
  const { isDebtContractModalOpen, setDebtContractModalOpen } = useAppStore();
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const [title, setTitle] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('36');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [category, setCategory] = useState('Financiamentos & Veículos');
  const [walletId, setWalletId] = useState('');

  const handleClose = () => {
    setTitle('');
    setTotalInstallments('36');
    setInstallmentAmount('');
    setInterestRate('');
    setStartDate(getTodayStr());
    setCategory('Financiamentos & Veículos');
    setDebtContractModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const instCount = parseInt(totalInstallments);
    const instVal = parseFloat(installmentAmount);
    if (isNaN(instCount) || instCount <= 0 || isNaN(instVal) || instVal <= 0) return;

    const totalAmount = instCount * instVal;
    const contractId = 'debt_' + Math.random().toString(36).substring(2, 9);
    const selectedWalletId = walletId || (wallets[0]?.id ?? 'w1');
    const parsedRate = parseFloat(interestRate);

    // 1. Create DebtContract
    const contractData = {
      id: contractId,
      title: title.trim(),
      totalInstallments: instCount,
      installmentAmount: instVal,
      totalAmount,
      interestRate: !isNaN(parsedRate) && parsedRate > 0 ? parsedRate : undefined,
      startDate,
      category: category || 'Financiamentos & Veículos',
      walletId: selectedWalletId,
      createdAt: new Date().toISOString(),
    };

    await db.debtContracts.add(contractData);

    // 2. Generate all N monthly transactions
    const baseDate = new Date(startDate + 'T12:00:00');
    const transactionsToInsert = [];

    for (let i = 1; i <= instCount; i++) {
      const txDate = new Date(baseDate);
      txDate.setMonth(baseDate.getMonth() + (i - 1));
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      transactionsToInsert.push({
        id: `tx_${contractId}_${i}`,
        description: `${title.trim()} (${i}/${instCount})`,
        amount: instVal,
        date: formattedDate,
        type: 'expense' as const,
        category: category || 'Financiamentos & Veículos',
        walletId: selectedWalletId,
        contractId: contractId,
        installments: {
          current: i,
          total: instCount,
        },
        createdAt: new Date().toISOString(),
      });
    }

    await db.transactions.bulkAdd(transactionsToInsert);

    handleClose();
  };

  return (
    <Modal
      isOpen={isDebtContractModalOpen}
      onClose={handleClose}
      title="Novo Financiamento / Contrato de Dívida"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="p-3 bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Contratos de Longo Prazo</h4>
            <p className="text-[11px] text-[#94A3B8]">
              Gera automaticamente todas as parcelas mensais (ex: 36x de Carro, Consórcio ou Imóvel).
            </p>
          </div>
        </div>

        <Input
          label="Título do Contrato / Descrição"
          placeholder="Ex: Financiamento Carro HB20, Consórcio, Empréstimo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Quantidade de Parcelas"
            type="number"
            min="1"
            max="360"
            placeholder="Ex: 36"
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            required
          />

          <Input
            label="Valor por Parcela (R$)"
            type="number"
            step="0.01"
            placeholder="Ex: 850,00"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(e.target.value)}
            required
          />

          <Input
            label="Taxa de Juros Mensal (%)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 1.5"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
        </div>

        {/* Calculated Total Display */}
        {parseFloat(installmentAmount) > 0 && parseInt(totalInstallments) > 0 && (
          <div className="p-3 bg-[#12141A] border border-[#00FF88]/30 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">Valor Total do Contrato:</span>
            <span className="text-base font-black text-[#00FF88]">
              {(parseInt(totalInstallments) * parseFloat(installmentAmount)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data da 1ª Parcela"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Select
            label="Conta / Cartão para Débito"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            options={(wallets || []).map((w) => ({
              value: w.id,
              label: `${w.icon} ${w.name}`,
            }))}
          />
        </div>

        <Select
          label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories.filter((c) => c.type === 'expense').map((c) => ({
            value: c.name,
            label: `${c.emoji} ${c.name}`,
          }))}
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            <ShieldCheck className="w-4 h-4" />
            <span>Gerar Contrato & Parcelas</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
