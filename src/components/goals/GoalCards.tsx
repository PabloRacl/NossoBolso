import React, { useState } from 'react';
import { Goal } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Target, Trash2 } from 'lucide-react';
import { db } from '../../services/db';

interface GoalCardsProps {
  goals: Goal[];
}

export const GoalCards: React.FC<GoalCardsProps> = ({ goals }) => {
  const { setGoalModalOpen } = useAppStore();

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const val = parseFloat(contribAmount);
    if (isNaN(val) || val <= 0) return;

    await db.goals.update(selectedGoal.id, {
      currentAmount: selectedGoal.currentAmount + val,
    });

    setSelectedGoal(null);
    setContribAmount('');
  };

  const handleDelete = async (id: string) => {
    await db.goals.delete(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#F8FAFC] font-extrabold text-lg">Metas & Objetivos</h3>
        <Button variant="primary" onClick={() => setGoalModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Target className="w-12 h-12 text-[#06B6D4] mb-3" />
          <h4 className="text-base font-bold text-[#F8FAFC]">Nenhuma meta cadastrada ainda</h4>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm">
            Crie metas financeiras como Reserva de Emergência ou Carro Novo para acompanhar o seu progresso!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            return (
              <Card key={g.id} className="flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#06B6D4]/10 text-[#06B6D4] rounded-xl">
                        <Target className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#F8FAFC]">{g.name}</h4>
                    </div>

                    <button
                      onClick={() => handleDelete(g.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-red-400 transition-all"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xl font-extrabold text-[#00FF88]">{formatBRL(g.currentAmount)}</span>
                    <span className="text-xs text-[#94A3B8]">de {formatBRL(g.targetAmount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#1E2330] rounded-full h-2.5 overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-[#00FF88] to-[#06B6D4] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-[#94A3B8] font-medium">
                    <span>{formatPercent(pct)} concluído</span>
                    <span>Prazo: {formatDate(g.deadline)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGoal(g)}
                  className="mt-4 w-full"
                >
                  + Adicionar Contribuição
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contribute Modal */}
      {selectedGoal && (
        <Modal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          title={`Contribuir para "${selectedGoal.name}"`}
        >
          <form onSubmit={handleAddContribution} className="flex flex-col gap-4">
            <Input
              label="Valor da Contribuição (R$)"
              type="number"
              step="0.01"
              placeholder="100,00"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1E2330]">
              <Button type="button" variant="ghost" onClick={() => setSelectedGoal(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Contribuir
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
