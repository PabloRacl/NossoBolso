import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Car, CreditCard, ShieldAlert, CheckCircle2, Calendar, Trash2, Zap, Pencil } from 'lucide-react';
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
    const paidTxs = contractTxs.filter((t) => new Date(t.date) <= new Date());
    const paidCount = paidTxs.length;

    let paidAmount = 0;
    let remainingAmount = 0;
    let progressPct = 0;

    const isSAC = c.amortizationSystem === 'sac';

    if (isSAC) {
      // No SAC, a amortização mensal é fixa.
      // O saldo devedor inicial é c.totalAmount. O total amortizado pago é paidCount * amortização.
      const startInstallment = c.startInstallmentNum ?? 1;
      const totalPlannedInstallments = c.totalInstallments - startInstallment + 1;
      const monthlyAmortization = c.totalAmount / (totalPlannedInstallments || 1);
      const totalAmortized = paidCount * monthlyAmortization;
      remainingAmount = c.totalAmount - totalAmortized;
      paidAmount = totalAmortized;
      progressPct = c.totalAmount > 0 ? (totalAmortized / c.totalAmount) * 100 : 0;
    } else {
      // No PRICE, consideramos o total pago como a soma das parcelas vencidas
      paidAmount = paidTxs.reduce((acc, t) => acc + t.amount, 0);
      remainingAmount = c.totalAmount - paidAmount;
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

        <Button variant="primary" onClick={() => setDebtContractModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Novo Financiamento (ex: Carro 36x)</span>
        </Button>
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

                {/* Expanded Installment List */}
                {expandedContractId === contract.id && (
                  <div className="mt-2 p-3 bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex flex-col gap-2 max-h-64 overflow-y-auto">
                    <h5 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Cronograma de Vencimento das {contractTxs.length} Parcelas
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {contractTxs.map((tx) => {
                        const isPaid = new Date(tx.date) <= new Date();
                        return (
                          <div
                            key={tx.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              isPaid
                                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#F8FAFC]'
                                : 'bg-[#12141A] border-[#1E2330] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-[#F8FAFC]">{tx.description}</span>
                              <span className="text-[10px] text-[#94A3B8]">{formatDate(tx.date)}</span>
                            </div>
                            <span className={`font-bold ${isPaid ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                              {isPaid ? '✓ Paga' : formatBRL(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
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
