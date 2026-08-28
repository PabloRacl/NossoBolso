import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Transaction, Goal } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  goals: Goal[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, goals }) => {
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const handleExportJSON = () => {
    const data = {
      appName: 'NossoBolso',
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

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#F8FAFC] font-extrabold text-lg">Relatório Financeiro Geral</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="w-4 h-4 text-[#00FF88]" />
            <span>Exportar JSON</span>
          </Button>
          <Button variant="primary" onClick={handlePrintPDF}>
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#10B981]">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase">Receitas Totais</span>
          <div className="text-2xl font-extrabold text-[#10B981] mt-1">{formatBRL(totalIncome)}</div>
        </Card>
        <Card className="border-l-4 border-l-[#EF4444]">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase">Despesas Totais</span>
          <div className="text-2xl font-extrabold text-[#EF4444] mt-1">{formatBRL(totalExpense)}</div>
        </Card>
        <Card className="border-l-4 border-l-[#00FF88]">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase">Balanço Acumulado</span>
          <div className={`text-2xl font-extrabold mt-1 ${totalBalance >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
            {formatBRL(totalBalance)}
          </div>
        </Card>
      </div>

      {/* Full Transaction History Table */}
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
                      {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
