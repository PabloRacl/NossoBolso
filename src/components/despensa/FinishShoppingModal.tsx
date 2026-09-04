import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Wallet, Transaction } from '../../types';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { ShoppingCart, CreditCard, Banknote, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface FinishShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalSpent: number;
  checkedCount: number;
  wallets: Wallet[];
  onConfirmFinish: (paymentDetails: {
    walletId: string;
    paymentMethod: 'cash' | 'credit';
    installmentsCount: number;
    description: string;
  }) => Promise<void>;
}

export const FinishShoppingModal: React.FC<FinishShoppingModalProps> = ({
  isOpen,
  onClose,
  totalSpent,
  checkedCount,
  wallets,
  onConfirmFinish,
}) => {
  const { isPrivacyMode } = useAppStore();

  const [description, setDescription] = useState('Compras de Mercado');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      // Priorizar carteira do tipo credit se selecionar crédito, ou primeira disponível
      const defaultWallet = wallets.find((w) => (paymentMethod === 'credit' ? w.type === 'credit' : w.type !== 'credit')) || wallets[0];
      setSelectedWalletId(defaultWallet.id);
    }
  }, [wallets, paymentMethod, selectedWalletId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDescription(`Compras de Mercado (${checkedCount} itens)`);
      setInstallmentsCount(1);
    }
  }, [isOpen, checkedCount]);

  const installmentAmount = totalSpent > 0 && installmentsCount > 0 ? totalSpent / installmentsCount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSpent <= 0 || !selectedWalletId) return;

    setIsSubmitting(true);
    try {
      await onConfirmFinish({
        walletId: selectedWalletId,
        paymentMethod,
        installmentsCount,
        description: description.trim() || 'Compras de Mercado',
      });
      onClose();
    } catch (err) {
      console.error('Erro ao finalizar feira:', err);
      alert('Ocorreu um erro ao lançar as compras no sistema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Feira & Lançar no Finance OS">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
        {/* Resumo do Valor Total */}
        <div className="p-4 bg-gradient-to-br from-[#00FF88]/15 via-[#0D1424] to-[#0A0B0E] border border-[#00FF88]/40 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#00FF88]/20 text-[#00FF88] rounded-xl border border-[#00FF88]/40">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total da Feira ({checkedCount} itens)</span>
              <span className="text-2xl font-black text-[#00FF88]">{formatBRL(totalSpent, isPrivacyMode)}</span>
            </div>
          </div>
        </div>

        {/* Nome / Descrição da Compra */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Descrição do Lançamento</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Compras no Carrefour, Atacadão..."
            className="w-full h-11 px-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:border-[#00FF88] focus:outline-none"
          />
        </div>

        {/* Escolha do Método de Pagamento: À Vista vs Cartão */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Forma de Pagamento</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('cash');
                setInstallmentsCount(1);
                const cashWallet = wallets.find((w) => w.type !== 'credit') || wallets[0];
                if (cashWallet) setSelectedWalletId(cashWallet.id);
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-[#00FF88]/15 border-[#00FF88] text-[#00FF88] shadow-md shadow-[#00FF88]/10'
                  : 'bg-[#0A0B0E] border-[#2E3B52] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-black">À Vista / Débito</span>
                <span className="text-[10px] text-[#94A3B8]">PIX, Dinheiro ou Conta</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('credit');
                const creditWallet = wallets.find((w) => w.type === 'credit') || wallets[0];
                if (creditWallet) setSelectedWalletId(creditWallet.id);
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                paymentMethod === 'credit'
                  ? 'bg-[#FF4D6D]/15 border-[#FF4D6D] text-[#FF4D6D] shadow-md shadow-[#FF4D6D]/10'
                  : 'bg-[#0A0B0E] border-[#2E3B52] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-black">Cartão de Crédito</span>
                <span className="text-[10px] text-[#94A3B8]">À vista ou Parcelado</span>
              </div>
            </button>
          </div>
        </div>

        {/* Seleção da Carteira / Cartão */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">
            {paymentMethod === 'credit' ? 'Selecione o Cartão de Crédito' : 'Selecione a Conta / Carteira de Débito'}
          </label>
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:border-[#00FF88] focus:outline-none cursor-pointer"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name} ({w.type === 'credit' ? 'Cartão de Crédito' : 'Conta/Saldo'})
              </option>
            ))}
          </select>
        </div>

        {/* Opção de Parcelamento se for Cartão de Crédito */}
        {paymentMethod === 'credit' && (
          <div className="flex flex-col gap-1.5 p-3.5 bg-[#12141A] border border-[#FF4D6D]/40 rounded-xl">
            <label className="text-xs font-bold text-[#FF4D6D] uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF4D6D]" />
              Número de Parcelas no Cartão
            </label>
            <select
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-black focus:outline-none cursor-pointer"
            >
              <option value={1}>1x de {formatBRL(totalSpent, isPrivacyMode)} (À vista na fatura)</option>
              <option value={2}>2x sem juros de {formatBRL(totalSpent / 2, isPrivacyMode)} / mês</option>
              <option value={3}>3x sem juros de {formatBRL(totalSpent / 3, isPrivacyMode)} / mês</option>
              <option value={4}>4x sem juros de {formatBRL(totalSpent / 4, isPrivacyMode)} / mês</option>
              <option value={5}>5x sem juros de {formatBRL(totalSpent / 5, isPrivacyMode)} / mês</option>
              <option value={6}>6x sem juros de {formatBRL(totalSpent / 6, isPrivacyMode)} / mês</option>
              <option value={10}>10x sem juros de {formatBRL(totalSpent / 10, isPrivacyMode)} / mês</option>
              <option value={12}>12x sem juros de {formatBRL(totalSpent / 12, isPrivacyMode)} / mês</option>
            </select>
          </div>
        )}

        {/* Resumo do Lançamento Financeiro que será feito */}
        <div className="p-3 bg-[#0A0B0E]/80 border border-[#1E2330] rounded-xl text-xs text-[#94A3B8] flex flex-col gap-1">
          <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
            O que será feito no sistema ao confirmar:
          </span>
          <ul className="list-disc list-inside space-y-1 text-[11px] pt-1">
            <li>Atualiza o estoque doméstico de {checkedCount} itens para o nível ideal.</li>
            <li>Registra os novos preços unitários no histórico.</li>
            {paymentMethod === 'credit' && installmentsCount > 1 ? (
              <li className="text-[#FF4D6D] font-bold">
                Lança {installmentsCount} parcelas de {formatBRL(installmentAmount, isPrivacyMode)} nos próximos {installmentsCount} meses na fatura do cartão.
              </li>
            ) : (
              <li className="text-[#00FF88] font-bold">
                Debita {formatBRL(totalSpent, isPrivacyMode)} à vista na conta/cartão selecionado.
              </li>
            )}
          </ul>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || totalSpent <= 0}>
            {isSubmitting ? 'Lançando...' : 'Confirmar & Lançar no NossoBolso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
