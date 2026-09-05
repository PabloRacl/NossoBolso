import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { formatBRL } from '../../utilidades/formatters';
import { ShieldCheck, Calculator, DollarSign, Percent, AlertTriangle, Sparkles, TrendingUp, Award } from 'lucide-react';

export const PmpeConsignadoSimulatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isPrivacyMode } = useAppStore();

  // Parâmetros do Contracheque PMPE
  const [grossSalary, setGrossSalary] = useState<number>(8659.00); // Salário Bruto PMPE
  const [compulsoryDeductions, setCompulsoryDeductions] = useState<number>(1111.89); // IRRF + Proteção Social Militar
  const [existingConsignments, setExistingConsignments] = useState<number>(1250.00); // Descontos consignados atuais
  const [interestRateMonthly, setInterestRateMonthly] = useState<number>(1.65); // Taxa de juros consignado militar % a.m.
  const [installmentsCount, setInstallmentsCount] = useState<number>(84); // 84x ou 96x parcelas

  // Cálculo da Margem Consignável PMPE (35% Empréstimo + 10% Cartão = 45%)
  const marginMetrics = useMemo(() => {
    const netBase = Math.max(grossSalary - compulsoryDeductions, 0);

    const maxLoansMargin35 = netBase * 0.35; // 35% Empréstimo Consignado
    const maxCardMargin10 = netBase * 0.10; // 10% Cartão Benefício Consignado
    const maxTotalMargin45 = netBase * 0.45; // 45% Total de Margem Legal

    const remainingLoansMargin = Math.max(maxLoansMargin35 - existingConsignments, 0);
    const usedMarginPct = maxLoansMargin35 > 0 ? (existingConsignments / maxLoansMargin35) * 100 : 0;

    // Cálculo do Capital Máximo Liberado (VP de Anuidade): PMT * [(1 - (1+i)^-n) / i]
    const i = interestRateMonthly / 100;
    const n = installmentsCount;
    let maxCreditSimulated = 0;

    if (i > 0 && n > 0 && remainingLoansMargin > 0) {
      maxCreditSimulated = remainingLoansMargin * ((1 - Math.pow(1 + i, -n)) / i);
    }

    return {
      netBase,
      maxLoansMargin35,
      maxCardMargin10,
      maxTotalMargin45,
      remainingLoansMargin,
      usedMarginPct: Math.min(Math.round(usedMarginPct), 100),
      maxCreditSimulated: Math.round(maxCreditSimulated),
    };
  }, [grossSalary, compulsoryDeductions, existingConsignments, interestRateMonthly, installmentsCount]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulador de Margem Consignável Militar PMPE">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Apresentação */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Calculadora de Margem Consignável PMPE (35% + 10%)</h4>
            <p className="mt-1">
              Calcule a margem consignável líquida disponível na sua folha militar e o limite estimado de crédito liberado de acordo com a legislação vigente.
            </p>
          </div>
        </div>

        {/* Formulário de Dados da Folha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Salário Bruto PMPE (R$):</label>
            <input
              type="number"
              value={grossSalary}
              onChange={(e) => setGrossSalary(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Descontos Compulsórios (IRRF + Previdência R$):</label>
            <input
              type="number"
              value={compulsoryDeductions}
              onChange={(e) => setCompulsoryDeductions(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Consignados Atuais Descontados (R$/mês):</label>
            <input
              type="number"
              value={existingConsignments}
              onChange={(e) => setExistingConsignments(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Taxa de Juros a.m. (%):</label>
            <input
              type="number"
              step="0.05"
              value={interestRateMonthly}
              onChange={(e) => setInterestRateMonthly(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>
        </div>

        {/* Telemetria de Margem */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">Margem 35% Bruta</span>
            <span className="text-xl font-black text-[#F8FAFC] my-1">
              {formatBRL(marginMetrics.maxLoansMargin35, isPrivacyMode)}
            </span>
            <span className="text-[10px] text-[#64748B]">Limite legal para empréstimos</span>
          </div>

          <div className="p-4 bg-[#090D18] border border-[#00FF88]/40 shadow-[0_0_15px_rgba(0,255,136,0.1)] rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#00FF88]">Margem Livre Restante</span>
            <span className="text-xl font-black text-[#00FF88] my-1">
              {formatBRL(marginMetrics.remainingLoansMargin, isPrivacyMode)}
            </span>
            <span className="text-[10px] text-[#94A3B8]">Disponível para novos empréstimos</span>
          </div>

          <div className="p-4 bg-[#090D18] border border-[#06B6D4]/40 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-[#06B6D4]">Crédito Liberado Simulado</span>
            <span className="text-xl font-black text-[#06B6D4] my-1">
              {formatBRL(marginMetrics.maxCreditSimulated, isPrivacyMode)}
            </span>
            <span className="text-[10px] text-[#94A3B8]">Em {installmentsCount}x de {formatBRL(marginMetrics.remainingLoansMargin, isPrivacyMode)}</span>
          </div>
        </div>

        {/* Barra de Comprometimento da Margem */}
        <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#94A3B8]">Comprometimento da Margem de 35%:</span>
            <span className={marginMetrics.usedMarginPct >= 80 ? 'text-[#FF4D6D]' : 'text-[#00FF88]'}>
              {marginMetrics.usedMarginPct}% Utilizada ({formatBRL(existingConsignments, isPrivacyMode)})
            </span>
          </div>
          <div className="w-full h-3 bg-[#0A0B0E] rounded-full overflow-hidden border border-[#2E3B52]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                marginMetrics.usedMarginPct >= 80 ? 'bg-[#FF4D6D]' : 'bg-[#00FF88]'
              }`}
              style={{ width: `${marginMetrics.usedMarginPct}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
