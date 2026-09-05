import React from 'react';
import { Activity, Wrench } from 'lucide-react';
import { Vehicle, ComponentCategory, ComponentSpec, VehicleRecord } from '../../tipos';

export interface ComponentHealthItem {
  catKey: ComponentCategory;
  name: string;
  kmInterval: number;
  recommendedPart: string;
  spec?: ComponentSpec;
  config: { name: string; icon: string; kmInterval: number; recommendedPart: string };
  lastRecord?: VehicleRecord;
  lastKm: number;
  kmRun: number;
  pctUsed: number;
  nextDueKm: number;
  kmRemaining: number;
  isUrgent: boolean;
  isWarning: boolean;
}

interface VehicleComponentHealthProps {
  currentVehicle: Vehicle | undefined;
  componentHealthList: ComponentHealthItem[];
  onEditSpec: (catKey: ComponentCategory) => void;
}

export const VehicleComponentHealth: React.FC<VehicleComponentHealthProps> = ({
  currentVehicle,
  componentHealthList,
  onEditSpec,
}) => {
  return (
    <div className="cyber-hud-card hud-corner p-5 flex flex-col gap-4 border border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
      <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <Activity className="w-5 h-5 text-[#00FF88] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">
              SAÚDE E VIDA ÚTIL DOS COMPONENTES ({currentVehicle ? currentVehicle.name.toUpperCase() : 'NENHUM VEÍCULO SELECIONADO'})
            </h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold">
              Monitoramento de quilometragem restante para a próxima revisão
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Componentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {componentHealthList.map((item) => (
          <div
            key={item.catKey}
            className={`p-4 bg-[#090D18]/90 border rounded-xl flex flex-col justify-between gap-3 transition-all ${
              item.isUrgent
                ? 'border-[#FF4D6D] shadow-[0_0_15px_rgba(255,77,109,0.2)]'
                : item.isWarning
                ? 'border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'border-[#1E293B] hover:border-[#00FF88]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.config.icon}</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#F8FAFC]">{item.name}</span>
                    <button
                      onClick={() => onEditSpec(item.catKey)}
                      className="text-[#00FF88] hover:text-[#06B6D4] p-0.5 transition-colors cursor-pointer"
                      title="Editar nome, limite em KM ou código da peça recomendada"
                    >
                      <Wrench className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">
                    Intervalo: {item.kmInterval.toLocaleString('pt-BR')} KM
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                  item.isUrgent
                    ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border-[#FF4D6D]/50 animate-pulse'
                    : item.isWarning
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50'
                    : 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30'
                }`}
              >
                {item.isUrgent ? 'REVISAR AGORA' : item.isWarning ? 'ATENÇÃO' : 'EM DIA'}
              </span>
            </div>

            {/* Barra de Progresso do Componente */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] font-extrabold">
                <span className="text-[#94A3B8]">Rodou: {item.kmRun.toLocaleString('pt-BR')} KM</span>
                <span className="text-[#00FF88]">{item.kmRemaining.toLocaleString('pt-BR')} KM restantes</span>
              </div>
              <div className="w-full h-2 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.isUrgent ? 'bg-[#FF4D6D]' : item.isWarning ? 'bg-[#F59E0B]' : 'bg-[#00FF88]'
                  }`}
                  style={{ width: `${item.pctUsed}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] text-[#94A3B8] font-medium bg-[#0A0B0E] p-2 rounded-lg border border-[#1E2330] flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <strong className="text-[#F8FAFC]">Peça Recomendada:</strong> {item.recommendedPart}
                </div>
                <button
                  onClick={() => onEditSpec(item.catKey)}
                  className="text-[9px] font-bold text-[#00FF88] hover:underline shrink-0"
                >
                  ✏️ Editar
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]">
                <span className="text-[9px] font-bold text-[#64748B]">Consultar Externa:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const q = encodeURIComponent(
                        `peca ${currentVehicle?.name || 'onix'} ${item.name} ${item.recommendedPart}`
                      );
                      window.open(`https://www.google.com/search?q=${q}`, '_blank');
                    }}
                    className="text-[10px] font-bold text-[#06B6D4] hover:underline cursor-pointer"
                    title="Pesquisar especificações e fornecedores no Google"
                  >
                    🔍 Google
                  </button>
                  <button
                    onClick={() => {
                      const q = encodeURIComponent(
                        `peca ${currentVehicle?.name || 'onix'} ${item.name} ${item.recommendedPart}`
                      );
                      window.open(`https://lista.mercadolivre.com.br/${q}`, '_blank');
                    }}
                    className="text-[10px] font-bold text-[#F59E0B] hover:underline cursor-pointer"
                    title="Pesquisar preços e ofertas no Mercado Livre"
                  >
                    🛒 Mercado Livre
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
