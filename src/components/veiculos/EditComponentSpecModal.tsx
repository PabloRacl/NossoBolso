import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ComponentCategory, ComponentSpec } from '../../types';
import { db } from '../../services/db';

interface EditComponentSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  category: ComponentCategory;
  defaultName: string;
  defaultKmInterval: number;
  defaultPart: string;
  currentLastKm: number;
  existingSpec?: ComponentSpec | null;
}

export const EditComponentSpecModal: React.FC<EditComponentSpecModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  category,
  defaultName,
  defaultKmInterval,
  defaultPart,
  currentLastKm,
  existingSpec,
}) => {
  const [name, setName] = useState(defaultName);
  const [kmInterval, setKmInterval] = useState(defaultKmInterval.toString());
  const [recommendedPart, setRecommendedPart] = useState(defaultPart);
  const [lastKmOverride, setLastKmOverride] = useState(currentLastKm.toString());

  useEffect(() => {
    if (isOpen) {
      if (existingSpec) {
        setName(existingSpec.name);
        setKmInterval(existingSpec.kmInterval.toString());
        setRecommendedPart(existingSpec.recommendedPart);
        setLastKmOverride((existingSpec.lastKmOverride || currentLastKm).toString());
      } else {
        setName(defaultName);
        setKmInterval(defaultKmInterval.toString());
        setRecommendedPart(defaultPart);
        setLastKmOverride(currentLastKm.toString());
      }
    }
  }, [isOpen, existingSpec, defaultName, defaultKmInterval, defaultPart, currentLastKm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const interval = parseFloat(kmInterval) || defaultKmInterval;
    const lastKm = parseFloat(lastKmOverride) || currentLastKm;
    const specId = existingSpec?.id || `spec_${vehicleId}_${category}`;

    await db.componentSpecs.put({
      id: specId,
      vehicleId,
      category,
      name: name.trim() || defaultName,
      kmInterval: interval,
      recommendedPart: recommendedPart.trim() || defaultPart,
      lastKmOverride: lastKm,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Parâmetros de Manutenção: ${defaultName}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-[#090D18] border border-[#00FF88]/30 rounded-xl text-xs text-[#94A3B8]">
          Personalize o intervalo de revisão, o nome da peça e o histórico para o veículo <strong className="text-[#00FF88]">{vehicleName}</strong>.
        </div>

        {/* Nome do Componente */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Nome do Componente / Serviço</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Óleo do Motor 5W30 Sintético..."
            className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:border-[#00FF88] focus:outline-none"
          />
        </div>

        {/* Intervalo em KM & KM da Última Troca */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#00FF88] uppercase">Intervalo de Troca (KM)</label>
            <input
              type="number"
              required
              min="100"
              value={kmInterval}
              onChange={(e) => setKmInterval(e.target.value)}
              placeholder="Ex: 10000"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#06B6D4] uppercase">KM da Última Troca Realizada</label>
            <input
              type="number"
              min="0"
              value={lastKmOverride}
              onChange={(e) => setLastKmOverride(e.target.value)}
              placeholder="Ex: 35400"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#06B6D4] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Código da Peça Recomendada */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Código / Especificação da Peça Recomendada</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const q = encodeURIComponent(`peca ${vehicleName} ${recommendedPart || name}`);
                  window.open(`https://www.google.com/search?q=${q}`, '_blank');
                }}
                className="text-[10px] font-bold text-[#06B6D4] hover:underline cursor-pointer"
              >
                🔍 Google
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = encodeURIComponent(`peca ${vehicleName} ${recommendedPart || name}`);
                  window.open(`https://lista.mercadolivre.com.br/${q}`, '_blank');
                }}
                className="text-[10px] font-bold text-[#F59E0B] hover:underline cursor-pointer"
              >
                🛒 Mercado Livre
              </button>
            </div>
          </div>
          <textarea
            rows={2}
            value={recommendedPart}
            onChange={(e) => setRecommendedPart(e.target.value)}
            placeholder="Ex: ACDelco 5W30 Dexos1 Gen2 (3.5L) + Filtro 88905845..."
            className="w-full p-2.5 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F59E0B] font-bold focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Salvar Parâmetros
          </Button>
        </div>
      </form>
    </Modal>
  );
};
