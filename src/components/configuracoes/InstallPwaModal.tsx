import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Smartphone, Download, Share, PlusSquare, CheckCircle2, Sparkles, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Escuta evento nativo do navegador para instalação em 1-clique
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se já está rodando como PWA instalado (Standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalar NossoBolso no Celular / Tablet">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Boas-Vindas */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <Smartphone className="w-7 h-7 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Aplicativo Nativo PWA sem Loja de Apps</h4>
            <p className="mt-1">
              Instale o **NossoBolso Finance OS** diretamente na tela inicial do seu Android ou iPhone com suporte offline e acesso instantâneo!
            </p>
          </div>
        </div>

        {/* Botão de 1-Clique se o navegador suportar o evento direto */}
        {deferredPrompt ? (
          <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/40 rounded-2xl flex flex-col items-center gap-3 text-center">
            <Sparkles className="w-8 h-8 text-[#00FF88] animate-bounce" />
            <h4 className="text-sm font-black text-[#F8FAFC]">Instalação Direta Pronta!</h4>
            <p className="text-xs text-[#94A3B8]">Seu dispositivo suporta a instalação em 1-clique agora mesmo.</p>
            <Button variant="primary" size="lg" onClick={handleInstallClick} className="w-full sm:w-auto">
              <Download className="w-5 h-5" />
              <span>Instalar Aplicativo Agora</span>
            </Button>
          </div>
        ) : isInstalled ? (
          <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl flex items-center gap-3 text-[#00FF88]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span className="text-xs font-black">O NossoBolso já está instalado no seu dispositivo!</span>
          </div>
        ) : (
          /* Instruções para Android & iOS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Android */}
            <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[#00FF88] font-black text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Android (Chrome / Edge)</span>
              </div>
              <ol className="text-xs text-[#94A3B8] space-y-1.5 list-decimal list-inside font-medium">
                <li>Abra o menu do navegador (3 pontinhos <span className="font-bold text-[#F8FAFC]">:</span>).</li>
                <li>Toque em <strong className="text-[#F8FAFC]">"Adicionar à Tela Inicial"</strong> ou <strong className="text-[#F8FAFC]">"Instalar App"</strong>.</li>
                <li>Confirme a instalação e o ícone aparecerá na sua tela inicial!</li>
              </ol>
            </div>

            {/* iOS (iPhone / iPad) */}
            <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[#38BDF8] font-black text-xs">
                <Share className="w-4 h-4" />
                <span>iPhone / iPad (Safari)</span>
              </div>
              <ol className="text-xs text-[#94A3B8] space-y-1.5 list-decimal list-inside font-medium">
                <li>Toque no botão <strong className="text-[#F8FAFC]">Compartilhar</strong> (<Share className="w-3 h-3 inline text-[#38BDF8]" />).</li>
                <li>Role para baixo e selecione <strong className="text-[#F8FAFC]">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3 h-3 inline text-[#38BDF8]" />).</li>
                <li>Toque em <strong className="text-[#F8FAFC]">"Adicionar"</strong> no canto superior direito!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
