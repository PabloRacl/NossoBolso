import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { db } from '../../servicos/db';
import { Vehicle } from '../../tipos';

interface EditMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  metricType: 'kml' | 'fuel' | 'maintenance' | 'cost_km';
  autoCalculatedValue: number;
}

export const EditMetricModal: React.FC<EditMetricModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  metricType,
  autoCalculatedValue,
}) => {
  const [val, setVal] = useState('');

  const titles: Record<string, { label: string; unit: string; description: string }> = {
    kml: {
      label: 'Média de Consumo de Combustível',
      unit: 'KM / Litro',
      description: 'Informe a média real de consumo do seu veículo (ex: 13,5 KM/L).',
    },
    fuel: {
      label: 'Total de Gastos em Combustível',
      unit: 'R$',
      description: 'Informe o valor total acumulado gasto em postos de combustível.',
    },
    maintenance: {
      label: 'Total de Manutenções & Peças',
      unit: 'R$',
      description: 'Informe o valor total acumulado investido em revisões e peças.',
    },
    cost_km: {
      label: 'Custo por Quilômetro Rodado',
      unit: 'R$ / KM',
      description: 'Informe o custo estimado por KM rodado com seu veículo (ex: R$ 0,45).',
    },
  };

  const currentConfig = titles[metricType] || titles.kml;

  useEffect(() => {
    if (isOpen && vehicle) {
      let initialVal: number | undefined;
      if (metricType === 'kml') initialVal = vehicle.customAvgKml;
      else if (metricType === 'fuel') initialVal = vehicle.customTotalFuel;
      else if (metricType === 'maintenance') initialVal = vehicle.customTotalMaintenance;
      else if (metricType === 'cost_km') initialVal = vehicle.customCostPerKm;

      if (initialVal !== undefined && initialVal !== null) {
        setVal(initialVal.toString());
      } else {
        setVal(autoCalculatedValue > 0 ? autoCalculatedValue.toFixed(2) : '');
      }
    }
  }, [isOpen, vehicle, metricType, autoCalculatedValue]);

  if (!vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);

    const updateObj: Partial<Vehicle> = {};
    if (metricType === 'kml') updateObj.customAvgKml = isNaN(num) ? undefined : num;
    else if (metricType === 'fuel') updateObj.customTotalFuel = isNaN(num) ? undefined : num;
    else if (metricType === 'maintenance') updateObj.customTotalMaintenance = isNaN(num) ? undefined : num;
    else if (metricType === 'cost_km') updateObj.customCostPerKm = isNaN(num) ? undefined : num;

    await db.vehicles.update(vehicle.id, updateObj);
    onClose();
  };

  const handleResetToAuto = async () => {
    const updateObj: Partial<Vehicle> = {};
    if (metricType === 'kml') updateObj.customAvgKml = undefined;
    else if (metricType === 'fuel') updateObj.customTotalFuel = undefined;
    else if (metricType === 'maintenance') updateObj.customTotalMaintenance = undefined;
    else if (metricType === 'cost_km') updateObj.customCostPerKm = undefined;

    await db.vehicles.update(vehicle.id, updateObj);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar ${currentConfig.label}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-[#090D18] border border-[#00FF88]/30 rounded-xl text-xs text-[#94A3B8]">
          {currentConfig.description}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#00FF88] uppercase">
            Valor Personalizado ({currentConfig.unit})
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={`Ex: ${autoCalculatedValue > 0 ? autoCalculatedValue.toFixed(1) : '13.5'}`}
              className="w-full h-12 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-base text-[#00FF88] font-black focus:border-[#00FF88] focus:outline-none"
            />
            <span className="absolute right-4 text-xs font-bold text-[#94A3B8]">
              {currentConfig.unit}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#94A3B8] flex items-center justify-between p-2.5 bg-[#0A0B0E] rounded-lg border border-[#1E2330]">
          <span>Cálculo Automático do Sistema:</span>
          <strong className="text-[#F8FAFC]">
            {autoCalculatedValue > 0 ? `${autoCalculatedValue.toFixed(2)} ${currentConfig.unit}` : 'Sem dados'}
          </strong>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#1E2330]">
          <button
            type="button"
            onClick={handleResetToAuto}
            className="text-xs font-bold text-[#F59E0B] hover:underline"
          >
            Restaurar Cálculo Automático
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Salvar Métrica
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
