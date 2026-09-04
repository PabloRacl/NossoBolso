import React from 'react';
import { Button } from '../ui/Button';
import { PantryTab } from './pantryTypes';
import {
  Package,
  ClipboardCheck,
  ShoppingCart,
  Plus,
  Sparkles,
  Share2,
  Printer,
  Camera,
} from 'lucide-react';

interface PantryHeaderProps {
  activeTab: PantryTab;
  onTabChange: (tab: PantryTab) => void;
  totalStockItems: number;
  totalNeededItems: number;
  onStartWizard: () => void;
  onOpenUnitCalcModal: () => void;
  onOpenScanner: () => void;
  onShareWhatsApp: () => void;
  onPrintPDF: () => void;
  onOpenNewItemModal: () => void;
}

export const PantryHeader: React.FC<PantryHeaderProps> = ({
  activeTab,
  onTabChange,
  totalStockItems,
  totalNeededItems,
  onStartWizard,
  onOpenUnitCalcModal,
  onOpenScanner,
  onShareWhatsApp,
  onPrintPDF,
  onOpenNewItemModal,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl shadow-lg">
      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
        <button
          onClick={() => onTabChange('stock')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Estoque ({totalStockItems})</span>
        </button>

        <button
          onClick={onStartWizard}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'wizard'
              ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 shadow-md shadow-[#06B6D4]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-[#06B6D4]" />
          <span>Checklist Pré-Feira</span>
        </button>

        <button
          onClick={() => onTabChange('shopping')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'shopping'
              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-md shadow-[#F59E0B]/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-[#F59E0B]" />
          <span>Feira Ao Vivo ({totalNeededItems})</span>
        </button>
      </div>

      {/* Ferramentas de Exportação e Adição */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onOpenUnitCalcModal}
          className="p-2.5 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 hover:bg-[#00FF88]/25 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title="Otimizador de Preço por KG/Litro na Prateleira"
        >
          <Sparkles className="w-4 h-4 text-[#00FF88]" />
          <span className="hidden sm:inline">Otimizador R$/KG</span>
        </button>

        {activeTab === 'shopping' && (
          <>
            <button
              onClick={onOpenScanner}
              className="p-2.5 rounded-xl bg-[#162032] text-[#00FF88] border border-[#2E3B52] hover:bg-[#00FF88]/15 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Escanear Código de Barras / Câmera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Câmera Barcode</span>
            </button>

            <button
              onClick={onShareWhatsApp}
              className="p-2.5 rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onPrintPDF}
              className="p-2.5 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] hover:text-[#F8FAFC] transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
            onClick={onOpenNewItemModal}
            className="w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </Button>
        )}
      </div>
    </div>
  );
};
