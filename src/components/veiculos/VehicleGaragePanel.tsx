import React from 'react';
import { Button } from '../ui/Button';
import { Car, Trash2, Plus, Wrench } from 'lucide-react';
import { Vehicle } from '../../tipos';

interface VehicleGaragePanelProps {
  vehiclesList: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onNewRecord: () => void;
  onNewVehicle: () => void;
  onEditVehicle: (veh: Vehicle) => void;
  onDeleteVehicle: (id: string, name: string) => void;
  onClearAllVehicles: () => void;
}

export const VehicleGaragePanel: React.FC<VehicleGaragePanelProps> = ({
  vehiclesList,
  selectedVehicleId,
  onSelectVehicle,
  onNewRecord,
  onNewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onClearAllVehicles,
}) => {
  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col gap-4 border border-[#00FF88]/40 shadow-[0_0_30px_rgba(0,255,136,0.12)]">
      <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <Car className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
              GARAGEM & FROTA DE VEÍCULOS
              <span className="text-[10px] bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 px-2 py-0.5 rounded-full font-extrabold">
                {vehiclesList.length} Veículo{vehiclesList.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">
              Selecione o veículo ativo para visualizar telemetria, custos e saúde dos componentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {vehiclesList.length > 0 && (
            <button
              onClick={onClearAllVehicles}
              className="px-3 py-2 bg-[#FF4D6D]/10 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 border border-[#FF4D6D]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Apagar todos os veículos cadastrados na garagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Apagar Todos</span>
            </button>
          )}

          <Button variant="primary" size="sm" onClick={onNewRecord}>
            <Plus className="w-4 h-4" />
            <span>Novo Serviço / Abastecimento</span>
          </Button>
        </div>
      </div>

      {/* Grade de Cards de Veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehiclesList.map((veh) => {
          const isSelected = veh.id === selectedVehicleId;

          return (
            <div
              key={veh.id}
              onClick={() => onSelectVehicle(veh.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-[#0D1627] via-[#090D18] to-[#060A14] border-[#00FF88] shadow-[0_0_25px_rgba(0,255,136,0.2)] scale-[1.01]'
                  : 'bg-[#090D18]/80 border-[#1E293B] hover:border-[#06B6D4]/50 hover:bg-[#0D1322]'
              }`}
            >
              {/* Visual Status Indicator */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{veh.icon || '🚗'}</span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      isSelected
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/50 shadow-[0_0_8px_rgba(0,255,136,0.3)]'
                        : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                    }`}
                  >
                    {isSelected ? '🟢 EM USO (ATIVO)' : 'GARAGEM'}
                  </span>
                </div>

                {/* Actions (Editar / Excluir) */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditVehicle(veh)}
                    className="p-1.5 bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 rounded-lg border border-[#00FF88]/30 transition-colors"
                    title="Editar ficha e odômetro deste veículo"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteVehicle(veh.id, veh.name)}
                    className="p-1.5 bg-[#FF4D6D]/10 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 rounded-lg border border-[#FF4D6D]/30 transition-colors"
                    title="Excluir este veículo da garagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info do Veículo */}
              <div className="flex flex-col gap-1 z-10 my-1">
                <h4 className="text-base font-black text-[#F8FAFC] tracking-tight truncate">{veh.name}</h4>
                {veh.plate && (
                  <span className="text-[11px] font-extrabold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded-md w-fit">
                    Placa: {veh.plate} {veh.yearModel ? `• ${veh.yearModel}` : ''}
                  </span>
                )}
                <p className="text-[11px] text-[#94A3B8] font-medium truncate mt-1">
                  {veh.engineSpecs || '1.0 Flex • Câmbio Manual'}
                </p>
              </div>

              {/* Rodapé do Card: Odômetro & Óleo Especificado */}
              <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-[#94A3B8]">Odômetro Atual</span>
                  <span className="font-black text-[#00FF88] text-sm">
                    {(veh.odometerKm || 0).toLocaleString('pt-BR')} KM
                  </span>
                </div>

                <div className="flex flex-col items-end max-w-[130px]">
                  <span className="text-[9px] font-bold uppercase text-[#94A3B8]">Óleo Recomendado</span>
                  <span className="font-extrabold text-[#F59E0B] text-[11px] truncate">
                    {veh.recommendedOil || '5W30 Sintético'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Card para Cadastrar Novo Veículo */}
        <div
          onClick={onNewVehicle}
          className="p-4 rounded-2xl border-2 border-dashed border-[#06B6D4]/40 hover:border-[#06B6D4] bg-[#090D18]/50 hover:bg-[#06B6D4]/10 flex flex-col items-center justify-center gap-2 min-h-[140px] cursor-pointer transition-all text-center group"
        >
          <div className="p-3 bg-[#06B6D4]/15 text-[#06B6D4] rounded-full group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors">
            Cadastrar Novo Veículo
          </span>
          <span className="text-[10px] text-[#94A3B8]">Adicione mais um carro, moto ou utilitário à sua garagem</span>
        </div>
      </div>
    </div>
  );
};
