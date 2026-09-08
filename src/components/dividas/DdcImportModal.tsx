import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, ProgressBar } from '../ui';
import { useAppStore } from '../../estado/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { formatBRL } from '../../utilidades/formatters';
import { formatDate } from '../../utilidades/dateUtils';
import {
  FileCheck,
  Upload,
  CheckCircle,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Home,
  ArrowRight,
} from 'lucide-react';
import { parseDDCText, ParsedDDCData } from '../../utilidades/ddcParser';
import { extractTextFromPdf } from '../../servicos/pdfTextExtractor';

export const DdcImportModal: React.FC = () => {
  const { isDdcModalOpen, setDdcModalOpen, isPrivacyMode } = useAppStore();
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const [step, setStep] = useState<'upload' | 'evaluate' | 'saving' | 'success'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Financiamentos & Veículos');
  const [parsedData, setParsedData] = useState<ParsedDDCData | null>(null);

  // Estados de progresso durante o salvamento das parcelas
  const [savingProgress, setSavingProgress] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [currentSavingInfo, setCurrentSavingInfo] = useState<{
    number: number;
    dueDate: string;
    amount: number;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Seleciona a carteira padrão
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const handleProcessExtractedText = (text: string) => {
    const result = parseDDCText(text);
    setParsedData(result);

    // Ajusta categoria padrão: 'Moradia' para habitacional ou 'Financiamentos & Veículos'
    const isHabitacional = !!(result.propertyAddress || result.amortizationSystem === 'sac' || result.modality.toLowerCase().includes('habita'));
    setSelectedCategory(isHabitacional ? 'Moradia' : 'Financiamentos & Veículos');

    // Auto-seleciona a carteira caso o nome do banco case com alguma existente
    if (result.institution && wallets.length > 0) {
      const lowerInst = result.institution.toLowerCase();
      const matched = wallets.find(
        (w) =>
          lowerInst.includes(w.name.toLowerCase()) ||
          w.name.toLowerCase().includes('bradesco') && lowerInst.includes('bradesco') ||
          w.name.toLowerCase().includes('caixa') && lowerInst.includes('caixa')
      );
      if (matched) {
        setSelectedWalletId(matched.id);
      }
    }

    if (result.installments.length === 0) {
      setParseWarning('Não foi possível identificar a tabela de parcelas automaticamente. Por favor, confira o documento.');
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
        setParseWarning('Não foi possível extrair o texto deste arquivo. Verifique se o arquivo possui texto selecionável ou cole o conteúdo manualmente.');
        setIsProcessing(false);
        return;
      }

      handleProcessExtractedText(content);
    } catch (err) {
      console.error('Erro ao ler DDC:', err);
      setParseWarning('Houve uma falha ao decodificar este arquivo PDF. Tente colar o texto copiado do documento abaixo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = () => {
    if (!pastedText.trim()) return;
    handleProcessExtractedText(pastedText);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    const targetWalletId = selectedWalletId || wallets[0]?.id || 'w1';
    const contractId = 'debt_' + (parsedData.contractNumber || Math.random().toString(36).substring(2, 9));

    // Inicializa a tela de animação de inclusão
    setStep('saving');
    setSavedCount(0);
    setSavingProgress(0);

    // 1. Cadastra ou atualiza o Contrato de Financiamento
    await db.debtContracts.put({
      id: contractId,
      title: parsedData.title,
      totalAmount: parsedData.totalOperationAmount || (parsedData.totalInstallments * parsedData.installmentAmount),
      startDate: parsedData.installments[0]?.dueDate || '2026-02-18',
      totalInstallments: parsedData.totalInstallments,
      originalTotalInstallments: parsedData.totalInstallments,
      startInstallmentNum: parsedData.nextInstallmentNumber,
      installmentAmount: parsedData.installmentAmount,
      interestRate: parsedData.monthlyInterestRate,
      interestRateType: 'monthly',
      amortizationSystem: parsedData.amortizationSystem,
      category: selectedCategory,
      walletId: targetWalletId,
      notes: parsedData.propertyAddress ? `Imóvel: ${parsedData.propertyAddress} | Sistema: ${parsedData.amortizationSystem.toUpperCase()}` : undefined,
      createdAt: new Date().toISOString(),
    });

    // 2. Insere as Parcelas a Vencer e a parcela recente do mês vigente no cronograma de transações
    const openInstallments = parsedData.installments.filter((i) => i.status === 'open');
    const recentPaidInstallments = parsedData.installments.filter(
      (i) => i.status === 'paid' && (i.dueDate.startsWith('2026-09') || i.number === parsedData.nextInstallmentNumber - 1)
    );
    const installmentsToSave = [...recentPaidInstallments, ...openInstallments];
    const total = installmentsToSave.length;
    const batchSize = 12; // Lotes de 12 itens para animação suave

    for (let i = 0; i < total; i += batchSize) {
      const batch = installmentsToSave.slice(i, i + batchSize);
      const txBatch = batch.map((inst) => ({
        id: `tx_${contractId}_${inst.number}`,
        description: `${parsedData.title} (${inst.number}/${parsedData.totalInstallments})`,
        amount: inst.amount,
        date: inst.dueDate,
        type: 'expense' as const,
        category: selectedCategory,
        walletId: targetWalletId,
        contractId: contractId,
        installments: {
          current: inst.number,
          total: parsedData.totalInstallments,
        },
        createdAt: new Date().toISOString(),
      }));

      await db.transactions.bulkPut(txBatch);

      const currentDone = Math.min(i + batch.length, total);
      const lastInst = batch[batch.length - 1];
      setSavedCount(currentDone);
      setSavingProgress(Math.round((currentDone / total) * 100));
      setCurrentSavingInfo({
        number: lastInst.number,
        dueDate: lastInst.dueDate,
        amount: lastInst.amount,
      });

      // Micro pausa para renderizar o efeito visual sem travar o event loop
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    // Pequena pausa para contemplação dos 100%
    await new Promise((resolve) => setTimeout(resolve, 300));
    setStep('success');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStep('upload');
      setPastedText('');
      setFileName('');
      setParsedData(null);
      setDdcModalOpen(false);
    }, 2500);
  };

  return (
    <Modal
      isOpen={isDdcModalOpen}
      onClose={() => setDdcModalOpen(false)}
      title="Importar DDC / Contrato de Financiamento (PDF)"
    >
      <div className="flex flex-col gap-4 py-1">
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            {/* Explicação da Leitura */}
            <div className="p-3.5 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#00FF88]">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold text-[#F8FAFC]">Leitura Automática de DDC Bancário</h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Envie o arquivo PDF do <strong>DDC (Documento Descritivo de Crédito)</strong> emitido pelo seu banco (ex: Bradesco, Banco do Brasil, Caixa). O sistema extrai automaticamente o saldo devedor, o valor da parcela, a taxa de juros, as parcelas já pagas e as parcelas a vencer.
              </p>
            </div>

            {/* Aviso de erro/leitura caso ocorra */}
            {parseWarning && (
              <div className="p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl flex items-center gap-2.5 text-[#FFB800] text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseWarning}</span>
              </div>
            )}

            {/* Upload Zone */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E2330] hover:border-[#00FF88] rounded-2xl cursor-pointer bg-[#0A0B0E]/50 transition-colors group">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2 text-[#00FF88]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold">Lendo e decodificando contrato DDC em PDF...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#64748B] group-hover:text-[#00FF88] mb-2 transition-colors" />
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    {fileName ? fileName : 'Clique para selecionar o DDC (PDF ou TXT)'}
                  </span>
                  <span className="text-xs text-[#64748B] mt-1">
                    Processamento 100% local e seguro no seu dispositivo
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    disabled={isProcessing}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-[#1E2330]" />
              <span className="text-xs text-[#64748B] font-bold uppercase">ou cole o texto do DDC</span>
              <div className="flex-1 h-[1px] bg-[#1E2330]" />
            </div>

            {/* Textarea Area */}
            <div className="flex flex-col gap-2">
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui o texto copiado do documento de evolução de dívida..."
                className="w-full p-3 text-xs bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-mono"
              />
              <Button variant="primary" onClick={handleTextSubmit} disabled={!pastedText.trim()}>
                <FileCheck className="w-4 h-4" />
                <span>Interpretar Texto do DDC</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'evaluate' && parsedData && (
          <div className="flex flex-col gap-4 max-h-[520px] overflow-y-auto pr-1">
            {/* Header do Contrato */}
            {/* Header do Contrato */}
            <div className="p-3.5 bg-[#0D1424] border border-[#2E3B52] rounded-2xl flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <label className="text-[10px] text-[#94A3B8] font-bold uppercase flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#00FF88]" />
                    <span>Instituição & Contrato</span>
                  </label>
                  <span className="text-sm font-black text-[#F8FAFC]">
                    {parsedData.title}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    Modalidade: {parsedData.modality}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Categoria</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#2E3B52] focus:border-[#00FF88]"
                    >
                      <option value="Moradia">🏠 Moradia</option>
                      <option value="Financiamentos & Veículos">🚗 Financiamentos & Veículos</option>
                      <option value="Dívidas & Empréstimos">💳 Dívidas & Empréstimos</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Debitar na Carteira</label>
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="bg-[#12141A] text-xs font-bold text-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#2E3B52] focus:border-[#00FF88]"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Endereço do Imóvel (se identificado) */}
              {parsedData.propertyAddress && (
                <div className="p-2.5 bg-[#0A0B0E] border border-[#2E3B52]/70 rounded-xl flex items-center gap-2.5 text-xs">
                  <Home className="w-4 h-4 text-[#00FF88] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Imóvel Financiado</span>
                    <span className="text-xs font-semibold text-[#F8FAFC]">{parsedData.propertyAddress}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cards de Métricas do Contrato */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#10B981]">Saldo Devedor</span>
                <span className="text-base font-black text-[#10B981] mt-0.5">
                  {formatBRL(parsedData.currentDebtBalance, isPrivacyMode)}
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  Original: {formatBRL(parsedData.totalOperationAmount, isPrivacyMode)}
                </span>
              </div>

              <div className="p-3 bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#FF4D6D]">Valor da Parcela</span>
                <span className="text-base font-black text-[#FF4D6D] mt-0.5">
                  {formatBRL(parsedData.installmentAmount, isPrivacyMode)}
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  {parsedData.amortizationSystem === 'sac' ? 'Sistema SAC (Decrescente)' : 'Tabela PRICE (Fixa)'}
                </span>
              </div>

              <div className="p-3 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#06B6D4]">Parcelas a Vencer</span>
                <span className="text-base font-black text-[#06B6D4] mt-0.5">
                  {parsedData.remainingInstallments}x
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  De {parsedData.totalInstallments} parcelas totais
                </span>
              </div>

              <div className="p-3 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-[#A855F7]">Taxa de Juros</span>
                <span className="text-base font-black text-[#A855F7] mt-0.5">
                  {parsedData.monthlyInterestRate.toFixed(2)}% a.m.
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  Próx: {formatDate(parsedData.nextDueDate)}
                </span>
              </div>
            </div>

            {/* Detalhe de Amortizações e Parcelas Já Pagas */}
            <div className="p-3 bg-[#121927] border border-[#2E3B52] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span className="text-[#94A3B8]">
                  Parcelas já pagas: <strong className="text-[#10B981]">{parsedData.paidCount} parcelas</strong>
                </span>
              </div>

              {parsedData.liquidatedEarlyCount > 0 && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00FF88]" />
                  <span className="text-[#00FF88] font-bold">
                    {parsedData.liquidatedEarlyCount} parcelas liquidadas antecipadamente com desconto!
                  </span>
                </div>
              )}
            </div>

            {/* Visualização da Tabela de Parcelas a Vencer */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#F8FAFC]">
                Cronograma de Parcelas Futuras ({parsedData.remainingInstallments} parcelas)
              </span>

              <div className="max-h-48 overflow-y-auto border border-[#1E2330] rounded-xl divide-y divide-[#1E2330] bg-[#0A0B0E]">
                {parsedData.installments
                  .filter((inst) => inst.status === 'open')
                  .map((inst) => (
                    <div key={inst.number} className="flex items-center justify-between p-2.5 text-xs hover:bg-[#121927]">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] font-black flex items-center justify-center text-[11px]">
                          {inst.number}
                        </span>
                        <div>
                          <span className="font-bold text-[#F8FAFC]">Vencimento: {formatDate(inst.dueDate)}</span>
                          <span className="block text-[10px] text-[#64748B]">
                            Amortização: {formatBRL(inst.principal, isPrivacyMode)} | Juros: {formatBRL(inst.interest, isPrivacyMode)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-[#FF4D6D]">{formatBRL(inst.amount, isPrivacyMode)}</span>
                        <span className="block text-[10px] text-[#94A3B8]">A Vencer</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1E2330]">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <RefreshCw className="w-4 h-4" />
                <span>Trocar Arquivo</span>
              </Button>

              <Button variant="primary" onClick={handleConfirmImport}>
                <CheckCircle className="w-4 h-4" />
                <span>Cadastrar Financiamento no NossoBolso</span>
              </Button>
            </div>
          </div>
        )}

        {/* Etapa de Processamento e Salvamento em Tempo Real com Animação */}
        {step === 'saving' && parsedData && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-5">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] shadow-lg shadow-[#00FF88]/10">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#06B6D4] flex items-center justify-center text-[#0D1424]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-extrabold text-[#F8FAFC]">
                Cadastrando Cronograma de Parcelas...
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Gravando <strong>{parsedData.remainingInstallments} parcelas</strong> com juros e amortizações no seu banco de dados local.
              </p>
            </div>

            {/* Barra de Progresso com Gradiente NossoBolso */}
            <div className="w-full max-w-md bg-[#0D1424] p-4 rounded-2xl border border-[#2E3B52]">
              <ProgressBar
                value={savingProgress}
                max={100}
                variant="gradient"
                size="md"
                showLabel
                label={`Progresso: ${savedCount} de ${parsedData.remainingInstallments} parcelas`}
              />

              {/* Destaque da parcela sendo cadastrada neste milissegundo */}
              {currentSavingInfo && (
                <div className="mt-3.5 pt-3 border-t border-[#1E2330] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#00FF88]/15 text-[#00FF88] font-black text-[11px]">
                      Parcela #{currentSavingInfo.number}
                    </span>
                    <span className="text-[#94A3B8]">
                      Vencimento: <strong className="text-[#F8FAFC]">{formatDate(currentSavingInfo.dueDate)}</strong>
                    </span>
                  </div>

                  <span className="font-extrabold text-[#00FF88]">
                    {formatBRL(currentSavingInfo.amount, isPrivacyMode)}
                  </span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00FF88]" />
              Inserção assíncrona ultra rápida em lotes (sem travamento)
            </span>
          </div>
        )}

        {/* Etapa de Sucesso */}
        {step === 'success' && parsedData && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] animate-bounce shadow-lg shadow-[#10B981]/20">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-black text-[#F8FAFC]">Financiamento Cadastrado com Sucesso!</h3>
              <p className="text-xs text-[#94A3B8]">
                O contrato e todas as <strong>{parsedData.remainingInstallments} parcelas futuras</strong> foram adicionados ao seu fluxo financeiro.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-1">
              <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Parcelas Inseridas</span>
                <span className="text-sm font-black text-[#00FF88] mt-0.5">{parsedData.remainingInstallments}x</span>
              </div>
              <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Próximo Vencimento</span>
                <span className="text-sm font-black text-[#06B6D4] mt-0.5">{formatDate(parsedData.nextDueDate)}</span>
              </div>
            </div>

            <div className="pt-2 w-full max-w-sm">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setStep('upload');
                  setPastedText('');
                  setFileName('');
                  setParsedData(null);
                  setDdcModalOpen(false);
                }}
              >
                <span>Concluir e Ver Financiamentos</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
