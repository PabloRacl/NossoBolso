import React, { useState } from 'react';
import { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { Search, Trash2, Edit3, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete }) => {
  const { searchQuery, setSearchQuery, setEditingTransactionId, setTransactionModalOpen, isPrivacyMode } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q)
      );
    }
    return true;
  });

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setTransactionModalOpen(true);
  };

  const handleExportCSV = () => {
    const sanitizeCsvCell = (val: string) => {
      let clean = val.replace(/"/g, '""');
      if (/^[=+@-]/ .test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const headers = ['ID', 'Descricao', 'Tipo', 'Categoria', 'Data', 'Valor (R$)'];
    const rows = filtered.map((tx) => [
      tx.id,
      sanitizeCsvCell(tx.description),
      tx.type === 'income' ? 'Receita' : 'Despesa',
      sanitizeCsvCell(tx.category),
      tx.date,
      tx.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transacoes_nossobolso_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-[#162032] p-1.5 rounded-xl border border-[#2E3B52]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-[#00FF88] text-[#0B0F19] shadow-md shadow-[#00FF88]/20'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'income'
                ? 'bg-[#10B981] text-[#0B0F19] shadow-md shadow-[#10B981]/20'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'expense'
                ? 'bg-[#FF4D6D] text-[#F8FAFC] shadow-md shadow-[#FF4D6D]/20'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Despesas
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="🔍 Buscar transação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="bg-[#162032] border-[#2E3B52] shrink-0"
            title="Exportar dados para Excel/CSV"
          >
            <Download className="w-4 h-4 text-[#00FF88]" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2E3B52] bg-[#121927] text-[#94A3B8] text-xs uppercase tracking-wider font-extrabold">
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3B52] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94A3B8]">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1E293B]/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                          tx.type === 'income'
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                        }`}
                      >
                        {tx.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {tx.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#F8FAFC]">{tx.description}</td>
                    <td className="py-3.5 px-4 text-[#94A3B8] font-medium">{tx.category}</td>
                    <td className="py-3.5 px-4 text-[#94A3B8] font-semibold">{formatDate(tx.date)}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-black ${
                        tx.type === 'income' ? 'text-[#10B981]' : 'text-[#FF4D6D]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount, isPrivacyMode)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(tx.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#162032] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tx.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#162032] rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
