import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Smartphone, Download, Share, PlusSquare, CheckCircle2, Sparkles, Monitor, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // 1. Resgata prompt capturado globalmente no carregamento da página
    const win = window as unknown as { deferredPrompt?: BeforeInstallPromptEvent };
    if (win.deferredPrompt) {
      setDeferredPrompt(win.deferredPrompt);
    }

    // 2. Escuta eventos adicionais de prontidão para instalação
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleCustomEvent = () => {
      if (win.deferredPrompt) {
        setDeferredPrompt(win.deferredPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('nossobolso:pwa-installable', handleCustomEvent);

    // 3. Verifica se já está em modo standalone (app instalado)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('nossobolso:pwa-installable', handleCustomEvent);
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
      const win = window as unknown as { deferredPrompt?: BeforeInstallPromptEvent };
      win.deferredPrompt = undefined;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalar Aplicativo NossoBolso">
      <div className="flex flex-col gap-5 py-2">
        {/* Card de Apresentação com Novo Ícone Oficial */}
        <div className="p-4 bg-gradient-to-br from-[#0B1528] via-[#070D18] to-[#04060B] border border-[#00FF88]/30 rounded-2xl flex items-center gap-4 shadow-xl shadow-emerald-950/20">
          <img
            src="/pwa-192x192.png"
            alt="Ícone Oficial NossoBolso"
            className="w-14 h-14 rounded-2xl shadow-lg shadow-emerald-500/20 border border-[#00FF88]/40 shrink-0 object-cover"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-[#F8FAFC] text-base tracking-tight">NossoBolso Finance OS</h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30">
                PWA Nativo
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Aplicativo com acesso offline instantâneo, banco local e novo ícone esmeralda 3D.
            </p>
          </div>
        </div>

        {/* 1. SE TIVER BOTÃO DE INSTALAÇÃO EM 1-CLIQUE */}
        {deferredPrompt && !isInstalled && (
          <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 to-[#06B6D4]/15 border border-[#00FF88]/40 rounded-2xl flex flex-col items-center gap-3 text-center">
            <Sparkles className="w-7 h-7 text-[#00FF88] animate-bounce" />
            <div>
              <h4 className="text-sm font-black text-[#F8FAFC]">Instalação Pronta em 1 Clique!</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Clique no botão abaixo para adicionar o NossoBolso diretamente à sua área de trabalho ou tela inicial.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#00FF88] to-emerald-500 hover:from-[#00e67a] hover:to-emerald-600 text-[#05070E] font-black text-sm shadow-lg shadow-[#00FF88]/30 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Instalar Aplicativo Agora</span>
            </Button>
          </div>
        )}

        {/* 2. SE JÁ ESTIVER INSTALADO */}
        {isInstalled && (
          <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl flex items-center gap-3 text-[#00FF88]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span className="text-xs font-black">O NossoBolso já está instalado e rodando em modo nativo no seu dispositivo!</span>
          </div>
        )}

        {/* 3. GUIA VISUAL DE INSTALAÇÃO CASO O NAVEGADOR EXIJA AÇÃO MANUAL */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
            <Info className="w-4 h-4 text-[#06B6D4]" />
            <span>Como instalar no seu dispositivo:</span>
          </div>

          {!isMobile ? (
            /* Guia para Computador (Brave, Chrome, Edge no Windows / Mac) */
            <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold text-xs">
                <Monitor className="w-4 h-4" />
                <span>No seu Computador (Brave / Chrome / Edge)</span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Navegadores desktop protegem a instalação solicitando confirmação na barra superior:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    Opção A: Barra de Endereço
                  </span>
                  <span className="text-[#94A3B8] text-[11px]">
                    Olhe no canto direito da barra de URL (onde diz <code>localhost:3000</code>) e clique no ícone de <strong className="text-white">Instalar</strong> (seta para baixo ou monitor).
                  </span>
                </div>
                <div className="p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    Opção B: Menu do Navegador
                  </span>
                  <span className="text-[#94A3B8] text-[11px]">
                    Clique nos <strong className="text-white">3 tracinhos/pontos</strong> no canto superior direito do seu navegador e escolha <strong className="text-[#00FF88]">"Instalar NossoBolso..."</strong>.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Guia para Celular (Android / iOS) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Android */}
              <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#00FF88] font-black text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Android (Chrome / Edge / Brave)</span>
                </div>
                <ol className="text-xs text-[#94A3B8] space-y-1 list-decimal list-inside font-medium">
                  <li>Toque no menu (3 pontinhos <strong className="text-white">:</strong>).</li>
                  <li>Toque em <strong className="text-white">"Adicionar à Tela Inicial"</strong> ou <strong className="text-white">"Instalar App"</strong>.</li>
                  <li>O ícone esmeralda 3D aparecerá na sua tela!</li>
                </ol>
              </div>

              {/* iOS */}
              <div className="p-4 bg-[#090D18] border border-[#1E293B] rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#38BDF8] font-black text-xs">
                  <Share className="w-4 h-4" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="text-xs text-[#94A3B8] space-y-1 list-decimal list-inside font-medium">
                  <li>Toque no botão <strong className="text-white">Compartilhar</strong> (<Share className="w-3 h-3 inline text-[#38BDF8]" />).</li>
                  <li>Selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3 h-3 inline text-[#38BDF8]" />).</li>
                  <li>Toque em <strong className="text-white">"Adicionar"</strong> no topo direito.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
