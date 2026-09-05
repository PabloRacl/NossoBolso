import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatBRL } from '../../utilidades/formatters';

interface DebtContractSummaryProps {
  totalInstallmentsNum: number;
  finalInstallmentVal: number;
  totalContractCost: number;
  paidCount: number;
  paidTotalCost: number;
  remainingCount: number;
  remainingTotalCost: number;
  startNum: number;
}

export const DebtContractSummary: React.FC<DebtContractSummaryProps> = ({
  totalInstallmentsNum,
  finalInstallmentVal,
  totalContractCost,
  paidCount,
  paidTotalCost,
  remainingCount,
  remainingTotalCost,
  startNum,
}) => {
  return (
    <motion.div
      key="price-summary"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-4 bg-gradient-to-br from-[#121929] to-[#0A0D18] border border-[#00FF88]/30 rounded-2xl flex flex-col gap-3 shadow-lg"
    >
      <div className="flex items-center justify-between text-xs font-black text-[#94A3B8] border-b border-[#2E3B52] pb-2">
        <span className="flex items-center gap-1.5 text-[#F8FAFC]">
          <Sparkles className="w-4 h-4 text-[#00FF88]" />
          <span>RESUMO FINANCEIRO CONTRATADO</span>
        </span>
        <span className="text-[#00FF88] font-mono">
          {totalInstallmentsNum} PARCELAS DE {formatBRL(finalInstallmentVal)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex flex-col">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase">Custo Total ({totalInstallmentsNum}x)</span>
          <span className="text-sm font-black text-[#00FF88] mt-1">{formatBRL(totalContractCost)}</span>
          <span className="text-[9px] text-[#64748B] font-medium mt-0.5">Contrato completo</span>
        </div>

        <div className="p-3 bg-[#0D1424] border border-[#10B981]/30 rounded-xl flex flex-col">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase">Já Pago ({paidCount}x)</span>
          <span className="text-sm font-black text-[#10B981] mt-1">{formatBRL(paidTotalCost)}</span>
          <span className="text-[9px] text-[#10B981] font-medium mt-0.5">
            {paidCount > 0 ? `Parcelas 1 até ${paidCount}` : 'Nenhuma paga'}
          </span>
        </div>

        <div className="p-3 bg-[#0D1424] border border-[#F59E0B]/30 rounded-xl flex flex-col">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase">Saldo Devedor ({remainingCount}x)</span>
          <span className="text-sm font-black text-[#F59E0B] mt-1">{formatBRL(remainingTotalCost)}</span>
          <span className="text-[9px] text-[#F59E0B] font-medium mt-0.5">
            Parcela {startNum} até {totalInstallmentsNum}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
