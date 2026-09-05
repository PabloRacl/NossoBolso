import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { formatBRL } from '../../utilidades/formatters';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { Compass, Sparkles, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const WhatIfSimulatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isPrivacyMode } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const currentBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const currentDebt = debtContracts.reduce((acc, d) => acc + (d.totalAmount || d.installmentAmount * d.totalInstallments), 0);
  const currentNetWorth = currentBalance - currentDebt;

  const currentIncome = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const currentExpense = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  // Parâmetros de Simulação "E Se?"
  const [assetSaleAmount, setAssetSaleAmount] = useState<number>(0);
  const [debtPayoffAmount, setDebtPayoffAmount] = useState<number>(0);
  const [monthlyCutAmount, setMonthlyCutAmount] = useState<number>(0);

  // Resultados Simulados
  const simulatedNetWorth = currentNetWorth + assetSaleAmount - debtPayoffAmount;
  const simulatedMonthlyExpense = Math.max(currentExpense - monthlyCutAmount, 0);
  const simulatedMonthlySavings = Math.max(currentIncome - simulatedMonthlyExpense, 0);
  const annualSavingsDelta = (currentExpense - simulatedMonthlyExpense) * 12;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulador de Cenários Estratégicos 'E Se?'">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Apresentação */}
        <div className="p-4 bg-gradient-to-r from-[#06B6D4]/15 via-[#00FF88]/10 to-[#0D1526] border border-[#06B6D4]/30 rounded-2xl flex items-start gap-3">
          <Compass className="w-6 h-6 text-[#06B6D4] shrink-0 mt-0.5 animate-spin-slow" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Laboratório de Decisão Financeira</h4>
            <p className="mt-1">
              Simule o impacto imediato de vender um bem, quitar um consignado ou cortar gastos sem alterar os seus dados reais!
            </p>
          </div>
        </div>

        {/* Inputs da Simulação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">E se eu vender um bem por (R$):</label>
            <input
              type="number"
              value={assetSaleAmount}
              onChange={(e) => setAssetSaleAmount(Number(e.target.value))}
              placeholder="Ex: 45000 (Vender Carro)"
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">E se eu quitar dívidas no valor de (R$):</label>
            <input
              type="number"
              value={debtPayoffAmount}
              onChange={(e) => setDebtPayoffAmount(Number(e.target.value))}
              placeholder="Ex: 25000 (Quitar Empréstimo)"
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">E se eu cortar de despesas (R$/mês):</label>
            <input
              type="number"
              value={monthlyCutAmount}
              onChange={(e) => setMonthlyCutAmount(Number(e.target.value))}
              placeholder="Ex: 400 (Economia Mensal)"
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>
        </div>

        {/* Comparador Antes x Depois */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Antes */}
          <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-[#94A3B8] border-b border-[#1E293B] pb-2">
              📍 Estado Atual (Real)
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Patrimônio Líquido:</span>
              <strong className="text-[#F8FAFC]">{formatBRL(currentNetWorth, isPrivacyMode)}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Gastos Mensais Executados:</span>
              <strong className="text-[#FF4D6D]">{formatBRL(currentExpense, isPrivacyMode)}</strong>
            </div>
          </div>

          {/* Depois (Simulado) */}
          <div className="p-4 bg-[#090D18] border border-[#00FF88]/40 shadow-[0_0_20px_rgba(0,255,136,0.15)] rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-[#00FF88] border-b border-[#00FF88]/30 pb-2 flex items-center justify-between">
              <span>✨ Cenário Simulado ("E Se?")</span>
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Novo Patrimônio Líquido:</span>
              <strong className="text-[#00FF88] text-sm">{formatBRL(simulatedNetWorth, isPrivacyMode)}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Novos Gastos Mensais:</span>
              <strong className="text-[#06B6D4] text-sm">{formatBRL(simulatedMonthlyExpense, isPrivacyMode)}</strong>
            </div>
          </div>
        </div>

        {/* Parecer do Cenário */}
        {annualSavingsDelta > 0 && (
          <div className="p-4 bg-[#00FF88]/15 border border-[#00FF88]/40 rounded-2xl flex items-center justify-between text-xs text-[#00FF88] font-bold">
            <span>Economia acumulada estimada em 1 ano com essa decisão:</span>
            <strong className="text-sm font-black">{formatBRL(annualSavingsDelta, isPrivacyMode)} / ano</strong>
          </div>
        )}
      </div>
    </Modal>
  );
};
