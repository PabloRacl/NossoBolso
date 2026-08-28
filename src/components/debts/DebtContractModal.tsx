import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTodayStr } from '../../utils/dateUtils';
import { Car, Landmark, CreditCard, ShieldCheck } from 'lucide-react';
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
  const [totalInstallments, setTotalInstallments] = useState('36');
  const [installmentAmount, setInstallmentAmount] = useState(''); // Usado para PRICE (Valor da Parcela)
  const [financedAmount, setFinancedAmount] = useState(''); // Usado para SAC (Valor Financiado / Saldo Devedor)
  const [interestRate, setInterestRate] = useState('');
  const [interestRateType, setInterestRateType] = useState<'monthly' | 'yearly'>('monthly');
  const [insuranceAmount, setInsuranceAmount] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [category, setCategory] = useState('Financiamentos & Veículos');
  const [walletId, setWalletId] = useState('');
  
  // Controle de contrato em andamento
  const [isOngoing, setIsOngoing] = useState(false);
  const [startInstallmentNum, setStartInstallmentNum] = useState('1');

  // Efeito para popular o formulário no modo de edição
  React.useEffect(() => {
    if (editingDebtContractId) {
      db.debtContracts.get(editingDebtContractId).then((contract) => {
        if (contract) {
          setTitle(contract.title);
          setAmortizationSystem(contract.amortizationSystem || 'price');
          const startNum = contract.startInstallmentNum ?? 1;
          setIsOngoing(startNum > 1);
          setStartInstallmentNum(String(startNum));
          setTotalInstallments(String(contract.totalInstallments - startNum + 1));
          setInsuranceAmount(contract.insuranceAmount ? String(contract.insuranceAmount) : '');
          setInterestRate(contract.interestRate ? String(contract.interestRate) : '');
          setInterestRateType(contract.interestRateType || 'monthly');
          setStartDate(contract.startDate);
          setCategory(contract.category);
          setWalletId(contract.walletId);
          if (contract.amortizationSystem === 'price') {
            setInstallmentAmount(String(contract.installmentAmount));
          } else {
            setFinancedAmount(String(contract.totalAmount));
          }
        }
      });
    }
  }, [editingDebtContractId]);

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
    setStartInstallmentNum('1');
    setEditingDebtContractId(null);
    setDebtContractModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const instCount = parseInt(totalInstallments);
    const startNum = isOngoing ? parseInt(startInstallmentNum) : 1;
    const parsedInsurance = parseFloat(insuranceAmount) || 0;
    const parsedRate = parseFloat(interestRate) || 0;

    if (isNaN(instCount) || instCount <= 0 || isNaN(startNum) || startNum <= 0) return;

    const contractId = editingDebtContractId || ('debt_' + Math.random().toString(36).substring(2, 9));
    const selectedWalletId = walletId || (wallets[0]?.id ?? 'w1');

    let totalAmount = 0;
    const baseDate = new Date(startDate + 'T12:00:00');
    const transactionsToInsert = [];

    if (amortizationSystem === 'price') {
      const instVal = parseFloat(installmentAmount);
      if (isNaN(instVal) || instVal <= 0) return;

      const finalInstallmentAmount = instVal + parsedInsurance;
      totalAmount = instCount * finalInstallmentAmount;

      for (let i = 1; i <= instCount; i++) {
        const currentNum = startNum + i - 1;
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + (i - 1));
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        transactionsToInsert.push({
          id: `tx_${contractId}_${currentNum}`,
          description: `${title.trim()} (${currentNum}/${startNum + instCount - 1})`,
          amount: finalInstallmentAmount,
          date: formattedDate,
          type: 'expense' as const,
          category: category || 'Financiamentos & Veículos',
          walletId: selectedWalletId,
          contractId: contractId,
          installments: {
            current: currentNum,
            total: startNum + instCount - 1,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Sistema SAC
      const balanceToAmortize = parseFloat(financedAmount);
      if (isNaN(balanceToAmortize) || balanceToAmortize <= 0) return;

      // Se for anual, convertemos dividindo por 12
      const monthlyRate = interestRateType === 'yearly' ? (parsedRate / 12 / 100) : (parsedRate / 100);
      const monthlyAmortization = balanceToAmortize / instCount;
      let runningBalance = balanceToAmortize;

      for (let i = 1; i <= instCount; i++) {
        const currentNum = startNum + i - 1;
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + (i - 1));
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const periodInterest = runningBalance * monthlyRate;
        const periodTotal = monthlyAmortization + periodInterest + parsedInsurance;
        const roundedTotal = Math.round(periodTotal * 100) / 100;

        transactionsToInsert.push({
          id: `tx_${contractId}_${currentNum}`,
          description: `${title.trim()} (${currentNum}/${startNum + instCount - 1})`,
          amount: roundedTotal,
          date: formattedDate,
          type: 'expense' as const,
          category: category || 'Financiamentos & Veículos',
          walletId: selectedWalletId,
          contractId: contractId,
          installments: {
            current: currentNum,
            total: startNum + instCount - 1,
          },
          createdAt: new Date().toISOString(),
        });

        runningBalance -= monthlyAmortization;
        totalAmount += roundedTotal;
      }
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
      totalInstallments: startNum + instCount - 1, // Guarda o prazo total final
      installmentAmount: amortizationSystem === 'price' ? parseFloat(installmentAmount) : (parseFloat(financedAmount) / instCount),
      totalAmount: amortizationSystem === 'price' ? totalAmount : parseFloat(financedAmount),
      interestRate: parsedRate > 0 ? parsedRate : undefined,
      interestRateType,
      amortizationSystem,
      insuranceAmount: parsedInsurance > 0 ? parsedInsurance : undefined,
      startInstallmentNum: isOngoing ? startNum : undefined,
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
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Cabeçalho informativo com efeito gradiente sutil */}
        <div className="relative overflow-hidden p-4 bg-[#12141A]/80 border border-[#2E3B52]/50 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F59E0B]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
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
            placeholder="Ex: Caixa Habitação, Financiamento HB20..."
            className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Seleção do Sistema de Amortização (Abas Modernas) */}
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
              <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Permite iniciar o financiamento de uma parcela específica</p>
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

        {/* Grid de Informações Financeiras (3 colunas alinhadas) */}
        <div className="grid grid-cols-3 gap-4">
          
          {/* Valor Principal (Parcela ou Financiado) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              {amortizationSystem === 'price' ? "Valor Parcela" : (isOngoing ? "Saldo Devedor" : "Valor Financiado")}
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder={amortizationSystem === 'price' ? "Ex: 850,00" : "Ex: 36862,23"}
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
              value={amortizationSystem === 'price' ? installmentAmount : financedAmount}
              onChange={(e) => amortizationSystem === 'price' ? setInstallmentAmount(e.target.value) : setFinancedAmount(e.target.value)}
            />
          </div>

          {/* Seguro / Taxa Mensal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Seguro / Taxa (Mês)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 14,68"
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
              value={insuranceAmount}
              onChange={(e) => setInsuranceAmount(e.target.value)}
            />
          </div>

          {/* Taxa de Juros Integrada (Campo Unificado) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              Taxa de Juros
            </label>
            <div className="flex items-center bg-[#0A0B0E] border border-[#2E3B52] rounded-xl focus-within:border-[#00FF88] focus-within:ring-1 focus-within:ring-[#00FF88] overflow-hidden transition-all duration-200 h-11">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 5"
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

        {/* Grid de Prazos e Datas (Alinhamento Simétrico Dinâmico) */}
        <div className={isOngoing ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              {isOngoing ? "Parcelas Restantes" : "Total Parcelas"}
            </label>
            <input
              type="number"
              min="1"
              max="360"
              required
              placeholder="Ex: 36"
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
            />
          </div>

          <AnimatePresence mode="popLayout">
            {isOngoing && (
              <motion.div
                key="ongoing-installment-input"
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
                  Próxima Parcela Nº
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 68"
                  className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
                  value={startInstallmentNum}
                  onChange={(e) => setStartInstallmentNum(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
              {isOngoing ? "Venc. da Próxima" : "Data da 1ª Parcela"}
            </label>
            <input
              type="date"
              required
              className="w-full h-11 px-4 text-sm bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] focus:outline-none transition-all duration-200"
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

        {/* Cards de Resumo de Cálculos com Animações */}
        <AnimatePresence mode="wait">
          {amortizationSystem === 'price' && parseFloat(installmentAmount) > 0 && parseInt(totalInstallments) > 0 && (
            <motion.div
              key="price-summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-gradient-to-br from-[#1E293B] to-[#12141A] border border-[#00FF88]/20 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Custo Total Contratado (com seguro):</span>
                <span className="text-[10px] text-[#64748B]">Parcelas fixas capitalizadas</span>
              </div>
              <span className="text-lg font-black text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                {(parseInt(totalInstallments) * (parseFloat(installmentAmount) + (parseFloat(insuranceAmount) || 0))).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </motion.div>
          )}

          {amortizationSystem === 'sac' && parseFloat(financedAmount) > 0 && parseInt(totalInstallments) > 0 && (
            <motion.div
              key="sac-summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-gradient-to-br from-[#1E293B] to-[#12141A] border border-[#00FF88]/20 rounded-2xl flex flex-col gap-2.5 shadow-lg"
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#94A3B8]">Amortização Mensal Fixa:</span>
                <span className="font-extrabold text-[#F8FAFC]">
                  {(parseFloat(financedAmount) / parseInt(totalInstallments)).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#2E3B52]/40">
                <span className="text-[#94A3B8]">1ª Parcela Estimada (Amortiz. + Juros + Seguro):</span>
                <span className="text-base font-black text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                  {(() => {
                    const am = parseFloat(financedAmount) / parseInt(totalInstallments);
                    const rateNum = parseFloat(interestRate) || 0;
                    const insNum = parseFloat(insuranceAmount) || 0;
                    const rate = interestRateType === 'yearly' ? (rateNum / 12 / 100) : (rateNum / 100);
                    const firstInterest = parseFloat(financedAmount) * rate;
                    const total = am + firstInterest + insNum;
                    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  })()}
                </span>
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
