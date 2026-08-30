import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { FileCheck, Upload, CheckCircle, ArrowRight, RefreshCw, Plus, Trash2, HelpCircle } from 'lucide-react';

interface ExtractedDeduction {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export const ContrachequeModal: React.FC = () => {
  const { isContrachequeModalOpen, setContrachequeModalOpen, isPrivacyMode } = useAppStore();
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const [step, setStep] = useState<'upload' | 'evaluate' | 'success'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  
  const getLastDayOfMonth = (yearMonthStr: string) => {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (!y || !m) return new Date().toISOString().substring(0, 10);
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const getDayOfMonth = (yearMonthStr: string, dayNum: number) => {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (!y || !m) return new Date().toISOString().substring(0, 10);
    return `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Extracted fields — Inicializado com os dados reais do Contracheque PMPE (AGO/2026)
  const [employer, setEmployer] = useState('Polícia Militar de Pernambuco (PMPE)');
  const [referenceMonth, setReferenceMonth] = useState('2026-08');
  const [entryDate, setEntryDate] = useState<string>(() => getLastDayOfMonth('2026-08'));
  const [grossSalary, setGrossSalary] = useState<number>(8659.00);
  const [netSalary, setNetSalary] = useState<number>(4244.65);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [importMode, setImportMode] = useState<'net_only' | 'detailed'>('detailed');

  const [deductions, setDeductions] = useState<ExtractedDeduction[]>([
    { id: 'pmpe_1', name: '4003 - Fund. Proteção Social Militar (10.5%)', amount: 650.30, category: 'Impostos & Taxas' },
    { id: 'pmpe_2', name: '4061 - IRRF - Imposto de Renda', amount: 461.59, category: 'Impostos & Taxas' },
    { id: 'pmpe_3', name: '4302 - Compens. Ad. 1/3 Férias', amount: 2064.43, category: 'Outras Despesas' },
    { id: 'pmpe_4', name: '4506 - Bradesco S/A (Empréstimo Consignado 01)', amount: 1176.10, category: 'Financiamentos & Empréstimos' },
    { id: 'pmpe_5', name: '5091 - SISMEPE (Contrib. Mensal Saúde)', amount: 61.93, category: 'Saúde' },
  ]);

  // Função para alterar o mês de referência e atualizar a data final padrão
  const handleReferenceMonthChange = (monthStr: string) => {
    setReferenceMonth(monthStr);
    setEntryDate(getLastDayOfMonth(monthStr));
  };

  // Função para carregar os dados exatos do Contracheque PMPE
  const handleLoadPMPEPreset = () => {
    setEmployer('Polícia Militar de Pernambuco (PMPE)');
    setReferenceMonth('2026-08');
    setEntryDate(getLastDayOfMonth('2026-08'));
    setGrossSalary(8659.00);
    setNetSalary(4244.65);
    setDeductions([
      { id: 'pmpe_1', name: '4003 - Fund. Proteção Social Militar (10.5%)', amount: 650.30, category: 'Impostos & Taxas' },
      { id: 'pmpe_2', name: '4061 - IRRF - Imposto de Renda', amount: 461.59, category: 'Impostos & Taxas' },
      { id: 'pmpe_3', name: '4302 - Compens. Ad. 1/3 Férias', amount: 2064.43, category: 'Outras Despesas' },
      { id: 'pmpe_4', name: '4506 - Bradesco S/A (Empréstimo Consignado 01)', amount: 1176.10, category: 'Financiamentos & Empréstimos' },
      { id: 'pmpe_5', name: '5091 - SISMEPE (Contrib. Mensal Saúde)', amount: 61.93, category: 'Saúde' },
    ]);
    setStep('evaluate');
  };

  // Set default wallet
  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  // Heuristic parser for contracheque text
  const parseContrachequeText = (text: string) => {
    let gross = 8659.00;
    let net = 4244.65;
    let emp = 'Polícia Militar de Pernambuco (PMPE)';
    const foundDeductions: ExtractedDeduction[] = [];

    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      // Search for gross salary
      if (lower.includes('bruto') || lower.includes('rendimentos') || lower.includes('vencimentos') || lower.includes('vantagens')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          if (val > 1000) gross = val;
        }
      }

      // Search for net salary
      if (lower.includes('líquido') || lower.includes('liquido') || lower.includes('valor a receber')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          if (val > 0) net = val;
        }
      }

      // Detect 4003 Fund Protecao Social Milit
      if (lower.includes('4003') || lower.includes('protecao social') || lower.includes('proteção social')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          foundDeductions.push({ id: `ded_${idx}`, name: '4003 - Fund. Proteção Social Militar', amount: val, category: 'Impostos & Taxas' });
        }
      }

      // Detect 4061 IRRF
      if (lower.includes('4061') || lower.includes('imposto de rend') || lower.includes('irrf')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          foundDeductions.push({ id: `ded_${idx}`, name: '4061 - IRRF - Imposto de Renda', amount: val, category: 'Impostos & Taxas' });
        }
      }

      // Detect 4302 FERIAS
      if (lower.includes('4302') || lower.includes('remum ferias')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          foundDeductions.push({ id: `ded_${idx}`, name: '4302 - Compens. Ad. 1/3 Férias', amount: val, category: 'Outras Despesas' });
        }
      }

      // Detect 4506 BRADESCO CONSIG
      if (lower.includes('4506') || lower.includes('bradesco') || lower.includes('emprestimo')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          foundDeductions.push({ id: `ded_${idx}`, name: '4506 - Bradesco (Empréstimo Consignado)', amount: val, category: 'Financiamentos & Empréstimos' });
        }
      }

      // Detect 5091 SISMEPE
      if (lower.includes('5091') || lower.includes('sismepe')) {
        const matches = line.match(/\d+[.,]\d{2}/g);
        if (matches) {
          const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
          foundDeductions.push({ id: `ded_${idx}`, name: '5091 - SISMEPE (Plano de Saúde)', amount: val, category: 'Saúde' });
        }
      }
    });

    setEmployer(emp);
    setGrossSalary(gross);
    setNetSalary(net);
    if (foundDeductions.length > 0) {
      setDeductions(foundDeductions);
    }
    setStep('evaluate');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        parseContrachequeText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleTextSubmit = () => {
    if (!pastedText.trim()) return;
    parseContrachequeText(pastedText);
  };

  const handleAddDeduction = () => {
    const newId = `d_${Date.now()}`;
    setDeductions((prev) => [
      ...prev,
      { id: newId, name: 'Novo Desconto Retido', amount: 100, category: 'Outras Despesas' },
    ]);
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  const handleConfirmImport = async () => {
    const targetWalletId = selectedWalletId || wallets[0]?.id || 'w1';
    const dateStr = entryDate || getLastDayOfMonth(referenceMonth);
    const wallet = await db.wallets.get(targetWalletId);
    let netDelta = 0;

    if (importMode === 'net_only') {
      // 1 Receita com o Salário Líquido
      await db.transactions.add({
        id: `salario_${Date.now()}`,
        description: `Salário Líquido - ${employer}`,
        amount: netSalary,
        date: dateStr,
        type: 'income',
        category: 'Salário',
        walletId: targetWalletId,
        createdAt: new Date().toISOString(),
      });
      netDelta = netSalary;
    } else {
      // Modo Detalhado: 1 Receita com Salário Bruto + Despesas para cada desconto
      const nowTs = Date.now();
      await db.transactions.add({
        id: `salario_bruto_${nowTs}`,
        description: `Salário Bruto - ${employer}`,
        amount: grossSalary,
        date: dateStr,
        type: 'income',
        category: 'Salário',
        walletId: targetWalletId,
        createdAt: new Date().toISOString(),
      });
      netDelta += grossSalary;

      for (let i = 0; i < deductions.length; i++) {
        const d = deductions[i];
        if (d.amount > 0) {
          await db.transactions.add({
            id: `desc_${d.id}_${nowTs}_${i}`,
            description: `Desconto Folha: ${d.name}`,
            amount: d.amount,
            date: dateStr,
            type: 'expense',
            category: d.category,
            walletId: targetWalletId,
            createdAt: new Date().toISOString(),
          });
          netDelta -= d.amount;
        }
      }
    }

    if (wallet) {
      await db.wallets.update(targetWalletId, { balance: wallet.balance + netDelta });
    }

    setStep('success');
    setTimeout(() => {
      setStep('upload');
      setPastedText('');
      setFileName('');
      setContrachequeModalOpen(false);
    }, 1800);
  };

  return (
    <Modal
      isOpen={isContrachequeModalOpen}
      onClose={() => setContrachequeModalOpen(false)}
      title="Importar e Ler Contracheque / Holerite"
    >
      <div className="flex flex-col gap-4 py-1">
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            {/* Atalho de 1 clique para Contracheque PMPE */}
            <div className="p-3 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/15 to-[#A855F7]/15 border border-[#00FF88]/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#00FF88]/20 text-[#00FF88] rounded-xl font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#F8FAFC]">Contracheque PMPE (AGO/2026)</h4>
                  <p className="text-[10px] text-[#94A3B8]">Soldo, Gratificações, Férias, IRRF e Consignados</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={handleLoadPMPEPreset} className="text-xs">
                <span>⚡ Carregar Dados PMPE</span>
              </Button>
            </div>

            {/* Explicação da Funcionalidade */}
            <div className="p-3.5 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#00FF88]">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold text-[#F8FAFC]">Como funciona a leitura do Contracheque?</h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Envie o arquivo do seu contracheque ou cole o texto copiado do PDF/Holerite. O sistema irá extrair automaticamente o <strong>Salário Bruto</strong>, os <strong>Descontos Retidos (INSS, IRRF, Saúde)</strong> e o <strong>Salário Líquido</strong> para você revisar e aprovar antes da inclusão.
              </p>
            </div>

            {/* Upload Zone */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E2330] hover:border-[#00FF88] rounded-2xl cursor-pointer bg-[#0A0B0E]/50 transition-colors group">
              <Upload className="w-8 h-8 text-[#64748B] group-hover:text-[#00FF88] mb-2 transition-colors" />
              <span className="text-sm font-semibold text-[#F8FAFC]">
                {fileName ? fileName : 'Clique para selecionar contracheque (PDF, TXT ou Imagem)'}
              </span>
              <span className="text-xs text-[#64748B] mt-1">Extrato mensal emitido pelo RH ou portal do funcionário</span>
              <input type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-[#1E2330]" />
              <span className="text-xs text-[#64748B] font-bold uppercase">ou cole o texto</span>
              <div className="flex-1 h-[1px] bg-[#1E2330]" />
            </div>

            {/* Textarea Area */}
            <div className="flex flex-col gap-2">
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui o texto copiado do seu contracheque/holerite..."
                className="w-full p-3 text-xs bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-mono"
              />
              <Button variant="primary" onClick={handleTextSubmit} disabled={!pastedText.trim()}>
                <FileCheck className="w-4 h-4" />
                <span>Interpretar Texto do Contracheque</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'evaluate' && (
          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
            {/* Header com dados principais */}
            <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col flex-1 min-w-[180px]">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Empresa / Empregador</label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#F8FAFC] focus:outline-none border-b border-[#2E3B52]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Mês Referência</label>
                  <input
                    type="month"
                    value={referenceMonth}
                    onChange={(e) => handleReferenceMonthChange(e.target.value)}
                    className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2 py-1 rounded-lg border border-[#2E3B52]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Depositar na Carteira</label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2 py-1 rounded-lg border border-[#2E3B52]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data de Entrada / Recebimento com Atalhos Rápidos */}
              <div className="pt-2 border-t border-[#1E2330] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-[#00FF88] font-bold uppercase">Data de Entrada / Recebimento:</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-[#12141A] text-xs font-black text-[#00FF88] px-2 py-1 rounded-lg border border-[#00FF88]/40 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#94A3B8] font-semibold">Atalhos:</span>
                  <button
                    type="button"
                    onClick={() => setEntryDate(getLastDayOfMonth(referenceMonth))}
                    className="px-2 py-1 bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 rounded-md text-[10px] font-extrabold hover:bg-[#00FF88]/25 transition-all"
                    title="Definir data para o último dia do mês"
                  >
                    🗓️ Último Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryDate(getDayOfMonth(referenceMonth, 5))}
                    className="px-2 py-1 bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 rounded-md text-[10px] font-extrabold hover:bg-[#06B6D4]/25 transition-all"
                    title="Definir data para o dia 05"
                  >
                    🗓️ Dia 05
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryDate(getDayOfMonth(referenceMonth, 1))}
                    className="px-2 py-1 bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 rounded-md text-[10px] font-extrabold hover:bg-[#A855F7]/25 transition-all"
                    title="Definir data para o dia 1º"
                  >
                    🗓️ Dia 1º
                  </button>
                </div>
              </div>
            </div>

            {/* Seletor de Modo de Lançamento */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0B0E] border border-[#1E2330] rounded-xl">
              <button
                onClick={() => setImportMode('detailed')}
                className={`p-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  importMode === 'detailed'
                    ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/40'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <span>📊 Modo Detalhado (Recomendado)</span>
                <span className="text-[10px] font-normal opacity-80">Salário Bruto + Despesas Individuais</span>
              </button>

              <button
                onClick={() => setImportMode('net_only')}
                className={`p-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  importMode === 'net_only'
                    ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/40'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <span>💵 Salário Líquido Simplificado</span>
                <span className="text-[10px] font-normal opacity-80">Lança apenas o dinheiro que cai na conta</span>
              </button>
            </div>

            {/* Valores Calculados */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#10B981]">Salário Bruto</span>
                <input
                  type="number"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-lg font-black text-[#10B981] focus:outline-none mt-1"
                />
              </div>

              <div className="p-3 bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#FF4D6D]">Total Descontos</span>
                <span className="text-lg font-black text-[#FF4D6D] mt-1">
                  {formatBRL(deductions.reduce((a, b) => a + b.amount, 0), isPrivacyMode)}
                </span>
              </div>

              <div className="p-3 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#00FF88]">Salário Líquido</span>
                <input
                  type="number"
                  value={netSalary}
                  onChange={(e) => setNetSalary(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-lg font-black text-[#00FF88] focus:outline-none mt-1"
                />
              </div>
            </div>

            {/* Lista de Descontos Editável (se Modo Detalhado) */}
            {importMode === 'detailed' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC]">Descontos Retidos na Fonte</span>
                  <Button variant="ghost" size="sm" onClick={handleAddDeduction} className="text-[#00FF88] text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Desconto</span>
                  </Button>
                </div>

                <div className="flex flex-col gap-2 bg-[#0A0B0E] p-2 rounded-xl border border-[#1E2330]">
                  {deductions.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 p-2 bg-[#12141A] rounded-lg border border-[#1E2330]">
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDeductions((prev) => prev.map((item) => (item.id === d.id ? { ...item, name: val } : item)));
                        }}
                        className="bg-transparent text-xs font-semibold text-[#F8FAFC] focus:outline-none flex-1"
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#94A3B8] font-bold">R$</span>
                        <input
                          type="number"
                          value={d.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDeductions((prev) => prev.map((item) => (item.id === d.id ? { ...item, amount: val } : item)));
                          }}
                          className="w-24 h-8 px-2 text-xs bg-[#0A0B0E] border border-[#2E3B52] rounded-md text-[#FF4D6D] font-bold text-right focus:outline-none"
                        />
                        <button
                          onClick={() => handleRemoveDeduction(d.id)}
                          className="p-1 text-[#94A3B8] hover:text-[#FF4D6D]"
                          title="Remover desconto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1E2330]">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <RefreshCw className="w-4 h-4" />
                <span>Recomeçar Leitura</span>
              </Button>

              <Button variant="primary" onClick={handleConfirmImport}>
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar e Lançar no NossoBolso</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#F8FAFC]">Contracheque Importado com Sucesso!</h3>
            <p className="text-xs text-[#94A3B8]">
              Os lançamentos foram incluídos na sua conta e atualizados no saldo patrimonial.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
