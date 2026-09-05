import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { VehicleRecord, ComponentCategory, Vehicle } from '../../tipos';
import { VehicleRecordModal } from './VehicleRecordModal';
import { VehicleModal } from './VehicleModal';
import { EditComponentSpecModal } from './EditComponentSpecModal';
import { EditMetricModal } from './EditMetricModal';
import { VehicleMaintenanceAlerts } from './VehicleMaintenanceAlerts';
import { VehicleGaragePanel } from './VehicleGaragePanel';
import { VehicleTelemetryCards } from './VehicleTelemetryCards';
import { VehicleComponentHealth, ComponentHealthItem } from './VehicleComponentHealth';
import { VehicleFuelTab } from './VehicleFuelTab';
import { VehicleMaintenanceHistory } from './VehicleMaintenanceHistory';
import { useAppStore } from '../../estado/useAppStore';

// Recomendações de Troca em KM para cada componente padrão do Chevrolet Onix 1.0 LT (2017/2018)
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

  useEffect(() => {
    if (vehiclesList.length > 0 && !vehiclesList.some((v) => v.id === selectedVehicleId)) {
      setSelectedVehicleId(vehiclesList[0].id);
    }
  }, [vehiclesList, selectedVehicleId]);

  // Filtrar registros pelo veículo ativo
  const vehicleRecords = useMemo(() => {
    if (!currentVehicle) return [];
    return records.filter((r) => r.vehicleId === currentVehicle.id || r.vehicleName === currentVehicle.name);
  }, [records, currentVehicle]);

  // Ordenar registros por data decrescente
  const sortedRecords = useMemo(() => {
    return [...vehicleRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vehicleRecords]);

  // Odômetro Máximo Atual
  const currentOdometer = useMemo(() => {
    if (currentVehicle?.odometerKm) return currentVehicle.odometerKm;
    if (vehicleRecords.length === 0) return 0;
    return Math.max(...vehicleRecords.map((r) => r.odometerKm));
  }, [vehicleRecords, currentVehicle]);

  // Cálculo de telemetria entre abastecimentos (KM/L)
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

  // Métricas financeiras gerais
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

  // Monitor de saúde dos componentes
  const componentHealthList: ComponentHealthItem[] = useMemo(() => {
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

  // Calculadora Flex Etanol vs Gasolina
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
      const recs = await db.vehicleRecords.filter((r) => r.vehicleId === id || r.vehicleName === name).toArray();
      for (const r of recs) {
        await db.vehicleRecords.delete(r.id);
      }
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
      {/* Modais */}
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

      {/* Painel da Garagem */}
      <VehicleGaragePanel
        vehiclesList={vehiclesList}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        onNewRecord={() => {
          setEditingRecord(null);
          setIsModalOpen(true);
        }}
        onNewVehicle={() => {
          setEditingVehicle(null);
          setIsVehicleModalOpen(true);
        }}
        onEditVehicle={(veh) => {
          setEditingVehicle(veh);
          setIsVehicleModalOpen(true);
        }}
        onDeleteVehicle={handleDeleteVehicle}
        onClearAllVehicles={handleClearAllVehicles}
      />

      {/* Alertas de Manutenção */}
      <VehicleMaintenanceAlerts />

      {/* Telemetria e Consumo */}
      <VehicleTelemetryCards
        currentVehicle={currentVehicle}
        refuelEfficiencyData={refuelEfficiencyData}
        metrics={metrics}
        isPrivacyMode={isPrivacyMode}
        onEditMetric={(type) => {
          setEditingMetricType(type);
          setIsEditMetricModalOpen(true);
        }}
      />

      {/* Saúde dos Componentes */}
      <VehicleComponentHealth
        currentVehicle={currentVehicle}
        componentHealthList={componentHealthList}
        onEditSpec={(catKey) => {
          setSelectedCategoryToEdit(catKey);
          setIsEditSpecModalOpen(true);
        }}
      />

      {/* Calculadora Flex e Abastecimentos */}
      <VehicleFuelTab
        gasolinePrice={gasolinePrice}
        setGasolinePrice={setGasolinePrice}
        ethanolPrice={ethanolPrice}
        setEthanolPrice={setEthanolPrice}
        flexCalc={flexCalc}
        refuelRecords={refuelEfficiencyData.computedRefuels}
        isPrivacyMode={isPrivacyMode}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Histórico Geral de Manutenções */}
      <VehicleMaintenanceHistory
        records={sortedRecords}
        isPrivacyMode={isPrivacyMode}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
      />
    </div>
  );
};
