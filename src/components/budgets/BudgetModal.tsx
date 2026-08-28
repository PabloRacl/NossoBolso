import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Target, Save } from 'lucide-react';

export const BudgetModal: React.FC = () => {
  const { isBudgetModalOpen, setBudgetModalOpen } = useAppStore();
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []) || [];
  const existingBudgets = useLiveQuery(() => db.budgets.toArray(), []) || [];

  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingBudgets.length > 0) {
      const initial: Record<string, string> = {};
      existingBudgets.forEach((b) => {
        initial[b.category] = String(b.monthlyLimit);
      });
      setBudgetValues(initial);
    }
  }, [existingBudgets]);

  const handleValueChange = (categoryName: string, value: string) => {
    setBudgetValues((prev) => ({
      ...prev,
      [categoryName]: value,
    }));
  };

  const handleSave = async () => {
    // Apaga orçamentos antigos e salva os novos informados
    await db.budgets.clear();
    const newBudgets = Object.entries(budgetValues)
      .filter(([_, val]) => parseFloat(val) > 0)
      .map(([catName, val]) => ({
        id: `budget_${catName}`,
        category: catName,
        monthlyLimit: parseFloat(val),
      }));

    if (newBudgets.length > 0) {
      await db.budgets.bulkAdd(newBudgets);
    }
    setBudgetModalOpen(false);
  };

  return (
    <Modal
      isOpen={isBudgetModalOpen}
      onClose={() => setBudgetModalOpen(false)}
      title="Gestão de Tetos de Gastos por Categoria"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00FF88]/15 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Orçamento Mensal (Budgeting)</h4>
            <p className="text-[11px] text-[#94A3B8]">
              Defina o valor máximo que você pretende gastar por mês em cada categoria de despesa.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const val = budgetValues[cat.name] || '';
            return (
              <div key={cat.id} className="p-3 bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-xs font-bold text-[#F8FAFC]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8] font-bold">R$</span>
                  <input
                    type="number"
                    step="50"
                    placeholder="Sem limite"
                    value={val}
                    onChange={(e) => handleValueChange(cat.name, e.target.value)}
                    className="w-32 h-9 px-3 text-xs bg-[#12141A] border border-[#2E3B52] rounded-lg text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-semibold text-right"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#1E2330]">
          <Button variant="outline" onClick={() => setBudgetModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4" />
            <span>Salvar Orçamentos</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
