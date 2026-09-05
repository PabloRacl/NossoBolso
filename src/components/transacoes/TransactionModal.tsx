import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { db } from '../../servicos/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TransactionType } from '../../tipos';
import { getTodayStr } from '../../utilidades/dateUtils';
import { Repeat, Calendar, Layers } from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const { isTransactionModalOpen, setTransactionModalOpen, editingTransactionId, setEditingTransactionId, setCategoryModalOpen } = useAppStore();

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const wallets = useLiveQuery(() => db.wallets.toArray(), []);

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');

  // Repeat & Installment state
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'indefinite' | 'installments'>('indefinite');
  const [installmentCount, setInstallmentCount] = useState('12');

  useEffect(() => {
    if (editingTransactionId) {
      db.transactions.get(editingTransactionId).then((tx) => {
        if (tx) {
          setType(tx.type);
          setDescription(tx.description);
          setAmount(tx.amount.toString());
          setDate(tx.date);
          setCategory(tx.category);
          setWalletId(tx.walletId);
          setIsRepeatEnabled(!!tx.isRecurring || !!tx.installments);
          if (tx.installments) {
            setRepeatMode('installments');
            setInstallmentCount(tx.installments.total.toString());
          } else {
            setRepeatMode('indefinite');
          }
        }
      });
    } else {
      setType('expense');
      setDescription('');
      setAmount('');
      setDate(getTodayStr());
      setCategory('');
      setIsRepeatEnabled(false);
      setRepeatMode('indefinite');
      setInstallmentCount('12');
      if (wallets && wallets.length > 0) setWalletId(wallets[0].id);
    }
  }, [editingTransactionId, isTransactionModalOpen, wallets]);

  const filteredCategories = categories?.filter((c) => c.type === type) || [];

  const handleClose = () => {
    setEditingTransactionId(null);
    setTransactionModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const selectedWalletId = walletId || (wallets ? wallets[0]?.id ?? 'w1' : 'w1');
    const selectedCategory = category || (filteredCategories[0]?.name ?? 'Geral');

    if (isRepeatEnabled && repeatMode === 'installments' && !editingTransactionId) {
      const instTotal = parseInt(installmentCount) || 12;
      const baseDate = new Date(date + 'T12:00:00');
      const batchId = Math.random().toString(36).substring(2, 9);
      const batchTxs = [];

      for (let i = 1; i <= instTotal; i++) {
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + (i - 1));
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');

        batchTxs.push({
          id: `tx_${batchId}_${i}`,
          description: `${description.trim()} (${i}/${instTotal})`,
          amount: parsedAmount,
          date: `${yyyy}-${mm}-${dd}`,
          type,
          category: selectedCategory,
          walletId: selectedWalletId,
          installments: {
            current: i,
            total: instTotal,
          },
          createdAt: new Date().toISOString(),
        });
      }

      await db.transactions.bulkAdd(batchTxs);

      // Update wallet balance for current month
      const wallet = await db.wallets.get(selectedWalletId);
      if (wallet) {
        const delta = type === 'income' ? parsedAmount : -parsedAmount;
        await db.wallets.update(selectedWalletId, { balance: wallet.balance + delta });
      }
    } else {
      // Single / Regular transaction
      const txData = {
        id: editingTransactionId || Math.random().toString(36).substring(2, 9),
        description: description.trim(),
        amount: parsedAmount,
        date,
        type,
        category: selectedCategory,
        walletId: selectedWalletId,
        isRecurring: isRepeatEnabled && repeatMode === 'indefinite',
        createdAt: new Date().toISOString(),
      };

      if (editingTransactionId) {
        await db.transactions.put(txData);
      } else {
        await db.transactions.add(txData);
      }

      // Update wallet balance
      if (selectedWalletId) {
        const wallet = await db.wallets.get(selectedWalletId);
        if (wallet) {
          const delta = type === 'income' ? parsedAmount : -parsedAmount;
          await db.wallets.update(selectedWalletId, { balance: wallet.balance + delta });
        }
      }
    }

    // Disparar animação de moedas no sistema
    useAppStore.getState().triggerTransactionAnimation(type, parsedAmount, description.trim());

    handleClose();
  };

  return (
    <Modal
      isOpen={isTransactionModalOpen}
      onClose={handleClose}
      title={editingTransactionId ? 'Editar Transação' : 'Nova Transação'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Toggle Type */}
        <div className="grid grid-cols-2 gap-2 bg-[#0A0B0E] p-1 rounded-xl border border-[#1E2330]">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              type === 'income'
                ? 'bg-[#10B981] text-[#0A0B0E] shadow-md shadow-[#10B981]/20'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            📈 Receita
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              type === 'expense'
                ? 'bg-[#EF4444] text-[#F8FAFC] shadow-md shadow-[#EF4444]/20'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            📉 Despesa
          </button>
        </div>

        <Input
          label="Descrição"
          placeholder="Ex: Salário, Aluguel, Mercado..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#94A3B8]">Categoria</label>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="text-[11px] text-[#00FF88] hover:underline font-bold"
              >
                + Gerenciar Categorias
              </button>
            </div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: '', label: 'Selecione...' },
                ...filteredCategories.map((c) => ({
                  value: c.name,
                  label: `${c.emoji} ${c.name}`,
                })),
              ]}
            />
          </div>

          <Select
            label="Carteira / Conta"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            options={(wallets || []).map((w) => ({
              value: w.id,
              label: `${w.icon} ${w.name}`,
            }))}
          />
        </div>

        {/* Repetição / Parcelamento Toggle */}
        {!editingTransactionId && (
          <div className="p-3 bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#00FF88]" />
                <span className="text-xs font-bold text-[#F8FAFC]">Repetir ou Parcelar Transação</span>
              </div>
              <input
                type="checkbox"
                checked={isRepeatEnabled}
                onChange={(e) => setIsRepeatEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#00FF88] cursor-pointer"
              />
            </div>

            {isRepeatEnabled && (
              <div className="flex flex-col gap-3 pt-2 border-t border-[#1E2330] animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 bg-[#12141A] p-1 rounded-lg border border-[#1E2330]">
                  <button
                    type="button"
                    onClick={() => setRepeatMode('indefinite')}
                    className={`py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      repeatMode === 'indefinite'
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Todo Mês (Recorrente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatMode('installments')}
                    className={`py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      repeatMode === 'installments'
                        ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Parcelar em N Vezes
                  </button>
                </div>

                {repeatMode === 'installments' && (
                  <div className="flex items-center gap-3">
                    <Input
                      label="Quantidade de Parcelas (Meses)"
                      type="number"
                      min="2"
                      max="360"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value)}
                      required
                    />
                    <div className="flex-1 text-[11px] text-[#94A3B8] font-medium pt-4">
                      O sistema criará <strong className="text-[#00FF88]">{installmentCount}</strong> parcelas mensais de{' '}
                      <strong className="text-[#F8FAFC]">
                        {parseFloat(amount) > 0 ? (parseFloat(amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                      </strong>.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Salvar Transação
          </Button>
        </div>
      </form>
    </Modal>
  );
};
