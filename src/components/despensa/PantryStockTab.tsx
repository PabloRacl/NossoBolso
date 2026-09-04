import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PantryItem } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  Package,
  ClipboardCheck,
  Plus,
  Trash2,
  Edit2,
  Minus,
} from 'lucide-react';

interface PantryStockTabProps {
  items: PantryItem[];
  filteredItems: PantryItem[];
  searchFilter: string;
  onSearchChange: (val: string) => void;
  categoriesList: string[];
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  onStartWizard: () => void;
  onOpenNewItemModal: () => void;
  onEditItem: (item: PantryItem) => void;
  onDeleteItem: (id: string) => void;
  onQuickQtyChange: (item: PantryItem, delta: number) => void;
}

export const PantryStockTab: React.FC<PantryStockTabProps> = ({
  items,
  filteredItems,
  searchFilter,
  onSearchChange,
  categoriesList,
  selectedCategory,
  onCategorySelect,
  onStartWizard,
  onOpenNewItemModal,
  onEditItem,
  onDeleteItem,
  onQuickQtyChange,
}) => {
  const { isPrivacyMode } = useAppStore();

  const formatQtyDisplay = (val: number) => {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2).replace('.', ',');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-[#0A0B0E]/80 border border-[#1E2330] rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar no estoque (ex: Leite, Arroz...)"
            className="w-full sm:w-auto px-4 py-2.5 text-xs bg-[#12141A] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none min-w-[200px]"
          />

          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => onCategorySelect('all')}
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
                onClick={() => onCategorySelect(cat)}
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

        <Button
          variant="outline"
          size="sm"
          onClick={onStartWizard}
          className="border-[#06B6D4]/40 text-[#06B6D4] w-full sm:w-auto justify-center"
        >
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
          <Button variant="primary" onClick={onOpenNewItemModal}>
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
              <Card
                key={item.id}
                className="flex flex-col justify-between gap-3 p-4 hover:border-[#00FF88]/40 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">{item.category}</span>
                    <h4 className="text-sm font-black text-[#F8FAFC] mt-0.5 group-hover:text-[#00FF88] transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#162032] rounded-lg transition-all"
                      title="Editar item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
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
                      {formatQtyDisplay(item.currentQuantity)} /{' '}
                      <span className="text-[#00FF88]">
                        {formatQtyDisplay(item.idealQuantity)} {item.unit}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickQtyChange(item, item.unit === 'kg' || item.unit === 'L' ? -0.5 : -1)}
                      className="w-9 h-9 rounded-xl bg-[#162032] border border-[#2E3B52] flex items-center justify-center text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/15 hover:border-[#FF4D6D]/40 font-black text-base active:scale-95 transition-all touch-manipulation"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onQuickQtyChange(item, item.unit === 'kg' || item.unit === 'L' ? 0.5 : 1)}
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
  );
};
