import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TransactionType, Category } from '../../types';
import { Plus, Trash2, Tag, Smile, Edit2, Check } from 'lucide-react';

const EMOJI_PRESETS = [
  // Finanças & Trabalho
  '💼', '💻', '📊', '🛒', '💡', '💰', '🏦', '🚀', '💎', '📈', '📉', '💳', '🏷️', '💵',
  // Alimentação & Casa
  '🍔', '🍕', '🛒', '☕', '🍺', '🏠', '🔑', '⚡', '💧', '🛋️', '🧹', '📦', '🍎', '🥩',
  // Transporte & Viagens
  '🚗', '🚌', '✈️', '⛽', '🛵', '🚲', '🎫', '🗺️', '🧳', '🚇', '⛵',
  // Saúde, Lazer & Estilo
  '🏥', '💊', '🏋️', '🎮', '🎬', '📚', '🎓', '⚽', '🐾', '💈', '🛠️', '🎁', '👶', '🛡️', '❤️'
];

export const CategoryModal: React.FC = () => {
  const { isCategoryModalOpen, setCategoryModalOpen } = useAppStore();
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [type, setType] = useState<TransactionType>('expense');
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const handleClose = () => {
    setName('');
    setEmoji('🏷️');
    setType('expense');
    setEditingCatId(null);
    setCategoryModalOpen(false);
  };

  const handleSelectEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setEmoji(cat.emoji || '🏷️');
    setType(cat.type);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCatId) {
      await db.categories.update(editingCatId, {
        name: name.trim(),
        emoji: emoji || '🏷️',
        type,
      });
      setEditingCatId(null);
    } else {
      await db.categories.add({
        id: 'cat_' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        emoji: emoji || '🏷️',
        type,
      });
    }

    setName('');
    setEmoji('🏷️');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      await db.categories.delete(id);
      if (editingCatId === id) {
        setEditingCatId(null);
        setName('');
      }
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <Modal
      isOpen={isCategoryModalOpen}
      onClose={handleClose}
      title="Gerenciar Categorias"
    >
      <div className="flex flex-col gap-6">
        {/* Nova / Editar Categoria Form */}
        <form onSubmit={handleSaveCategory} className="p-4 bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              {editingCatId ? <Edit2 className="w-4 h-4 text-[#00FF88]" /> : <Plus className="w-4 h-4 text-[#00FF88]" />}
              {editingCatId ? 'Editar Categoria' : 'Criar Nova Categoria'}
            </h4>
            {editingCatId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCatId(null);
                  setName('');
                  setEmoji('🏷️');
                }}
                className="text-xs text-[#94A3B8] hover:text-[#FF4D6D] underline"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 bg-[#12141A] p-1 rounded-xl border border-[#1E2330]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                type === 'expense'
                  ? 'bg-[#EF4444] text-[#F8FAFC] shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              📉 Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                type === 'income'
                  ? 'bg-[#10B981] text-[#0A0B0E] shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              📈 Receita
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Selected Emoji Preview */}
            <div className="flex flex-col items-center">
              <label className="text-xs text-[#94A3B8] mb-1 font-medium">Emoji</label>
              <div className="w-11 h-11 bg-[#12141A] border border-[#1E2330] rounded-xl flex items-center justify-center text-2xl shadow-inner">
                {emoji}
              </div>
            </div>

            <div className="flex-1">
              <Input
                label="Nome da Categoria"
                placeholder="Ex: Assinaturas, Mercado, Pet..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Emoji Palette Selection */}
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1 mb-2">
              <Smile className="w-3.5 h-3.5 text-[#00FF88]" />
              Escolha um Emoji:
            </span>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#12141A] border border-[#1E2330] rounded-xl">
              {EMOJI_PRESETS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEmoji(item)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[#1E2330] transition-transform active:scale-95 ${
                    emoji === item ? 'bg-[#00FF88]/20 border border-[#00FF88] scale-110' : ''
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-1">
            {editingCatId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingCatId ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
          </Button>
        </form>

        {/* Existing Categories List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#06B6D4]" />
              Categorias Existentes ({categories.length})
            </h4>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-[#0A0B0E] p-1 rounded-lg border border-[#1E2330]">
              <button
                type="button"
                onClick={() => setActiveTab('expense')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'expense' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'text-[#94A3B8]'
                }`}
              >
                Despesas ({categories.filter((c) => c.type === 'expense').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('income')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'income' ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-[#94A3B8]'
                }`}
              >
                Receitas ({categories.filter((c) => c.type === 'income').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-[#64748B] col-span-2 text-center py-4">
                Nenhuma categoria cadastrada para {activeTab === 'expense' ? 'Despesas' : 'Receitas'}.
              </p>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-2.5 bg-[#0A0B0E] border rounded-xl transition-colors ${
                    editingCatId === cat.id ? 'border-[#00FF88] bg-[#00FF88]/10' : 'border-[#1E2330] hover:border-[#64748B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleSelectEdit(cat)}>
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-xs font-semibold text-[#F8FAFC]">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectEdit(cat)}
                      className="p-1 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#1E2330] rounded-lg transition-colors"
                      title="Editar Categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 text-[#64748B] hover:text-red-400 hover:bg-[#1E2330] rounded-lg transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
