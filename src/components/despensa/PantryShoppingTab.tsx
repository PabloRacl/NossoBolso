import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { PantryItem, Wallet } from '../../types';
import { ShoppingSummary, PriceCalculationMode } from './pantryTypes';
import { ShoppingItemCard } from './ShoppingItemCard';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  Layers,
  Target,
  BadgePercent,
} from 'lucide-react';

interface PantryShoppingTabProps {
  neededItems: PantryItem[];
  displayedNeededItems: PantryItem[];
  itemsByAisle: [string, PantryItem[]][];
  displayedItemsByAisle: [string, PantryItem[]][];
  cartChecked: Record<string, boolean>;
  cartQuantities: Record<string, number>;
  cartPrices: Record<string, number>;
  cartPriceModes: Record<string, PriceCalculationMode>;
  cartComboTotals: Record<string, number>;
  cartDiscounts: Record<string, number>;
  wallets: Wallet[];
  selectedWalletId: string;
  onSelectWalletId: (id: string) => void;
  budgetCap: string;
  onBudgetCapChange: (cap: string) => void;
  cashierDiscount: string;
  onCashierDiscountChange: (discount: string) => void;
  shoppingFilter: 'all' | 'checked' | 'pending';
  onShoppingFilterChange: (filter: 'all' | 'checked' | 'pending') => void;
  groupByAisle: boolean;
  onToggleGroupByAisle: () => void;
  shoppingSummary: ShoppingSummary;
  isAllChecked: boolean;
  onToggleSelectAll: () => void;
  onClearCart: () => void;
  onOpenFinishModal: () => void;
  onOpenNewItemModal: () => void;
  onToggleCartItem: (id: string) => void;
  onCartQtyChange: (id: string, delta: number) => void;
  onPriceChange: (id: string, price: number) => void;
  onSetPriceMode: (id: string, mode: PriceCalculationMode, defaultQty: number, lastPrice: number) => void;
  onComboTotalChange: (id: string, total: number) => void;
  onDiscountChange: (id: string, discount: number) => void;
  getQtyToBuy: (item: PantryItem) => number;
  getEffectiveUnitPrice: (item: PantryItem) => number;
  getItemSubtotal: (item: PantryItem) => number;
}

export const PantryShoppingTab: React.FC<PantryShoppingTabProps> = ({
  neededItems,
  displayedNeededItems,
  displayedItemsByAisle,
  cartChecked,
  cartQuantities,
  cartPrices,
  cartPriceModes,
  cartComboTotals,
  cartDiscounts,
  wallets,
  selectedWalletId,
  onSelectWalletId,
  budgetCap,
  onBudgetCapChange,
  cashierDiscount,
  onCashierDiscountChange,
  shoppingFilter,
  onShoppingFilterChange,
  groupByAisle,
  onToggleGroupByAisle,
  shoppingSummary,
  isAllChecked,
  onToggleSelectAll,
  onClearCart,
  onOpenFinishModal,
  onOpenNewItemModal,
  onToggleCartItem,
  onCartQtyChange,
  onPriceChange,
  onSetPriceMode,
  onComboTotalChange,
  onDiscountChange,
  getQtyToBuy,
  getEffectiveUnitPrice,
  getItemSubtotal,
}) => {
  const { isPrivacyMode } = useAppStore();

  const renderCard = (item: PantryItem) => {
    const defaultNeeded = Math.max(Math.round((item.idealQuantity - item.currentQuantity) * 100) / 100, 0.01);
    const qtyToBuy = getQtyToBuy(item);
    const isChecked = cartChecked[item.id] ?? false;
    const priceMode = cartPriceModes[item.id] || 'unit';
    const effectiveUnitPrice = getEffectiveUnitPrice(item);
    const itemSubtotal = getItemSubtotal(item);
    const basePrice = cartPrices[item.id] ?? item.lastPrice;
    const comboTotal = cartComboTotals[item.id] ?? (qtyToBuy * item.lastPrice);
    const discount = cartDiscounts[item.id] ?? 0;

    return (
      <ShoppingItemCard
        key={item.id}
        item={item}
        isChecked={isChecked}
        qtyToBuy={qtyToBuy}
        priceMode={priceMode}
        cartPrice={basePrice}
        comboTotal={comboTotal}
        discount={discount}
        effectiveUnitPrice={effectiveUnitPrice}
        itemSubtotal={itemSubtotal}
        onToggleCheck={() => onToggleCartItem(item.id)}
        onQtyChange={(delta) => onCartQtyChange(item.id, delta)}
        onPriceChange={(price) => onPriceChange(item.id, price)}
        onSetPriceMode={(mode) => onSetPriceMode(item.id, mode, defaultNeeded, item.lastPrice)}
        onComboTotalChange={(total) => onComboTotalChange(item.id, total)}
        onDiscountChange={(disc) => onDiscountChange(item.id, disc)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* PAINEL SUPERIOR: TETO DE ORÇAMENTO DA FEIRA & CONTROLES */}
      <div className="p-4 bg-gradient-to-r from-[#F59E0B]/15 via-[#00FF88]/15 to-[#06B6D4]/15 border border-[#F59E0B]/30 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F59E0B]/20 text-[#F59E0B] rounded-2xl border border-[#F59E0B]/40 shadow-md">
              <ShoppingCart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#F8FAFC]">Modo Mercado Ao Vivo</h3>
              <p className="text-xs text-[#94A3B8] font-medium">
                {shoppingSummary.checkedCount} de {shoppingSummary.totalNeeded} itens no carrinho
              </p>
            </div>
          </div>

          {/* Teto de Orçamento da Feira & Desconto no Caixa */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#0A0B0E]/80 p-2.5 rounded-xl border border-[#2E3B52]">
              <Target className="w-4 h-4 text-[#F59E0B]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Teto da Feira (R$)</span>
                <input
                  type="number"
                  step="10.00"
                  value={budgetCap}
                  onChange={(e) => onBudgetCapChange(e.target.value)}
                  className="w-24 bg-transparent text-sm font-black text-[#F59E0B] focus:outline-none"
                  placeholder="Ex: 500,00"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#0A0B0E]/80 p-2.5 rounded-xl border border-[#2E3B52]">
              <BadgePercent className="w-4 h-4 text-[#00FF88]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Desconto Caixa (R$)</span>
                <input
                  type="number"
                  step="1.00"
                  value={cashierDiscount}
                  onChange={(e) => onCashierDiscountChange(e.target.value)}
                  className="w-20 bg-transparent text-sm font-black text-[#00FF88] focus:outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewItemModal}
              className="border-[#00FF88]/40 text-[#00FF88]"
            >
              <Plus className="w-4 h-4" />
              <span>Item Imprevisto</span>
            </Button>

            <select
              value={selectedWalletId}
              onChange={(e) => onSelectWalletId(e.target.value)}
              className="bg-[#0A0B0E] text-xs font-bold text-[#F8FAFC] px-3 py-2.5 rounded-xl border border-[#2E3B52] focus:outline-none cursor-pointer"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              onClick={onOpenFinishModal}
              disabled={shoppingSummary.checkedCount === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Finalizar Feira ({shoppingSummary.checkedCount})</span>
            </Button>
          </div>
        </div>

        {/* Barra de Progresso do Teto do Orçamento e Saldo Restante */}
        {shoppingSummary.capNum > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2E3B52]/60">
            <div className="flex flex-wrap items-center justify-between text-xs font-extrabold gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={
                    shoppingSummary.isOverBudget
                      ? 'text-[#FF4D6D] flex items-center gap-1'
                      : 'text-[#00FF88]'
                  }
                >
                  {shoppingSummary.isOverBudget && <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D6D]" />}
                  No Carrinho: {formatBRL(shoppingSummary.netTotalSpent, isPrivacyMode)} / Teto{' '}
                  {formatBRL(shoppingSummary.capNum, isPrivacyMode)}
                </span>
                {shoppingSummary.discountNum > 0 && (
                  <span className="text-[10px] text-[#00FF88] bg-[#00FF88]/15 px-2 py-0.5 rounded-md border border-[#00FF88]/30">
                    Cupom: -{formatBRL(shoppingSummary.discountNum, isPrivacyMode)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={
                    shoppingSummary.remainingBudget >= 0 ? 'text-[#06B6D4]' : 'text-[#FF4D6D]'
                  }
                >
                  Saldo Restante: {formatBRL(shoppingSummary.remainingBudget, isPrivacyMode)}
                </span>
                <span className={shoppingSummary.isOverBudget ? 'text-[#FF4D6D]' : 'text-[#94A3B8]'}>
                  {shoppingSummary.budgetPct}% do teto
                </span>
              </div>
            </div>

            <ProgressBar
              value={shoppingSummary.budgetPct}
              variant={
                shoppingSummary.isOverBudget
                  ? 'rose'
                  : shoppingSummary.budgetPct > 80
                  ? 'amber'
                  : 'emerald'
              }
              size="md"
            />
          </div>
        )}
      </div>

      {/* BARRA DE FERRAMENTAS DE MARCAR TODOS, LIMPAR E FILTROS RÁPIDOS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0D1424]/90 border border-[#2E3B52] rounded-2xl shadow-md">
        {/* Botão de Marcar / Desmarcar Todos & Limpar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer active:scale-95 ${
              isAllChecked
                ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border-[#FF4D6D]/40 hover:bg-[#FF4D6D]/30'
                : 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40 hover:bg-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
            }`}
            title={isAllChecked ? 'Desmarcar todos os itens da feira' : 'Marcar todos os itens da feira no carrinho'}
          >
            {isAllChecked ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            <span>{isAllChecked ? 'Desmarcar Todos' : '⚡ Marcar Todos'}</span>
          </button>

          {shoppingSummary.checkedCount > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] hover:text-[#FF4D6D] hover:border-[#FF4D6D]/40 text-xs font-bold transition-all cursor-pointer"
              title="Limpar marcações do carrinho"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Carrinho</span>
            </button>
          )}
        </div>

        {/* Filtros Rápidos de Exibição */}
        <div className="flex items-center p-1 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs gap-1">
          <button
            type="button"
            onClick={() => onShoppingFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              shoppingFilter === 'all'
                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Todos ({neededItems.length})
          </button>
          <button
            type="button"
            onClick={() => onShoppingFilterChange('checked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              shoppingFilter === 'checked'
                ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            🛒 No Carrinho ({shoppingSummary.checkedCount})
          </button>
          <button
            type="button"
            onClick={() => onShoppingFilterChange('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              shoppingFilter === 'pending'
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            ⏳ Faltando ({neededItems.length - shoppingSummary.checkedCount})
          </button>
        </div>

        {/* Alternador de Agrupamento por Corredor */}
        <button
          type="button"
          onClick={onToggleGroupByAisle}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#162032] text-[#06B6D4] border border-[#2E3B52] hover:border-[#06B6D4]/40 text-xs font-bold transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>{groupByAisle ? '🏬 Por Corredores' : '📋 Lista Simples'}</span>
        </button>
      </div>

      {/* LISTA DE COMPRAS (AGRUPADA OU SIMPLES) */}
      {displayedNeededItems.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-[#00FF88]" />
          <h4 className="text-base font-bold text-[#F8FAFC]">Nenhum item exibido para este filtro!</h4>
          <p className="text-xs text-[#94A3B8]">
            {shoppingFilter === 'checked'
              ? 'Você ainda não marcou nenhum item no carrinho.'
              : shoppingFilter === 'pending'
              ? 'Todos os itens necessários já foram marcados!'
              : 'Nenhum item do seu estoque está abaixo da quantidade ideal no momento.'}
          </p>
        </Card>
      ) : groupByAisle ? (
        <div className="flex flex-col gap-6">
          {displayedItemsByAisle.map(([category, catItems]) => (
            <div key={category} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-[#2E3B52]">
                <span className="text-xs font-black uppercase tracking-wider text-[#06B6D4] px-2.5 py-0.5 rounded-md bg-[#06B6D4]/15 border border-[#06B6D4]/30">
                  Corredor: {category} ({catItems.length})
                </span>
              </div>

              <div className="flex flex-col gap-3.5">
                {catItems.map((item) => renderCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {displayedNeededItems.map((item) => renderCard(item))}
        </div>
      )}

      {/* BARRA FIXA FLUTUANTE DE RESUMO PARA CELULAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#0D1424]/95 backdrop-blur-xl border-t border-[#2E3B52] z-50 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase">No Carrinho</span>
          <span className="text-xl font-black text-[#00FF88]">
            {formatBRL(shoppingSummary.netTotalSpent, isPrivacyMode)}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenFinishModal}
          disabled={shoppingSummary.checkedCount === 0}
          className="px-4 py-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finalizar ({shoppingSummary.checkedCount})</span>
        </Button>
      </div>
    </div>
  );
};
