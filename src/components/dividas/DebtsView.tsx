import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { db } from '../../servicos/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatBRL, formatPercent } from '../../utilidades/formatters';
import { formatDate } from '../../utilidades/dateUtils';
import { useAppStore } from '../../estado/useAppStore';
import { Plus, Car, CreditCard, ShieldAlert, CheckCircle2, Calendar, Trash2, Zap, Pencil, ShieldCheck, Sparkles, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const DebtsView: React.FC = () => {
  const { 
    setDebtContractModalOpen, 
    setAmortizacaoModalOpen, 
    setAmortizacaoContractId,
    setEditingDebtContractId,
    setEditingTransactionId,
    setTransactionModalOpen,
    selectedMonth
  } = useAppStore();

  const contracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  
  // Filtros individuais de busca e escopo para o cronograma de cada contrato
  const [scheduleSearch, setScheduleSearch] = useState<Record<string, string>>({});
  const [scheduleScope, setScheduleScope] = useState<Record<string, string>>({});

  // Auto-repair para garantir que o contrato do ONIX ou outros contratos preservem originalTotalInstallments = 36
  useEffect(() => {
    contracts.forEach(async (c) => {
      if ((!c.originalTotalInstallments || c.originalTotalInstallments < 36) && /onix/i.test(c.title)) {
        await db.debtContracts.update(c.id, {
          originalTotalInstallments: 36,
          startInstallmentNum: 6,
        });
      }
    });
  }, [contracts]);

  // Formatar nome amigável do mês selecionado no topo
  const getSelectedMonthLabel = () => {
    if (!selectedMonth || selectedMonth === 'all') return 'Mês Ativo';
    const [y, m] = selectedMonth.split('-');
    if (!y || !m) return selectedMonth;
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Calculate totals
  const totalFinanced = contracts.reduce((acc, c) => {
    const originalTotal = c.originalTotalInstallments || Math.max(c.totalInstallments, 36);
    const singleVal = (c.installmentAmount || 0) + (c.insuranceAmount || 0);
    return acc + (originalTotal * singleVal);
  }, 0);

  // Calculate stats per contract
  const contractStats = contracts.map((c) => {
    const contractTxs = transactions.filter((t) => t.contractId === c.id);
    const startInstallment = c.startInstallmentNum ?? 1;
    const originalTotal = c.originalTotalInstallments || (c.title.includes('ONIX') ? 36 : Math.max(c.totalInstallments, 36));
    const singleVal = (c.installmentAmount || 0) + (c.insuranceAmount || 0);

    const initialPaidCount = Math.max(startInstallment - 1, 0);
    const initialPaidAmount = initialPaidCount * singleVal;

    const remainingPendingCount = contractTxs.length;
    const remainingAmount = contractTxs.reduce((acc, t) => acc + t.amount, 0);

    const amortizedCount = Math.max(originalTotal - initialPaidCount - remainingPendingCount, 0);
    const amortizedAmountSaved = amortizedCount * singleVal;

    const paidCount = initialPaidCount;
    const totalDoneCount = initialPaidCount + amortizedCount;
    const progressPct = originalTotal > 0 ? (totalDoneCount / originalTotal) * 100 : 0;

    return {
      contract: c,
      contractTxs,
      originalTotal,
      startInstallment,
      initialPaidCount,
      initialPaidAmount,
      remainingPendingCount,
      remainingAmount,
      amortizedCount,
      amortizedAmountSaved,
      paidCount,
      progressPct,
    };
  });

  const totalPaid = contractStats.reduce((acc, s) => acc + s.initialPaidAmount, 0);
  const totalAmortizedSaved = contractStats.reduce((acc, s) => acc + s.amortizedAmountSaved, 0);
  const totalRemaining = contractStats.reduce((acc, s) => acc + s.remainingAmount, 0);

  const handleEditContract = (id: string) => {
    setEditingDebtContractId(id);
    setDebtContractModalOpen(true);
  };

  const handleAmortizeContract = (id: string) => {
    setAmortizacaoContractId(id);
    setAmortizacaoModalOpen(false);
    setTimeout(() => setAmortizacaoModalOpen(true), 50);
  };

  const handleEditSingleInstallment = (txId: string) => {
    setEditingTransactionId(txId);
    setTransactionModalOpen(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Deseja realmente excluir este financiamento e todas as suas parcelas?')) return;
    await db.debtContracts.delete(id);
    const txsToDelete = transactions.filter((t) => t.contractId === id);
    for (const tx of txsToDelete) {
      await db.transactions.delete(tx.id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#F8FAFC]">Financiamentos & Dívidas Contratadas</h3>
          <p className="text-xs text-[#94A3B8] font-medium">
            Gerencie contratos de longo prazo (Veículos 36x, Consórcios, Empréstimos 360x)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => useAppStore.getState().setPmpeConsignadoModalOpen(true)}>
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            <span>Margem Consignável PMPE</span>
          </Button>

          <Button variant="primary" onClick={() => setDebtContractModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Novo Financiamento</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-l-4 border-l-[#38BDF8]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Custo Total Contratado</span>
            <Car className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-black text-[#38BDF8]">{formatBRL(totalFinanced)}</div>
          <p className="text-xs text-[#64748B] mt-1">{contracts.length} Contrato(s) Cadastrado(s)</p>
        </Card>

        <Card className="border-l-4 border-l-[#10B981]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Total Já Pago</span>
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#10B981]">{formatBRL(totalPaid)}</div>
          <p className="text-xs text-[#64748B] mt-1">Parcelas quitadas até a data atual</p>
        </Card>

        <Card className="border-l-4 border-l-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Economizado com Amortização</span>
            <Zap className="w-5 h-5 text-[#00FF88] animate-pulse" />
          </div>
          <div className="text-2xl font-black text-[#00FF88]">{formatBRL(totalAmortizedSaved)}</div>
          <p className="text-xs text-[#00FF88]/80 font-semibold mt-1">Juros e parcelas eliminadas</p>
        </Card>

        <Card className="border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Saldo Devedor Restante</span>
            <ShieldAlert className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-black text-[#F59E0B]">{formatBRL(totalRemaining)}</div>
          <p className="text-xs text-[#64748B] mt-1">Valor pendente a ser quitado no futuro</p>
        </Card>
      </motion.div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1E2330]/50 border border-[#2A3042] flex items-center justify-center mb-3">
            <CreditCard className="w-8 h-8 text-[#64748B]" />
          </div>
          <h4 className="text-base font-bold text-[#F8FAFC]">Nenhum financiamento cadastrado</h4>
          <p className="text-xs text-[#94A3B8] max-w-sm mt-1 mb-4">
            Cadastre contratos de parcelamento de longo prazo (como o financiamento do carro em 36x) para acompanhar o saldo devedor e parcelas futuras.
          </p>
          <Button variant="primary" onClick={() => setDebtContractModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Financiamento</span>
          </Button>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4"
        >
          {contractStats.map(({ 
            contract, 
            contractTxs, 
            originalTotal,
            startInstallment,
            initialPaidCount, 
            initialPaidAmount, 
            remainingPendingCount,
            remainingAmount, 
            amortizedCount,
            amortizedAmountSaved,
            progressPct 
          }) => {
            const isHouse = /casa|apartamento|apê|habitação|imóvel|lote|terreno/i.test(contract.title) || contract.category === 'Moradia';
            const emoji = isHouse ? '🏠' : '🚗';

            let colors = {
              text: 'text-[#F59E0B]',
              bg: 'bg-[#F59E0B]/10',
              border: 'border-[#F59E0B]/20',
              hoverBorder: 'hover:border-[#F59E0B]/30',
              btnText: 'text-[#F59E0B]',
            };

            if (progressPct >= 100) {
              colors = {
                text: 'text-[#00FF88]',
                bg: 'bg-[#00FF88]/10',
                border: 'border-[#00FF88]/20',
                hoverBorder: 'hover:border-[#00FF88]/30',
                btnText: 'text-[#00FF88]',
              };
            }

            const currentScope = scheduleScope[contract.id] || 'current_month';
            const currentQuery = scheduleSearch[contract.id] || '';

            return (
              <Card
                key={contract.id}
                className={`p-5 flex flex-col gap-4 border ${colors.border} ${colors.hoverBorder} transition-all duration-300`}
              >
                {/* Contract Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center text-2xl shrink-0`}>
                      {emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-[#F8FAFC]">{contract.title}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {contract.amortizationSystem ? contract.amortizationSystem.toUpperCase() : 'PRICE'}
                        </span>
                        {amortizedCount > 0 && (
                          <Badge variant="success" size="sm" className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#00FF88]" />
                            <span>{amortizedCount} AMORTIZADA(S)</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                        Prazo Contratado: <span className="font-bold text-[#F8FAFC]">{originalTotal}x</span> ({remainingPendingCount} Restantes • {amortizedCount} Eliminadas) • {contract.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAmortizeContract(contract.id)}
                      className="px-3 py-1.5 text-xs font-extrabold text-[#090D16] bg-[#00FF88] hover:bg-[#00E577] rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,255,136,0.2)]"
                      title="Simular ou Executar Amortização Extraordinária"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Amortizar / Antecipar</span>
                    </button>

                    <button
                      onClick={() => handleEditContract(contract.id)}
                      className="p-2 text-[#64748B] hover:text-[#00FF88] hover:bg-[#1E2330] rounded-xl transition-colors"
                      title="Editar Financiamento Geral"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteContract(contract.id)}
                      className="p-2 text-[#64748B] hover:text-red-400 hover:bg-[#1E2330] rounded-xl transition-colors"
                      title="Excluir Financiamento"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1E2330]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#94A3B8]">
                      Progresso de Quitação: <span className="text-[#F8FAFC]">{initialPaidCount + amortizedCount} de {originalTotal} parcelas pagas/abatidas</span> ({formatBRL(initialPaidAmount + amortizedAmountSaved)})
                    </span>
                    <span className="text-[#00FF88]">{formatPercent(progressPct)}</span>
                  </div>
                  <ProgressBar
                    value={progressPct}
                    variant="gradient"
                    size="md"
                  />
                </div>

                {/* Toggle Details */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setExpandedContractId(expandedContractId === contract.id ? null : contract.id)}
                    className="text-xs font-bold text-[#06B6D4] hover:underline flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {expandedContractId === contract.id ? 'Ocultar Cronograma de Parcelas' : 'Ver Cronograma & Editar Parcela do Mês X'}
                  </button>
                </div>

                {/* Expanded Installment List com Filtros Avançados por Mês e Edição Individual */}
                {expandedContractId === contract.id && (
                  <div className="mt-2 p-4 bg-[#0A0B0E] border border-[#1E293B] rounded-2xl flex flex-col gap-3 animate-fadeIn shadow-xl">
                    
                    {/* Header do Cronograma & Telemetria */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3B52]/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#00FF88]" />
                        <h5 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider">
                          CRONOGRAMA DE VENCIMENTO ({originalTotal} PARCELAS)
                        </h5>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-lg border border-[#10B981]/30">
                          {initialPaidCount} Pagas ({formatBRL(initialPaidAmount)})
                        </span>

                        {amortizedCount > 0 && (
                          <span className="text-[10px] font-black text-[#00FF88] bg-[#00FF88]/15 px-2.5 py-1 rounded-lg border border-[#00FF88]/40 flex items-center gap-1 shadow-[0_0_12px_rgba(0,255,136,0.3)] animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-[#00FF88]" />
                            <span>⚡ {amortizedCount} Antecipada(s) ({formatBRL(amortizedAmountSaved)})</span>
                          </span>
                        )}

                        <span className="text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/15 px-2.5 py-1 rounded-lg border border-[#F59E0B]/30">
                          {remainingPendingCount} Pendentes ({formatBRL(remainingAmount)})
                        </span>
                      </div>
                    </div>

                    {/* Toolbar de Filtro por Mês / Ano e Busca da Parcela X */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#090D18] p-2.5 rounded-xl border border-[#1E293B]">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
                        <span className="text-xs font-bold text-[#94A3B8] shrink-0">Filtrar Visão:</span>

                        <select
                          value={currentScope}
                          onChange={(e) => setScheduleScope({ ...scheduleScope, [contract.id]: e.target.value })}
                          className="px-3 py-1.5 text-xs bg-[#162032] border border-[#2E3B52] rounded-lg text-[#00FF88] font-extrabold focus:outline-none cursor-pointer"
                        >
                          <option value="current_month">📅 Mês Selecionado ({getSelectedMonthLabel()})</option>
                          <option value="next">⚡ Apenas Próxima Parcela (Nº {startInstallment})</option>
                          <option value="all">🌐 Ver Todas as {originalTotal} Parcelas</option>
                        </select>
                      </div>

                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="🔍 Nº parcela ou mês (ex: 153 ou 09/2026)..."
                          value={currentQuery}
                          onChange={(e) => setScheduleSearch({ ...scheduleSearch, [contract.id]: e.target.value })}
                          className="w-full h-8 px-3 text-xs bg-[#0A0B0E] border border-[#2E3B52] rounded-lg text-[#F8FAFC] placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Lista de Parcelas Filtrada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                      {(() => {
                        const singleVal = (contract.installmentAmount || 0) + (contract.insuranceAmount || 0);

                        const allInstallments = [];
                        for (let i = 1; i <= originalTotal; i++) {
                          const isPastInitial = i < startInstallment;
                          const tx = contractTxs.find((t) => t.installments?.current === i);
                          const isPaid = isPastInitial;
                          const isNext = !isPaid && i === startInstallment;
                          const isPending = !isPaid && !isNext && !!tx;
                          const isAmortized = !isPaid && !isNext && !tx;

                          allInstallments.push({
                            num: i,
                            amount: tx ? tx.amount : singleVal,
                            date: tx ? tx.date : '',
                            txId: tx ? tx.id : undefined,
                            isPaid,
                            isNext,
                            isPending,
                            isAmortized,
                          });
                        }

                        // Aplicar Filtros de Mês / Busca
                        const filteredInstallments = allInstallments.filter((inst) => {
                          // Busca textual (nº da parcela ou data)
                          if (currentQuery.trim() !== '') {
                            const q = currentQuery.toLowerCase();
                            const matchesNum = String(inst.num).includes(q);
                            const matchesDate = inst.date ? formatDate(inst.date).toLowerCase().includes(q) : false;
                            if (!matchesNum && !matchesDate) return false;
                          }

                          // Filtro de Escopo
                          if (currentScope === 'next') {
                            return inst.isNext;
                          }
                          if (currentScope === 'current_month' && selectedMonth && selectedMonth !== 'all') {
                            if (inst.isNext) return true; // Mantém a próxima visível
                            if (inst.date && inst.date.startsWith(selectedMonth)) return true;
                            return false;
                          }

                          return true;
                        });

                        if (filteredInstallments.length === 0) {
                          return (
                            <div className="col-span-2 p-6 text-center text-xs text-[#94A3B8] bg-[#090D18] rounded-xl border border-[#1E293B]">
                              Nenhuma parcela encontrada para o filtro selecionado ({getSelectedMonthLabel()}). 
                              <button
                                onClick={() => setScheduleScope({ ...scheduleScope, [contract.id]: 'all' })}
                                className="ml-2 text-[#00FF88] font-bold underline hover:text-[#00E577]"
                              >
                                Clique aqui para ver todas as {originalTotal} parcelas
                              </button>
                            </div>
                          );
                        }

                        return filteredInstallments.map((inst) => (
                          <div
                            key={`inst_${contract.id}_${inst.num}`}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              inst.isPaid
                                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#F8FAFC]'
                                : inst.isNext
                                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#F8FAFC] shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : inst.isAmortized
                                ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#F8FAFC] shadow-[0_0_8px_rgba(0,255,136,0.15)]'
                                : 'bg-[#090D18] border-[#1E293B] hover:border-[#3B4C6A] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                                inst.isPaid
                                  ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                                  : inst.isNext
                                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                                  : inst.isAmortized
                                  ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40 font-bold'
                                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                              }`}>
                                {String(inst.num).padStart(2, '0')} / {originalTotal}
                              </span>

                              <div className="flex flex-col">
                                <span className="text-xs font-black text-[#F8FAFC]">
                                  {inst.isPaid
                                    ? 'Parcela Paga'
                                    : inst.isNext
                                    ? 'Próxima Parcela'
                                    : inst.isAmortized
                                    ? '⚡ Parcela Antecipada'
                                    : 'Parcela Futura'}
                                </span>
                                <span className="text-[11px] text-[#94A3B8] font-medium">
                                  {inst.date
                                    ? formatDate(inst.date)
                                    : inst.isPaid
                                    ? 'Paga antes da contratação'
                                    : inst.isAmortized
                                    ? 'Abatida por Amortização'
                                    : 'A agendar'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-[#F8FAFC]">
                                {formatBRL(inst.amount)}
                              </span>

                              {inst.txId && (
                                <button
                                  onClick={() => handleEditSingleInstallment(inst.txId!)}
                                  className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#1E293B] rounded-lg transition-colors border border-transparent hover:border-[#00FF88]/30"
                                  title={`Editar valor/data da Parcela ${inst.num}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {inst.isPaid ? (
                                <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 rounded-md">
                                  ✓ PAGA
                                </span>
                              ) : inst.isNext ? (
                                <span className="text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-2 py-0.5 rounded-md animate-pulse">
                                  ⚡ PRÓXIMA
                                </span>
                              ) : inst.isAmortized ? (
                                <span className="text-[10px] font-black text-[#00FF88] bg-[#00FF88]/20 border border-[#00FF88]/50 px-2 py-0.5 rounded-md shadow-[0_0_6px_rgba(0,255,136,0.3)]">
                                  ⚡ ANTECIPADA
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-[#64748B] bg-[#1E293B] border border-[#334155] px-2 py-0.5 rounded-md">
                                  A VENCER
                                </span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
