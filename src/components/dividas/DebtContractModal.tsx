import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTodayStr } from '../../utils/dateUtils';
import { formatBRL } from '../../utils/formatters';
import { Car, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DebtContractModal: React.FC = () => {
  const { 
    isDebtContractModalOpen, 
    setDebtContractModalOpen,
    editingDebtContractId,
    setEditingDebtContractId
  } = useAppStore();
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const [title, setTitle] = useState('');
  const [amortizationSystem, setAmortizationSystem] = useState<'price' | 'sac'>('price');
  const [totalInstallments, setTotalInstallments] = useState('36'); // Prazo Total Contratado (ex: 36)
  const [installmentAmount, setInstallmentAmount] = useState(''); // Usado para PRICE (Valor da Parcela)
  const [financedAmount, setFinancedAmount] = useState(''); // Usado para SAC (Valor Financiado)
  const [interestRate, setInterestRate] = useState('');
  const [interestRateType, setInterestRateType] = useState<'monthly' | 'yearly'>('monthly');
  const [insuranceAmount, setInsuranceAmount] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [category, setCategory] = useState('Financiamentos & Veículos');
  const [walletId, setWalletId] = useState('');
  
  // Controle de contrato em andamento
  const [isOngoing, setIsOngoing] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState('0'); // Quantas parcelas já foram pagas (ex: 5)
  const [startInstallmentNum, setStartInstallmentNum] = useState('1'); // Próxima Parcela Nº (ex: 6)

  // Efeito para popular o formulário no modo de edição
  useEffect(() => {
    if (editingDebtContractId) {
      db.debtContracts.get(editingDebtContractId).then((contract) => {
        if (contract) {
          setTitle(contract.title);
          setAmortizationSystem(contract.amortizationSystem || 'price');
          const startNum = contract.startInstallmentNum ?? 1;
          const paidCount = Math.max(startNum - 1, 0);
          setIsOngoing(startNum > 1);
          setStartInstallmentNum(String(startNum));
          setPaidInstallments(String(paidCount));
          setTotalInstallments(String(contract.totalInstallments)); // Mantém 36
          setInsuranceAmount(contract.insuranceAmount ? String(contract.insuranceAmount) : '');
          setInterestRate(contract.interestRate ? String(contract.interestRate) : '');
          setInterestRateType(contract.interestRateType || 'monthly');
          setStartDate(contract.startDate);
          setCategory(contract.category);
          setWalletId(contract.walletId);
          setInstallmentAmount(contract.installmentAmount ? String(contract.installmentAmount) : '');
          setFinancedAmount(contract.totalAmount ? String(contract.totalAmount) : '');
        }
      });
    }
  }, [editingDebtContractId]);

  // Sincronizador ao alterar Parcelas Já Pagas
  const handlePaidChange = (val: string) => {
    setPaidInstallments(val);
    const paidNum = parseInt(val) || 0;
    setStartInstallmentNum(String(paidNum + 1));
  };

  // Sincronizador ao alterar Próxima Parcela Nº
  const handleNextInstallmentChange = (val: string) => {
    setStartInstallmentNum(val);
    const nextNum = parseInt(val) || 1;
    setPaidInstallments(String(Math.max(nextNum - 1, 0)));
  };

  const handleClose = () => {
    setTitle('');
    setTotalInstallments('36');
    setInstallmentAmount('');
    setFinancedAmount('');
    setInterestRate('');
    setInterestRateType('monthly');
    setInsuranceAmount('');
    setStartDate(getTodayStr());
    setCategory('Financiamentos & Veículos');
    setWalletId('');
    setAmortizationSystem('price');
    setIsOngoing(false);
    setPaidInstallments('0');
    setStartInstallmentNum('1');
    setEditingDebtContractId(null);
    setDebtContractModalOpen(false);
  };

  const totalInstallmentsNum = Math.max(parseInt(totalInstallments) || 36, 1);
  const paidCount = isOngoing ? Math.max(parseInt(paidInstallments) || 0, 0) : 0;
  const startNum = isOngoing ? Math.max(parseInt(startInstallmentNum) || 1, 1) : 1;
  const remainingCount = Math.max(totalInstallmentsNum - paidCount, 1);
  const instVal = parseFloat(installmentAmount) || 0;
  const parsedInsurance = parseFloat(insuranceAmount) || 0;
  const finalInstallmentVal = instVal + parsedInsurance;
  const totalContractCost = totalInstallmentsNum * finalInstallmentVal;
  const paidTotalCost = paidCount * finalInstallmentVal;
  const remainingTotalCost = remainingCount * finalInstallmentVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(interestRate) || 0;

    if (totalInstallmentsNum <= 0 || startNum <= 0) return;

    const contractId = editingDebtContractId || ('debt_' + Math.random().toString(36).substring(2, 9));
    const selectedWalletId = walletId || (wallets[0]?.id ?? 'w1');

    const baseDate = new Date(startDate + 'T12:00:00');
    const transactionsToInsert = [];
    let calculatedTotalAmount = 0;

    if (amortizationSystem === 'price') {
      if (instVal <= 0) return;
      calculatedTotalAmount = totalContractCost;

      // Gerar TODAS as parcelas do contrato (da Parcela 1 até totalInstallmentsNum)
      for (let currentNum = 1; currentNum <= totalInstallmentsNum; currentNum++) {
        // Offset de meses em relação à próxima parcela (startNum)
        const offsetMonths = currentNum - startNum;
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + offsetMonths);

        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        transactionsToInsert.push({
          id: `tx_${contractId}_${currentNum}`,
          description: `${title.trim()} (${currentNum}/${totalInstallmentsNum})`,
          amount: finalInstallmentVal,
          date: formattedDate,
          type: 'expense' as const,
          category: category || 'Financiamentos & Veículos',
          walletId: selectedWalletId,
          contractId: contractId,
          installments: {
            current: currentNum,
            total: totalInstallmentsNum,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Sistema SAC - Gerar todas as parcelas do contrato
      const balanceToAmortize = parseFloat(financedAmount);
      if (isNaN(balanceToAmortize) || balanceToAmortize <= 0) return;

      const monthlyRate = interestRateType === 'yearly' ? (parsedRate / 12 / 100) : (parsedRate / 100);
      const monthlyAmortization = balanceToAmortize / totalInstallmentsNum;
      let runningBalance = balanceToAmortize;

      for (let currentNum = 1; currentNum <= totalInstallmentsNum; currentNum++) {
        const offsetMonths = currentNum - startNum;
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + offsetMonths);

        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const periodInterest = runningBalance * monthlyRate;
        const periodTotal = monthlyAmortization + periodInterest + parsedInsurance;
        const roundedTotal = instVal > 0 ? instVal : Math.round(periodTotal * 100) / 100;

        transactionsToInsert.push({
          id: `tx_${contractId}_${currentNum}`,
          description: `${title.trim()} (${currentNum}/${totalInstallmentsNum})`,
          amount: roundedTotal,
          date: formattedDate,
          type: 'expense' as const,
          category: category || 'Financiamentos & Veículos',
          walletId: selectedWalletId,
          contractId: contractId,
          installments: {
            current: currentNum,
            total: totalInstallmentsNum,
          },
          createdAt: new Date().toISOString(),
        });

        runningBalance -= monthlyAmortization;
        calculatedTotalAmount += roundedTotal;
      }
      if (calculatedTotalAmount === 0) calculatedTotalAmount = balanceToAmortize;
    }

    let originalCreatedAt = new Date().toISOString();
    if (editingDebtContractId) {
      const existing = await db.debtContracts.get(editingDebtContractId);
      if (existing) {
        originalCreatedAt = existing.createdAt;
      }
      await db.transactions.where('contractId').equals(contractId).delete();
    }

    const contractData = {
      id: contractId,
      title: title.trim(),
      totalInstallments: totalInstallmentsNum, // Guarda 360
      originalTotalInstallments: totalInstallmentsNum,
      installmentAmount: instVal > 0 ? instVal : (parseFloat(financedAmount) / totalInstallmentsNum),
      totalAmount: amortizationSystem === 'price' ? calculatedTotalAmount : parseFloat(financedAmount),
      interestRate: parsedRate > 0 ? parsedRate : undefined,
      interestRateType,
      amortizationSystem,
      insuranceAmount: parsedInsurance > 0 ? parsedInsurance : undefined,
      startInstallmentNum: isOngoing ? startNum : 1, // Ex: 6 (Próxima parcela)
      startDate,
      category: category || 'Financiamentos & Veículos',
      walletId: selectedWalletId,
      createdAt: originalCreatedAt,
    };

    await db.debtContracts.put(contractData);
    await db.transactions.bulkAdd(transactionsToInsert);

    handleClose();
  };

  return (
    <Modal
      isOpen={isDebtContractModalOpen}
      onClose={handleClose}
      title={editingDebtContractId ? "Editar Financiamento / Contrato de Dívida" : "Novo Financiamento / Contrato de Dívida"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Cabeçalho informativo */}
        <div className="relative overflow-hidden p-4 bg-[#12141A]/80 border border-[#2E3B52]/50 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="p-3 bg-[#F59E0B]/10 text-[#F59E0B] rounded-2xl border border-[#F59E0B]/20 shadow-inner">
            <Car className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-[#F8FAFC] tracking-wide">Contratos & Financiamentos</h4>
            <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5 leading-relaxed">
              Monitore a evolução do saldo devedor e parcelas do seu carro, imóvel ou empréstimos de longo prazo.
            </p>
          </div>
        </div>

        {/* Título do Contrato */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
            Título do Contrato / Descrição
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Desconto Folha: Bradesco S/A (Empréstimo ONIX)..."
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Seleção do Sistema de Amortização */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
            Sistema de Amortização
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-[#0A0B0E] border border-[#2E3B52]/60 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAmortizationSystem('price');
                setInterestRateType('monthly');
              }}
              className={`relative flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                amortizationSystem === 'price'
                  ? 'bg-[#1E293B] text-[#00FF88] border border-[#00FF88]/30 shadow-lg'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
              }`}
            >
              <span className="text-lg">🚗</span>
              <div className="flex flex-col items-start text-left">
                <span className="font-extrabold text-sm">Tabela PRICE</span>
                <span className="text-[9px] font-normal text-[#64748B]">Parcelas Fixas (ex: Carro)</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setAmortizationSystem('sac');
                setInterestRateType('yearly');
              }}
              className={`relative flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                amortizationSystem === 'sac'
                  ? 'bg-[#1E293B] text-[#00FF88] border border-[#00FF88]/30 shadow-lg'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
              }`}
            >
              <span className="text-lg">🏠</span>
              <div className="flex flex-col items-start text-left">
                <span className="font-extrabold text-sm">Sistema SAC</span>
                <span className="text-[9px] font-normal text-[#64748B]">Parcelas Decrescentes (ex: Casa)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Switch Moderno: Contrato em Andamento */}
        <div className="flex items-center justify-between p-3.5 bg-[#12141A]/50 border border-[#2E3B52]/40 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isOngoing ? 'bg-[#F59E0B] animate-pulse' : 'bg-[#64748B]'}`} />
            <div>
              <span className="text-xs font-extrabold text-[#F8FAFC]">Contrato em Andamento</span>
              <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Ative para informar parcelas já pagas previamente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOngoing(!isOngoing)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOngoing ? 'bg-[#00FF88]' : 'bg-[#2E3B52]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#F8FAFC] shadow-md ring-0 transition duration-200 ease-in-out ${
                isOngoing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Valores Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#00FF88] tracking-widest uppercase flex items-center gap-1">
              <span>Valor Parcela (R$)</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 345,50"
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#00FF88]/40 rounded-xl text-[#00FF88] font-extrabold focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200 shadow-[0_0_10px_rgba(0,255,136,0.1)]"
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Saldo Devedor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 36862,23"
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
              value={financedAmount}
              onChange={(e) => setFinancedAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Seguro / Taxa (Mês)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 0,50"
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
              value={insuranceAmount}
              onChange={(e) => setInsuranceAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Taxa de Juros
            </label>
            <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl focus-within:border-[#00FF88] focus-within:ring-1 focus-within:ring-[#00FF88] overflow-hidden transition-all duration-200 h-11">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 5.1"
                className="w-full px-3 text-sm bg-transparent text-[#F8FAFC] placeholder-[#64748B] focus:outline-none h-full"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
              <select
                className="px-2.5 text-xs bg-[#162032] border-l border-[#2E3B52] text-[#94A3B8] h-full focus:outline-none cursor-pointer font-bold"
                value={interestRateType}
                onChange={(e) => setInterestRateType(e.target.value as 'monthly' | 'yearly')}
              >
                <option value="monthly">a.m.</option>
                <option value="yearly">a.a.</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prazos e Contagem de Parcelas (Sincronização Perfeita) */}
        <div className={isOngoing ? "grid grid-cols-2 sm:grid-cols-4 gap-3" : "grid grid-cols-2 gap-4"}>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Prazo Total (36x)
            </label>
            <input
              type="number"
              min="1"
              max="360"
              required
              placeholder="Ex: 36"
              className="w-full h-11 px-3 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
            />
          </div>

          {isOngoing && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
                  Parcelas Já Pagas
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalInstallmentsNum - 1}
                  required
                  placeholder="Ex: 5"
                  className="w-full h-11 px-3 text-sm bg-[#0A0B0E] border border-[#10B981]/50 rounded-xl text-[#10B981] font-extrabold focus:border-[#10B981] focus:outline-none"
                  value={paidInstallments}
                  onChange={(e) => handlePaidChange(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
                  Próxima Parcela Nº
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalInstallmentsNum}
                  required
                  placeholder="Ex: 6"
                  className="w-full h-11 px-3 text-sm bg-[#0A0B0E] border border-[#00FF88]/50 rounded-xl text-[#00FF88] font-black focus:border-[#00FF88] focus:outline-none"
                  value={startInstallmentNum}
                  onChange={(e) => handleNextInstallmentChange(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              {isOngoing ? "Venc. da Próxima" : "Data da 1ª Parcela"}
            </label>
            <input
              type="date"
              required
              className="w-full h-11 px-3 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* Conta e Categoria */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Conta / Cartão para Débito"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            options={(wallets || []).map((w) => ({
              value: w.id,
              label: `${w.icon} ${w.name}`,
            }))}
            className="h-11 rounded-xl bg-[#0A0B0E] border border-[#2E3B52]"
          />

          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.filter((c) => c.type === 'expense').map((c) => ({
              value: c.name,
              label: `${c.emoji} ${c.name}`,
            }))}
            className="h-11 rounded-xl bg-[#0A0B0E] border border-[#2E3B52]"
          />
        </div>

        {/* Card Futurista de Resumo com Validação Matemática Impecável */}
        <AnimatePresence mode="wait">
          {amortizationSystem === 'price' && instVal > 0 && (
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
                <span className="text-[#00FF88] font-mono">{totalInstallmentsNum} PARCELAS DE {formatBRL(finalInstallmentVal)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex flex-col">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase">Custo Total ({totalInstallmentsNum}x)</span>
                  <span className="text-sm font-black text-[#00FF88] mt-1">
                    {formatBRL(totalContractCost)}
                  </span>
                  <span className="text-[9px] text-[#64748B] font-medium mt-0.5">Contrato completo</span>
                </div>

                <div className="p-3 bg-[#0D1424] border border-[#10B981]/30 rounded-xl flex flex-col">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase">Já Pago ({paidCount}x)</span>
                  <span className="text-sm font-black text-[#10B981] mt-1">
                    {formatBRL(paidTotalCost)}
                  </span>
                  <span className="text-[9px] text-[#10B981] font-medium mt-0.5">
                    {paidCount > 0 ? `Parcelas 1 até ${paidCount}` : 'Nenhuma paga'}
                  </span>
                </div>

                <div className="p-3 bg-[#0D1424] border border-[#F59E0B]/30 rounded-xl flex flex-col">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase">Saldo Devedor ({remainingCount}x)</span>
                  <span className="text-sm font-black text-[#F59E0B] mt-1">
                    {formatBRL(remainingTotalCost)}
                  </span>
                  <span className="text-[9px] text-[#F59E0B] font-medium mt-0.5">
                    Parcela {startNum} até {totalInstallmentsNum}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé de Ações */}
        <div className="flex justify-end gap-3.5 mt-2 pt-4 border-t border-[#2E3B52]/50">
          <Button type="button" variant="ghost" onClick={handleClose} className="hover:bg-[#1E293B] font-bold text-sm">
            Cancelar
          </Button>
          <Button
            type="submit"
            className="font-bold text-sm bg-[#00FF88] hover:bg-[#00E577] text-[#090D16] shadow-[0_4px_14px_rgba(0,255,136,0.2)] hover:shadow-[0_6px_20px_rgba(0,255,136,0.3)] transition-all duration-300 rounded-xl px-5"
          >
            <span>{editingDebtContractId ? "Salvar Alterações" : "Gerar Contrato & Parcelas"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
