import React from 'react';
import { Card } from '../ui/Card';
import { PantryItem } from '../../types';
import { PriceCalculationMode } from './pantryTypes';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  Tag,
  Flame,
  BadgePercent,
  Minus,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ShoppingItemCardProps {
  item: PantryItem;
  isChecked: boolean;
  qtyToBuy: number;
  priceMode: PriceCalculationMode;
  cartPrice: number;
  comboTotal: number;
  discount: number;
  effectiveUnitPrice: number;
  itemSubtotal: number;
  onToggleCheck: () => void;
  onQtyChange: (delta: number) => void;
  onPriceChange: (price: number) => void;
  onSetPriceMode: (mode: PriceCalculationMode) => void;
  onComboTotalChange: (total: number) => void;
  onDiscountChange: (discount: number) => void;
}

export const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  isChecked,
  qtyToBuy,
  priceMode,
  cartPrice,
  comboTotal,
  discount,
  effectiveUnitPrice,
  itemSubtotal,
  onToggleCheck,
  onQtyChange,
  onPriceChange,
  onSetPriceMode,
  onComboTotalChange,
  onDiscountChange,
}) => {
  const { isPrivacyMode } = useAppStore();

  const formatQtyDisplay = (val: number) => {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2).replace('.', ',');
  };

  const defaultNeeded = Math.max(Math.round((item.idealQuantity - item.currentQuantity) * 100) / 100, 0.01);
  const priceDiff = effectiveUnitPrice - item.lastPrice;
  const priceDiffPct = item.lastPrice > 0 ? (priceDiff / item.lastPrice) * 100 : 0;
  const isInflationAlert = priceDiffPct > 15;

  return (
    <Card
      key={item.id}
      className={`p-4 sm:p-5 transition-all flex flex-col gap-4 ${
        isChecked
          ? 'bg-[#00FF88]/10 border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/5'
          : 'bg-[#0A0B0E]/80 border-[#1E2330] hover:border-[#2E3B52]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onToggleCheck}
            className="w-7 h-7 rounded-lg accent-[#00FF88] cursor-pointer shrink-0 mt-0.5 touch-manipulation"
          />

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#162032] text-[#06B6D4] border border-[#2E3B52]">
                {item.category}
              </span>
              <span className="text-xs text-[#00FF88] font-bold">
                Faltam: {formatQtyDisplay(defaultNeeded)} {item.unit} (Estoque: {formatQtyDisplay(item.currentQuantity)})
              </span>
              {isInflationAlert && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Alerta Inflação (+{priceDiffPct.toFixed(0)}%)</span>
                </span>
              )}
            </div>

            <h4 className={`text-lg font-black mt-1 ${isChecked ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
              {item.name}
            </h4>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Subtotal Item</span>
          <span className="text-xl font-black text-[#00FF88]">{formatBRL(itemSubtotal, isPrivacyMode)}</span>
        </div>
      </div>

      {/* Seletor de Modo de Valor / Desconto */}
      <div className="flex flex-col gap-2 p-3 bg-[#12141A] border border-[#2E3B52] rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#00FF88]" />
            Selecione como calcular o preço/desconto:
          </span>

          <div className="flex items-center gap-1 bg-[#0A0B0E] p-1 rounded-lg border border-[#2E3B52]">
            <button
              type="button"
              onClick={() => onSetPriceMode('unit')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                priceMode === 'unit'
                  ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              🏷️ Preço Unitário
            </button>

            <button
              type="button"
              onClick={() => onSetPriceMode('combo')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                priceMode === 'combo'
                  ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Flame className="w-3 h-3 text-[#FF4D6D]" />
              <span>Combo "Leve X por R$ Y"</span>
            </button>

            <button
              type="button"
              onClick={() => onSetPriceMode('discount')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                priceMode === 'discount'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <BadgePercent className="w-3 h-3 text-[#F59E0B]" />
              <span>Desconto em R$</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Qtd Comprada no Carrinho</label>
            <div className="flex items-center gap-1.5 h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl">
              <button
                onClick={() => onQtyChange(item.unit === 'kg' || item.unit === 'L' ? -0.25 : -1)}
                className="w-7 h-7 rounded-lg bg-[#162032] flex items-center justify-center text-[#F8FAFC] font-black text-sm active:scale-95 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="flex-1 text-center font-black text-sm text-[#00FF88]">
                {formatQtyDisplay(qtyToBuy)} {item.unit}
              </span>
              <button
                onClick={() => onQtyChange(item.unit === 'kg' || item.unit === 'L' ? 0.25 : 1)}
                className="w-7 h-7 rounded-lg bg-[#162032] flex items-center justify-center text-[#F8FAFC] font-black text-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {priceMode === 'unit' && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">
                Preço Unitário Prateleira (R$/{item.unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={cartPrice}
                  onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F59E0B] font-black focus:border-[#00FF88] focus:outline-none"
                  placeholder="Preço normal por unidade"
                />
                <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">
                  Mês anterior: <strong className="text-[#F8FAFC]">{formatBRL(item.lastPrice, isPrivacyMode)}</strong>
                </span>
              </div>
            </div>
          )}

          {priceMode === 'combo' && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-[#FF4D6D] uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#FF4D6D]" />
                Valor TOTAL Fechado da Promoção (R$)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.50"
                  value={comboTotal}
                  onChange={(e) => onComboTotalChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-[#0A0B0E] border border-[#FF4D6D]/60 rounded-xl text-sm text-[#FF4D6D] font-black focus:outline-none"
                  placeholder="Digite o valor total pago por todas as unidades"
                />
              </div>
            </div>
          )}

          {priceMode === 'discount' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Preço Normal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cartPrice}
                  onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F8FAFC] font-black focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#F59E0B] uppercase">Valor do Desconto Abatido (R$)</label>
                <input
                  type="number"
                  step="0.10"
                  value={discount}
                  onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-[#0A0B0E] border border-[#F59E0B]/60 rounded-xl text-sm text-[#F59E0B] font-black focus:outline-none"
                  placeholder="R$ desconto total"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#0A0B0E]/60 border border-[#1E2330] mt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8] font-medium">Preço Efetivo Calculado:</span>
            <strong className="text-[#00FF88] font-black text-sm">
              {formatBRL(effectiveUnitPrice, isPrivacyMode)} / {item.unit}
            </strong>
          </div>

          {priceDiff !== 0 && (
            <div className={`flex items-center gap-1 font-bold text-[11px] ${priceDiff > 0 ? 'text-[#FF4D6D]' : 'text-[#00FF88]'}`}>
              {priceDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {priceDiff > 0 ? '+' : ''}{priceDiffPct.toFixed(1)}% ({formatBRL(Math.abs(priceDiff), isPrivacyMode)}/{item.unit})
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
