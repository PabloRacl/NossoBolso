import React from 'react';
import { Gauge, Fuel, Wrench, Activity } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';
import { Vehicle } from '../../tipos';

interface VehicleTelemetryCardsProps {
  currentVehicle: Vehicle | undefined;
  refuelEfficiencyData: {
    overallKml: number;
    avgCostPerKm: number;
  };
  metrics: {
    totalFuel: number;
    totalMaintenance: number;
  };
  isPrivacyMode: boolean;
  onEditMetric: (type: 'kml' | 'fuel' | 'maintenance' | 'cost_km') => void;
}

export const VehicleTelemetryCards: React.FC<VehicleTelemetryCardsProps> = ({
  currentVehicle,
  refuelEfficiencyData,
  metrics,
  isPrivacyMode,
  onEditMetric,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Média de Consumo KM/L */}
      <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#00FF88] relative group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Média de Consumo</span>
            {currentVehicle?.customAvgKml !== undefined && (
              <span className="text-[9px] font-black text-[#00FF88] bg-[#00FF88]/15 border border-[#00FF88]/30 px-1.5 py-0.2 rounded">
                MANUAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditMetric('kml')}
              className="text-[#00FF88] hover:text-[#06B6D4] p-1 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 border border-[#00FF88]/30 rounded-lg transition-colors cursor-pointer"
              title="Editar Média de Consumo KM/L"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <Gauge className="w-5 h-5 text-[#00FF88]" />
          </div>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-3xl font-black text-[#00FF88]">
            {currentVehicle?.customAvgKml !== undefined
              ? currentVehicle.customAvgKml.toFixed(1)
              : refuelEfficiencyData.overallKml > 0
              ? refuelEfficiencyData.overallKml.toFixed(1)
              : '0,0'}
          </span>
          <span className="text-xs font-bold text-[#F8FAFC]">KM / Litro</span>
        </div>
        <span className="text-[11px] text-[#94A3B8]">
          {currentVehicle?.customAvgKml !== undefined ? 'Média manual informada' : 'Média histórica entre abastecimentos'}
        </span>
      </div>

      {/* Total em Combustível */}
      <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#F59E0B] relative group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Total em Combustível</span>
            {currentVehicle?.customTotalFuel !== undefined && (
              <span className="text-[9px] font-black text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/30 px-1.5 py-0.2 rounded">
                MANUAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditMetric('fuel')}
              className="text-[#F59E0B] hover:text-[#00FF88] p-1 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded-lg transition-colors cursor-pointer"
              title="Editar Total em Combustível"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <Fuel className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>
        <span className="text-3xl font-black text-[#F59E0B] my-2">
          {currentVehicle?.customTotalFuel !== undefined
            ? formatBRL(currentVehicle.customTotalFuel, isPrivacyMode)
            : formatBRL(metrics.totalFuel, isPrivacyMode)}
        </span>
        <span className="text-[11px] text-[#94A3B8]">Acumulado em postos de combustível</span>
      </div>

      {/* Manutenções & Peças */}
      <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#06B6D4] relative group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Manutenções & Peças</span>
            {currentVehicle?.customTotalMaintenance !== undefined && (
              <span className="text-[9px] font-black text-[#06B6D4] bg-[#06B6D4]/15 border border-[#06B6D4]/30 px-1.5 py-0.2 rounded">
                MANUAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditMetric('maintenance')}
              className="text-[#06B6D4] hover:text-[#00FF88] p-1 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 rounded-lg transition-colors cursor-pointer"
              title="Editar Total em Manutenções & Peças"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <Wrench className="w-5 h-5 text-[#06B6D4]" />
          </div>
        </div>
        <span className="text-3xl font-black text-[#06B6D4] my-2">
          {currentVehicle?.customTotalMaintenance !== undefined
            ? formatBRL(currentVehicle.customTotalMaintenance, isPrivacyMode)
            : formatBRL(metrics.totalMaintenance, isPrivacyMode)}
        </span>
        <span className="text-[11px] text-[#94A3B8]">Revisões de fábrica e trocas de componentes</span>
      </div>

      {/* Custo por Quilômetro Rodado (R$/KM) */}
      <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#A855F7] relative group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Custo Por KM (R$/KM)</span>
            {currentVehicle?.customCostPerKm !== undefined && (
              <span className="text-[9px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1.5 py-0.2 rounded">
                MANUAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditMetric('cost_km')}
              className="text-[#A855F7] hover:text-[#00FF88] p-1 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 rounded-lg transition-colors cursor-pointer"
              title="Editar Custo Por KM"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <Activity className="w-5 h-5 text-[#A855F7]" />
          </div>
        </div>
        <span className="text-3xl font-black text-[#A855F7] my-2">
          {currentVehicle?.customCostPerKm !== undefined
            ? `R$ ${currentVehicle.customCostPerKm.toFixed(2)}`
            : refuelEfficiencyData.avgCostPerKm > 0
            ? `R$ ${refuelEfficiencyData.avgCostPerKm.toFixed(2)}`
            : 'R$ 0,00'}
        </span>
        <span className="text-[11px] text-[#94A3B8]">Custo total médio por KM rodado</span>
      </div>
    </div>
  );
};
