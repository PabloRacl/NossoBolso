import React from 'react';
import { Flame, Sparkles, Fuel, Wrench, Trash2 } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';
import { VehicleRecord } from '../../tipos';

interface VehicleFuelTabProps {
  gasolinePrice: string;
  setGasolinePrice: (v: string) => void;
  ethanolPrice: string;
  setEthanolPrice: (v: string) => void;
  flexCalc: {
    ratio: number;
    recommend: string;
  };
  refuelRecords: (VehicleRecord & { kmPerLiter?: number; costPerKm?: number })[];
  isPrivacyMode: boolean;
  onEditRecord: (record: VehicleRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const VehicleFuelTab: React.FC<VehicleFuelTabProps> = ({
  gasolinePrice,
  setGasolinePrice,
  ethanolPrice,
  setEthanolPrice,
  flexCalc,
  refuelRecords,
  isPrivacyMode,
  onEditRecord,
  onDeleteRecord,
}) => {
  return (
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Paridade Atual: {flexCalc.ratio.toFixed(1)}%
            </span>
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
              {refuelRecords.map((item) => (
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
                        onClick={() => onEditRecord(item)}
                        className="p-1 text-[#94A3B8] hover:text-[#00FF88] transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(item.id)}
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
  );
};
