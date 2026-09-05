import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VehicleRecord, VehicleRecordType, ComponentCategory, Wallet } from '../../tipos';
import { db } from '../../servicos/db';

interface VehicleRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  editingRecord?: VehicleRecord | null;
  currentVehicleId?: string;
  currentVehicleName?: string;
}

// Preset de Peças e Especificações de Fábrica do Chevrolet Onix 1.0 LT (2017/2018)
const ONIX_PARTS_PRESETS: Record<ComponentCategory, { name: string; partNumber: string; kmInterval: number; yearInterval: number; defaultCost: number }> = {
  oil: {
    name: 'Troca de Óleo 5W30 Sintético + Filtro',
    partNumber: 'ACDelco 5W30 API SN Dexos1 Gen2 (3.5L) / Filtro ACDelco 88905845',
    kmInterval: 10000,
    yearInterval: 1,
    defaultCost: 280.00,
  },
  timing_belt: {
    name: 'Troca da Correia Dentada e Tensor',
    partNumber: 'Correia GM ACDelco 93353848 + Tensor Rolamento GM',
    kmInterval: 60000,
    yearInterval: 5,
    defaultCost: 550.00,
  },
  tires: {
    name: 'Troca de Pneus & Alinhamento/Balanceamento',
    partNumber: 'Pneus 185/65 R15 88H (Pressão: 35 PSI Diant / 35 PSI Tras)',
    kmInterval: 40000,
    yearInterval: 3,
    defaultCost: 1200.00,
  },
  brakes: {
    name: 'Troca de Pastilhas e Discos de Freio',
    partNumber: 'Pastilhas Cobreq N-358 / Fras-le PD/1446 + Fluido DOT 4 ACDelco',
    kmInterval: 25000,
    yearInterval: 2,
    defaultCost: 320.00,
  },
  spark_plugs: {
    name: 'Troca de Velas de Ignição e Cabos',
    partNumber: 'Velas NGK BR7ES-D (Folga 0.8mm) + Cabos NGK SC-G73',
    kmInterval: 30000,
    yearInterval: 3,
    defaultCost: 240.00,
  },
  filters: {
    name: 'Kit de Filtros (Ar Motor, Combustível e Cabine)',
    partNumber: 'Filtro Ar ARL8832 / Combustível GI04/7 / Cabine ACP883',
    kmInterval: 10000,
    yearInterval: 1,
    defaultCost: 140.00,
  },
  coolant: {
    name: 'Troca do Fluido de Arrefecimento + Limpeza',
    partNumber: 'Aditivo Etilenoglicol Rosa Organico ACDelco 50% (5.4L)',
    kmInterval: 30000,
    yearInterval: 2,
    defaultCost: 190.00,
  },
  battery: {
    name: 'Substituição de Bateria 12V',
    partNumber: 'Bateria Moura ou ACDelco 60Ah Selada (CCA 450A)',
    kmInterval: 50000,
    yearInterval: 2.5,
    defaultCost: 450.00,
  },
  general: {
    name: 'Revisão Geral e Diagnóstico',
    partNumber: 'Checagem Injeção, Suspensão e Sensores OBD2',
    kmInterval: 10000,
    yearInterval: 1,
    defaultCost: 200.00,
  },
};

export const VehicleRecordModal: React.FC<VehicleRecordModalProps> = ({
  isOpen,
  onClose,
  wallets,
  editingRecord,
  currentVehicleId,
  currentVehicleName,
}) => {
  const [vehicleName, setVehicleName] = useState(currentVehicleName || 'Chevrolet Onix 1.0 LT (2017/2018)');
  const [type, setType] = useState<VehicleRecordType>('maintenance');
  const [componentCategory, setComponentCategory] = useState<ComponentCategory>('oil');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [odometerKm, setOdometerKm] = useState('45400');
  const [totalCost, setTotalCost] = useState('280.00');
  const [liters, setLiters] = useState('40.0');
  const [pricePerLiter, setPricePerLiter] = useState('5.75');
  const [fuelType, setFuelType] = useState<'gasoline' | 'ethanol' | 'diesel' | 'gnv'>('gasoline');
  const [description, setDescription] = useState(ONIX_PARTS_PRESETS.oil.name);
  const [partNumber, setPartNumber] = useState(ONIX_PARTS_PRESETS.oil.partNumber);
  const [nextDueKm, setNextDueKm] = useState('55400');
  const [nextDueDate, setNextDueDate] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || 'w1');

  // Auto-fill Onix Specs upon changing Component Category
  const handleComponentCategoryChange = (cat: ComponentCategory) => {
    setComponentCategory(cat);
    const preset = ONIX_PARTS_PRESETS[cat];
    if (preset) {
      setDescription(preset.name);
      setPartNumber(preset.partNumber);
      setTotalCost(preset.defaultCost.toFixed(2));
      const kmCurrent = parseFloat(odometerKm) || 45400;
      const targetKm = kmCurrent + preset.kmInterval;
      setNextDueKm(targetKm.toString());

      const today = new Date();
      today.setFullYear(today.getFullYear() + Math.floor(preset.yearInterval));
      setNextDueDate(today.toISOString().substring(0, 10));
    }
  };

  const handleOdometerChange = (val: string) => {
    setOdometerKm(val);
    const kmNum = parseFloat(val) || 0;
    const preset = ONIX_PARTS_PRESETS[componentCategory];
    if (preset && kmNum > 0) {
      setNextDueKm((kmNum + preset.kmInterval).toString());
    }
  };

  useEffect(() => {
    if (editingRecord && isOpen) {
      setVehicleName(editingRecord.vehicleName);
      setType(editingRecord.type);
      if (editingRecord.componentCategory) setComponentCategory(editingRecord.componentCategory);
      setDate(editingRecord.date);
      setOdometerKm(editingRecord.odometerKm.toString());
      setTotalCost(editingRecord.totalCost.toString());
      setLiters(editingRecord.liters ? editingRecord.liters.toString() : '');
      setPricePerLiter(editingRecord.pricePerLiter ? editingRecord.pricePerLiter.toString() : '');
      setFuelType(editingRecord.fuelType || 'gasoline');
      setDescription(editingRecord.description || '');
      setPartNumber(editingRecord.partNumber || '');
      setNextDueKm(editingRecord.nextDueKm ? editingRecord.nextDueKm.toString() : '');
      setNextDueDate(editingRecord.nextDueDate || '');
      if (editingRecord.walletId) setSelectedWalletId(editingRecord.walletId);
    } else if (isOpen && !editingRecord) {
      if (currentVehicleName) setVehicleName(currentVehicleName);
      setType('maintenance');
      setComponentCategory('oil');
      setDate(new Date().toISOString().substring(0, 10));
      setOdometerKm('45400');
      handleComponentCategoryChange('oil');
      if (wallets[0]?.id) setSelectedWalletId(wallets[0].id);
    }
  }, [editingRecord, isOpen, wallets, currentVehicleName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(totalCost) || 0;
    const km = parseFloat(odometerKm) || 0;
    const ltrs = parseFloat(liters) || 0;
    const priceLtr = parseFloat(pricePerLiter) || 0;
    const dueKm = parseFloat(nextDueKm) || undefined;

    if (cost < 0 || km <= 0) return;

    if (editingRecord) {
      // Editar Registro Existente
      await db.vehicleRecords.update(editingRecord.id, {
        vehicleId: currentVehicleId || editingRecord.vehicleId,
        vehicleName,
        type,
        componentCategory: type === 'maintenance' ? componentCategory : undefined,
        date,
        odometerKm: km,
        totalCost: cost,
        liters: type === 'refuel' ? ltrs : undefined,
        pricePerLiter: type === 'refuel' ? priceLtr : undefined,
        fuelType: type === 'refuel' ? fuelType : undefined,
        description: description.trim() || (type === 'refuel' ? 'Abastecimento' : 'Manutenção'),
        partNumber: partNumber.trim() || undefined,
        nextDueKm: type === 'maintenance' ? dueKm : undefined,
        nextDueDate: type === 'maintenance' ? nextDueDate : undefined,
        walletId: selectedWalletId,
      });
    } else {
      // Gravar Novo Registro Automotivo
      await db.vehicleRecords.add({
        id: `vr_${Date.now()}`,
        vehicleId: currentVehicleId,
        vehicleName,
        type,
        componentCategory: type === 'maintenance' ? componentCategory : undefined,
        date,
        odometerKm: km,
        totalCost: cost,
        liters: type === 'refuel' ? ltrs : undefined,
        pricePerLiter: type === 'refuel' ? priceLtr : undefined,
        fuelType: type === 'refuel' ? fuelType : undefined,
        description: description.trim() || (type === 'refuel' ? 'Abastecimento' : 'Manutenção'),
        partNumber: partNumber.trim() || undefined,
        nextDueKm: type === 'maintenance' ? dueKm : undefined,
        nextDueDate: type === 'maintenance' ? nextDueDate : undefined,
        walletId: selectedWalletId,
        createdAt: new Date().toISOString(),
      });

      // Lançar despesa financeira automaticamente no NossoBolso
      const categoryName = type === 'refuel' ? 'Transporte' : type === 'maintenance' ? 'Manutenção Veículo' : 'Impostos & Taxas';
      await db.transactions.add({
        id: `auto_${Date.now()}`,
        description: `[Veículo] ${vehicleName} - ${description.trim() || type}`,
        amount: cost,
        date,
        type: 'expense',
        category: categoryName,
        walletId: selectedWalletId,
        createdAt: new Date().toISOString(),
      });

      // Debitar valor do saldo da carteira
      const wallet = await db.wallets.get(selectedWalletId);
      if (wallet) {
        await db.wallets.update(selectedWalletId, { balance: wallet.balance - cost });
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? `Editar Registro (${editingRecord.vehicleName})` : 'Manutenção & Especificações Veiculares'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {/* Nome do Veículo & Tipo de Lançamento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Veículo</label>
            <input
              type="text"
              required
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="Ex: Chevrolet Onix 1.0 LT 2017/2018..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Tipo de Registro</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleRecordType)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none cursor-pointer"
            >
              <option value="maintenance">🛠️ Manutenção / Revisão de Peças</option>
              <option value="refuel">⛽ Abastecimento (Tanque)</option>
              <option value="tax">📄 IPVA / Licenciamento / DPVAT</option>
              <option value="insurance">🛡️ Seguro Automotivo</option>
            </select>
          </div>
        </div>

        {/* Seção Específica para Manutenção com Especificações do Onix */}
        {type === 'maintenance' && (
          <div className="p-3.5 bg-[#090D18] border border-[#00FF88]/40 rounded-xl flex flex-col gap-3 shadow-[0_0_15px_rgba(0,255,136,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#00FF88] flex items-center gap-1.5">
                🚘 Especificação de Peça (Chevrolet Onix 2017/2018)
              </span>
              <span className="text-[10px] bg-[#00FF88]/15 text-[#00FF88] px-2 py-0.5 rounded-md font-bold border border-[#00FF88]/30">
                Preset de Fábrica
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8]">Selecione o Componente / Peça</label>
                <select
                  value={componentCategory}
                  onChange={(e) => handleComponentCategoryChange(e.target.value as ComponentCategory)}
                  className="w-full h-10 px-2.5 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value="oil">🛢️ Óleo do Motor & Filtro (5W30 Dexos1 Gen2)</option>
                  <option value="timing_belt">⚙️ Correia Dentada & Tensor GM</option>
                  <option value="tires">🛞 Pneus 185/65 R15 & Alinhamento</option>
                  <option value="brakes">🛑 Pastilhas Cobreq N-358 & Discos</option>
                  <option value="spark_plugs">⚡ Velas NGK BR7ES-D & Cabos</option>
                  <option value="filters">🌬️ Filtro de Ar Motor / Cabine / Combustível</option>
                  <option value="coolant">🌡️ Fluido de Arrefecimento ACDelco 50%</option>
                  <option value="battery">🔋 Bateria 12V (60Ah Selada)</option>
                  <option value="general">🔧 Outros Serviços & Diagnóstico OBD2</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#94A3B8]">Código / Modelo Recomendado</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const q = encodeURIComponent(`peca ${vehicleName} ${partNumber || description}`);
                        window.open(`https://www.google.com/search?q=${q}`, '_blank');
                      }}
                      className="text-[10px] font-bold text-[#06B6D4] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Pesquisar especificações no Google"
                    >
                      🔍 Google
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = encodeURIComponent(`peca ${vehicleName} ${partNumber || description}`);
                        window.open(`https://lista.mercadolivre.com.br/${q}`, '_blank');
                      }}
                      className="text-[10px] font-bold text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Pesquisar preços no Mercado Livre"
                    >
                      🛒 Mercado Livre
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Ex: ACDelco 5W30 Dexos1 Gen2..."
                  className="w-full h-10 px-2.5 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F59E0B] font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data & Odômetro KM Atual */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Data do Serviço</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">KM Odômetro Atual</label>
            <input
              type="number"
              required
              min="0"
              value={odometerKm}
              onChange={(e) => handleOdometerChange(e.target.value)}
              placeholder="Ex: 45400"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
            />
          </div>
        </div>

        {/* Projeção de Próxima Troca (Automação de Lembrete e Orçamento) */}
        {type === 'maintenance' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#12141A] border border-[#2E3B52] rounded-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#00FF88] uppercase">🎯 Próxima Troca (KM Target)</label>
              <input
                type="number"
                value={nextDueKm}
                onChange={(e) => setNextDueKm(e.target.value)}
                placeholder="Ex: 55400 KM"
                className="w-full h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#06B6D4] uppercase">📅 Próxima Data de Troca</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#06B6D4] font-bold focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Campos Específicos para Abastecimento */}
        {type === 'refuel' ? (
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#12141A] border border-[#2E3B52] rounded-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalCost}
                onChange={(e) => {
                  setTotalCost(e.target.value);
                  const c = parseFloat(e.target.value) || 0;
                  const p = parseFloat(pricePerLiter) || 1;
                  if (p > 0) setLiters((c / p).toFixed(2));
                }}
                className="w-full h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Preço/Litro (R$)</label>
              <input
                type="number"
                step="0.01"
                value={pricePerLiter}
                onChange={(e) => {
                  setPricePerLiter(e.target.value);
                  const c = parseFloat(totalCost) || 0;
                  const p = parseFloat(e.target.value) || 1;
                  if (p > 0) setLiters((c / p).toFixed(2));
                }}
                className="w-full h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F59E0B] font-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Litros Abastecidos</label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                className="w-full h-10 px-2 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-black focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Valor do Serviço / Custo (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-sm text-[#00FF88] font-black focus:outline-none"
            />
          </div>
        )}

        {/* Descrição & Carteira Usada */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Descrição do Serviço / Notas</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Troca de Óleo ACDelco 5W30..."
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Forma de Pagamento</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none cursor-pointer"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2330]">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {editingRecord ? 'Salvar Alterações' : 'Registrar & Agendar Lembrete'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
