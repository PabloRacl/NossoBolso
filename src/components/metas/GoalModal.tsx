import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';

export const GoalModal: React.FC = () => {
  const { isGoalModalOpen, setGoalModalOpen, editingGoalId, setEditingGoalId } = useAppStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (editingGoalId && isGoalModalOpen) {
      db.goals.get(editingGoalId).then((goal) => {
        if (goal) {
          setName(goal.name);
          setTargetAmount(goal.targetAmount.toString());
          setCurrentAmount(goal.currentAmount.toString());
          setDeadline(goal.deadline);
        }
      });
    } else if (isGoalModalOpen && !editingGoalId) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
    }
  }, [editingGoalId, isGoalModalOpen]);

  const handleClose = () => {
    setEditingGoalId(null);
    setGoalModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return;

    if (editingGoalId) {
      // Atualizar Meta Existente
      await db.goals.update(editingGoalId, {
        name,
        targetAmount: target,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline,
      });
    } else {
      // Criar Nova Meta
      await db.goals.add({
        id: Math.random().toString(36).substring(2, 9),
        name,
        targetAmount: target,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline,
        createdAt: new Date().toISOString(),
      });
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isGoalModalOpen}
      onClose={handleClose}
      title={editingGoalId ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome da Meta"
          placeholder="Ex: Reserva de Emergência, Viagem, Carro Novo..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor Alvo (R$)"
            type="number"
            step="0.01"
            placeholder="10000,00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />

          <Input
            label="Valor Atual Guardado (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
        </div>

        <Input
          label="Prazo Final"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1E2330]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {editingGoalId ? 'Salvar Alterações' : 'Criar Meta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
