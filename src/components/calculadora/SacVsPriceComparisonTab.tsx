import React from 'react';
import { Card } from '../ui/Card';
import { Scale, Sparkles } from 'lucide-react';
import { formatBRL } from '../../utilidades/formatters';

interface SacVsPriceComparisonTabProps {
  compFinanced: string;
  setCompFinanced: (v: string) => void;
  compRate: string;
  setCompRate: (v: string) => void;
  compRateType: 'monthly' | 'yearly';
  setCompRateType: (v: 'monthly' | 'yearly') => void;
  compInstallments: string;
  setCompInstallments: (v: string) => void;
  comparisonResults: {
    price: {
      firstInstallment: number;
      lastInstallment: number;
      total: number;
      interest: number;
    };
    sac: {
      firstInstallment: number;
      lastInstallment: number;
      total: number;
      interest: number;
    };
    sacSavings: number;
  };
}

export const SacVsPriceComparisonTab: React.FC<SacVsPriceComparisonTabProps> = ({
  compFinanced,
  setCompFinanced,
  compRate,
  setCompRate,
  compRateType,
  setCompRateType,
  compInstallments,
  setCompInstallments,
  comparisonResults,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Formulário de Financiamento */}
      <Card className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border-l-4 border-l-[#38BDF8]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Valor a Financiar (R$)
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={compFinanced}
            onChange={(e) => setCompFinanced(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Taxa de Juros Nominal
          </label>
          <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl overflow-hidden h-11 focus-within:border-[#38BDF8]">
            <input
              type="number"
              step="0.1"
              min="0"
              value={compRate}
              onChange={(e) => setCompRate(e.target.value)}
              className="w-full px-4 text-sm bg-transparent text-[#F8FAFC] focus:outline-none"
            />
            <select
              value={compRateType}
              onChange={(e) => setCompRateType(e.target.value as 'monthly' | 'yearly')}
              className="px-3 text-xs font-bold bg-[#162032] text-[#94A3B8] h-full focus:outline-none cursor-pointer border-l border-[#2E3B52]"
            >
              <option value="yearly">% a.a.</option>
              <option value="monthly">% a.m.</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
            Prazo (Parcelas Mensais)
          </label>
          <input
            type="number"
            min="12"
            max="420"
            value={compInstallments}
            onChange={(e) => setCompInstallments(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
          />
        </div>
      </Card>

      {/* Resultado Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PRICE Card */}
        <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#38BDF8]">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
              <span>🚗 Tabela PRICE</span>
            </h4>
            <span className="text-[10px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-1 rounded-full">
              Parcelas Fixas
            </span>
          </div>

          <div className="flex flex-col gap-3 py-2 border-y border-[#1E293B]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Valor das Parcelas (1ª à última):</span>
              <span className="font-bold text-[#F8FAFC]">
                {formatBRL(comparisonResults.price.firstInstallment)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Total Pago em Juros:</span>
              <span className="font-bold text-[#F59E0B]">{formatBRL(comparisonResults.price.interest)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-black pt-1">
            <span className="text-[#94A3B8]">Custo Total Final:</span>
            <span className="text-lg text-[#F8FAFC]">{formatBRL(comparisonResults.price.total)}</span>
          </div>
        </Card>

        {/* SAC Card */}
        <Card className="flex flex-col gap-4 p-6 border-t-4 border-t-[#00FF88] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
              <span>🏠 Sistema SAC</span>
            </h4>
            <span className="text-[10px] font-bold text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/20 px-2.5 py-1 rounded-full">
              Parcelas Decrescentes
            </span>
          </div>

          <div className="flex flex-col gap-3 py-2 border-y border-[#1E293B]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">1ª Parcela (Inicial):</span>
              <span className="font-bold text-[#F8FAFC]">
                {formatBRL(comparisonResults.sac.firstInstallment)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Última Parcela (Final):</span>
              <span className="font-bold text-[#00FF88]">{formatBRL(comparisonResults.sac.lastInstallment)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Total Pago em Juros:</span>
              <span className="font-bold text-[#F59E0B]">{formatBRL(comparisonResults.sac.interest)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-black pt-1">
            <span className="text-[#94A3B8]">Custo Total Final:</span>
            <span className="text-lg text-[#00FF88]">{formatBRL(comparisonResults.sac.total)}</span>
          </div>
        </Card>
      </div>

      {/* Banner de Economia SAC vs PRICE */}
      <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 to-[#06B6D4]/15 border border-[#00FF88]/30 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00FF88]/20 text-[#00FF88] rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-sm font-extrabold text-[#F8FAFC]">Economia do Sistema SAC</h5>
            <p className="text-xs text-[#94A3B8]">Escolhendo o SAC você economiza no final do contrato:</p>
          </div>
        </div>
        <div className="text-xl font-black text-[#00FF88]">
          {formatBRL(Math.max(comparisonResults.sacSavings, 0))}
        </div>
      </div>
    </div>
  );
};
