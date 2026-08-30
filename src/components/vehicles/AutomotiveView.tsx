import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { VehicleRecord, ComponentCategory } from '../../types';
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
  AlertTriangle,
  FileText,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Flame,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

// Recomendações de Troca em KM para cada componente do Chevrolet Onix 1.0 LT (2017/2018)
const COMPONENT_KM_LIMITS: Record<ComponentCategory, { name: string; icon: string; kmInterval: number; recommendedPart: string }> = {
  oil: { name: 'Óleo 5W30 & Filtro', icon: '🛢️', kmInterval: 10000, recommendedPart: 'ACDelco 5W30 Dexos1 Gen2 (3.5L) + Filtro 88905845' },
  timing_belt: { name: 'Correia Dentada & Tensor', icon: '⚙️', kmInterval: 60000, recommendedPart: 'Correia GM ACDelco 93353848 + Tensor Rolamento GM' },
  tires: { name: 'Pneus & Alinhamento', icon: '🛞', kmInterval: 40000, recommendedPart: '185/65 R15 88H (Pressão: 35 PSI Diant / 35 PSI Tras)' },
  brakes: { name: 'Pastilhas & Discos de Freio', icon: '🛑', kmInterval: 25000, recommendedPart: 'Cobreq N-358 / Fras-le PD/1446 + Fluido DOT 4' },
  spark_plugs: { name: 'Velas & Cabos Ignição', icon: '⚡', kmInterval: 30000, recommendedPart: 'NGK BR7ES-D (Folga 0.8mm) + Cabos SC-G73' },
  filters: { name: 'Kit de Filtros (Ar/Combustível/Cabine)', icon: '🌬️', kmInterval: 10000, recommendedPart: 'Tecfil ARL8832 / GI04/7 / ACP883' },
  coolant: { name: 'Fluido de Arrefecimento', icon: '🌡️', kmInterval: 30000, recommendedPart: 'Aditivo Etilenoglicol Rosa Organico ACDelco 50%' },
  battery: { name: 'Bateria 12V 60Ah', icon: '🔋', kmInterval: 50000, recommendedPart: 'Moura / ACDelco 60Ah Selada (CCA 450A)' },
  general: { name: 'Diagnóstico OBD2 & Suspensão', icon: '🔧', kmInterval: 10000, recommendedPart: 'Checkup Injeção Eletrônica e Amortecedores' },
};

import { VehicleModal } from './VehicleModal';
import { EditComponentSpecModal } from './EditComponentSpecModal';
import { EditMetricModal } from './EditMetricModal';
import { Vehicle } from '../../types';

export const AutomotiveView: React.FC = () => {
  const { isPrivacyMode } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VehicleRecord | null>(null);

  // Módulo de Gerenciamento da Garagem & Múltiplos Veículos
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh_onix');

  // Modal de Edição de Especificação de Componente
  const [isEditSpecModalOpen, setIsEditSpecModalOpen] = useState(false);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<ComponentCategory>('oil');

  // Modal de Edição de Métricas Automotivas
  const [isEditMetricModalOpen, setIsEditMetricModalOpen] = useState(false);
  const [editingMetricType, setEditingMetricType] = useState<'kml' | 'fuel' | 'maintenance' | 'cost_km'>('kml');

  // Calculadora Flex Etanol vs Gasolina
  const [gasolinePrice, setGasolinePrice] = useState('5.79');
  const [ethanolPrice, setEthanolPrice] = useState('3.89');

  // Dexie live queries
  const records = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const vehiclesList = useLiveQuery(() => db.vehicles.toArray(), []) || [];
  const customSpecs = useLiveQuery(() => db.componentSpecs.toArray(), []) || [];

  const currentVehicle = vehiclesList.find((v) => v.id === selectedVehicleId) || vehiclesList[0];

  React.useEffect(() => {
    if (vehiclesList.length > 0 && !vehiclesList.some((v) => v.id === selectedVehicleId)) {
      setSelectedVehicleId(vehiclesList[0].id);
    }
  }, [vehiclesList, selectedVehicleId]);

  // Filter records by currently selected active vehicle
  const vehicleRecords = useMemo(() => {
    if (!currentVehicle) return [];
    return records.filter((r) => r.vehicleId === currentVehicle.id || r.vehicleName === currentVehicle.name);
  }, [records, currentVehicle]);

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    return [...vehicleRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vehicleRecords]);

  // Current Odometer Max KM
  const currentOdometer = useMemo(() => {
    if (currentVehicle?.odometerKm) return currentVehicle.odometerKm;
    if (vehicleRecords.length === 0) return 0;
    return Math.max(...vehicleRecords.map((r) => r.odometerKm));
  }, [vehicleRecords, currentVehicle]);

  // Refuel records sorted ascending by date to compute KM/L between fills
  const refuelEfficiencyData = useMemo(() => {
    const refuels = vehicleRecords
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
    const avgCostPerKm = totalKmTraveled > 0 ? vehicleRecords.reduce((acc, r) => acc + r.totalCost, 0) / totalKmTraveled : 0;

    return {
      computedRefuels: computedRefuels.reverse(),
      overallKml,
      totalKmTraveled,
      avgCostPerKm,
    };
  }, [vehicleRecords]);

  // Overall Financial Summaries
  const metrics = useMemo(() => {
    const totalFuel = vehicleRecords.filter((r) => r.type === 'refuel').reduce((acc, r) => acc + r.totalCost, 0);
    const totalMaintenance = vehicleRecords.filter((r) => r.type === 'maintenance').reduce((acc, r) => acc + r.totalCost, 0);
    const totalTaxes = vehicleRecords.filter((r) => r.type === 'tax' || r.type === 'insurance').reduce((acc, r) => acc + r.totalCost, 0);
    const grandTotal = totalFuel + totalMaintenance + totalTaxes;

    return {
      totalFuel,
      totalMaintenance,
      totalTaxes,
      grandTotal,
    };
  }, [vehicleRecords]);

  // Component Health Monitor per Category
  const componentHealthList = useMemo(() => {
    const categoriesList: ComponentCategory[] = ['oil', 'timing_belt', 'tires', 'brakes', 'spark_plugs', 'filters', 'coolant', 'battery'];

    return categoriesList.map((catKey) => {
      const config = COMPONENT_KM_LIMITS[catKey];
      const spec = customSpecs.find((s) => s.vehicleId === currentVehicle?.id && s.category === catKey);

      const name = spec?.name || config.name;
      const kmInterval = spec?.kmInterval || config.kmInterval;
      const recommendedPart = spec?.recommendedPart || config.recommendedPart;

      const catRecords = vehicleRecords
        .filter((r) => r.type === 'maintenance' && r.componentCategory === catKey)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastRecord = catRecords[0];
      const lastKm = spec?.lastKmOverride !== undefined ? spec.lastKmOverride : (lastRecord ? lastRecord.odometerKm : (currentOdometer > 0 ? currentOdometer : 0));
      const kmRun = currentOdometer > 0 ? Math.max(currentOdometer - lastKm, 0) : 0;
      const pctUsed = Math.min(Math.round((kmRun / kmInterval) * 100), 100);

      const nextDueKm = lastRecord?.nextDueKm || lastKm + kmInterval;
      const kmRemaining = Math.max(nextDueKm - currentOdometer, 0);

      const isUrgent = currentOdometer > 0 && kmRemaining <= 500;
      const isWarning = currentOdometer > 0 && !isUrgent && pctUsed >= 80;

      return {
        catKey,
        name,
        kmInterval,
        recommendedPart,
        spec,
        config,
        lastRecord,
        lastKm,
        kmRun,
        pctUsed,
        nextDueKm,
        kmRemaining,
        isUrgent,
        isWarning,
      };
    });
  }, [vehicleRecords, currentOdometer, customSpecs, currentVehicle]);

  // Calculadora Flex Etanol vs Gasolina Calculation
  const flexCalc = useMemo(() => {
    const g = parseFloat(gasolinePrice) || 0;
    const e = parseFloat(ethanolPrice) || 0;
    if (g <= 0 || e <= 0) return { ratio: 0, recommend: 'gasoline' };
    const ratio = (e / g) * 100;
    const recommend = ratio <= 70 ? 'ethanol' : 'gasoline';
    return { ratio, recommend };
  }, [gasolinePrice, ethanolPrice]);

  const handleEditRecord = (record: VehicleRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o veículo "${name}" e todo o seu histórico da garagem?`)) {
      await db.vehicles.delete(id);
      // Apagar registros do veículo
      const recs = await db.vehicleRecords.filter((r) => r.vehicleId === id || r.vehicleName === name).toArray();
      for (const r of recs) {
        await db.vehicleRecords.delete(r.id);
      }
      // Apagar especificações do veículo
      const specs = await db.componentSpecs.filter((s) => s.vehicleId === id).toArray();
      for (const s of specs) {
        await db.componentSpecs.delete(s.id);
      }
      const remaining = vehiclesList.filter((v) => v.id !== id);
      setSelectedVehicleId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleClearAllVehicles = async () => {
    if (confirm('Tem certeza que deseja apagar TODOS os veículos e históricos da sua garagem?')) {
      await db.vehicles.clear();
      await db.vehicleRecords.clear();
      await db.componentSpecs.clear();
      setSelectedVehicleId('');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro automotivo?')) {
      await db.vehicleRecords.delete(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Modal de Edição de Métricas Automotivas */}
      <EditMetricModal
        isOpen={isEditMetricModalOpen}
        onClose={() => setIsEditMetricModalOpen(false)}
        vehicle={currentVehicle || null}
        metricType={editingMetricType}
        autoCalculatedValue={
          editingMetricType === 'kml'
            ? refuelEfficiencyData.overallKml
            : editingMetricType === 'fuel'
            ? metrics.totalFuel
            : editingMetricType === 'maintenance'
            ? metrics.totalMaintenance
            : refuelEfficiencyData.avgCostPerKm
        }
      />

      {/* Modal de Personalização de Especificações de Componente */}
      <EditComponentSpecModal
        isOpen={isEditSpecModalOpen}
        onClose={() => setIsEditSpecModalOpen(false)}
        vehicleId={currentVehicle?.id || 'veh_onix'}
        vehicleName={currentVehicle?.name || 'Chevrolet Onix 1.0 LT (2017/2018)'}
        category={selectedCategoryToEdit}
        defaultName={COMPONENT_KM_LIMITS[selectedCategoryToEdit]?.name || ''}
        defaultKmInterval={COMPONENT_KM_LIMITS[selectedCategoryToEdit]?.kmInterval || 10000}
        defaultPart={COMPONENT_KM_LIMITS[selectedCategoryToEdit]?.recommendedPart || ''}
        currentLastKm={
          records
            .filter((r) => r.type === 'maintenance' && r.componentCategory === selectedCategoryToEdit)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.odometerKm || 35400
        }
        existingSpec={customSpecs.find((s) => s.vehicleId === (currentVehicle?.id || 'veh_onix') && s.category === selectedCategoryToEdit)}
      />

      {/* Modal de Cadastro/Edição da Ficha do Veículo */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={(createdId) => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
          if (createdId && typeof createdId === 'string') {
            setSelectedVehicleId(createdId);
          }
        }}
        editingVehicle={editingVehicle}
      />

      {/* Modal de Cadastro de Serviços e Abastecimentos */}
      <VehicleRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        wallets={wallets}
        editingRecord={editingRecord}
        currentVehicleId={currentVehicle?.id}
        currentVehicleName={currentVehicle?.name}
      />

      {/* 🚘 PAINEL VISUAL DA GARAGEM & FROTA (CARDS INTERATIVOS DE VEÍCULOS) */}
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
              <p className="text-[11px] text-[#94A3B8] font-semibold">Selecione o veículo ativo para visualizar telemetria, custos e saúde dos componentes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vehiclesList.length > 0 && (
              <button
                onClick={handleClearAllVehicles}
                className="px-3 py-2 bg-[#FF4D6D]/10 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 border border-[#FF4D6D]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Apagar todos os veículos cadastrados na garagem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar Todos</span>
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
            >
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
                onClick={() => setSelectedVehicleId(veh.id)}
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
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      isSelected
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/50 shadow-[0_0_8px_rgba(0,255,136,0.3)]'
                        : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                    }`}>
                      {isSelected ? '🟢 EM USO (ATIVO)' : 'GARAGEM'}
                    </span>
                  </div>

                  {/* Actions (Editar / Excluir) */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingVehicle(veh);
                        setIsVehicleModalOpen(true);
                      }}
                      className="p-1.5 bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 rounded-lg border border-[#00FF88]/30 transition-colors"
                      title="Editar ficha e odômetro deste veículo"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteVehicle(veh.id, veh.name)}
                      className="p-1.5 bg-[#FF4D6D]/10 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 rounded-lg border border-[#FF4D6D]/30 transition-colors"
                      title="Excluir este veículo da garagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info do Veículo */}
                <div className="flex flex-col gap-1 z-10 my-1">
                  <h4 className="text-base font-black text-[#F8FAFC] tracking-tight truncate">
                    {veh.name}
                  </h4>
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
            onClick={() => {
              setEditingVehicle(null);
              setIsVehicleModalOpen(true);
            }}
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

      {/* STAT CARDS AUTOMOTIVOS */}
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
                onClick={() => {
                  setEditingMetricType('kml');
                  setIsEditMetricModalOpen(true);
                }}
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
                onClick={() => {
                  setEditingMetricType('fuel');
                  setIsEditMetricModalOpen(true);
                }}
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
                onClick={() => {
                  setEditingMetricType('maintenance');
                  setIsEditMetricModalOpen(true);
                }}
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
                onClick={() => {
                  setEditingMetricType('cost_km');
                  setIsEditMetricModalOpen(true);
                }}
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

      {/* PAINEL DE SAÚDE DOS COMPONENTES (COMPONENTS HEALTH TRACKER) */}
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
              <p className="text-[11px] text-[#94A3B8] font-semibold">Monitoramento de quilometragem restante para a próxima revisão</p>
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
                        onClick={() => {
                          setSelectedCategoryToEdit(item.catKey);
                          setIsEditSpecModalOpen(true);
                        }}
                        className="text-[#00FF88] hover:text-[#06B6D4] p-0.5 transition-colors cursor-pointer"
                        title="Editar nome, limite em KM ou código da peça recomendada"
                      >
                        <Wrench className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Intervalo: {item.kmInterval.toLocaleString('pt-BR')} KM</span>
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
                    onClick={() => {
                      setSelectedCategoryToEdit(item.catKey);
                      setIsEditSpecModalOpen(true);
                    }}
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
                        const q = encodeURIComponent(`peca ${currentVehicle?.name || 'onix'} ${item.name} ${item.recommendedPart}`);
                        window.open(`https://www.google.com/search?q=${q}`, '_blank');
                      }}
                      className="text-[10px] font-bold text-[#06B6D4] hover:underline cursor-pointer"
                      title="Pesquisar especificações e fornecedores no Google"
                    >
                      🔍 Google
                    </button>
                    <button
                      onClick={() => {
                        const q = encodeURIComponent(`peca ${currentVehicle?.name || 'onix'} ${item.name} ${item.recommendedPart}`);
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

      {/* CALCULADORA FLEX ETANOL VS GASOLINA & GUIA DE COMBUSTÍVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculadora Flex */}
        <div className="cyber-hud-card hud-corner p-5 flex flex-col justify-between gap-4 border border-[#F59E0B]/30">
          <div className="flex items-center gap-2.5 border-b border-[#2E3B52]/80 pb-3">
            <div className="p-2.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
              <Flame className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#F8FAFC]">CALCULADORA FLEX (ETANOL VS GASOLINA)</h3>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Paridade de 70% para combustível ideal no Onix</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Preço Gasolina (R$)</label>
              <input
                type="number"
                step="0.01"
                value={gasolinePrice}
                onChange={(e) => setGasolinePrice(e.target.value)}
                className="w-full h-10 px-2.5 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Preço Etanol (R$)</label>
              <input
                type="number"
                step="0.01"
                value={ethanolPrice}
                onChange={(e) => setEthanolPrice(e.target.value)}
                className="w-full h-10 px-2.5 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F59E0B] font-black focus:outline-none"
              />
            </div>
          </div>

          {/* Resultado do Recomendador Flex */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              flexCalc.recommend === 'ethanol'
                ? 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]'
                : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Paridade Atual: {flexCalc.ratio.toFixed(1)}%</span>
              <strong className="text-sm font-black mt-0.5">
                {flexCalc.recommend === 'ethanol' ? '🌽 Abasteça com ETANOL' : '⛽ Abasteça com GASOLINA'}
              </strong>
            </div>
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Tabela de Histórico de Abastecimentos */}
        <div className="lg:col-span-2 cyber-hud-card p-5 flex flex-col gap-4 border border-[#F59E0B]/30">
          <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-sm font-black text-[#F8FAFC]">HISTÓRICO DE ABASTECIMENTOS & DESEMPENHO</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#94A3B8]">
              <thead className="bg-[#0A0B0E] text-[10px] font-extrabold uppercase text-[#94A3B8]">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">KM Odômetro</th>
                  <th className="p-2.5">Litros</th>
                  <th className="p-2.5">Preço/L</th>
                  <th className="p-2.5">Média KM/L</th>
                  <th className="p-2.5 text-right">Valor Total</th>
                  <th className="p-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2330]">
                {refuelEfficiencyData.computedRefuels.map((item) => (
                  <tr key={item.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="p-2.5 font-bold text-[#F8FAFC]">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2.5 font-bold text-[#00FF88]">{item.odometerKm.toLocaleString('pt-BR')} KM</td>
                    <td className="p-2.5">{item.liters ? `${item.liters.toFixed(2)} L` : '-'}</td>
                    <td className="p-2.5">{item.pricePerLiter ? formatBRL(item.pricePerLiter, isPrivacyMode) : '-'}</td>
                    <td className="p-2.5 font-black">
                      {item.kmPerLiter ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
                          {item.kmPerLiter.toFixed(1)} KM/L
                        </span>
                      ) : (
                        <span className="text-[#64748B]">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-black text-[#F59E0B]">
                      {formatBRL(item.totalCost, isPrivacyMode)}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditRecord(item)}
                          className="p-1 text-[#94A3B8] hover:text-[#00FF88] transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1 text-[#94A3B8] hover:text-[#FF4D6D] transition-colors"
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
        </div>
      </div>

      {/* HISTÓRICO GERAL DE MANUTENÇÕES E IMPOSTOS */}
      <div className="cyber-hud-card p-5 flex flex-col gap-4 border border-[#06B6D4]/30">
        <div className="flex items-center justify-between border-b border-[#2E3B52]/80 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="text-sm font-black text-[#F8FAFC]">MANUTENÇÕES, REVISÕES E TAXAS REGISTRADAS</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRecords
            .filter((r) => r.type !== 'refuel')
            .map((rec) => (
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
                      onClick={() => handleEditRecord(rec)}
                      className="text-[#94A3B8] hover:text-[#00FF88] transition-colors p-1"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-[#94A3B8] hover:text-[#FF4D6D] transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
