import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Car, CreditCard, ShieldAlert, CheckCircle2, Calendar, Trash2, Zap, Pencil, ShieldCheck } from 'lucide-react';
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
    setEditingDebtContractId
  } = useAppStore();
  const contracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  // Calculate totals
  const totalFinanced = contracts.reduce((acc, c) => acc + c.totalAmount, 0);

  // Calculate paid installments per contract
  const contractStats = contracts.map((c) => {
    const contractTxs = transactions.filter((t) => t.contractId === c.id);
    const startInstallment = c.startInstallmentNum ?? 1;
    const initialPaidCount = Math.max(startInstallment - 1, 0);
    const paidTxs = contractTxs.filter((t) => new Date(t.date) <= new Date());
    const paidCount = Math.min(initialPaidCount + paidTxs.length, c.totalInstallments);

    let paidAmount = 0;
    let remainingAmount = 0;
    let progressPct = 0;

    const isSAC = c.amortizationSystem === 'sac';

    if (isSAC) {
      // No SAC, a amortização mensal é fixa.
      const monthlyAmortization = c.totalAmount / (c.totalInstallments || 1);
      const totalAmortized = paidCount * monthlyAmortization;
      remainingAmount = Math.max(c.totalAmount - totalAmortized, 0);
      paidAmount = totalAmortized;
      progressPct = c.totalAmount > 0 ? (totalAmortized / c.totalAmount) * 100 : 0;
    } else {
      // No PRICE, consideramos o total pago como paidCount * valor da parcela
      const singleInstallmentVal = (c.installmentAmount || 0) + (c.insuranceAmount || 0);
      paidAmount = paidCount * singleInstallmentVal;
      remainingAmount = Math.max(c.totalAmount - paidAmount, 0);
      progressPct = c.totalAmount > 0 ? (paidAmount / c.totalAmount) * 100 : 0;
    }

    return {
      contract: c,
      contractTxs,
      paidCount,
      paidAmount,
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      progressPct,
    };
  });

  const totalPaid = contractStats.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalRemaining = contractStats.reduce((acc, s) => acc + s.remainingAmount, 0);

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
            Gerencie contratos de longo prazo (Veículos 36x, Consórcios, Empréstimos)
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border-l-4 border-l-[#38BDF8]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Total em Financiamentos</span>
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
          {contractStats.map(({ contract, contractTxs, paidCount, paidAmount, remainingAmount, progressPct }) => {
            const isHouse = /casa|apartamento|apê|habitação|imóvel|lote|terreno/i.test(contract.title) || contract.category === 'Moradia';
            const emoji = isHouse ? '🏠' : '🚗';

            // Cores dinâmicas de acordo com o progresso de quitação
            let colors = {
              text: 'text-[#F59E0B]',
              bg: 'bg-[#F59E0B]/10',
              border: 'border-[#F59E0B]/20',
              hoverBorder: 'hover:border-[#F59E0B]/30',
              btnText: 'text-[#F59E0B]',
              btnBg: 'bg-[#F59E0B]/10',
              btnBorder: 'border-[#F59E0B]/20',
              btnHover: 'hover:bg-[#F59E0B]/20'
            };

            if (remainingAmount <= 0) {
              // Quitado
              colors = {
                text: 'text-[#10B981]',
                bg: 'bg-[#10B981]/10',
                border: 'border-[#10B981]/20',
                hoverBorder: 'hover:border-[#10B981]/30',
                btnText: 'text-[#10B981]',
                btnBg: 'bg-[#10B981]/10',
                btnBorder: 'border-[#10B981]/20',
                btnHover: 'hover:bg-[#10B981]/20'
              };
            } else if (paidCount > 0) {
              // Em andamento
              colors = {
                text: 'text-[#38BDF8]',
                bg: 'bg-[#38BDF8]/10',
                border: 'border-[#38BDF8]/20',
                hoverBorder: 'hover:border-[#38BDF8]/30',
                btnText: 'text-[#38BDF8]',
                btnBg: 'bg-[#38BDF8]/10',
                btnBorder: 'border-[#38BDF8]/20',
                btnHover: 'hover:bg-[#38BDF8]/20'
              };
            }

            return (
              <Card key={contract.id} className={`flex flex-col gap-4 ${colors.hoverBorder} transition-all`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} border ${colors.border} flex items-center justify-center text-2xl font-bold shadow-md`}>
                      {emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-[#F8FAFC]">{contract.title}</h4>
                        {contract.amortizationSystem === 'sac' ? (
                          <span className="bg-[#1E293B] text-[#00FF88] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#00FF88]/30">
                            SAC • {contract.totalInstallments} parcelas
                          </span>
                        ) : (
                          <span className="bg-[#1E293B] text-[#00FF88] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#00FF88]/30">
                            {contract.totalInstallments}x de {formatBRL(contract.installmentAmount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                        Início em {formatDate(contract.startDate)} • Categoria: {contract.category}
                        {contract.interestRate ? ` • Juros: ${contract.interestRate}% ${contract.interestRateType === 'yearly' ? 'a.a.' : 'a.m.'}` : ''}
                        {contract.insuranceAmount ? ` • Seguro: ${formatBRL(contract.insuranceAmount)}/mês` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[#94A3B8] font-semibold uppercase">Saldo Devedor</span>
                      <span className={`text-xl font-black ${colors.text}`}>{formatBRL(remainingAmount)}</span>
                    </div>

                    {remainingAmount > 0 ? (
                      <button
                        onClick={() => {
                          setAmortizacaoContractId(contract.id);
                          setAmortizacaoModalOpen(true);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${colors.btnText} ${colors.btnBg} border ${colors.btnBorder} ${colors.btnHover} rounded-xl transition-colors`}
                        title="Amortizar — Pagamento Adiantado"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Amortizar
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl select-none">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Quitado
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setEditingDebtContractId(contract.id);
                        setDebtContractModalOpen(true);
                      }}
                      className="p-2 text-[#64748B] hover:text-[#00FF88] hover:bg-[#1E2330] rounded-xl transition-colors"
                      title="Editar Financiamento"
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
                      Progresso de Quitação: <span className="text-[#F8FAFC]">{paidCount} de {contract.totalInstallments} parcelas pagas</span> ({formatBRL(paidAmount)})
                    </span>
                    <span className="text-[#00FF88]">{formatPercent(progressPct)}</span>
                  </div>
                  <div className="w-full h-3 bg-[#0A0B0E] border border-[#1E2330] rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#00FF88] to-[#06B6D4] rounded-full transition-all duration-500 shadow-[0_0_10px_#00FF88]"
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Toggle Details */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setExpandedContractId(expandedContractId === contract.id ? null : contract.id)}
                    className="text-xs font-bold text-[#06B6D4] hover:underline flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {expandedContractId === contract.id ? 'Ocultar Lista de Parcelas' : 'Ver Cronograma Completo de Parcelas'}
                  </button>
                </div>

                {/* Expanded Installment List (Cronograma Organizado) */}
                {expandedContractId === contract.id && (
                  <div className="mt-2 p-4 bg-[#0A0B0E] border border-[#1E293B] rounded-2xl flex flex-col gap-3 animate-fadeIn shadow-xl">
                    {/* Cabeçalho do Cronograma com Filtros */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3B52]/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#00FF88]" />
                        <h5 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider">
                          CRONOGRAMA DE VENCIMENTO ({contract.totalInstallments} PARCELAS)
                        </h5>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-lg border border-[#10B981]/30">
                          {paidCount} Pagas ({formatBRL(paidAmount)})
                        </span>
                        <span className="text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/15 px-2.5 py-1 rounded-lg border border-[#F59E0B]/30">
                          {contract.totalInstallments - paidCount} Pendentes ({formatBRL(remainingAmount)})
                        </span>
                      </div>
                    </div>

                    {/* Grid Organizado de Parcelas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {(() => {
                        const startNum = contract.startInstallmentNum ?? 1;
                        const singleVal = (contract.installmentAmount || 0) + (contract.insuranceAmount || 0);

                        const allInstallments = [];
                        for (let i = 1; i <= contract.totalInstallments; i++) {
                          const isPastInitial = i < startNum;
                          const tx = contractTxs.find((t) => t.installments?.current === i);
                          const isPaid = isPastInitial || (tx ? new Date(tx.date) <= new Date() : false);
                          const isNext = i === startNum && !isPaid;

                          allInstallments.push({
                            num: i,
                            amount: tx ? tx.amount : singleVal,
                            date: tx ? tx.date : '',
                            isPaid,
                            isNext,
                          });
                        }

                        return allInstallments.map((inst) => (
                          <div
                            key={`inst_${contract.id}_${inst.num}`}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              inst.isPaid
                                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#F8FAFC]'
                                : inst.isNext
                                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#F8FAFC] shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-[#090D18] border-[#1E293B] hover:border-[#3B4C6A] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                                inst.isPaid
                                  ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                                  : inst.isNext
                                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                              }`}>
                                {String(inst.num).padStart(2, '0')} / {contract.totalInstallments}
                              </span>

                              <div className="flex flex-col">
                                <span className="text-xs font-black text-[#F8FAFC]">
                                  {inst.isPaid ? 'Parcela Paga' : (inst.isNext ? 'Próxima Parcela' : 'Parcela Futura')}
                                </span>
                                <span className="text-[11px] text-[#94A3B8] font-medium">
                                  {inst.date ? formatDate(inst.date) : 'Paga na contratação'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-xs font-black text-[#F8FAFC]">
                                {formatBRL(inst.amount)}
                              </span>

                              {inst.isPaid ? (
                                <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 rounded-md">
                                  ✓ PAGA
                                </span>
                              ) : inst.isNext ? (
                                <span className="text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-2 py-0.5 rounded-md animate-pulse">
                                  ⚡ PRÓXIMA
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
