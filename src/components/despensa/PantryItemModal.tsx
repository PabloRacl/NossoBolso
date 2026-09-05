import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PantryItem } from '../../tipos';
import { db } from '../../servicos/db';

interface PantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: PantryItem | null;
}

export const PantryItemModal: React.FC<PantryItemModalProps> = ({ isOpen, onClose, editingItem }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Alimentos');
  const [unit, setUnit] = useState('un');
  const [idealQuantity, setIdealQuantity] = useState('5');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [lastPrice, setLastPrice] = useState('5.00');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setUnit(editingItem.unit);
      setIdealQuantity(String(editingItem.idealQuantity));
      setCurrentQuantity(String(editingItem.currentQuantity));
      setLastPrice(String(editingItem.lastPrice));
    } else {
      setName('');
      setCategory('Alimentos');
      setUnit('un');
      setIdealQuantity('5');
      setCurrentQuantity('0');
      setLastPrice('5.00');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ideal = Math.max(parseFloat(idealQuantity) || 1, 1);
    const current = Math.max(parseFloat(currentQuantity) || 0, 0);
    const price = Math.max(parseFloat(lastPrice) || 0, 0);

    if (editingItem) {
      await db.pantryItems.update(editingItem.id, {
        name,
        category,
        unit,
        idealQuantity: ideal,
        currentQuantity: current,
        lastPrice: price,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.pantryItems.add({
        id: `pi_${Date.now()}`,
        name,
        category,
        unit,
        idealQuantity: ideal,
        currentQuantity: current,
        lastPrice: price,
        createdAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  const categories = ['Alimentos', 'Laticínios', 'Limpeza', 'Higiene', 'Bebidas', 'Hortifrúti', 'Carnes & Peixes', 'Outros'];
  const units = ['un', 'kg', 'L', 'cx', 'pct', 'g', 'ml'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Item do Estoque' : 'Novo Item para Estoque Doméstico'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Nome do Item</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Leite Integral 1L, Feijão Carioca..."
            className="w-full h-11 px-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-bold cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Unidade de Medida</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-bold cursor-pointer"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Estoque Alvo (Ideal)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={idealQuantity}
              onChange={(e) => setIdealQuantity(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#00FF88] font-black focus:outline-none"
              placeholder="Ex: 1,50 ou 12"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Estoque Atual em Casa</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F8FAFC] font-black focus:outline-none"
              placeholder="Ex: 0,50 ou 2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Último Preço (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={lastPrice}
              onChange={(e) => setLastPrice(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#F59E0B] font-black focus:outline-none"
              placeholder="Ex: 5,50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {editingItem ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
