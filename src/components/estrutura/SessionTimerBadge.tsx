import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Clock, Lock, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoLock, formatSecondsToTimer } from '../../estado/useAutoLock';
import { useAppStore } from '../../estado/useAppStore';

export const SessionTimerBadge: React.FC = () => {
  const { user } = useAppStore();
  const { secondsRemaining, formattedTime, extendSession, lockManually } = useAutoLock();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Se o usuário não estiver logado, não exibe o cronômetro
  if (!user) return null;

  // Determina nível de urgência do tempo restante
  const isUrgent = secondsRemaining < 60; // menos de 1 minuto
  const isWarning = secondsRemaining < 300 && !isUrgent; // menos de 5 minutos

  // Cálculo da porcentagem para barra de progresso (900s = 100%)
  const percentage = Math.min(100, Math.max(0, (secondsRemaining / (15 * 60)) * 100));

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer select-none ${
          isUrgent
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-400 shadow-md shadow-rose-900/30 animate-pulse'
            : isWarning
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-400 shadow-md shadow-amber-900/20'
            : 'bg-[#162032] border-[#00FF88]/30 text-[#00FF88] hover:border-[#00FF88]/70 shadow-sm shadow-[#00FF88]/5'
        }`}
        title={`Sessão expira em ${formattedTime}. Clique para gerenciar o tempo de sessão.`}
      >
        {isUrgent ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        ) : isWarning ? (
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
        )}

        <span className="tabular-nums tracking-wider">{formattedTime}</span>

        <span
          className={`text-[9px] uppercase font-sans font-extrabold px-1 py-0.5 rounded hidden lg:inline ${
            isUrgent
              ? 'bg-rose-500/20 text-rose-300'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-[#00FF88]/15 text-[#00FF88]'
          }`}
        >
          Sessão
        </span>
      </button>

      {/* Dropdown com detalhes de segurança da sessão */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-[#0B0F19] border border-[#1E293B] shadow-2xl shadow-black/80 z-[100] space-y-3"
          >
            {/* Header */}
            <div className="flex items-start gap-2.5 pb-2 border-b border-[#1E293B]">
              <div
                className={`p-2 rounded-xl ${
                  isUrgent
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : isWarning
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-white leading-tight">Proteção de Sessão Ativa</h4>
                <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5">
                  Dados sensíveis são protegidos após 15 min de inatividade.
                </p>
              </div>
            </div>

            {/* Status do Tempo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] font-medium">Tempo até expirar:</span>
                <span
                  className={`font-mono font-bold ${
                    isUrgent ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-[#00FF88]'
                  }`}
                >
                  {formattedTime} min
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-1.5 bg-[#162032] rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    isUrgent
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-emerald-500 to-[#00FF88]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  extendSession();
                  setIsDropdownOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00FF88]/20 to-emerald-500/20 hover:from-[#00FF88]/30 hover:to-emerald-500/30 border border-[#00FF88]/40 text-[#00FF88] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Estender Sessão (+15 min)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  lockManually();
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#162032] hover:bg-rose-500/15 border border-[#2E3B52] hover:border-rose-500/40 text-[#94A3B8] hover:text-rose-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Tela Agora</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
