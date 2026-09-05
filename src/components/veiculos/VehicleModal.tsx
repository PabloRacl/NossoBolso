import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Vehicle } from '../../tipos';
import { db } from '../../servicos/db';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: (createdId?: string) => void;
  editingVehicle?: Vehicle | null;
}

type VehicleFuelType = 'flex' | 'gasoline' | 'ethanol' | 'diesel' | 'electric';
const isVehicleFuelType = (val: string): val is VehicleFuelType =>
  ['flex', 'gasoline', 'ethanol', 'diesel', 'electric'].includes(val);

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  editingVehicle,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚗');
  const [plate, setPlate] = useState('');
  const [yearModel, setYearModel] = useState('');
  const [odometerKm, setOdometerKm] = useState('0');
  const [engineSpecs, setEngineSpecs] = useState('');
  const [recommendedOil, setRecommendedOil] = useState('');
  const [tireSpecs, setTireSpecs] = useState('');
  const [fuelType, setFuelType] = useState<VehicleFuelType>('flex');

  useEffect(() => {
    if (editingVehicle && isOpen) {
      setName(editingVehicle.name);
      setIcon(editingVehicle.icon || '🚗');
      setPlate(editingVehicle.plate || '');
      setYearModel(editingVehicle.yearModel || '');
      setOdometerKm(editingVehicle.odometerKm.toString());
      setEngineSpecs(editingVehicle.engineSpecs || '');
      setRecommendedOil(editingVehicle.recommendedOil || '');
      setTireSpecs(editingVehicle.tireSpecs || '');
      setFuelType(editingVehicle.fuelType || 'flex');
    } else if (isOpen && !editingVehicle) {
      setName('');
      setIcon('🚗');
      setPlate('');
      setYearModel('');
      setOdometerKm('0');
      setEngineSpecs('');
      setRecommendedOil('');
      setTireSpecs('');
      setFuelType('flex');
    }
  }, [editingVehicle, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(odometerKm) || 0;

    if (!name.trim()) return;

    let targetId = editingVehicle?.id;

    if (editingVehicle) {
      // Atualizar Veículo Existente
      await db.vehicles.update(editingVehicle.id, {
        name: name.trim(),
        icon,
        plate: plate.trim() || undefined,
        yearModel: yearModel.trim() || undefined,
        odometerKm: km,
        engineSpecs: engineSpecs.trim() || undefined,
        recommendedOil: recommendedOil.trim() || undefined,
        tireSpecs: tireSpecs.trim() || undefined,
        fuelType,
      });
    } else {
      // Cadastrar Novo Veículo na Garagem
      targetId = `veh_${Date.now()}`;
      await db.vehicles.add({
        id: targetId,
        name: name.trim(),
        icon,
        plate: plate.trim() || undefined,
        yearModel: yearModel.trim() || undefined,
        odometerKm: km,
        engineSpecs: engineSpecs.trim() || undefined,
        recommendedOil: recommendedOil.trim() || undefined,
        tireSpecs: tireSpecs.trim() || undefined,
        fuelType,
        isMain: false,
        createdAt: new Date().toISOString(),
      });
    }

    onClose(targetId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingVehicle ? `Editar Ficha do Veículo` : 'Cadastrar Novo Veículo na Garagem'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {/* Seletor de Ícone do Veículo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Ícone / Categoria do Veículo</label>
          <div className="flex items-center gap-2">
            {[
              { id: '🚗', label: 'Carro' },
              { id: '🛻', label: 'Picape/SUV' },
              { id: '🏍️', label: 'Moto' },
              { id: '🛵', label: 'Scooter' },
              { id: '🚛', label: 'Van/Caminhão' },
              { id: '🏎️', label: 'Esportivo' },
            ].map((ic) => (
              <button
                key={ic.id}
                type="button"
                onClick={() => setIcon(ic.id)}
                className={`flex-1 h-11 text-xl rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  icon === ic.id
                    ? 'bg-[#00FF88]/20 border-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.3)] scale-105'
                    : 'bg-[#0A0B0E] border-[#2E3B52] hover:border-[#94A3B8]'
                }`}
                title={ic.label}
              >
                {ic.id}
              </button>
            ))}
          </div>
        </div>

        {/* Nome do Veículo & Placa */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Nome do Veículo / Modelo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chevrolet Onix 1.0 LT (2017/2018)..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Placa / Ano Modelo</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="Ex: ABC-1234 / 2017/2018..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Odômetro Atual (KM) & Motorização */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#090D18] border border-[#00FF88]/30 rounded-xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-[#00FF88] uppercase">Odômetro Atual (KM)</label>
            <input
              type="number"
              required
              min="0"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              placeholder="Ex: 45400"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#00FF88] font-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Motorização & Câmbio</label>
            <input
              type="text"
              value={engineSpecs}
              onChange={(e) => setEngineSpecs(e.target.value)}
              placeholder="Ex: 1.0 SPE/4 Eco (80 cv) • Câmbio 6M..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Óleo Recomendado & Medida dos Pneus */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Óleo Recomendado de Fábrica</label>
            <input
              type="text"
              value={recommendedOil}
              onChange={(e) => setRecommendedOil(e.target.value)}
              placeholder="Ex: 5W30 Dexos1 Gen2 (3.5L)..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F59E0B] font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Medida dos Pneus & Pressão</label>
            <input
              type="text"
              value={tireSpecs}
              onChange={(e) => setTireSpecs(e.target.value)}
              placeholder="Ex: 185/65 R15 (35 PSI)..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#06B6D4] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Tipo de Combustível */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">Combustível Principal</label>
          <select
            value={fuelType}
            onChange={(e) => {
              if (isVehicleFuelType(e.target.value)) {
                setFuelType(e.target.value);
              }
            }}
            className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none cursor-pointer"
          >
            <option value="flex">🌽/⛽ Flex (Etanol e Gasolina)</option>
            <option value="gasoline">⛽ Apenas Gasolina</option>
            <option value="ethanol">🌽 Apenas Etanol</option>
            <option value="diesel">🚛 Diesel</option>
            <option value="electric">⚡ Elétrico / Híbrido</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={() => onClose()} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {editingVehicle ? 'Salvar Ficha do Veículo' : 'Cadastrar na Garagem'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
