import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';

const BANK_PRESETS = [
  { name: 'Nubank', bankName: 'Nubank', icon: '🟣', color: '#8A05BE' },
  { name: 'Itaú Unibanco', bankName: 'Itaú', icon: '🟠', color: '#EC7000' },
  { name: 'Bradesco', bankName: 'Bradesco', icon: '🔴', color: '#CC092F' },
  { name: 'Banco do Brasil', bankName: 'Banco do Brasil', icon: '🟡', color: '#003399' },
  { name: 'Caixa Econômica', bankName: 'Caixa', icon: '🔷', color: '#0066B3' },
  { name: 'Santander', bankName: 'Santander', icon: '🔴', color: '#EC0000' },
  { name: 'Banco Inter', bankName: 'Inter', icon: '🍊', color: '#FF7A00' },
  { name: 'BTG Pactual', bankName: 'BTG Pactual', icon: '🌌', color: '#0F223D' },
  { name: 'C6 Bank', bankName: 'C6 Bank', icon: '⬛', color: '#242424' },
  { name: 'Sicoob / Sicredi', bankName: 'Sicoob', icon: '🌿', color: '#003622' },
  { name: 'PicPay', bankName: 'PicPay', icon: '💸', color: '#11C76F' },
  { name: 'XP Investimentos', bankName: 'XP', icon: '📈', color: '#111827' },
  { name: 'Dinheiro Físico', bankName: 'Dinheiro', icon: '💵', color: '#00FF88' },
];

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setWalletModalOpen, editingWalletId, setEditingWalletId } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'credit' | 'investment'>('checking');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#00FF88');
  const [bankName, setBankName] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [cardBrand, setCardBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard'>('mastercard');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('20');
  const [dueDay, setDueDay] = useState('27');
  const [yieldRateCdi, setYieldRateCdi] = useState('100');

  useEffect(() => {
    if (editingWalletId && isWalletModalOpen) {
      db.wallets.get(editingWalletId).then((wallet) => {
        if (wallet) {
          setName(wallet.name);
          setType(wallet.type);
          setBalance(wallet.balance.toString());
          setIcon(wallet.icon || '🏦');
          setColor(wallet.color || '#00FF88');
          setBankName(wallet.bankName || '');
          setLastDigits(wallet.lastDigits || '');
          setCardBrand(wallet.cardBrand || 'mastercard');
          setCreditLimit(wallet.creditLimit ? wallet.creditLimit.toString() : '');
          setClosingDay(wallet.closingDay ? wallet.closingDay.toString() : '20');
          setDueDay(wallet.dueDay ? wallet.dueDay.toString() : '27');
          setYieldRateCdi(wallet.yieldRateCdi ? wallet.yieldRateCdi.toString() : '100');
        }
      });
    } else if (isWalletModalOpen && !editingWalletId) {
      setName('');
      setType('checking');
      setBalance('');
      setIcon('🏦');
      setColor('#00FF88');
      setBankName('');
      setLastDigits('');
      setCardBrand('mastercard');
      setCreditLimit('');
      setClosingDay('20');
      setDueDay('27');
      setYieldRateCdi('100');
    }
  }, [editingWalletId, isWalletModalOpen]);

  const handleApplyPreset = (preset: typeof BANK_PRESETS[0]) => {
    setName(preset.name);
    setBankName(preset.bankName);
    setIcon(preset.icon);
    setColor(preset.color);
  };

  const handleClose = () => {
    setEditingWalletId(null);
    setWalletModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialBalance = parseFloat(balance) || 0;
    const limit = type === 'credit' ? parseFloat(creditLimit) || 0 : undefined;
    const cdi = parseFloat(yieldRateCdi) || undefined;
    const cDay = parseInt(closingDay) || undefined;
    const dDay = parseInt(dueDay) || undefined;

    const walletData = {
      name,
      type,
      balance: initialBalance,
      color: color || (type === 'checking' ? '#00FF88' : type === 'credit' ? '#EF4444' : '#06B6D4'),
      icon: icon || '🏦',
      bankName: bankName || name,
      lastDigits: lastDigits ? lastDigits.slice(-4) : undefined,
      cardBrand,
      creditLimit: limit,
      yieldRateCdi: cdi,
      closingDay: cDay,
      dueDay: dDay,
    };

    if (editingWalletId) {
      await db.wallets.update(editingWalletId, walletData);
    } else {
      await db.wallets.add({
        id: `w_${Date.now()}`,
        ...walletData,
      });
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isWalletModalOpen}
      onClose={handleClose}
      title={editingWalletId ? 'Editar Ficha da Carteira / Banco' : 'Nova Carteira / Conta Bancária'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        {/* Preset de Bancos em 1-Clique */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Selecione uma Instituição Bancária (Atalho)</label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-[#090D18] border border-[#2E3B52] rounded-xl max-h-24 overflow-y-auto">
            {BANK_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 bg-[#121929] hover:bg-[#00FF88]/20 border border-[#2E3B52] hover:border-[#00FF88]/40 rounded-lg text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{p.icon}</span>
                <span>{p.bankName}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Nome da Conta / Carteira"
          placeholder="Ex: Nubank Conta Corrente, Itaú Cartão..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
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
            label="Ícone / Emoji da Conta"
            placeholder="🏦"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Saldo Inicial (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          <Input
            label="Últimos 4 Dígitos do Cartão (Opcional)"
            placeholder="4829"
            maxLength={4}
            value={lastDigits}
            onChange={(e) => setLastDigits(e.target.value)}
          />
        </div>

        {/* Especificidades de Cartão de Crédito */}
        {type === 'credit' && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#0D1424] border border-[#EF4444]/30 rounded-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#EF4444] uppercase">Limite do Cartão</label>
              <input
                type="number"
                step="0.01"
                placeholder="5000,00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full h-9 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-lg text-xs font-bold text-[#F8FAFC] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Dia Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full h-9 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-lg text-xs font-bold text-[#F8FAFC] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#00FF88] uppercase">Dia Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full h-9 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-lg text-xs font-bold text-[#00FF88] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Rendimento em CDI para Investimentos ou Conta */}
        {(type === 'savings' || type === 'investment' || type === 'checking') && (
          <Input
            label="Rendimento Automático (% do CDI)"
            type="number"
            step="1"
            placeholder="100"
            value={yieldRateCdi}
            onChange={(e) => setYieldRateCdi(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {editingWalletId ? 'Salvar Alterações' : 'Criar Carteira Bancária'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
