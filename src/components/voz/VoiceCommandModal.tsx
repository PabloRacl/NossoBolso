import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { Mic, MicOff, Sparkles, CheckCircle2, AlertCircle, Volume2, ArrowRight } from 'lucide-react';

interface ISpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export const VoiceCommandModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { setActivePage, triggerTransactionAnimation, setTransactionModalOpen } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setFeedback(null);
    }
  }, [isOpen]);

  const handleStartListening = () => {
    const win = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setFeedback('Seu navegador não possui suporte para a Web Speech API. Recomendamos o Google Chrome ou Edge.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback('Ouvindo... Fale seu comando (ex: "Adicionar despesa de 50 reais em restaurante")');
    };

    recognition.onresult = (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event: { error?: string }) => {
      console.error('Erro de reconhecimento de voz:', event.error);
      setIsListening(false);
      setFeedback('Não consegui entender a fala. Tente novamente!');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleProcessTranscript = async () => {
    if (!transcript) return;
    const lower = transcript.toLowerCase();

    // 1. Comando de Navegação
    if (lower.includes('carteiras') || lower.includes('banco')) {
      setActivePage('wallets');
      setFeedback('Navegando para Carteiras & Bancos!');
      setTimeout(onClose, 1200);
      return;
    }

    if (lower.includes('relatório') || lower.includes('relatorios')) {
      setActivePage('reports');
      setFeedback('Navegando para Relatórios!');
      setTimeout(onClose, 1200);
      return;
    }

    // 2. Extração de Valores numéricos (ex: 50, 120.50)
    const matchAmount = lower.match(/(\d+([\.,]\d+)?)/);
    const amount = matchAmount ? parseFloat(matchAmount[1].replace(',', '.')) : 0;

    const isExpense = lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei') || lower.includes('compras');
    const isIncome = lower.includes('receita') || lower.includes('ganhei') || lower.includes('recebi') || lower.includes('salário');

    if (amount > 0 && (isExpense || isIncome)) {
      const type = isExpense ? 'expense' : 'income';
      const category = isExpense ? 'Alimentação & Mercado' : 'Salário';
      const description = transcript.charAt(0).toUpperCase() + transcript.slice(1);
      const todayStr = new Date().toISOString().split('T')[0];

      // Salvar no IndexedDB
      const wallets = await db.wallets.toArray();
      const targetWalletId = wallets[0]?.id || 'w1';

      await db.transactions.add({
        id: `tx_voice_${Date.now()}`,
        description,
        amount,
        date: todayStr,
        type,
        category,
        walletId: targetWalletId,
        createdAt: new Date().toISOString(),
      });

      if (wallets[0]) {
        const delta = type === 'income' ? amount : -amount;
        await db.wallets.update(targetWalletId, { balance: wallets[0].balance + delta });
      }

      // Disparar Animação de Moeda Voadora Holográfica!
      triggerTransactionAnimation(type, amount, description);
      setFeedback(`✅ Transação cadastrada: ${description} (R$ ${amount.toFixed(2)})`);
      setTimeout(onClose, 1500);
    } else {
      setFeedback('Não identifiquei o valor ou o tipo da transação. Fale por exemplo: "Adicionar despesa de 70 reais"');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assistente de Voz por IA em Português">
      <div className="flex flex-col items-center justify-center gap-6 py-4 text-center">
        {/* Microfone Animado */}
        <button
          onClick={handleStartListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-2xl cursor-pointer ${
            isListening
              ? 'bg-[#FF4D6D]/20 border-[#FF4D6D] text-[#FF4D6D] animate-pulse shadow-[0_0_40px_rgba(255,77,109,0.5)]'
              : 'bg-[#00FF88]/15 border-[#00FF88] text-[#00FF88] hover:scale-105 shadow-[0_0_30px_rgba(0,255,136,0.3)]'
          }`}
        >
          {isListening ? <MicOff className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
        </button>

        <div className="flex flex-col gap-1 max-w-sm">
          <span className="text-xs font-black text-[#F8FAFC]">
            {isListening ? 'Escutando a sua voz...' : 'Clique no Microfone para Falar'}
          </span>
          <p className="text-[11px] text-[#94A3B8]">
            Fale naturalmente comandos de lançamentos ou navegação em Português.
          </p>
        </div>

        {/* Transcrição ao Vivo */}
        {transcript && (
          <div className="w-full p-4 bg-[#090D18] border border-[#00FF88]/40 rounded-2xl flex flex-col gap-2 text-left">
            <span className="text-[10px] font-bold text-[#00FF88] uppercase tracking-wider">Voz Detectada:</span>
            <p className="text-sm font-black text-[#F8FAFC]">"{transcript}"</p>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div className="text-xs font-bold text-[#06B6D4] bg-[#06B6D4]/10 p-3 rounded-xl border border-[#06B6D4]/30 w-full">
            {feedback}
          </div>
        )}

        {/* Botão de Processar Transcrição */}
        {transcript && !isListening && (
          <Button variant="primary" onClick={handleProcessTranscript} className="w-full text-xs shadow-md shadow-[#00FF88]/20">
            <Sparkles className="w-4 h-4" />
            <span>Confirmar Comando por Voz</span>
          </Button>
        )}
      </div>
    </Modal>
  );
};
