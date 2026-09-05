import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Wallet } from '../../tipos';
import { db } from '../../servicos/db';
import { ArrowRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../estado/useAppStore';

interface TransferBetweenWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
}

export const TransferBetweenWalletsModal: React.FC<TransferBetweenWalletsModalProps> = ({
  isOpen,
  onClose,
  wallets,
}) => {
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [targetWalletId, setTargetWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Transferência entre Contas');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    if (isOpen && wallets.length >= 2) {
      setSourceWalletId(wallets[0].id);
      setTargetWalletId(wallets[1].id);
      setAmount('');
      setDescription('Transferência entre Contas');
      setDate(new Date().toISOString().substring(0, 10));
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!sourceWalletId || !targetWalletId || sourceWalletId === targetWalletId || isNaN(val) || val <= 0) {
      alert('Selecione duas carteiras diferentes e um valor maior que zero.');
      return;
    }

    const sourceWallet = wallets.find((w) => w.id === sourceWalletId);
    const targetWallet = wallets.find((w) => w.id === targetWalletId);

    if (!sourceWallet || !targetWallet) return;

    const nowTs = Date.now();

    // 1. Saída da Carteira de Origem
    await db.transactions.add({
      id: `tr_out_${nowTs}`,
      description: `Transferência ➔ ${targetWallet.name} (${description})`,
      amount: val,
      date,
      type: 'expense',
      category: 'Transferência',
      walletId: sourceWallet.id,
      createdAt: new Date().toISOString(),
    });

    // 2. Entrada na Carteira de Destino
    await db.transactions.add({
      id: `tr_in_${nowTs}`,
      description: `Transferência ⬅️ ${sourceWallet.name} (${description})`,
      amount: val,
      date,
      type: 'income',
      category: 'Transferência',
      walletId: targetWallet.id,
      createdAt: new Date().toISOString(),
    });

    // 3. Atualizar Saldos nas Carteiras
    await db.wallets.update(sourceWallet.id, { balance: sourceWallet.balance - val });
    await db.wallets.update(targetWallet.id, { balance: targetWallet.balance + val });

    // Disparar Animação de Moeda
    useAppStore.getState().triggerTransactionAnimation('income', val, `Transferência para ${targetWallet.name}`);

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transferência Direta entre Carteiras"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div className="p-3 bg-[#090D18] border border-[#00FF88]/30 rounded-xl text-xs text-[#94A3B8] flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-[#00FF88] shrink-0" />
          <span>Mova saldo entre suas contas com 1 clique (ex: da Conta Corrente para Reserva).</span>
        </div>

        {/* Origem e Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#FF4D6D] uppercase">Conta de Origem (Sai o valor)</label>
            <select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#FF4D6D]/40 rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === targetWalletId}>
                  {w.icon} {w.name} (R$ {w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#00FF88] uppercase">Conta de Destino (Entra o valor)</label>
            <select
              value={targetWalletId}
              onChange={(e) => setTargetWalletId(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#00FF88]/40 rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === sourceWalletId}>
                  {w.icon} {w.name} (R$ {w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valor e Data */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#00FF88] uppercase">Valor da Transferência (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 500.00"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#00FF88] font-black focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Data do Lançamento</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Descrição Opcional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Descrição / Motivo</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Reserva de emergência, aporte..."
            className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Transferência</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
