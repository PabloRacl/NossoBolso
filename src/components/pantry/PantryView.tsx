import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { PantryItem } from '../../types';
import { PantryItemModal } from './PantryItemModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { FinishShoppingModal } from './FinishShoppingModal';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  Package,
  ClipboardCheck,
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Minus,
  Tag,
  Flame,
  Percent,
  BadgePercent,
  Share2,
  Printer,
  Camera,
  Target,
  Layers,
  Zap,
  Check
} from 'lucide-react';

type PantryTab = 'stock' | 'wizard' | 'shopping';
type PriceCalculationMode = 'unit' | 'combo' | 'discount';

export const PantryView: React.FC = () => {
  const { isPrivacyMode, setActivePage } = useAppStore();
  const [activeTab, setActiveTab] = useState<PantryTab>('stock');

  // Dexie live queries
  const items = useLiveQuery(() => db.pantryItems.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  // State for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

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

  // Novas Funcionalidades: Teto de Orçamento e Agrupamento por Corredor
  const [budgetCap, setBudgetCap] = useState<string>('500.00');
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
    const isOverBudget = capNum > 0 && totalSpent > capNum;
    const budgetPct = capNum > 0 ? Math.min(Math.round((totalSpent / capNum) * 100), 100) : 0;

    return {
      totalSpent,
      checkedCount,
      totalNeeded: neededItems.length,
      capNum,
      isOverBudget,
      budgetPct,
    };
  }, [neededItems, cartChecked, cartPrices, cartQuantities, cartPriceModes, cartComboTotals, cartDiscounts, budgetCap]);

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

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={neededItems.length > 0 ? neededItems : items}
        onSelectFoundItem={(foundItem) => {
          setCartChecked((prev) => ({ ...prev, [foundItem.id]: true }));
          alert(`Item "${foundItem.name}" localizado e marcado no carrinho!`);
        }}
      />

      {/* Header Tabs Responsive */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'stock'
                ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Estoque ({items.length})</span>
          </button>

          <button
            onClick={handleStartWizard}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'wizard'
                ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 shadow-md shadow-[#06B6D4]/10'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-[#06B6D4]" />
            <span>Checklist Pré-Feira</span>
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'shopping'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-md shadow-[#F59E0B]/10'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-[#F59E0B]" />
            <span>Feira Ao Vivo ({neededItems.length})</span>
          </button>
        </div>

        {/* Ferramentas de Exportação e Adição */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === 'shopping' && (
            <>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="p-2.5 rounded-xl bg-[#162032] text-[#00FF88] border border-[#2E3B52] hover:bg-[#00FF88]/15 transition-all text-xs font-bold flex items-center gap-1.5"
                title="Escanear Código de Barras / Câmera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Câmera Barcode</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="p-2.5 rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all text-xs font-bold flex items-center gap-1.5"
                title="Compartilhar no WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="p-2.5 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] hover:text-[#F8FAFC] transition-all text-xs font-bold flex items-center gap-1.5"
                title="Imprimir ou Salvar PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </>
          )}

          {activeTab === 'stock' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* --- TAB 1: ESTOQUE DOMÉSTICO --- */}
      {activeTab === 'stock' && (
        <div className="flex flex-col gap-6 w-full animate-fadeIn">
          {/* Barra de Busca e Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-[#0A0B0E]/80 border border-[#1E2330] rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar no estoque (ex: Leite, Arroz...)"
                className="w-full sm:w-auto px-4 py-2.5 text-xs bg-[#12141A] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none min-w-[200px]"
              />

              <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
                  }`}
                >
                  Todas
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleStartWizard} className="border-[#06B6D4]/40 text-[#06B6D4] w-full sm:w-auto justify-center">
              <ClipboardCheck className="w-4 h-4" />
              <span>Conferência Pré-Feira</span>
            </Button>
          </div>

          {/* Grid de Itens do Estoque */}
          {filteredItems.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center flex flex-col items-center gap-3">
              <Package className="w-12 h-12 text-[#64748B]" />
              <h4 className="text-base font-bold text-[#F8FAFC]">Nenhum item cadastrado no estoque</h4>
              <p className="text-xs text-[#94A3B8]">
                Adicione os alimentos e produtos que você costuma ter em casa para controlar o estoque e gerar listas automáticas de feira.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Item</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const pct = Math.round((item.currentQuantity / item.idealQuantity) * 100);
                const isOutOfStock = item.currentQuantity === 0;
                const isLowStock = !isOutOfStock && pct < 50;

                const statusColor = isOutOfStock
                  ? 'border-l-[#FF4D6D] text-[#FF4D6D] bg-[#FF4D6D]/10 border-[#FF4D6D]/30'
                  : isLowStock
                  ? 'border-l-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
                  : 'border-l-[#00FF88] text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/30';

                return (
                  <Card key={item.id} className="flex flex-col justify-between gap-3 p-4 hover:border-[#00FF88]/40 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">{item.category}</span>
                        <h4 className="text-sm font-black text-[#F8FAFC] mt-0.5 group-hover:text-[#00FF88] transition-colors">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#162032] rounded-lg transition-all"
                          title="Editar item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#162032] rounded-lg transition-all"
                          title="Excluir item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${statusColor}`}>
                        {isOutOfStock ? 'Esgotado' : isLowStock ? 'Estoque Baixo' : 'Estoque OK'} ({pct}%)
                      </span>
                      <span className="text-[#94A3B8] text-[11px] font-medium">
                        Último: <strong className="text-[#F8FAFC]">{formatBRL(item.lastPrice, isPrivacyMode)}</strong>/{item.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#0A0B0E] border border-[#1E2330] rounded-xl mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#94A3B8]">Estoque Atual:</span>
                        <span className="text-sm font-black text-[#F8FAFC]">
                          {formatQtyDisplay(item.currentQuantity)} / <span className="text-[#00FF88]">{formatQtyDisplay(item.idealQuantity)} {item.unit}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickQtyChange(item, item.unit === 'kg' || item.unit === 'L' ? -0.5 : -1)}
                          className="w-9 h-9 rounded-xl bg-[#162032] border border-[#2E3B52] flex items-center justify-center text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/15 hover:border-[#FF4D6D]/40 font-black text-base active:scale-95 transition-all touch-manipulation"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickQtyChange(item, item.unit === 'kg' || item.unit === 'L' ? 0.5 : 1)}
                          className="w-9 h-9 rounded-xl bg-[#162032] border border-[#2E3B52] flex items-center justify-center text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/15 hover:border-[#00FF88]/40 font-black text-base active:scale-95 transition-all touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: WIZARD CHECKLIST PRÉ-FEIRA --- */}
      {activeTab === 'wizard' && (
        <div className="flex justify-center w-full animate-fadeIn">
          {items.length === 0 ? (
            <Card className="p-8 text-center max-w-md flex flex-col gap-3">
              <p className="text-sm text-[#94A3B8]">Cadastre itens no seu estoque primeiro para utilizar a conferência rápida.</p>
              <Button variant="primary" onClick={() => setActiveTab('stock')}>
                Voltar para o Estoque
              </Button>
            </Card>
          ) : currentWizardItem ? (
            <Card glow glowColor="#06B6D4" className="w-full max-w-lg p-5 sm:p-6 flex flex-col gap-5 border-t-4 border-t-[#06B6D4] shadow-2xl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="font-extrabold text-[#06B6D4] uppercase tracking-wider">
                    Conferência Pré-Feira ({wizardIndex + 1} de {items.length})
                  </span>
                  <span>{Math.round(((wizardIndex + 1) / items.length) * 100)}% concluído</span>
                </div>
                <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#06B6D4] to-[#00FF88] transition-all duration-300 rounded-full"
                    style={{ width: `${((wizardIndex + 1) / items.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-3 p-5 sm:p-6 bg-[#0A0B0E] border border-[#2E3B52] rounded-2xl">
                <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                  {currentWizardItem.category}
                </span>

                <h3 className="text-lg sm:text-xl font-black text-[#F8FAFC]">
                  Quantos <strong className="text-[#00FF88]">{currentWizardItem.name}</strong> tem no armário/geladeira atualmente?
                </h3>

                <p className="text-xs text-[#94A3B8]">
                  Estoque ideal cadastrado: <strong className="text-[#00FF88]">{formatQtyDisplay(currentWizardItem.idealQuantity)} {currentWizardItem.unit}</strong>.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-[#94A3B8] uppercase text-center">Selecione a quantidade atual restante:</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {[0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleWizardAnswer(num)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-black border active:scale-95 transition-all touch-manipulation ${
                        num === 0
                          ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/30'
                          : num < currentWizardItem.idealQuantity
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/30'
                          : 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30 hover:bg-[#00FF88]/30'
                      }`}
                    >
                      {formatQtyDisplay(num)} {currentWizardItem.unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#1E2330]">
                <button
                  onClick={() => setWizardIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={wizardIndex === 0}
                  className="px-4 py-2.5 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 cursor-pointer"
                >
                  Anterior
                </button>

                <button
                  onClick={() => handleWizardAnswer(currentWizardItem.currentQuantity)}
                  className="px-4 py-2.5 text-xs font-bold text-[#06B6D4] hover:underline cursor-pointer"
                >
                  Manter Atual ({formatQtyDisplay(currentWizardItem.currentQuantity)} {currentWizardItem.unit}) ➔
                </button>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {/* --- TAB 3: MODO MERCADO AO VIVO (CARRINHO, TETO, CORREDORES, PROMOÇÕES COMBO & PREÇOS) --- */}
      {activeTab === 'shopping' && (
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

              {/* Teto de Orçamento da Feira */}
              <div className="flex items-center gap-3 bg-[#0A0B0E]/80 p-2.5 rounded-xl border border-[#2E3B52]">
                <Target className="w-4 h-4 text-[#F59E0B]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Teto da Feira (R$)</span>
                  <input
                    type="number"
                    step="10.00"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(e.target.value)}
                    className="w-24 bg-transparent text-sm font-black text-[#F59E0B] focus:outline-none"
                    placeholder="Ex: 500,00"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="border-[#00FF88]/40 text-[#00FF88]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Item Imprevisto</span>
                </Button>

                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="bg-[#0A0B0E] text-xs font-bold text-[#F8FAFC] px-3 py-2.5 rounded-xl border border-[#2E3B52] focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>

                <Button variant="primary" onClick={handleOpenFinishModal} disabled={shoppingSummary.checkedCount === 0}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Finalizar Feira ({shoppingSummary.checkedCount})</span>
                </Button>
              </div>
            </div>

            {/* Barra de Progresso do Teto do Orçamento */}
            {shoppingSummary.capNum > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2E3B52]/60">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className={shoppingSummary.isOverBudget ? 'text-[#FF4D6D] flex items-center gap-1' : 'text-[#00FF88]'}>
                    {shoppingSummary.isOverBudget && <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D6D]" />}
                    No Carrinho: {formatBRL(shoppingSummary.totalSpent, isPrivacyMode)} / Teto {formatBRL(shoppingSummary.capNum, isPrivacyMode)}
                  </span>
                  <span className={shoppingSummary.isOverBudget ? 'text-[#FF4D6D]' : 'text-[#94A3B8]'}>
                    {shoppingSummary.budgetPct}% do teto limite
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      shoppingSummary.isOverBudget
                        ? 'bg-[#FF4D6D]'
                        : shoppingSummary.budgetPct > 80
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#00FF88]'
                    }`}
                    style={{ width: `${Math.min(shoppingSummary.budgetPct, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* BARRA DE BOTÃO DE ORGANIZAÇÃO POR CORREDOR */}
          <div className="flex items-center justify-between px-2 text-xs">
            <button
              onClick={() => setGroupByAisle(!groupByAisle)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#162032] text-[#06B6D4] border border-[#2E3B52] hover:border-[#06B6D4]/40 font-bold transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>{groupByAisle ? '🏬 Agrupado por Corredores' : '📋 Lista Simples'}</span>
            </button>

            <span className="text-[#94A3B8] font-medium">
              Dica: Toque em <strong className="text-[#00FF88]">Câmera Barcode</strong> para marcar itens direto com o celular!
            </span>
          </div>

          {/* LISTA DE COMPRAS (AGRUPADA OU SIMPLES) */}
          {neededItems.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-[#00FF88]" />
              <h4 className="text-base font-bold text-[#F8FAFC]">Seu estoque está 100% abastecido!</h4>
              <p className="text-xs text-[#94A3B8]">
                Nenhum item do seu estoque está abaixo da quantidade ideal no momento.
              </p>
            </Card>
          ) : groupByAisle ? (
            <div className="flex flex-col gap-6">
              {itemsByAisle.map(([category, catItems]) => (
                <div key={category} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-[#2E3B52]">
                    <span className="text-xs font-black uppercase tracking-wider text-[#06B6D4] px-2.5 py-0.5 rounded-md bg-[#06B6D4]/15 border border-[#06B6D4]/30">
                      Corredor: {category} ({catItems.length})
                    </span>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {catItems.map((item) => renderShoppingCard(item))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {neededItems.map((item) => renderShoppingCard(item))}
            </div>
          )}

          {/* BARRA FIXA FLUTUANTE DE RESUMO PARA CELULAR */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#0D1424]/95 backdrop-blur-xl border-t border-[#2E3B52] z-50 flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase">No Carrinho</span>
              <span className="text-xl font-black text-[#00FF88]">
                {formatBRL(shoppingSummary.totalSpent, isPrivacyMode)}
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenFinishModal}
              disabled={shoppingSummary.checkedCount === 0}
              className="px-4 py-3 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar ({shoppingSummary.checkedCount})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Pagamento e Finalização de Compras */}
      <FinishShoppingModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        totalSpent={shoppingSummary.totalSpent}
        checkedCount={shoppingSummary.checkedCount}
        wallets={wallets}
        onConfirmFinish={handleConfirmFinishShopping}
      />
    </div>
  );

  // RENDEREIZADOR DO CARD DO ITEM DO MERCADO
  function renderShoppingCard(item: PantryItem) {
    const defaultNeeded = Math.max(Math.round((item.idealQuantity - item.currentQuantity) * 100) / 100, 0.01);
    const qtyToBuy = getQtyToBuy(item);
    const isChecked = cartChecked[item.id] ?? false;
    const priceMode = cartPriceModes[item.id] || 'unit';
    const effectiveUnitPrice = getEffectiveUnitPrice(item);
    const itemSubtotal = getItemSubtotal(item);

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
              onChange={() => handleToggleCartItem(item.id)}
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

        {/* SELETOR DE MODO DE VALOR / DESCONTO SUPER INTUITIVO */}
        <div className="flex flex-col gap-2 p-3 bg-[#12141A] border border-[#2E3B52] rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#00FF88]" />
              Selecione como calcular o preço/desconto:
            </span>

            <div className="flex items-center gap-1 bg-[#0A0B0E] p-1 rounded-lg border border-[#2E3B52]">
              <button
                type="button"
                onClick={() => handleSetPriceMode(item.id, 'unit', defaultNeeded, item.lastPrice)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  priceMode === 'unit'
                    ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                🏷️ Preço Unitário
              </button>

              <button
                type="button"
                onClick={() => handleSetPriceMode(item.id, 'combo', defaultNeeded, item.lastPrice)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
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
                onClick={() => handleSetPriceMode(item.id, 'discount', defaultNeeded, item.lastPrice)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
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
                  onClick={() => handleCartQtyChange(item.id, item.unit === 'kg' || item.unit === 'L' ? -0.25 : -1)}
                  className="w-7 h-7 rounded-lg bg-[#162032] flex items-center justify-center text-[#F8FAFC] font-black text-sm active:scale-95"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center font-black text-sm text-[#00FF88]">
                  {formatQtyDisplay(qtyToBuy)} {item.unit}
                </span>
                <button
                  onClick={() => handleCartQtyChange(item.id, item.unit === 'kg' || item.unit === 'L' ? 0.25 : 1)}
                  className="w-7 h-7 rounded-lg bg-[#162032] flex items-center justify-center text-[#F8FAFC] font-black text-sm active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {priceMode === 'unit' && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Preço Unitário Prateleira (R$/{item.unit})</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={cartPrices[item.id] ?? item.lastPrice}
                    onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
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
                    value={cartComboTotals[item.id] ?? (qtyToBuy * item.lastPrice)}
                    onChange={(e) => handleComboTotalChange(item.id, parseFloat(e.target.value) || 0)}
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
                    value={cartPrices[item.id] ?? item.lastPrice}
                    onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F8FAFC] font-black focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#F59E0B] uppercase">Valor do Desconto Abatido (R$)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={cartDiscounts[item.id] ?? 0}
                    onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
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
  }
};
