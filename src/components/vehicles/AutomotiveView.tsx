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

export const AutomotiveView: React.FC = () => {
  const { isPrivacyMode } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VehicleRecord | null>(null);

  // Calculadora Flex Etanol vs Gasolina
  const [gasolinePrice, setGasolinePrice] = useState('5.79');
  const [ethanolPrice, setEthanolPrice] = useState('3.89');

  // Dexie live queries
  const records = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // Current Odometer Max KM
  const currentOdometer = useMemo(() => {
    if (records.length === 0) return 45400; // Valor padrão para Onix LT 2017/2018
    return Math.max(...records.map((r) => r.odometerKm));
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
    const avgCostPerKm = totalKmTraveled > 0 ? records.reduce((acc, r) => acc + r.totalCost, 0) / totalKmTraveled : 0;

    return {
      computedRefuels: computedRefuels.reverse(),
      overallKml,
      totalKmTraveled,
      avgCostPerKm,
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

  // Component Health Monitor per Category
  const componentHealthList = useMemo(() => {
    const categoriesList: ComponentCategory[] = ['oil', 'timing_belt', 'tires', 'brakes', 'spark_plugs', 'filters', 'coolant', 'battery'];

    return categoriesList.map((catKey) => {
      const config = COMPONENT_KM_LIMITS[catKey];
      const catRecords = records
        .filter((r) => r.type === 'maintenance' && r.componentCategory === catKey)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastRecord = catRecords[0];
      const lastKm = lastRecord ? lastRecord.odometerKm : 35400; // Valor padrão histórico
      const kmRun = Math.max(currentOdometer - lastKm, 0);
      const pctUsed = Math.min(Math.round((kmRun / config.kmInterval) * 100), 100);

      const nextDueKm = lastRecord?.nextDueKm || lastKm + config.kmInterval;
      const kmRemaining = Math.max(nextDueKm - currentOdometer, 0);

      const isUrgent = kmRemaining <= 500;
      const isWarning = !isUrgent && pctUsed >= 80;

      return {
        catKey,
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
  }, [records, currentOdometer]);

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

      {/* HEADER FICHA TÉCNICA FICHA ONIX 1.0 LT 2017/2018 */}
      <div className="cyber-hud-card hud-corner p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-[#00FF88]/40 shadow-[0_0_30px_rgba(0,255,136,0.12)]">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-[#00FF88]/20 via-[#06B6D4]/20 to-[#3B82F6]/20 text-[#00FF88] rounded-2xl border border-[#00FF88]/50 shadow-[0_0_20px_rgba(0,255,136,0.25)]">
            <Car className="w-9 h-9" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#F8FAFC]">Chevrolet Onix 1.0 LT (2017/2018)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/40 text-[10px] font-black text-[#00FF88] uppercase tracking-wider">
                GARAGEM OFICIAL
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-semibold flex flex-wrap items-center gap-2">
              <span>Motor 1.0 SPE/4 Eco (80 cv)</span>
              <span>•</span>
              <span>Câmbio 6M</span>
              <span>•</span>
              <span className="text-[#00FF88] font-extrabold">Óleo: 5W30 Dexos1 Gen2 (3,5L)</span>
              <span>•</span>
              <span>Pneus 185/65 R15 (35 PSI)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="px-4 py-2 bg-[#090D18] border border-[#2E3B52] rounded-xl flex flex-col items-end">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Odômetro Atual</span>
            <span className="text-lg font-black text-[#00FF88]">{currentOdometer.toLocaleString('pt-BR')} KM</span>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-3"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Serviço / Abastecimento</span>
          </Button>
        </div>
      </div>

      {/* STAT CARDS AUTOMOTIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Média de Consumo KM/L */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#00FF88]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Média de Consumo</span>
            <Gauge className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#00FF88]">
              {refuelEfficiencyData.overallKml > 0 ? refuelEfficiencyData.overallKml.toFixed(1) : '12,8'}
            </span>
            <span className="text-xs font-bold text-[#F8FAFC]">KM / Litro</span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">Média histórica entre abastecimentos</span>
        </div>

        {/* Total em Combustível */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Total em Combustível</span>
            <Fuel className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <span className="text-3xl font-black text-[#F59E0B] my-2">
            {formatBRL(metrics.totalFuel, isPrivacyMode)}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Acumulado em postos de combustível</span>
        </div>

        {/* Manutenções & Peças */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#06B6D4]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Manutenções & Peças</span>
            <Wrench className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <span className="text-3xl font-black text-[#06B6D4] my-2">
            {formatBRL(metrics.totalMaintenance, isPrivacyMode)}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Revisões de fábrica e trocas de componentes</span>
        </div>

        {/* Custo por Quilômetro Rodado (R$/KM) */}
        <div className="cyber-hud-card p-4 flex flex-col justify-between border-l-4 border-l-[#A855F7]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider">Custo Por KM (R$/KM)</span>
            <Activity className="w-5 h-5 text-[#A855F7]" />
          </div>
          <span className="text-3xl font-black text-[#A855F7] my-2">
            {refuelEfficiencyData.avgCostPerKm > 0 ? `R$ ${refuelEfficiencyData.avgCostPerKm.toFixed(2)}` : 'R$ 0,48'}
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
              <h3 className="text-sm font-black text-[#F8FAFC] tracking-tight">SAÚDE E VIDA ÚTIL DOS COMPONENTES (ONIX 1.0 LT)</h3>
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
                    <span className="text-xs font-black text-[#F8FAFC]">{item.config.name}</span>
                    <span className="text-[10px] text-[#94A3B8]">Intervalo: {item.config.kmInterval.toLocaleString('pt-BR')} KM</span>
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

              <div className="text-[10px] text-[#94A3B8] font-medium bg-[#0A0B0E] p-2 rounded-lg border border-[#1E293B]">
                <strong className="text-[#F8FAFC]">Peça Recomendada:</strong> {item.config.recommendedPart}
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
