import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { PantryItem } from '../../tipos';
import { PantryItemModal } from './PantryItemModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { FinishShoppingModal } from './FinishShoppingModal';
import { UnitPriceCalculatorModal } from './UnitPriceCalculatorModal';
import { PantryHeader } from './PantryHeader';
import { PantryStockTab } from './PantryStockTab';
import { PantryWizardTab } from './PantryWizardTab';
import { PantryShoppingTab } from './PantryShoppingTab';
import { PantryTab, PriceCalculationMode } from './pantryTypes';
import { formatBRL } from '../../utilidades/formatters';

export const PantryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PantryTab>('stock');

  // Dexie live queries
  const items = useLiveQuery(() => db.pantryItems.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  // State for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isUnitCalcModalOpen, setIsUnitCalcModalOpen] = useState(false);

  // Search & Category Filters in Stock
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Wizard state (Checklist Pré-Feira)
  const [wizardIndex, setWizardIndex] = useState(0);

  // Shopping Cart state (Modo Mercado Ao Vivo)
  const [cartChecked, setCartChecked] = useState<Record<string, boolean>>({});
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartPrices, setCartPrices] = useState<Record<string, number>>({});
  const [cartPriceModes, setCartPriceModes] = useState<Record<string, PriceCalculationMode>>({});
  const [cartComboTotals, setCartComboTotals] = useState<Record<string, number>>({});
  const [cartDiscounts, setCartDiscounts] = useState<Record<string, number>>({});
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  // Teto de Orçamento, Desconto no Caixa, Filtros e Agrupamento por Corredor
  const [budgetCap, setBudgetCap] = useState<string>('500.00');
  const [cashierDiscount, setCashierDiscount] = useState<string>('0');
  const [shoppingFilter, setShoppingFilter] = useState<'all' | 'checked' | 'pending'>('all');
  const [groupByAisle, setGroupByAisle] = useState<boolean>(true);

  // 1. Filtered Stock Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchFilter]);

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [items]);

  // Format Helper for Quantities
  const formatQtyDisplay = (val: number) => {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2).replace('.', ',');
  };

  // Handle Quick Quantity Change in Stock
  const handleQuickQtyChange = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(Math.round((item.currentQuantity + delta) * 100) / 100, 0);
    await db.pantryItems.update(item.id, {
      currentQuantity: newQty,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item do estoque?')) {
      await db.pantryItems.delete(id);
    }
  };

  // --- 2. Wizard Logic (Conferência Pré-Feira) ---
  const currentWizardItem = items[wizardIndex];

  const handleStartWizard = () => {
    if (items.length === 0) return;
    setWizardIndex(0);
    setActiveTab('wizard');
  };

  const handleWizardAnswer = async (qty: number) => {
    if (!currentWizardItem) return;

    await db.pantryItems.update(currentWizardItem.id, {
      currentQuantity: qty,
      updatedAt: new Date().toISOString(),
    });

    if (wizardIndex < items.length - 1) {
      setWizardIndex((prev) => prev + 1);
    } else {
      // Wizard complete! Initialize cart
      const defaultQty: Record<string, number> = {};
      const defaultPrices: Record<string, number> = {};
      items.forEach((item) => {
        const needed = Math.max(item.idealQuantity - qty, 0);
        defaultQty[item.id] = needed > 0 ? needed : 1;
        defaultPrices[item.id] = item.lastPrice;
      });
      setCartQuantities(defaultQty);
      setCartPrices(defaultPrices);
      setActiveTab('shopping');
    }
  };

  // --- 3. Shopping Cart Logic (Modo Mercado Ao Vivo) ---
  const neededItems = useMemo(() => {
    return items.filter((item) => item.idealQuantity - item.currentQuantity > 0);
  }, [items]);

  // Agrupamento por Corredores do Supermercado
  const itemsByAisle = useMemo(() => {
    const order: Record<string, number> = {
      'Hortifrúti': 1,
      'Carnes & Peixes': 2,
      'Laticínios': 3,
      'Alimentos': 4,
      'Bebidas': 5,
      'Limpeza': 6,
      'Higiene': 7,
      'Outros': 8,
    };

    const grouped: Record<string, PantryItem[]> = {};

    neededItems.forEach((item) => {
      const cat = item.category || 'Outros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    return Object.entries(grouped).sort(([catA], [catB]) => {
      const posA = order[catA] || 99;
      const posB = order[catB] || 99;
      return posA - posB;
    });
  }, [neededItems]);

  const getQtyToBuy = (item: PantryItem) => {
    if (cartQuantities[item.id] !== undefined) {
      return cartQuantities[item.id];
    }
    const needed = Math.max(item.idealQuantity - item.currentQuantity, 0.01);
    return Math.round(needed * 100) / 100;
  };

  const getEffectiveUnitPrice = (item: PantryItem) => {
    const mode = cartPriceModes[item.id] || 'unit';
    const qty = getQtyToBuy(item);
    const basePrice = cartPrices[item.id] ?? item.lastPrice;

    if (mode === 'combo') {
      const comboTotal = cartComboTotals[item.id] ?? (qty * basePrice);
      return qty > 0 ? comboTotal / qty : basePrice;
    }

    if (mode === 'discount') {
      const discount = cartDiscounts[item.id] ?? 0;
      const total = Math.max((qty * basePrice) - discount, 0);
      return qty > 0 ? total / qty : basePrice;
    }

    return basePrice;
  };

  const getItemSubtotal = (item: PantryItem) => {
    const mode = cartPriceModes[item.id] || 'unit';
    const qty = getQtyToBuy(item);
    const basePrice = cartPrices[item.id] ?? item.lastPrice;

    if (mode === 'combo') {
      return cartComboTotals[item.id] ?? (qty * basePrice);
    }

    if (mode === 'discount') {
      const discount = cartDiscounts[item.id] ?? 0;
      return Math.max((qty * basePrice) - discount, 0);
    }

    return qty * basePrice;
  };

  const shoppingSummary = useMemo(() => {
    let totalSpent = 0;
    let checkedCount = 0;

    neededItems.forEach((item) => {
      const isChecked = cartChecked[item.id] ?? false;
      if (isChecked) {
        checkedCount += 1;
        totalSpent += getItemSubtotal(item);
      }
    });

    const capNum = parseFloat(budgetCap) || 0;
    const discountNum = parseFloat(cashierDiscount) || 0;
    const netTotalSpent = Math.max(totalSpent - discountNum, 0);
    const isOverBudget = capNum > 0 && netTotalSpent > capNum;
    const budgetPct = capNum > 0 ? Math.min(Math.round((netTotalSpent / capNum) * 100), 100) : 0;
    const remainingBudget = capNum > 0 ? capNum - netTotalSpent : 0;

    return {
      totalSpent,
      discountNum,
      netTotalSpent,
      checkedCount,
      totalNeeded: neededItems.length,
      capNum,
      isOverBudget,
      budgetPct,
      remainingBudget,
    };
  }, [neededItems, cartChecked, cartPrices, cartQuantities, cartPriceModes, cartComboTotals, cartDiscounts, budgetCap, cashierDiscount]);

  const isAllChecked = useMemo(() => {
    return neededItems.length > 0 && neededItems.every((item) => cartChecked[item.id]);
  }, [neededItems, cartChecked]);

  const handleToggleSelectAll = () => {
    if (isAllChecked) {
      setCartChecked({});
    } else {
      const newChecked: Record<string, boolean> = {};
      neededItems.forEach((item) => {
        newChecked[item.id] = true;
      });
      setCartChecked(newChecked);
    }
  };

  const displayedNeededItems = useMemo(() => {
    if (shoppingFilter === 'checked') {
      return neededItems.filter((item) => cartChecked[item.id]);
    }
    if (shoppingFilter === 'pending') {
      return neededItems.filter((item) => !cartChecked[item.id]);
    }
    return neededItems;
  }, [neededItems, cartChecked, shoppingFilter]);

  const displayedItemsByAisle = useMemo(() => {
    return itemsByAisle
      .map(([category, catItems]) => {
        const filteredCatItems = catItems.filter((item) => {
          if (shoppingFilter === 'checked') return cartChecked[item.id];
          if (shoppingFilter === 'pending') return !cartChecked[item.id];
          return true;
        });
        return [category, filteredCatItems] as [string, PantryItem[]];
      })
      .filter(([, catItems]) => catItems.length > 0);
  }, [itemsByAisle, cartChecked, shoppingFilter]);

  const handleToggleCartItem = (id: string) => {
    setCartChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCartQtyChange = (id: string, delta: number) => {
    setCartQuantities((prev) => {
      const current = prev[id] !== undefined ? prev[id] : 1;
      const next = Math.max(Math.round((current + delta) * 100) / 100, 0.01);
      return { ...prev, [id]: next };
    });
  };

  const handlePriceChange = (id: string, price: number) => {
    setCartPrices((prev) => ({ ...prev, [id]: price }));
  };

  const handleSetPriceMode = (id: string, mode: PriceCalculationMode, defaultQty: number, lastPrice: number) => {
    setCartPriceModes((prev) => ({ ...prev, [id]: mode }));

    if (mode === 'combo' && cartComboTotals[id] === undefined) {
      const qty = cartQuantities[id] || defaultQty;
      const price = cartPrices[id] || lastPrice;
      setCartComboTotals((prev) => ({ ...prev, [id]: qty * price }));
    }

    if (mode === 'discount' && cartDiscounts[id] === undefined) {
      setCartDiscounts((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const handleComboTotalChange = (id: string, total: number) => {
    setCartComboTotals((prev) => ({ ...prev, [id]: total }));
  };

  const handleDiscountChange = (id: string, discount: number) => {
    setCartDiscounts((prev) => ({ ...prev, [id]: discount }));
  };

  // --- RECURSO: COMPARTILHAR NO WHATSAPP ---
  const handleShareWhatsApp = () => {
    let msg = `🛒 *LISTA DE FEIRA DE MERCADO - NOSSOBOLSO*\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    itemsByAisle.forEach(([category, catItems]) => {
      msg += `📌 *${category.toUpperCase()}*\n`;
      catItems.forEach((i) => {
        const qty = getQtyToBuy(i);
        const price = getEffectiveUnitPrice(i);
        msg += ` • ${i.name}: ${formatQtyDisplay(qty)} ${i.unit} (~${formatBRL(qty * price, false)})\n`;
      });
      msg += `\n`;
    });

    const estTotal = neededItems.reduce((acc, i) => acc + (getQtyToBuy(i) * getEffectiveUnitPrice(i)), 0);
    msg += `💰 *Estimativa Total:* ${formatBRL(estTotal, false)}\n\n_Gerado por NossoBolso Finance OS_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // --- RECURSO: IMPRIMIR / EXPORTAR PDF ---
  const handlePrintPDF = () => {
    window.print();
  };

  const handleOpenFinishModal = () => {
    if (shoppingSummary.checkedCount === 0 || shoppingSummary.totalSpent <= 0) return;
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinishShopping = async (paymentDetails: {
    walletId: string;
    paymentMethod: 'cash' | 'credit';
    installmentsCount: number;
    description: string;
  }) => {
    const { walletId, paymentMethod, installmentsCount, description } = paymentDetails;

    // 1. Repor estoque dos itens marcados no carrinho
    for (const item of neededItems) {
      if (cartChecked[item.id]) {
        const qtyBought = getQtyToBuy(item);
        const effectivePrice = getEffectiveUnitPrice(item);
        const newStock = Math.round((item.currentQuantity + qtyBought) * 100) / 100;

        await db.pantryItems.update(item.id, {
          currentQuantity: newStock,
          lastPrice: effectivePrice,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Lançar Transação(ões) no NossoBolso de acordo com a forma de pagamento selecionada
    if (shoppingSummary.totalSpent > 0) {
      if (paymentMethod === 'credit' && installmentsCount > 1) {
        // Lançamento Parcelado no Cartão de Crédito
        const instAmount = Math.round((shoppingSummary.totalSpent / installmentsCount) * 100) / 100;
        const batchId = Date.now();
        const batchTxs = [];
        const today = new Date();

        for (let i = 1; i <= installmentsCount; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + (i - 1), today.getDate());
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');

          batchTxs.push({
            id: `feira_${batchId}_${i}`,
            description: `${description} (${i}/${installmentsCount})`,
            amount: instAmount,
            date: `${yyyy}-${mm}-${dd}`,
            type: 'expense' as const,
            category: 'Alimentação',
            walletId,
            installments: {
              current: i,
              total: installmentsCount,
            },
            createdAt: new Date().toISOString(),
          });
        }

        await db.transactions.bulkAdd(batchTxs);

        // Debitar valor da 1ª parcela no saldo do mês atual
        const wallet = await db.wallets.get(walletId);
        if (wallet) {
          await db.wallets.update(walletId, { balance: wallet.balance - instAmount });
        }
      } else {
        // Lançamento À Vista / Débito / 1x no Cartão
        await db.transactions.add({
          id: `feira_${Date.now()}`,
          description,
          amount: shoppingSummary.totalSpent,
          date: new Date().toISOString().substring(0, 10),
          type: 'expense',
          category: 'Alimentação',
          walletId,
          createdAt: new Date().toISOString(),
        });

        // Debitar valor total do saldo da carteira
        const wallet = await db.wallets.get(walletId);
        if (wallet) {
          await db.wallets.update(walletId, { balance: wallet.balance - shoppingSummary.totalSpent });
        }
      }
    }

    alert('🎉 Compras finalizadas com sucesso! O estoque foi abastecido e o lançamento financeiro foi organizado no NossoBolso.');
    setCartChecked({});
    setActiveTab('stock');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-24 md:pb-6">
      {/* Modais */}
      <PantryItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
      />

      <UnitPriceCalculatorModal
        isOpen={isUnitCalcModalOpen}
        onClose={() => setIsUnitCalcModalOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={neededItems.length > 0 ? neededItems : items}
        onSelectFoundItem={(foundItem) => {
          setCartChecked((prev) => ({ ...prev, [foundItem.id]: true }));
          alert(`Item "${foundItem.name}" localizado e marcado no carrinho!`);
        }}
      />

      {/* Cabeçalho de Abas e Ações */}
      <PantryHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalStockItems={items.length}
        totalNeededItems={neededItems.length}
        onStartWizard={handleStartWizard}
        onOpenUnitCalcModal={() => setIsUnitCalcModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onShareWhatsApp={handleShareWhatsApp}
        onPrintPDF={handlePrintPDF}
        onOpenNewItemModal={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
      />

      {/* Aba 1: Estoque Doméstico */}
      {activeTab === 'stock' && (
        <PantryStockTab
          items={items}
          filteredItems={filteredItems}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          categoriesList={categoriesList}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onStartWizard={handleStartWizard}
          onOpenNewItemModal={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          onEditItem={(item) => {
            setEditingItem(item);
            setIsModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onQuickQtyChange={handleQuickQtyChange}
        />
      )}

      {/* Aba 2: Checklist Pré-Feira */}
      {activeTab === 'wizard' && (
        <PantryWizardTab
          items={items}
          wizardIndex={wizardIndex}
          onSelectQuantity={handleWizardAnswer}
          onPrevious={() => setWizardIndex((prev) => Math.max(prev - 1, 0))}
          onKeepCurrent={() =>
            currentWizardItem && handleWizardAnswer(currentWizardItem.currentQuantity)
          }
          onBackToStock={() => setActiveTab('stock')}
        />
      )}

      {/* Aba 3: Feira Ao Vivo */}
      {activeTab === 'shopping' && (
        <PantryShoppingTab
          neededItems={neededItems}
          displayedNeededItems={displayedNeededItems}
          itemsByAisle={itemsByAisle}
          displayedItemsByAisle={displayedItemsByAisle}
          cartChecked={cartChecked}
          cartQuantities={cartQuantities}
          cartPrices={cartPrices}
          cartPriceModes={cartPriceModes}
          cartComboTotals={cartComboTotals}
          cartDiscounts={cartDiscounts}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onSelectWalletId={setSelectedWalletId}
          budgetCap={budgetCap}
          onBudgetCapChange={setBudgetCap}
          cashierDiscount={cashierDiscount}
          onCashierDiscountChange={setCashierDiscount}
          shoppingFilter={shoppingFilter}
          onShoppingFilterChange={setShoppingFilter}
          groupByAisle={groupByAisle}
          onToggleGroupByAisle={() => setGroupByAisle(!groupByAisle)}
          shoppingSummary={shoppingSummary}
          isAllChecked={isAllChecked}
          onToggleSelectAll={handleToggleSelectAll}
          onClearCart={() => {
            if (confirm('Deseja desmarcar todos os itens do carrinho?')) {
              setCartChecked({});
            }
          }}
          onOpenFinishModal={handleOpenFinishModal}
          onOpenNewItemModal={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          onToggleCartItem={handleToggleCartItem}
          onCartQtyChange={handleCartQtyChange}
          onPriceChange={handlePriceChange}
          onSetPriceMode={handleSetPriceMode}
          onComboTotalChange={handleComboTotalChange}
          onDiscountChange={handleDiscountChange}
          getQtyToBuy={getQtyToBuy}
          getEffectiveUnitPrice={getEffectiveUnitPrice}
          getItemSubtotal={getItemSubtotal}
        />
      )}

      {/* Modal de Pagamento e Finalização de Compras */}
      <FinishShoppingModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        totalSpent={shoppingSummary.netTotalSpent}
        checkedCount={shoppingSummary.checkedCount}
        wallets={wallets}
        onConfirmFinish={handleConfirmFinishShopping}
      />
    </div>
  );
};
