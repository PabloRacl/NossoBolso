import React from 'react';
import { Wrench, FileText, Trash2 } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';
import { VehicleRecord } from '../../tipos';

interface VehicleMaintenanceHistoryProps {
  records: VehicleRecord[];
  isPrivacyMode: boolean;
  onEditRecord: (record: VehicleRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const VehicleMaintenanceHistory: React.FC<VehicleMaintenanceHistoryProps> = ({
  records,
  isPrivacyMode,
  onEditRecord,
  onDeleteRecord,
}) => {
  const maintenanceRecords = records.filter((r) => r.type !== 'refuel');

  return (
    <div className="cyber-hud-card p-5 flex flex-col gap-4 border border-[#06B6D4]/30">
      <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#06B6D4]" />
          <h3 className="text-sm font-black text-[#F8FAFC]">MANUTENÇÕES, REVISÕES E TAXAS REGISTRADAS</h3>
        </div>
      </div>

      {maintenanceRecords.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#94A3B8] bg-[#0A0B0E]/60 border border-[#1E2330] rounded-xl">
          Nenhuma manutenção ou taxa registrada para este veículo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintenanceRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-[#0A0B0E]/90 border border-[#1E2330] rounded-xl flex items-center justify-between gap-3 hover:border-[#06B6D4]/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#06B6D4]/15 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30">
                  {rec.type === 'maintenance' ? <Wrench className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black text-[#F8FAFC]">{rec.description}</span>
                  {rec.partNumber && (
                    <span className="text-[10px] text-[#00FF88] font-bold">Peça: {rec.partNumber}</span>
                  )}
                  <span className="text-[11px] text-[#94A3B8]">
                    {rec.odometerKm.toLocaleString('pt-BR')} KM • {new Date(rec.date).toLocaleDateString('pt-BR')}
                    {rec.nextDueKm ? ` • Próxima: ${rec.nextDueKm.toLocaleString('pt-BR')} KM` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-[#FF4D6D]">{formatBRL(rec.totalCost, isPrivacyMode)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRecord(rec)}
                    className="text-[#94A3B8] hover:text-[#00FF88] transition-colors p-1"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRecord(rec.id)}
                    className="text-[#94A3B8] hover:text-[#FF4D6D] transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
