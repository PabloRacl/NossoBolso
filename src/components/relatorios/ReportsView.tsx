import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Transaction, Goal } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import {
  Download,
  Printer,
  FileSpreadsheet,
  PieChart,
  FileCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Copy
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  goals: Goal[];
}

type ReportTab = 'summary' | 'rule503020' | 'irpf';

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, goals }) => {
  const { isPrivacyMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];
  const vehicles = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // --- 1. CÁLCULO DA REGRA 50/30/20 ---
  const rule503020Metrics = useMemo(() => {
    let needs = 0; // 50% Necessidades (Alimentação, Moradia, Saúde, Transporte, SISMEPE, Consignado)
    let wants = 0; // 30% Desejos (Lazer, Compras, Restaurantes)
    let savings = 0; // 20% Investimentos & Metas

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const cat = tx.category.toLowerCase();
        if (
          cat.includes('alimenta') ||
          cat.includes('moradia') ||
          cat.includes('saúde') ||
          cat.includes('transporte') ||
          cat.includes('consignado') ||
          cat.includes('imposto') ||
          cat.includes('fixa')
        ) {
          needs += tx.amount;
        } else if (cat.includes('lazer') || cat.includes('compra') || cat.includes('restaurante') || cat.includes('outro')) {
          wants += tx.amount;
        } else if (cat.includes('invest') || cat.includes('reserva') || cat.includes('poupança') || cat.includes('meta')) {
          savings += tx.amount;
        } else {
          needs += tx.amount;
        }
      }
    });

    const incomeBase = totalIncome > 0 ? totalIncome : 8659.00; // Saldo base PMPE se sem receitas no mês
    const needsPct = Math.round((needs / incomeBase) * 100);
    const wantsPct = Math.round((wants / incomeBase) * 100);
    const savingsPct = Math.round(((incomeBase - totalExpense + savings) / incomeBase) * 100);

    return {
      needs,
      wants,
      savings,
      incomeBase,
      needsPct,
      wantsPct,
      savingsPct,
    };
  }, [transactions, totalIncome, totalExpense]);

  // --- 2. CÁLCULO DO RELATÓRIO IRPF ---
  const irpfData = useMemo(() => {
    const totalBankAccounts = wallets
      .filter((w) => w.type !== 'credit')
      .reduce((acc, w) => acc + Math.max(w.balance, 0), 0);

    const totalDebtsAndFinancing = debtContracts.reduce((acc, d) => acc + (d.totalAmount || (d.installmentAmount * d.totalInstallments)), 0);
    const totalVehiclesEstimated = vehicles.length > 0 ? 85000.00 : 0;

    return {
      totalBankAccounts,
      totalDebtsAndFinancing,
      totalVehiclesEstimated,
      grossIncomeAnnual: 8659.00 * 12, // PMPE Salário Bruto Anual
      irrfAnnual: 461.59 * 12,
      previdenciamilitarAnnual: 650.30 * 12,
    };
  }, [wallets, debtContracts, vehicles]);

  const handleExportJSON = () => {
    const data = {
      appName: 'Nosso Bolso',
      exportDate: new Date().toISOString(),
      transactions,
      goals,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nosso-bolso-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Descricao', 'Tipo', 'Categoria', 'Data', 'Valor (R$)'];
    const rows = transactions.map((tx) => [
      tx.id,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type === 'income' ? 'Receita' : 'Despesa',
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.date,
      tx.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_nossobolso_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyIRPFText = () => {
    const text = `DECLARE IRPF 2026 - NOSSOBOLSO
-----------------------------------------
FICHA BENS E DIREITOS:
- Contas Bancárias e Investimentos: ${formatBRL(irpfData.totalBankAccounts, false)}
- Veículos Automotores: ${formatBRL(irpfData.totalVehiclesEstimated, false)}

FICHA RENDIMENTOS TRIBUTÁVEIS (PMPE):
- Rendimentos Brutos Anuais: ${formatBRL(irpfData.grossIncomeAnnual, false)}
- Previdência / Proteção Social Militar Retida: ${formatBRL(irpfData.previdenciamilitarAnnual, false)}
- IRRF Retido na Fonte: ${formatBRL(irpfData.irrfAnnual, false)}

FICHA DÍVIDAS E ÔNUS REAIS:
- Saldo Devedor em Empréstimos e Financiamentos: ${formatBRL(irpfData.totalDebtsAndFinancing, false)}`;

    navigator.clipboard.writeText(text);
    alert('📋 Dados formatados para a Declaração de Imposto de Renda copiados para a área de transferência!');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'summary'
                ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Extrato & Relatório Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('rule503020')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'rule503020'
                ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <PieChart className="w-4 h-4 text-[#06B6D4]" />
            <span>Diagnóstico Regra 50/30/20</span>
          </button>

          <button
            onClick={() => setActiveTab('irpf')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'irpf'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>Declaração IRPF</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-4 h-4 text-[#00FF88]" />
            <span>CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-4 h-4 text-[#06B6D4]" />
            <span>JSON</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrintPDF}>
            <Printer className="w-4 h-4" />
            <span>Imprimir PDF</span>
          </Button>
        </div>
      </div>

      {/* TAB 1: EXTRATO E VISÃO GERAL */}
      {activeTab === 'summary' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#10B981]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Receitas Totais</span>
              <div className="text-2xl font-extrabold text-[#10B981] mt-1">{formatBRL(totalIncome, isPrivacyMode)}</div>
            </Card>
            <Card className="border-l-4 border-l-[#EF4444]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Despesas Totais</span>
              <div className="text-2xl font-extrabold text-[#EF4444] mt-1">{formatBRL(totalExpense, isPrivacyMode)}</div>
            </Card>
            <Card className="border-l-4 border-l-[#00FF88]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Balanço Acumulado</span>
              <div className={`text-2xl font-extrabold mt-1 ${totalBalance >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                {formatBRL(totalBalance, isPrivacyMode)}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-[#06B6D4]" />
              <h4 className="text-base font-bold text-[#F8FAFC]">Resumo do Extrato ({transactions.length} Lançamentos)</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#1E2330] text-[#94A3B8] text-xs uppercase font-semibold">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2330]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        Sem dados para exibir no relatório.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#1E2330]/20">
                        <td className="py-2.5 px-3 text-[#94A3B8]">{formatDate(tx.date)}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          {tx.type === 'income' ? (
                            <span className="text-[#10B981]">Receita</span>
                          ) : (
                            <span className="text-[#EF4444]">Despesa</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#F8FAFC]">{tx.description}</td>
                        <td className="py-2.5 px-3 text-[#94A3B8]">{tx.category}</td>
                        <td
                          className={`py-2.5 px-3 text-right font-extrabold ${
                            tx.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount, isPrivacyMode)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DIAGNÓSTICO REGRA 50/30/20 */}
      {activeTab === 'rule503020' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <Card className="p-6 border-t-4 border-t-[#06B6D4]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#06B6D4]" />
                <h3 className="text-lg font-black text-[#F8FAFC]">Diagnóstico de Saúde Financeira (Regra 50/30/20)</h3>
              </div>
              <p className="text-xs text-[#94A3B8]">
                A Regra 50/30/20 divide seu orçamento ideal em: <strong className="text-[#38BDF8]">50% Necessidades</strong>, <strong className="text-[#F59E0B]">30% Desejos/Estilo de Vida</strong> e <strong className="text-[#00FF88]">20% Investimentos & Metas</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* 50% Necessidades */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#38BDF8]">50% NECESSIDADES</span>
                  <span className="text-xs font-bold text-[#94A3B8]">Alvo: 50%</span>
                </div>
                <span className="text-2xl font-black text-[#38BDF8]">{rule503020Metrics.needsPct}%</span>
                <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                  <div className="h-full bg-[#38BDF8] rounded-full" style={{ width: `${Math.min(rule503020Metrics.needsPct, 100)}%` }} />
                </div>
                <span className="text-xs text-[#94A3B8]">
                  Gasto: {formatBRL(rule503020Metrics.needs, isPrivacyMode)} (Alimentação, Moradia, Saúde, Transporte, SISMEPE, Consignado)
                </span>
              </div>

              {/* 30% Desejos */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#F59E0B]">30% DESEJOS & LAZER</span>
                  <span className="text-xs font-bold text-[#94A3B8]">Alvo: 30%</span>
                </div>
                <span className="text-2xl font-black text-[#F59E0B]">{rule503020Metrics.wantsPct}%</span>
                <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${Math.min(rule503020Metrics.wantsPct, 100)}%` }} />
                </div>
                <span className="text-xs text-[#94A3B8]">
                  Gasto: {formatBRL(rule503020Metrics.wants, isPrivacyMode)} (Restaurantes, Lazer, Compras pessoais)
                </span>
              </div>

              {/* 20% Investimentos */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#00FF88]">20% INVESTIMENTOS & METAS</span>
                  <span className="text-xs font-bold text-[#94A3B8]">Alvo: 20%</span>
                </div>
                <span className="text-2xl font-black text-[#00FF88]">{rule503020Metrics.savingsPct}%</span>
                <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00FF88] rounded-full" style={{ width: `${Math.min(rule503020Metrics.savingsPct, 100)}%` }} />
                </div>
                <span className="text-xs text-[#94A3B8]">
                  Guardado/Aportado: {formatBRL(totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0, isPrivacyMode)}
                </span>
              </div>
            </div>

            {/* Parecer do Assistente de IA */}
            <div className="p-4 bg-[#0D1424] border border-[#00FF88]/40 rounded-xl mt-6 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs">
                <h4 className="font-extrabold text-[#F8FAFC]">Parecer do Diagnóstico Financeiro</h4>
                <p className="text-[#94A3B8]">
                  Sua taxa de poupança/investimentos está estimada em <strong className="text-[#00FF88]">{rule503020Metrics.savingsPct}%</strong>. Mantendo essa disciplina, você fortalece sua reserva de emergência e acelera suas metas de longo prazo!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: DECLARAÇÃO IRPF */}
      {activeTab === 'irpf' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <Card className="p-6 border-t-4 border-t-[#F59E0B]">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2E3B52]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
                <div>
                  <h3 className="text-lg font-black text-[#F8FAFC]">Relatório Consolidado IRPF 2026</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Resumo organizado de Bens, Rendimentos e Dívidas para a Declaração Anual de Imposto de Renda.
                  </p>
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={handleCopyIRPFText}>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto Formatado IRPF</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Ficha 1: Bens e Direitos */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase text-[#00FF88] border-b border-[#2E3B52] pb-2">
                  1. Ficha de Bens & Direitos
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Saldos Bancários / Investimentos:</span>
                    <strong className="text-[#F8FAFC]">{formatBRL(irpfData.totalBankAccounts, isPrivacyMode)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Veículos Registrados:</span>
                    <strong className="text-[#F8FAFC]">{formatBRL(irpfData.totalVehiclesEstimated, isPrivacyMode)}</strong>
                  </div>
                </div>
              </div>

              {/* Ficha 2: Rendimentos PMPE */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase text-[#38BDF8] border-b border-[#2E3B52] pb-2">
                  2. Rendimentos Tributáveis (PMPE)
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Rendimento Bruto Anual:</span>
                    <strong className="text-[#00FF88]">{formatBRL(irpfData.grossIncomeAnnual, isPrivacyMode)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Previdência Militar Anual:</span>
                    <strong className="text-[#F59E0B]">{formatBRL(irpfData.previdenciamilitarAnnual, isPrivacyMode)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">IRRF Retido na Fonte Anual:</span>
                    <strong className="text-[#FF4D6D]">{formatBRL(irpfData.irrfAnnual, isPrivacyMode)}</strong>
                  </div>
                </div>
              </div>

              {/* Ficha 3: Dívidas e Ônus Reais */}
              <div className="p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase text-[#FF4D6D] border-b border-[#2E3B52] pb-2">
                  3. Dívidas & Ônus Reais
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Saldo Devedor Financiamentos:</span>
                    <strong className="text-[#FF4D6D]">{formatBRL(irpfData.totalDebtsAndFinancing, isPrivacyMode)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Contratos Ativos:</span>
                    <strong className="text-[#F8FAFC]">{debtContracts.length} contrato(s)</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
