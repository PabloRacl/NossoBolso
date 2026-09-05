import React, { useState, useMemo } from 'react';
import { Transaction } from '../../tipos';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatBRL } from '../../utilidades/formatters';
import { formatDate } from '../../utilidades/dateUtils';
import { useAppStore } from '../../estado/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import {
  Search,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Printer,
  Tag,
  SlidersHorizontal,
  RotateCcw,
  Wallet as WalletIcon,
  ArrowUpDown,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileCheck,
  QrCode,
} from 'lucide-react';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'desc-asc';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedMonth?: string;
  onDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedMonth,
  onDelete,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    setEditingTransactionId,
    setTransactionModalOpen,
    setCategoryModalOpen,
    setContrachequeModalOpen,
    setQrCodeModalOpen,
    isPrivacyMode,
  } = useAppStore();

  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  // Estados dos Filtros
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPeriodMode, setFilterPeriodMode] = useState<'month' | 'all' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState<boolean>(false);

  // Formatar nome amigável do mês selecionado
  const getSelectedMonthName = () => {
    if (!selectedMonth || selectedMonth === 'all') return 'Todas as Datas';
    const [y, m] = selectedMonth.split('-');
    if (!y || !m) return selectedMonth;
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Mapeamento de carteiras por ID para exibição rápida
  const walletMap = useMemo(() => {
    const map = new Map<string, string>();
    wallets.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [wallets]);

  // Contagem de filtros avançados ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedWallet !== 'all') count++;
    if (filterPeriodMode === 'custom' && (startDate || endDate)) count++;
    if (sortOption !== 'date-desc') count++;
    return count;
  }, [selectedCategory, selectedWallet, filterPeriodMode, startDate, endDate, sortOption]);

  const handleClearFilters = () => {
    setFilterType('all');
    setFilterPeriodMode('month');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setSortOption('date-desc');
    setSearchQuery('');
  };

  // Filtragem e Ordenação
  const filteredAndSorted = useMemo(() => {
    const result = transactions.filter((tx) => {
      // 1. Filtro de Tipo (Receita / Despesa)
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // 2. Filtro de Período
      if (filterPeriodMode === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) {
          return false;
        }
      } else if (filterPeriodMode === 'custom') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      // 3. Filtro de Categoria
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }

      // 4. Filtro de Carteira
      if (selectedWallet !== 'all') {
        if (tx.walletId !== selectedWallet) return false;
      }

      // 5. Busca por Texto (Descrição, Categoria, Carteira ou Valor)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const walletName = (tx.walletId ? walletMap.get(tx.walletId) : '')?.toLowerCase() || '';
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          walletName.includes(q) ||
          tx.amount.toString().includes(q)
        );
      }

      return true;
    });

    // Ordenação
    return result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return b.date.localeCompare(a.date);
        case 'date-asc':
          return a.date.localeCompare(b.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'desc-asc':
          return a.description.localeCompare(b.description);
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [
    transactions,
    filterType,
    filterPeriodMode,
    selectedMonth,
    startDate,
    endDate,
    selectedCategory,
    selectedWallet,
    searchQuery,
    sortOption,
    walletMap,
  ]);

  // Métricas do resultado filtrado
  const filteredMetrics = useMemo(() => {
    const totalIncome = filteredAndSorted
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredAndSorted
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    return {
      count: filteredAndSorted.length,
      income: totalIncome,
      expense: totalExpense,
      balance: netBalance,
    };
  }, [filteredAndSorted]);

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setTransactionModalOpen(true);
  };

  // Exportação CSV
  const handleExportCSV = () => {
    const sanitizeCsvCell = (val: string) => {
      let clean = val.replace(/"/g, '""');
      if (/^[=+@-]/.test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const headers = ['ID', 'Descrição', 'Tipo', 'Categoria', 'Conta/Carteira', 'Data', 'Valor (R$)'];
    const rows = filteredAndSorted.map((tx) => [
      tx.id,
      sanitizeCsvCell(tx.description),
      tx.type === 'income' ? 'Receita' : 'Despesa',
      sanitizeCsvCell(tx.category),
      sanitizeCsvCell(tx.walletId ? walletMap.get(tx.walletId) || 'Não informada' : 'Geral'),
      tx.date,
      tx.amount.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `extrato_transacoes_nossobolso_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Impressão em PDF Limpa e Profissional
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para imprimir o relatório em PDF.');
      return;
    }

    const periodDescription =
      filterPeriodMode === 'month'
        ? getSelectedMonthName()
        : filterPeriodMode === 'custom'
        ? `De ${startDate ? formatDate(startDate) : 'Início'} até ${
            endDate ? formatDate(endDate) : 'Hoje'
          }`
        : 'Histórico Completo';

    const rowsHtml = filteredAndSorted
      .map(
        (tx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-size: 11px;">${formatDate(tx.date)}</td>
          <td style="padding: 8px 10px; font-size: 11px; font-weight: 600;">${tx.description}</td>
          <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${tx.category}</td>
          <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${
            tx.walletId ? walletMap.get(tx.walletId) || 'Principal' : 'Principal'
          }</td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; ${
              tx.type === 'income'
                ? 'background: #dcfce7; color: #15803d;'
                : 'background: #fee2e2; color: #b91c1c;'
            }">
              ${tx.type === 'income' ? 'Receita' : 'Despesa'}
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: bold; ${
            tx.type === 'income' ? 'color: #15803d;' : 'color: #b91c1c;'
          }">
            ${tx.type === 'income' ? '+' : '-'} R$ ${tx.amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Extrato Financeiro — NossoBolso</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: 900; color: #059669; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta-info { text-align: right; font-size: 11px; color: #64748b; }
          .cards { display: flex; gap: 16px; margin-bottom: 20px; }
          .card { flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
          .card-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .card-val { font-size: 16px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; padding: 8px 10px; font-size: 10px; font-weight: 800; text-align: left; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; color: #475569; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">NossoBolso — Relatório Financeiro</div>
            <div class="subtitle">Extrato Analítico de Lançamentos • Período: <strong>${periodDescription}</strong></div>
          </div>
          <div class="meta-info">
            <div>Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
            <div>Registros: <strong>${filteredAndSorted.length}</strong></div>
          </div>
        </div>

        <div class="cards">
          <div class="card">
            <div class="card-title">Total de Receitas</div>
            <div class="card-val" style="color: #15803d;">+ R$ ${filteredMetrics.income.toLocaleString(
              'pt-BR',
              { minimumFractionDigits: 2 }
            )}</div>
          </div>
          <div class="card">
            <div class="card-title">Total de Despesas</div>
            <div class="card-val" style="color: #b91c1c;">- R$ ${filteredMetrics.expense.toLocaleString(
              'pt-BR',
              { minimumFractionDigits: 2 }
            )}</div>
          </div>
          <div class="card">
            <div class="card-title">Resultado Líquido</div>
            <div class="card-val" style="color: ${
              filteredMetrics.balance >= 0 ? '#15803d' : '#b91c1c'
            };">
              ${filteredMetrics.balance >= 0 ? '+' : ''} R$ ${filteredMetrics.balance.toLocaleString(
      'pt-BR',
      { minimumFractionDigits: 2 }
    )}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 85px;">Data</th>
              <th>Descrição</th>
              <th style="width: 130px;">Categoria</th>
              <th style="width: 110px;">Conta/Carteira</th>
              <th style="width: 80px; text-align: center;">Tipo</th>
              <th style="width: 110px; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum lançamento no período filtrado.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Gerado pelo Sistema Inteligente NossoBolso Finance OS. Todos os dados permanecem protegidos sob criptografia e controle exclusivo do usuário.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. BARRA PRINCIPAL: FILTROS RÁPIDOS, BUSCA E AÇÕES (CATEGORIAS, CSV, PDF) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0D1424]/90 p-3 rounded-2xl border border-[#2E3B52] shadow-lg">
        {/* Lado Esquerdo: Tipos e Período */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Tipo: Todas / Receitas / Despesas */}
          <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-xl border border-[#2E3B52]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#00FF88] text-[#0B0F19] shadow-md shadow-[#00FF88]/20'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'income'
                  ? 'bg-[#10B981] text-[#0B0F19] shadow-md shadow-[#10B981]/20'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Receitas
            </button>
            <button
              type="button"
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-[#FF4D6D] text-[#F8FAFC] shadow-md shadow-[#FF4D6D]/20'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Despesas
            </button>
          </div>

          <div className="hidden sm:block w-[1px] h-5 bg-[#2E3B52]" />

          {/* Seletor Período Rápido */}
          <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-xl border border-[#2E3B52]">
            <button
              type="button"
              onClick={() => setFilterPeriodMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterPeriodMode === 'month'
                  ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Filtrar pelo mês atualmente selecionado no topo"
            >
              <Calendar className="w-3.5 h-3.5 text-[#00FF88]" />
              <span className="hidden sm:inline">{getSelectedMonthName()}</span>
              <span className="sm:hidden">Mês Ativo</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterPeriodMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriodMode === 'all'
                  ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Exibir todos os lançamentos históricos sem filtro de data"
            >
              🌐 Todas as Datas
            </button>
          </div>

          {/* Botão de Alternar Filtros Avançados */}
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isAdvancedFiltersOpen || activeFiltersCount > 0
                ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-md shadow-[#00FF88]/10'
                : 'bg-[#162032] text-[#94A3B8] border-[#2E3B52] hover:text-[#F8FAFC] hover:border-[#38BDF8]/40'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00FF88] text-[#0B0F19] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Lado Direito: Busca e Botões (Categorias, CSV, PDF) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-56 md:w-64">
            <Input
              id="transaction-search-input"
              name="transactionSearch"
              aria-label="Buscar transação"
              placeholder="🔍 Buscar transação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* NOVO BOTÃO DE CATEGORIAS AO LADO DE CSV E PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryModalOpen(true)}
            className="bg-[#162032] border-[#F59E0B]/40 hover:border-[#F59E0B] text-[#F8FAFC] hover:text-[#F59E0B] transition-all shrink-0 font-bold"
            title="Gerenciar ou Criar Novas Categorias"
          >
            <Tag className="w-4 h-4 text-[#F59E0B]" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>

          {/* BOTÃO IMPORTAR / LER HOLERITE */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContrachequeModalOpen(true)}
            className="bg-[#162032] border-[#10B981]/40 hover:border-[#10B981] text-[#F8FAFC] hover:text-[#10B981] transition-all shrink-0 font-bold"
            title="Importar e Ler Holerite / Contracheque"
          >
            <FileCheck className="w-4 h-4 text-[#10B981]" />
            <span className="hidden sm:inline">Holerite</span>
          </Button>

          {/* BOTÃO ESCANEAR NOTA FISCAL (QR CODE) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrCodeModalOpen(true)}
            className="bg-[#162032] border-[#06B6D4]/40 hover:border-[#06B6D4] text-[#F8FAFC] hover:text-[#06B6D4] transition-all shrink-0 font-bold"
            title="Escanear Nota Fiscal NFC-e por QRCode / Câmera"
          >
            <QrCode className="w-4 h-4 text-[#06B6D4]" />
            <span className="hidden sm:inline">Nota Fiscal</span>
          </Button>

          {/* BOTÃO EXPORTAR CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="bg-[#162032] border-[#2E3B52] hover:border-[#00FF88]/40 shrink-0 font-bold"
            title="Exportar dados para Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00FF88]" />
            <span className="hidden sm:inline">CSV</span>
          </Button>

          {/* NOVO BOTÃO IMPRIMIR PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            className="bg-[#162032] border-[#2E3B52] hover:border-[#38BDF8]/40 shrink-0 font-bold"
            title="Imprimir Extrato ou Salvar em PDF"
          >
            <Printer className="w-4 h-4 text-[#38BDF8]" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* 2. PAINEL EXPANSÍVEL DE FILTROS AVANÇADOS */}
      {isAdvancedFiltersOpen && (
        <div className="p-4 bg-[#0A0E1A] border border-[#2E3B52] rounded-2xl flex flex-col gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#00FF88]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#F8FAFC]">
                Filtros Avançados de Transações
              </h4>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-[#FF4D6D] hover:text-red-300 font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro por Categoria */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-category-select" className="text-[11px] font-bold text-[#94A3B8] uppercase">
                Categoria
              </label>
              <select
                id="filter-category-select"
                name="filterCategory"
                aria-label="Filtrar por Categoria"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#00FF88] cursor-pointer"
              >
                <option value="all">🏷️ Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.emoji || '🏷️'} {c.name} ({c.type === 'income' ? 'Receita' : 'Despesa'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Carteira / Conta Bancária */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-wallet-select" className="text-[11px] font-bold text-[#94A3B8] uppercase">
                Conta / Carteira
              </label>
              <select
                id="filter-wallet-select"
                name="filterWallet"
                aria-label="Filtrar por Conta ou Carteira"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="h-10 px-3 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#00FF88] cursor-pointer"
              >
                <option value="all">💳 Todas as Contas / Carteiras</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type === 'credit' ? 'Cartão de Crédito' : 'Conta/Dinheiro'})
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenação dos Lançamentos */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-sort-select" className="text-[11px] font-bold text-[#94A3B8] uppercase">
                Ordenar Por
              </label>
              <select
                id="filter-sort-select"
                name="filterSort"
                aria-label="Ordenar transações"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-10 px-3 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#00FF88] cursor-pointer"
              >
                <option value="date-desc">📅 Data: Mais Recentes Primeiro</option>
                <option value="date-asc">📅 Data: Mais Antigas Primeiro</option>
                <option value="amount-desc">💰 Valor: Maior para Menor</option>
                <option value="amount-asc">💰 Valor: Menor para Maior</option>
                <option value="desc-asc">🔤 Descrição: A até Z</option>
              </select>
            </div>

            {/* Período Personalizado (De / Até) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">
                Intervalo de Datas
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="filter-start-date"
                  name="filterStartDate"
                  aria-label="Data inicial do filtro"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setFilterPeriodMode('custom');
                  }}
                  className="w-full h-10 px-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#00FF88]"
                  title="Data Inicial"
                />
                <span className="text-[#64748B] text-xs">até</span>
                <input
                  id="filter-end-date"
                  name="filterEndDate"
                  aria-label="Data final do filtro"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setFilterPeriodMode('custom');
                  }}
                  className="w-full h-10 px-2 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#00FF88]"
                  title="Data Final"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BARRA DE RESUMO RÁPIDO DO EXTRATO FILTRADO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0D1424] border border-[#2E3B52] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Lançamentos</span>
          <span className="text-base font-black text-[#F8FAFC]">
            {filteredMetrics.count} <span className="text-xs text-[#64748B] font-medium">itens</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0D1424] border border-[#2E3B52] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#10B981]">Total Receitas</span>
          <span className="text-base font-black text-[#10B981]">
            + {formatBRL(filteredMetrics.income, isPrivacyMode)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0D1424] border border-[#2E3B52] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#FF4D6D]">Total Despesas</span>
          <span className="text-base font-black text-[#FF4D6D]">
            - {formatBRL(filteredMetrics.expense, isPrivacyMode)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0D1424] border border-[#2E3B52] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#38BDF8]">Saldo do Filtro</span>
          <span
            className={`text-base font-black ${
              filteredMetrics.balance >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
            }`}
          >
            {filteredMetrics.balance >= 0 ? '+' : ''}{' '}
            {formatBRL(filteredMetrics.balance, isPrivacyMode)}
          </span>
        </div>
      </div>

      {/* 4. TABELA DE TRANSAÇÕES */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2E3B52] bg-[#121927] text-[#94A3B8] text-xs uppercase tracking-wider font-extrabold">
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Conta/Carteira</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3B52] text-sm">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-[#64748B]/50" />
                      <span className="font-bold text-sm text-[#F8FAFC]">
                        Nenhuma transação encontrada com os filtros atuais.
                      </span>
                      <p className="text-xs text-[#64748B]">
                        Tente ajustar a busca ou clique em Limpar Filtros para visualizar outros períodos.
                      </p>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                          className="mt-2 text-xs border-[#2E3B52]"
                        >
                          Limpar Filtros Aplicados
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1E293B]/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                          tx.type === 'income'
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {tx.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#F8FAFC]">{tx.description}</td>
                    <td className="py-3.5 px-4 text-[#94A3B8] font-medium">{tx.category}</td>
                    <td className="py-3.5 px-4 text-[#64748B] text-xs font-semibold">
                      {tx.walletId ? walletMap.get(tx.walletId) || 'Principal' : 'Principal'}
                    </td>
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
                          type="button"
                          onClick={() => handleEdit(tx.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#162032] rounded-lg transition-colors cursor-pointer"
                          title="Editar Lançamento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tx.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] hover:bg-[#162032] rounded-lg transition-colors cursor-pointer"
                          title="Excluir Lançamento"
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

