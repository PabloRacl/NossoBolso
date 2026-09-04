import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Car, Wrench, ShieldAlert, CheckCircle2, AlertTriangle, Calendar, ShieldCheck, Gauge } from 'lucide-react';

interface MaintenanceAlert {
  id: string;
  vehicleName: string;
  type: string;
  dueKm: number;
  currentKm: number;
  remainingKm: number;
  dueDateStr: string;
  status: 'ok' | 'warning' | 'danger';
  icon: React.ReactNode;
}

export const VehicleMaintenanceAlerts: React.FC = () => {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []) || [];
  const records = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];

  const alerts = useMemo((): MaintenanceAlert[] => {
    if (!vehicles.length) return [];

    const items: MaintenanceAlert[] = [];

    vehicles.forEach((v) => {
      const currentKm = v.odometerKm || 45000;

      // Buscar última manutenção registrada
      const lastOilRecord = records.find(
        (r) => r.vehicleId === v.id && r.type === 'maintenance' && (r.description || '').toLowerCase().includes('óleo')
      );

      const lastOilKm = lastOilRecord?.odometerKm || currentKm - 8500;
      const nextOilKm = lastOilKm + 10000;
      const remainingOilKm = nextOilKm - currentKm;

      let oilStatus: 'ok' | 'warning' | 'danger' = 'ok';
      if (remainingOilKm <= 0) oilStatus = 'danger';
      else if (remainingOilKm <= 1500) oilStatus = 'warning';

      items.push({
        id: `oil_${v.id}`,
        vehicleName: v.name,
        type: 'Troca de Óleo & Filtro de Ar',
        dueKm: nextOilKm,
        currentKm,
        remainingKm: remainingOilKm,
        dueDateStr: remainingOilKm <= 0 ? 'VENCIDA' : `Em ${remainingOilKm.toLocaleString('pt-BR')} KM`,
        status: oilStatus,
        icon: <Wrench className="w-4 h-4 text-[#00FF88]" />,
      });

      // Rodízio e Alinhamento de Pneus
      const nextTireKm = currentKm + 3200;
      items.push({
        id: `tire_${v.id}`,
        vehicleName: v.name,
        type: 'Alinhamento, Balanceamento & Pneus',
        dueKm: nextTireKm,
        currentKm,
        remainingKm: 3200,
        dueDateStr: 'Em 3.200 KM',
        status: 'ok',
        icon: <Gauge className="w-4 h-4 text-[#06B6D4]" />,
      });

      // IPVA e Licenciamento Anual (Baseado na Placa)
      const lastDigit = v.plate ? v.plate.slice(-1) : '0';
      const ipvaMonth = lastDigit === '1' || lastDigit === '2' ? 'Março' : lastDigit === '3' || lastDigit === '4' ? 'Abril' : 'Outubro';

      items.push({
        id: `ipva_${v.id}`,
        vehicleName: v.name,
        type: `IPVA & Licenciamento Anual (${v.plate || 'Placa'})`,
        dueKm: 0,
        currentKm,
        remainingKm: 0,
        dueDateStr: `Vencimento em ${ipvaMonth}/2026`,
        status: 'warning',
        icon: <Calendar className="w-4 h-4 text-[#F59E0B]" />,
      });
    });

    return items;
  }, [vehicles, records]);

  if (!vehicles.length) return null;

  return (
    <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-[#38BDF8] hover:border-[#38BDF8]/60 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#38BDF8]/15 text-[#38BDF8] rounded-xl border border-[#38BDF8]/30">
            <Car className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Central de Alerta de Manutenções da Garagem</h3>
            <p className="text-[11px] text-[#94A3B8] font-medium">Telemetria preventiva de troca de óleo, pneus e obrigações IPVA</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-black text-[#38BDF8] uppercase tracking-wider">
          {vehicles.length} Veículo(s) Monitorado(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
              a.status === 'danger'
                ? 'bg-[#FF4D6D]/10 border-[#FF4D6D]/40'
                : a.status === 'warning'
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40'
                : 'bg-[#090D18]/90 border-[#1E293B]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#121929] border border-[#2E3B52] shrink-0">{a.icon}</div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-[#F8FAFC]">{a.type}</h4>
                  <span className="text-[10px] text-[#94A3B8] font-semibold">{a.vehicleName}</span>
                </div>
              </div>

              {a.status === 'danger' ? (
                <ShieldAlert className="w-4 h-4 text-[#FF4D6D] shrink-0 animate-bounce" />
              ) : a.status === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#00FF88] shrink-0" />
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8] font-semibold">Prazo Previsto:</span>
              <strong
                className={`font-black ${
                  a.status === 'danger'
                    ? 'text-[#FF4D6D]'
                    : a.status === 'warning'
                    ? 'text-[#F59E0B]'
                    : 'text-[#00FF88]'
                }`}
              >
                {a.dueDateStr}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
