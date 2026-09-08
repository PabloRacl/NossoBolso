import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { formatBRL } from '../../utilidades/formatters';
import {
  FileCheck,
  Upload,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Building,
} from 'lucide-react';
import { parseContrachequeText, ExtractedDeduction } from '../../utilidades/contrachequeParser';
import { extractTextFromPdf } from '../../servicos/pdfTextExtractor';

export const ContrachequeModal: React.FC = () => {
  const { isContrachequeModalOpen, setContrachequeModalOpen, isPrivacyMode } = useAppStore();
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const [step, setStep] = useState<'upload' | 'evaluate' | 'success'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  // Calcula data no mês à frente (mês seguinte ao da folha)
  const getNextMonthDay = (yearMonthStr: string, dayNum: number = 1) => {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (!y || !m) return new Date().toISOString().substring(0, 10);
    const nextDate = new Date(y, m, dayNum);
    const ny = nextDate.getFullYear();
    const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nd = String(nextDate.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  };

  // Mês atual como padrão de abertura
  const getDefaultYearMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Estados dos campos extraídos dinamicamente
  const [employer, setEmployer] = useState('Polícia Militar de Pernambuco (PMPE)');
  const [referenceMonth, setReferenceMonth] = useState('2026-08');
  // REGRA OFICIAL: Folha de AGO/2026 cai sempre no mês à frente (Setembro/2026)
  const [entryDate, setEntryDate] = useState<string>(() => getNextMonthDay('2026-08', 1));
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [netSalary, setNetSalary] = useState<number>(0);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [importMode, setImportMode] = useState<'net_only' | 'detailed'>('detailed');
  const [deductions, setDeductions] = useState<ExtractedDeduction[]>([]);

  const [consignableMargin, setConsignableMargin] = useState<number | undefined>(undefined);

  // Consulta transações existentes no mesmo mês para detectar potencial duplicidade
  const existingMonthSalaries = useLiveQuery(async () => {
    if (!entryDate) return [];
    const targetMonth = entryDate.slice(0, 7);
    return await db.transactions
      .filter((t) => t.category === 'Salário' && t.date.startsWith(targetMonth))
      .toArray();
  }, [entryDate]);

  // Função para alterar o mês de referência e atualizar a data de entrada padrão no mês à frente
  const handleReferenceMonthChange = (monthStr: string) => {
    setReferenceMonth(monthStr);
    setEntryDate(getNextMonthDay(monthStr, 1));
  };

  // Atalho de 1 clique para carregar dados de demonstração da PMPE (AGO/2026 -> Setembro/2026)
  const handleLoadPMPEPreset = () => {
    setEmployer('Polícia Militar de Pernambuco (PMPE)');
    setReferenceMonth('2026-08');
    setEntryDate(getNextMonthDay('2026-08', 1)); // 2026-09-01 (Mês à frente)
    setGrossSalary(8659.00);
    setNetSalary(4244.65);
    setConsignableMargin(329.74);
    setDeductions([
      { id: 'pmpe_1', name: '4003 - FUND PROTECAO SOCIAL MILIT (10.5%)', amount: 650.30, category: 'Impostos & Taxas' },
      { id: 'pmpe_2', name: '4061 - Desconto de Imposto de Rend (Ferias)', amount: 461.59, category: 'Impostos & Taxas' },
      { id: 'pmpe_3', name: '4302 - COMPENS AD 1/3 REMUM FERIAS (2025 1)', amount: 2064.43, category: 'Outras Despesas' },
      { id: 'pmpe_4', name: '4506 - BRADESCO S/A (EMPRESTIMO CONSIG 01)', amount: 1176.10, category: 'Financiamentos & Empréstimos' },
      { id: 'pmpe_5', name: '5091 - SISMEPE (CONTRIB MENSAL)', amount: 61.93, category: 'Saúde' },
    ]);
    setParseWarning(null);
    setStep('evaluate');
  };

  // Define a carteira padrão
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const handleProcessExtractedText = (text: string) => {
    const result = parseContrachequeText(text);

    setEmployer(result.employer);

    if (result.referenceMonth) {
      setReferenceMonth(result.referenceMonth);
      // REGRA: Lançar sempre no mês à frente (ex: AGO/2026 -> 01/09/2026)
      setEntryDate(getNextMonthDay(result.referenceMonth, 1));
    }

    setGrossSalary(result.grossSalary);
    setNetSalary(result.netSalary);
    setDeductions(result.deductions);
    setConsignableMargin(result.consignableMargin);

    // Auto-seleciona a carteira bancária se o nome bater com o banco do contracheque
    if (result.bankName && wallets.length > 0) {
      const lowerBank = result.bankName.toLowerCase();
      const matched = wallets.find(
        (w) =>
          lowerBank.includes(w.name.toLowerCase()) ||
          w.name.toLowerCase().includes('bradesco') && lowerBank.includes('bradesco')
      );
      if (matched) {
        setSelectedWalletId(matched.id);
      }
    }

    if (result.grossSalary === 0 && result.netSalary === 0) {
      setParseWarning('Não foi possível identificar valores monetários automaticamente. Por favor, confira ou preencha os valores nos campos abaixo.');
    } else {
      setParseWarning(null);
    }

    setStep('evaluate');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setParseWarning(null);

    try {
      let content = '';
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        content = await extractTextFromPdf(file);
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        setParseWarning('Não foi possível extrair texto legível deste documento. Se for um arquivo escaneado em imagem, por favor cole o texto ou digite os valores.');
        setIsProcessing(false);
        return;
      }

      handleProcessExtractedText(content);
    } catch (err) {
      console.error('Erro ao ler contracheque:', err);
      setParseWarning('Houve uma falha ao decodificar este arquivo PDF. Experimente copiar e colar o texto abaixo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = () => {
    if (!pastedText.trim()) return;
    handleProcessExtractedText(pastedText);
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
        description: `Salário Líquido (${referenceMonth}) - ${employer}`,
        amount: netSalary,
        date: dateStr,
        type: 'income',
        category: 'Salário',
        walletId: targetWalletId,
        createdAt: new Date().toISOString(),
      });
      netDelta = netSalary;
    } else {
      // Modo Detalhado: 1 Receita com Salário Bruto + Despesas para cada desconto retido
      const nowTs = Date.now();
      await db.transactions.add({
        id: `salario_bruto_${nowTs}`,
        description: `Salário Bruto (${referenceMonth}) - ${employer}`,
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
            description: `Desconto Folha (${referenceMonth}): ${d.name}`,
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

    // Disparar animação de moedas no sistema
    useAppStore.getState().triggerTransactionAnimation(
      'income',
      importMode === 'net_only' ? netSalary : grossSalary,
      `Contracheque ${employer}`
    );

    // Navega automaticamente a aplicação para o mês onde as transações foram gravadas
    const targetMonthKey = dateStr.slice(0, 7);
    useAppStore.getState().setSelectedMonth(targetMonthKey);

    setStep('success');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
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
            {/* Atalho rápido para preset PMPE de demonstração */}
            <div className="p-3 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/15 to-[#A855F7]/15 border border-[#00FF88]/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#00FF88]/20 text-[#00FF88] rounded-xl font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#F8FAFC]">Demonstração PMPE (AGO/2026)</h4>
                  <p className="text-[10px] text-[#94A3B8]">Soldo, Gratificações, Férias, IRRF e Consignados</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={handleLoadPMPEPreset} className="text-xs">
                <span>⚡ Carregar Exemplo PMPE</span>
              </Button>
            </div>

            {/* Explicação da Funcionalidade */}
            <div className="p-3.5 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#00FF88]">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold text-[#F8FAFC]">Leitura Inteligente de Holerites Mensais</h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Envie o arquivo PDF do seu contracheque de qualquer mês. O NossoBolso identifica automaticamente o <strong>mês de competência</strong>, a <strong>empresa ou órgão pagador</strong>, o <strong>Salário Bruto</strong>, todas as <strong>deduções retidas</strong> e o <strong>Salário Líquido</strong>.
              </p>
            </div>

            {/* Aviso de erro/leitura caso ocorra */}
            {parseWarning && (
              <div className="p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl flex items-center gap-2.5 text-[#FFB800] text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseWarning}</span>
              </div>
            )}

            {/* Upload Zone com suporte a PDF real */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E2330] hover:border-[#00FF88] rounded-2xl cursor-pointer bg-[#0A0B0E]/50 transition-colors group">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2 text-[#00FF88]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold">Lendo e decodificando arquivo PDF...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#64748B] group-hover:text-[#00FF88] mb-2 transition-colors" />
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    {fileName ? fileName : 'Clique para selecionar o contracheque (PDF ou TXT)'}
                  </span>
                  <span className="text-xs text-[#64748B] mt-1">
                    Processamento 100% local e seguro no seu dispositivo
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.csv"
                    disabled={isProcessing}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
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
          <div className="flex flex-col gap-4 max-h-[520px] overflow-y-auto pr-1">
            {/* Alerta de aviso se houver */}
            {parseWarning && (
              <div className="p-2.5 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl flex items-center gap-2 text-[#FFB800] text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseWarning}</span>
              </div>
            )}

            {/* Alerta caso o mês já tenha lançamento cadastrado */}
            {existingMonthSalaries && existingMonthSalaries.length > 0 && (
              <div className="p-2.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex items-center gap-2 text-[#06B6D4] text-xs">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  Atenção: Já existe {existingMonthSalaries.length} lançamento de salário registrado em{' '}
                  <strong>{referenceMonth}</strong>. Você pode confirmar para adicionar ou ajustar a data se necessário.
                </span>
              </div>
            )}

            {/* Header com dados principais */}
            <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#00FF88]" />
                    <span>Empresa / Órgão Empregador</span>
                  </label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#F8FAFC] focus:outline-none border-b border-[#2E3B52] py-1"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#00FF88]" />
                    <span>Mês Competência</span>
                  </label>
                  <input
                    type="month"
                    value={referenceMonth}
                    onChange={(e) => handleReferenceMonthChange(e.target.value)}
                    className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#2E3B52]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Depositar na Carteira</label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#2E3B52]"
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
                    onClick={() => setEntryDate(getNextMonthDay(referenceMonth, 1))}
                    className="px-2 py-1 bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 rounded-md text-[10px] font-extrabold hover:bg-[#00FF88]/30 transition-all cursor-pointer shadow-sm"
                    title="Definir data para o dia 1º do mês à frente (padrão)"
                  >
                    ⭐ 01 do Mês à Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryDate(getNextMonthDay(referenceMonth, 5))}
                    className="px-2 py-1 bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 rounded-md text-[10px] font-extrabold hover:bg-[#06B6D4]/25 transition-all cursor-pointer"
                    title="Definir data para o dia 05 do mês à frente"
                  >
                    🗓️ 05 do Mês à Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryDate(getLastDayOfMonth(referenceMonth))}
                    className="px-2 py-1 bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 rounded-md text-[10px] font-extrabold hover:bg-[#A855F7]/25 transition-all cursor-pointer"
                    title="Definir data para o último dia da folha (competência)"
                  >
                    🗓️ Fim da Folha ({referenceMonth})
                  </button>
                </div>
              </div>
            </div>

            {/* Seletor de Modo de Lançamento */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0B0E] border border-[#1E2330] rounded-xl">
              <button
                type="button"
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
                type="button"
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
                  step="0.01"
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
                  step="0.01"
                  value={netSalary}
                  onChange={(e) => setNetSalary(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-lg font-black text-[#00FF88] focus:outline-none mt-1"
                />
              </div>
            </div>

            {consignableMargin !== undefined && consignableMargin > 0 && (
              <div className="p-2.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] font-bold">💳 Margem Consignável Disponível na Folha:</span>
                <span className="text-[#06B6D4] font-black">{formatBRL(consignableMargin, isPrivacyMode)}</span>
              </div>
            )}

            {/* Lista de Descontos Editável (se Modo Detalhado) */}
            {importMode === 'detailed' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC]">
                    Descontos Retidos na Fonte ({deductions.length})
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleAddDeduction} className="text-[#00FF88] text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Desconto</span>
                  </Button>
                </div>

                {deductions.length === 0 ? (
                  <div className="p-3 text-center bg-[#0A0B0E] rounded-xl border border-[#1E2330] text-xs text-[#94A3B8]">
                    Nenhum desconto retido registrado para este contracheque.
                  </div>
                ) : (
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
                            step="0.01"
                            value={d.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDeductions((prev) => prev.map((item) => (item.id === d.id ? { ...item, amount: val } : item)));
                            }}
                            className="w-24 h-8 px-2 text-xs bg-[#0A0B0E] border border-[#2E3B52] rounded-md text-[#FF4D6D] font-bold text-right focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDeduction(d.id)}
                            className="p-1 text-[#94A3B8] hover:text-[#FF4D6D] cursor-pointer"
                            title="Remover desconto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1E2330]">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <RefreshCw className="w-4 h-4" />
                <span>Trocar Arquivo / Recomeçar</span>
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
              Os lançamentos de <strong>{referenceMonth}</strong> ({employer}) foram incluídos na sua conta e atualizados no saldo patrimonial.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
