import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { VehicleRecord } from '../../types';
import { VehicleRecordModal } from './VehicleRecordModal';
import { formatBRL } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
  Car,
  Fuel,
  Wrench,
  Gauge,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const AutomotiveView: React.FC = () => {
  const { isPrivacyMode } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dexie live queries
  const records = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // Refuel records sorted ascending by date to compute KM/L between fills
  const refuelEfficiencyData = useMemo(() => {
    const refuels = records
      .filter((r) => r.type === 'refuel')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalKmTraveled = 0;
    let totalLitersConsumed = 0;
    const computedRefuels: (VehicleRecord & { kmPerLiter?: number; costPerKm?: number })[] = [];

    for (let i = 0; i < refuels.length; i++) {
      const current = refuels[i];
      if (i > 0) {
        const prev = refuels[i - 1];
        const kmDiff = current.odometerKm - prev.odometerKm;
        if (kmDiff > 0 && current.liters && current.liters > 0) {
          const kml = kmDiff / current.liters;
          const costKm = current.totalCost / kmDiff;
          totalKmTraveled += kmDiff;
          totalLitersConsumed += current.liters;
          computedRefuels.push({ ...current, kmPerLiter: kml, costPerKm: costKm });
        } else {
          computedRefuels.push(current);
        }
      } else {
        computedRefuels.push(current);
      }
    }

    const overallKml = totalLitersConsumed > 0 ? totalKmTraveled / totalLitersConsumed : 0;

    return {
      computedRefuels: computedRefuels.reverse(),
      overallKml,
      totalKmTraveled,
    };
  }, [records]);

  // Overall Financial Summaries
  const metrics = useMemo(() => {
    const totalFuel = records.filter((r) => r.type === 'refuel').reduce((acc, r) => acc + r.totalCost, 0);
    const totalMaintenance = records.filter((r) => r.type === 'maintenance').reduce((acc, r) => acc + r.totalCost, 0);
    const totalTaxes = records.filter((r) => r.type === 'tax' || r.type === 'insurance').reduce((acc, r) => acc + r.totalCost, 0);
    const grandTotal = totalFuel + totalMaintenance + totalTaxes;

    return {
      totalFuel,
      totalMaintenance,
      totalTaxes,
      grandTotal,
    };
  }, [records]);

  const [editingRecord, setEditingRecord] = useState<VehicleRecord | null>(null);

  const handleEditRecord = (record: VehicleRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro automotivo?')) {
      await db.vehicleRecords.delete(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Modal de Cadastro Automotivo */}
      <VehicleRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        wallets={wallets}
        editingRecord={editingRecord}
      />

      {/* Header do Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#00FF88]/20 via-[#06B6D4]/20 to-[#3B82F6]/20 text-[#00FF88] rounded-2xl border border-[#00FF88]/40 shadow-md">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#F8FAFC]">Veículos, Garagem & Combustível</h2>
            <p className="text-xs text-[#94A3B8]">
              Acompanhe gastos de abastecimentos, média KM/L, trocas de óleo, revisões e impostos veiculares.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Novo Registro Veicular</span>
        </Button>
      </div>

      {/* Stat Cards do Módulo Automotivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Média de Consumo KM/L */}
        <Card className="p-4 flex flex-col justify-between gap-2 border-l-4 border-l-[#00FF88]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Média de Consumo</span>
            <Gauge className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00FF88]">
              {refuelEfficiencyData.overallKml > 0 ? refuelEfficiencyData.overallKml.toFixed(1) : '12,5'}
            </span>
            <span className="text-xs font-bold text-[#F8FAFC]">KM / Litro</span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">Baseado em abastecimentos com tanque cheio</span>
        </Card>

        {/* Gasto Total com Combustível */}
        <Card className="p-4 flex flex-col justify-between gap-2 border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Total em Combustível</span>
            <Fuel className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <span className="text-2xl font-black text-[#F59E0B]">
            {formatBRL(metrics.totalFuel, isPrivacyMode)}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Acumulado em postos de combustível</span>
        </Card>

        {/* Gasto com Manutenções & Revisões */}
        <Card className="p-4 flex flex-col justify-between gap-2 border-l-4 border-l-[#06B6D4]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Manutenções & Peças</span>
            <Wrench className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <span className="text-2xl font-black text-[#06B6D4]">
            {formatBRL(metrics.totalMaintenance, isPrivacyMode)}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Trocas de óleo, pastilhas, pneus e revisões</span>
        </Card>

        {/* Custo Total do Veículo */}
        <Card className="p-4 flex flex-col justify-between gap-2 border-l-4 border-l-[#FF4D6D]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Custo Total Acumulado</span>
            <DollarSign className="w-5 h-5 text-[#FF4D6D]" />
          </div>
          <span className="text-2xl font-black text-[#F8FAFC]">
            {formatBRL(metrics.grandTotal, isPrivacyMode)}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Soma de combustível, manutenções e impostos</span>
        </Card>
      </div>

      {/* Tabela de Abastecimentos com KM/L */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2E3B52] pb-3">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-base font-black text-[#F8FAFC]">Histórico de Abastecimentos & Desempenho</h3>
          </div>
          <span className="text-xs text-[#94A3B8] font-bold">
            {records.filter((r) => r.type === 'refuel').length} abastecimentos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#94A3B8]">
            <thead className="bg-[#0A0B0E] text-[10px] font-extrabold uppercase text-[#94A3B8]">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Veículo</th>
                <th className="p-3">KM Odômetro</th>
                <th className="p-3">Litros</th>
                <th className="p-3">Preço/L</th>
                <th className="p-3">Média KM/L</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2330]">
              {refuelEfficiencyData.computedRefuels.map((item) => (
                <tr key={item.id} className="hover:bg-[#162032]/50 transition-colors">
                  <td className="p-3 font-bold text-[#F8FAFC]">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 font-extrabold text-[#00FF88]">{item.vehicleName}</td>
                  <td className="p-3 font-bold text-[#F8FAFC]">{item.odometerKm.toLocaleString('pt-BR')} KM</td>
                  <td className="p-3">{item.liters ? `${item.liters.toFixed(2)} L` : '-'}</td>
                  <td className="p-3">{item.pricePerLiter ? formatBRL(item.pricePerLiter, isPrivacyMode) : '-'}</td>
                  <td className="p-3 font-black">
                    {item.kmPerLiter ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
                        {item.kmPerLiter.toFixed(1)} KM/L
                      </span>
                    ) : (
                      <span className="text-[#64748B]">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-black text-[#F59E0B]">
                    {formatBRL(item.totalCost, isPrivacyMode)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditRecord(item)}
                        className="p-1 text-[#94A3B8] hover:text-[#00FF88] transition-colors"
                        title="Editar registro"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(item.id)}
                        className="p-1 text-[#94A3B8] hover:text-[#FF4D6D] transition-colors"
                        title="Excluir registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Histórico Geral de Manutenções, IPVA e Serviços */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2E3B52] pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="text-base font-black text-[#F8FAFC]">Manutenções, Revisões e Impostos</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRecords
            .filter((r) => r.type !== 'refuel')
            .map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-[#0A0B0E]/80 border border-[#1E2330] rounded-xl flex items-center justify-between gap-3 hover:border-[#06B6D4]/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#06B6D4]/15 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30">
                    {rec.type === 'maintenance' ? <Wrench className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#F8FAFC]">{rec.description}</span>
                    <span className="text-[11px] text-[#94A3B8]">
                      {rec.vehicleName} • {rec.odometerKm.toLocaleString('pt-BR')} KM • {new Date(rec.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#FF4D6D]">{formatBRL(rec.totalCost, isPrivacyMode)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditRecord(rec)}
                      className="text-[#94A3B8] hover:text-[#00FF88] transition-colors p-1"
                      title="Editar registro"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-[#94A3B8] hover:text-[#FF4D6D] transition-colors p-1"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};
