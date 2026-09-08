import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { PantryItem, Wallet } from '../../tipos';
import { ShoppingSummary, PriceCalculationMode, ShoppingSubView } from './pantryTypes';
import { ShoppingItemCard } from './ShoppingItemCard';
import { formatBRL } from '../../utilidades/formatters';
import { useAppStore } from '../../estado/useAppStore';
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
  Store,
  CreditCard,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ReceiptText,
  Search,
  X,
} from 'lucide-react';

interface PantryShoppingTabProps {
  neededItems: PantryItem[];
  itemsByAisle: [string, PantryItem[]][];
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
  searchFilter: string;
  onSearchChange: (search: string) => void;
}

export const PantryShoppingTab: React.FC<PantryShoppingTabProps> = ({
  neededItems,
  itemsByAisle,
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
  searchFilter,
  onSearchChange,
}) => {
  const { isPrivacyMode } = useAppStore();
  const [subView, setSubView] = useState<ShoppingSubView>('aisles');

  // Filtro Universal: Nome ou Categoria
  const term = searchFilter.trim().toLowerCase();

  const filterItem = (item: PantryItem) => {
    if (!term) return true;
    const matchName = item.name.toLowerCase().includes(term);
    const matchCat = (item.category || '').toLowerCase().includes(term);
    return matchName || matchCat;
  };

  // Itens na Gôndola (ainda não adicionados ao carrinho)
  const aisleItems = useMemo(() => {
    return neededItems.filter((item) => !cartChecked[item.id] && filterItem(item));
  }, [neededItems, cartChecked, term]);

  // Itens no Carrinho / Caixa (já adicionados)
  const checkoutItems = useMemo(() => {
    return neededItems.filter((item) => cartChecked[item.id] && filterItem(item));
  }, [neededItems, cartChecked, term]);

  // Itens da Gôndola agrupados por corredor
  const aisleItemsByAisle = useMemo(() => {
    return itemsByAisle
      .map(([category, catItems]) => {
        const filteredCatItems = catItems.filter((item) => !cartChecked[item.id] && filterItem(item));
        return [category, filteredCatItems] as [string, PantryItem[]];
      })
      .filter(([, catItems]) => catItems.length > 0);
  }, [itemsByAisle, cartChecked, term]);

  const pendingCount = neededItems.filter((item) => !cartChecked[item.id]).length;
  const checkedCount = shoppingSummary.checkedCount;
  const isFeiraComplete = neededItems.length > 0 && pendingCount === 0;

  const renderCard = (item: PantryItem, viewMode: 'aisle' | 'checkout') => {
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
        viewMode={viewMode}
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
      {/* 2 INFORMAÇÕES CHAVE NO TOPO: PROGRESSO DE COLETA & INTELIGÊNCIA FINANCEIRA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* INFORMAÇÃO 1: Indicador de Avanço da Feira (Gôndola vs Carrinho) */}
        <div className="p-4 bg-[#0A0B0E]/90 border border-[#2E3B52] rounded-2xl flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF88]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Avanço da Feira
                </span>
                <h4 className="text-sm font-black text-[#F8FAFC]">
                  {checkedCount} de {neededItems.length} Itens no Carrinho
                </h4>
              </div>
            </div>
            <span className="text-sm font-black text-[#00FF88] bg-[#00FF88]/10 px-2.5 py-1 rounded-lg border border-[#00FF88]/30">
              {shoppingSummary.completionPct}% Coletado
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <ProgressBar
              value={shoppingSummary.completionPct}
              variant={isFeiraComplete ? 'emerald' : 'cyan'}
              size="md"
            />
            <div className="flex items-center justify-between text-[11px] font-bold text-[#94A3B8]">
              <span>Gôndola: {pendingCount} restantes</span>
              <span className="text-[#00FF88]">Carrinho: {checkedCount} pegos</span>
            </div>
          </div>
        </div>

        {/* INFORMAÇÃO 2: Inteligência de Economia & Preços em Tempo Real */}
        <div className="p-4 bg-[#0A0B0E]/90 border border-[#2E3B52] rounded-2xl flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Subtotal & Economia
                </span>
                <h4 className="text-sm font-black text-[#F8FAFC]">
                  Total: {formatBRL(shoppingSummary.netTotalSpent, isPrivacyMode)}
                </h4>
              </div>
            </div>

            {shoppingSummary.savingsTotal > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-black text-[#00FF88] bg-[#00FF88]/15 px-2.5 py-1 rounded-lg border border-[#00FF88]/30">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Economia: {formatBRL(shoppingSummary.savingsTotal, isPrivacyMode)}</span>
              </div>
            )}
          </div>

          {/* Status do Teto de Gastos */}
          {shoppingSummary.capNum > 0 ? (
            <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-[#2E3B52]/60">
              <span className={shoppingSummary.isOverBudget ? 'text-[#FF4D6D] flex items-center gap-1' : 'text-[#06B6D4]'}>
                {shoppingSummary.isOverBudget && <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D6D]" />}
                Teto: {formatBRL(shoppingSummary.capNum, isPrivacyMode)}
              </span>
              <span className={shoppingSummary.remainingBudget >= 0 ? 'text-[#94A3B8]' : 'text-[#FF4D6D]'}>
                {shoppingSummary.remainingBudget >= 0
                  ? `Resta ${formatBRL(shoppingSummary.remainingBudget, isPrivacyMode)}`
                  : `Excedeu ${formatBRL(Math.abs(shoppingSummary.remainingBudget), isPrivacyMode)}`}
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-[#94A3B8] pt-1 border-t border-[#2E3B52]/60">
              Defina um teto orçamentário no Caixa para acompanhar o limite de gastos.
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO ENTRE ETAPAS: GÔNDOLA AO VIVO vs CAIXA & PAGAMENTO */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0D1424] border border-[#2E3B52] rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          {/* Aba 1: Gôndola */}
          <button
            type="button"
            onClick={() => setSubView('aisles')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'aisles'
                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 shadow-md shadow-[#06B6D4]/10'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>🏬 Gôndola / Prateleiras</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Aba 2: Caixa */}
          <button
            type="button"
            onClick={() => setSubView('checkout')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'checkout'
                ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-md shadow-[#00FF88]/10'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>🛒 Caixa & Pagamento</span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full border ${
                checkedCount > 0
                  ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/30 font-black'
                  : 'bg-[#2E3B52]/40 text-[#94A3B8] border-transparent'
              }`}
            >
              {checkedCount}
            </span>
          </button>
        </div>

        {/* Controles Auxiliares */}
        <div className="flex items-center gap-2">
          {subView === 'aisles' && (
            <button
              type="button"
              onClick={onToggleGroupByAisle}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#162032] text-[#06B6D4] border border-[#2E3B52] hover:border-[#06B6D4]/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{groupByAisle ? 'Por Corredores' : 'Lista Simples'}</span>
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenNewItemModal}
            className="border-[#00FF88]/40 text-[#00FF88]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Item Imprevisto</span>
          </Button>

          {checkedCount > 0 && subView === 'aisles' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSubView('checkout')}
              className="bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black"
            >
              <span>Ir ao Caixa</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* BARRA DE PESQUISA PRÓXIMA DOS ITENS (GÔNDOLA OU CAIXA) */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#00FF88] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="pantry-shopping-search-input"
          type="text"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 Pesquisar produtos na feira (nome do produto, categoria ou corredor)..."
          className="w-full h-11 pl-10 pr-10 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#00FF88] transition-all shadow-inner"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#FF4D6D] p-1 rounded cursor-pointer transition-colors"
            title="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* SUB-VISÃO 1: GÔNDOLA / PRATELEIRAS AO VIVO */}
      {subView === 'aisles' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Banner de ações da gôndola */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0A0B0E]/80 border border-[#2E3B52] rounded-xl text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F8FAFC]">Dica de Feira:</span>
              <span>Ao pegar o produto na prateleira, marque para enviá-lo ao carrinho com animação.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSelectAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                  isAllChecked
                    ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border-[#FF4D6D]/40'
                    : 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40'
                }`}
              >
                {isAllChecked ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                <span>{isAllChecked ? 'Desmarcar Todos' : '⚡ Pegar Todos'}</span>
              </button>

              {checkedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#162032] text-[#94A3B8] border border-[#2E3B52] hover:text-[#FF4D6D] text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback quando tudo foi pego */}
          {isFeiraComplete ? (
            <Card className="p-12 text-center flex flex-col items-center gap-4 bg-gradient-to-b from-[#00FF88]/10 to-transparent border-[#00FF88]/30">
              <div className="p-4 bg-[#00FF88]/20 text-[#00FF88] rounded-3xl border border-[#00FF88]/40 shadow-xl">
                <Sparkles className="w-12 h-12 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#F8FAFC]">Toda a Gôndola foi Coletada!</h4>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-1">
                  Todos os itens necessários foram adicionados ao seu carrinho. Prossiga para a tela do Caixa para revisar os valores, aplicar cupons e registrar o pagamento.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setSubView('checkout')}
                className="mt-2 bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black shadow-xl"
              >
                <CreditCard className="w-5 h-5" />
                <span>Avançar para o Caixa ({checkedCount} itens)</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Card>
          ) : aisleItems.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-[#00FF88]" />
              <h4 className="text-sm font-bold text-[#F8FAFC]">Nenhum item na gôndola para os filtros atuais</h4>
              <p className="text-xs text-[#94A3B8]">
                {term ? `Nenhum produto correspondente a "${searchFilter}".` : 'Não há itens pendentes.'}
              </p>
            </Card>
          ) : groupByAisle && aisleItemsByAisle.length > 0 ? (
            <div className="flex flex-col gap-6">
              {aisleItemsByAisle.map(([category, catItems]) => (
                <div key={category} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-[#2E3B52]">
                    <span className="text-xs font-black uppercase tracking-wider text-[#06B6D4] px-2.5 py-0.5 rounded-md bg-[#06B6D4]/15 border border-[#06B6D4]/30">
                      Corredor: {category} ({catItems.length})
                    </span>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <AnimatePresence>
                      {catItems.map((item) => renderCard(item, 'aisle'))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <AnimatePresence>
                {aisleItems.map((item) => renderCard(item, 'aisle'))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* SUB-VISÃO 2: TELA DO CAIXA & PAGAMENTO */}
      {subView === 'checkout' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* PAINEL FINANCEIRO DO CAIXA */}
          <div className="p-5 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/15 to-[#F59E0B]/15 border border-[#00FF88]/30 rounded-2xl flex flex-col gap-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#00FF88]/20 text-[#00FF88] rounded-2xl border border-[#00FF88]/40 shadow-md">
                  <CreditCard className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F8FAFC]">Caixa & Fechamento da Feira</h3>
                  <p className="text-xs text-[#94A3B8] font-medium">
                    Revise os itens comprados, confirme a carteira e realize o pagamento
                  </p>
                </div>
              </div>

              {/* Teto e Desconto no Caixa */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5 bg-[#0A0B0E]/90 p-2.5 rounded-xl border border-[#2E3B52]">
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

                <div className="flex items-center gap-2.5 bg-[#0A0B0E]/90 p-2.5 rounded-xl border border-[#2E3B52]">
                  <BadgePercent className="w-4 h-4 text-[#00FF88]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Cupom / Caixa (R$)</span>
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

                {/* Seletor de Carteira */}
                <div className="flex items-center gap-2 bg-[#0A0B0E]/90 p-2 rounded-xl border border-[#2E3B52]">
                  <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] pl-1">Carteira:</span>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => onSelectWalletId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#F8FAFC] pr-2 focus:outline-none cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#0A0B0E] text-[#F8FAFC]">
                        {w.icon} {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Resumo Numérico do Caixa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#2E3B52]/60">
              <div className="p-3 bg-[#0A0B0E]/70 rounded-xl border border-[#2E3B52]/60 flex flex-col">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Subtotal Bruto</span>
                <span className="text-base font-black text-[#F8FAFC]">
                  {formatBRL(shoppingSummary.totalSpent, isPrivacyMode)}
                </span>
              </div>

              <div className="p-3 bg-[#0A0B0E]/70 rounded-xl border border-[#2E3B52]/60 flex flex-col">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Descontos & Economia</span>
                <span className="text-base font-black text-[#00FF88]">
                  -{formatBRL(shoppingSummary.savingsTotal, isPrivacyMode)}
                </span>
              </div>

              <div className="p-3 bg-[#0A0B0E]/70 rounded-xl border border-[#2E3B52]/60 flex flex-col">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Líquido</span>
                <span className="text-lg font-black text-[#00FF88]">
                  {formatBRL(shoppingSummary.netTotalSpent, isPrivacyMode)}
                </span>
              </div>

              <div className="flex items-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onOpenFinishModal}
                  disabled={checkedCount === 0}
                  className="w-full h-full py-3 bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black text-sm shadow-xl"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Pagar ({checkedCount})</span>
                </Button>
              </div>
            </div>
          </div>

          {/* LISTA DE ITENS NO CARRINHO PARA O CAIXA */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2E3B52]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#00FF88]" />
              <h4 className="text-sm font-black text-[#F8FAFC]">
                Itens no Caixa para Pagamento ({checkoutItems.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSubView('aisles')}
              className="text-xs font-bold text-[#06B6D4] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Voltar para as gôndolas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {checkoutItems.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-4">
              <ShoppingCart className="w-12 h-12 text-[#94A3B8]/40" />
              <div>
                <h4 className="text-base font-bold text-[#F8FAFC]">Seu carrinho do caixa está vazio</h4>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                  Vá até a aba de Gôndolas para pegar os produtos e colocá-los no carrinho.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubView('aisles')}
                className="border-[#06B6D4]/40 text-[#06B6D4]"
              >
                <Store className="w-4 h-4" />
                <span>Ver Gôndolas</span>
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3.5">
              <AnimatePresence mode="popLayout">
                {checkoutItems.map((item) => renderCard(item, 'checkout'))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* BARRA FIXA FLUTUANTE DE RESUMO PARA CELULAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#0D1424]/95 backdrop-blur-xl border-t border-[#2E3B52] z-50 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase">
            {subView === 'aisles' ? 'No Carrinho' : 'Total do Caixa'}
          </span>
          <span className="text-xl font-black text-[#00FF88]">
            {formatBRL(shoppingSummary.netTotalSpent, isPrivacyMode)}
          </span>
        </div>

        {subView === 'aisles' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSubView('checkout')}
            disabled={checkedCount === 0}
            className="px-4 py-3 text-xs bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black"
          >
            <span>Ir ao Caixa ({checkedCount})</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenFinishModal}
            disabled={checkedCount === 0}
            className="px-4 py-3 text-xs bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pagar Feira ({checkedCount})</span>
          </Button>
        )}
      </div>
    </div>
  );
};
