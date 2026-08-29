import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VehicleRecord, VehicleRecordType, Wallet } from '../../types';
import { db } from '../../services/db';

interface VehicleRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  editingRecord?: VehicleRecord | null;
}

export const VehicleRecordModal: React.FC<VehicleRecordModalProps> = ({
  isOpen,
  onClose,
  wallets,
  editingRecord,
}) => {
  const [vehicleName, setVehicleName] = useState('Honda Civic 2.0');
  const [type, setType] = useState<VehicleRecordType>('refuel');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [odometerKm, setOdometerKm] = useState('45800');
  const [totalCost, setTotalCost] = useState('230.00');
  const [liters, setLiters] = useState('40.0');
  const [pricePerLiter, setPricePerLiter] = useState('5.75');
  const [fuelType, setFuelType] = useState<'gasoline' | 'ethanol' | 'diesel' | 'gnv'>('gasoline');
  const [description, setDescription] = useState('Abastecimento Posto BR');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || 'w1');

  useEffect(() => {
    if (editingRecord && isOpen) {
      setVehicleName(editingRecord.vehicleName);
      setType(editingRecord.type);
      setDate(editingRecord.date);
      setOdometerKm(editingRecord.odometerKm.toString());
      setTotalCost(editingRecord.totalCost.toString());
      setLiters(editingRecord.liters ? editingRecord.liters.toString() : '');
      setPricePerLiter(editingRecord.pricePerLiter ? editingRecord.pricePerLiter.toString() : '');
      setFuelType(editingRecord.fuelType || 'gasoline');
      setDescription(editingRecord.description || '');
      if (editingRecord.walletId) setSelectedWalletId(editingRecord.walletId);
    } else if (isOpen && !editingRecord) {
      setVehicleName('Honda Civic 2.0');
      setType('refuel');
      setDate(new Date().toISOString().substring(0, 10));
      setOdometerKm('45800');
      setTotalCost('230.00');
      setLiters('40.0');
      setPricePerLiter('5.75');
      setFuelType('gasoline');
      setDescription('Abastecimento Posto BR');
      if (wallets[0]?.id) setSelectedWalletId(wallets[0].id);
    }
  }, [editingRecord, isOpen, wallets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(totalCost) || 0;
    const km = parseFloat(odometerKm) || 0;
    const ltrs = parseFloat(liters) || 0;
    const priceLtr = parseFloat(pricePerLiter) || 0;

    if (cost <= 0 || km <= 0) return;

    if (editingRecord) {
      // Editar Registro Existente
      await db.vehicleRecords.update(editingRecord.id, {
        vehicleName,
        type,
        date,
        odometerKm: km,
        totalCost: cost,
        liters: type === 'refuel' ? ltrs : undefined,
        pricePerLiter: type === 'refuel' ? priceLtr : undefined,
        fuelType: type === 'refuel' ? fuelType : undefined,
        description: description.trim() || (type === 'refuel' ? 'Abastecimento' : 'Manutenção'),
        walletId: selectedWalletId,
      });
    } else {
      // Gravar Novo Registro
      await db.vehicleRecords.add({
        id: `vr_${Date.now()}`,
        vehicleName,
        type,
        date,
        odometerKm: km,
        totalCost: cost,
        liters: type === 'refuel' ? ltrs : undefined,
        pricePerLiter: type === 'refuel' ? priceLtr : undefined,
        fuelType: type === 'refuel' ? fuelType : undefined,
        description: description.trim() || (type === 'refuel' ? 'Abastecimento' : 'Manutenção'),
        walletId: selectedWalletId,
        createdAt: new Date().toISOString(),
      });

      // Lançar despesa no NossoBolso
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

      // Debitar do saldo da carteira
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
      title={editingRecord ? `Editar Registro (${editingRecord.vehicleName})` : 'Novo Registro de Veículo'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {/* Veículo & Tipo de Lançamento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Nome do Veículo</label>
            <input
              type="text"
              required
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="Ex: Honda Civic, Corolla, Moto..."
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
              <option value="refuel">⛽ Abastecimento</option>
              <option value="maintenance">🛠️ Manutenção / Revisão</option>
              <option value="tax">📄 IPVA / Licenciamento</option>
              <option value="insurance">🛡️ Seguro Automotivo</option>
            </select>
          </div>
        </div>

        {/* Data & Odômetro KM */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Quilometragem (KM)</label>
            <input
              type="number"
              required
              min="0"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              placeholder="Ex: 45800"
              className="w-full h-11 px-3 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#00FF88] font-black focus:outline-none"
            />
          </div>
        </div>

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
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Valor Total (R$)</label>
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
            <label className="text-xs font-bold text-[#94A3B8] uppercase">Descrição / Detalhes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Troca de Óleo, Licenciamento..."
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
            {editingRecord ? 'Salvar Alterações' : 'Salvar & Lançar no NossoBolso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
