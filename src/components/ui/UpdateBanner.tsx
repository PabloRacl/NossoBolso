import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { applyUpdate } from '../../servicos/serviceWorkerRegistration';

export const UpdateBanner: React.FC = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<{ registration: ServiceWorkerRegistration }>;
      if (customEvent.detail?.registration) {
        setRegistration(customEvent.detail.registration);
        setIsVisible(true);
      }
    };

    window.addEventListener('nossobolso:update-available', handleUpdateAvailable);
    return () => {
      window.removeEventListener('nossobolso:update-available', handleUpdateAvailable);
    };
  }, []);

  if (!isVisible || !registration) {
    return null;
  }

  const handleUpdate = () => {
    setIsUpdating(true);
    applyUpdate(registration);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)] bg-[#0F172A]/95 border border-[#06B6D4]/40 backdrop-blur-xl shadow-2xl shadow-cyan-950/50 rounded-2xl p-4 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#3B82F6]/20 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white tracking-wide uppercase">
          Nova Versão Disponível
        </h4>
        <p className="text-xs text-[#94A3B8] truncate mt-0.5">
          Atualize o NossoBolso para acessar as melhorias mais recentes.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#2563EB] hover:from-[#0891B2] hover:to-[#1D4ED8] text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Atualizando...' : 'Atualizar'}
        </button>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Dispensar por enquanto"
          aria-label="Dispensar aviso de atualização"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
