import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setWalletModalOpen, editingWalletId, setEditingWalletId } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'credit' | 'investment'>('checking');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [creditLimit, setCreditLimit] = useState('');

  useEffect(() => {
    if (editingWalletId && isWalletModalOpen) {
      db.wallets.get(editingWalletId).then((wallet) => {
        if (wallet) {
          setName(wallet.name);
          setType(wallet.type);
          setBalance(wallet.balance.toString());
          setIcon(wallet.icon);
          setCreditLimit(wallet.creditLimit ? wallet.creditLimit.toString() : '');
        }
      });
    } else if (isWalletModalOpen && !editingWalletId) {
      setName('');
      setType('checking');
      setBalance('');
      setIcon('🏦');
      setCreditLimit('');
    }
  }, [editingWalletId, isWalletModalOpen]);

  const handleClose = () => {
    setEditingWalletId(null);
    setWalletModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialBalance = parseFloat(balance) || 0;
    const limit = type === 'credit' ? parseFloat(creditLimit) || 0 : undefined;

    if (editingWalletId) {
      // Atualizar Carteira Existente
      await db.wallets.update(editingWalletId, {
        name,
        type,
        balance: initialBalance,
        color: type === 'checking' ? '#00FF88' : type === 'credit' ? '#EF4444' : '#06B6D4',
        icon: icon || '🏦',
        creditLimit: limit,
      });
    } else {
      // Criar Nova Carteira
      await db.wallets.add({
        id: Math.random().toString(36).substring(2, 9),
        name,
        type,
        balance: initialBalance,
        color: type === 'checking' ? '#00FF88' : type === 'credit' ? '#EF4444' : '#06B6D4',
        icon: icon || '🏦',
        creditLimit: limit,
      });
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isWalletModalOpen}
      onClose={handleClose}
      title={editingWalletId ? 'Editar Carteira / Conta' : 'Nova Carteira / Conta Bancária'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome da Conta"
          placeholder="Ex: Nubank, Itaú, Reserva..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Conta"
            value={type}
            onChange={(e) => setType(e.target.value as 'checking' | 'savings' | 'credit' | 'investment')}
            options={[
              { value: 'checking', label: '🏦 Conta Corrente' },
              { value: 'savings', label: '🐷 Poupança / Reserva' },
              { value: 'credit', label: '💳 Cartão de Crédito' },
              { value: 'investment', label: '📊 Investimentos' },
            ]}
          />

          <Input
            label="Ícone / Emoji"
            placeholder="🏦"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>

        <Input
          label="Saldo (R$)"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />

        {type === 'credit' && (
          <Input
            label="Limite do Cartão (R$)"
            type="number"
            step="0.01"
            placeholder="5000,00"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {editingWalletId ? 'Salvar Alterações' : 'Criar Carteira'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
