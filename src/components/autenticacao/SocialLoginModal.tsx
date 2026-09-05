import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowRight, Loader2, Facebook, Linkedin } from 'lucide-react';

interface SocialLoginModalProps {
  provider: 'google' | 'facebook' | 'linkedin' | 'twitter' | null;
  onClose: () => void;
  onExecute: (email: string, name: string) => void;
  loading: boolean;
  connectingProvider: 'google' | 'facebook' | 'linkedin' | 'twitter' | null;
  connectingStep: string;
}

export const SocialLoginModal: React.FC<SocialLoginModalProps> = ({
  provider,
  onClose,
  onExecute,
  loading,
  connectingProvider,
  connectingStep,
}) => {
  const [socialEmailInput, setSocialEmailInput] = useState('pabloracl@gmail.com');
  const [socialNameInput, setSocialNameInput] = useState('Pablo Ricardo');

  return (
    <>
      {/* INTERACTIVE SOCIAL LOGIN POPUP MODAL */}
      <AnimatePresence>
        {provider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-5"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {provider === 'google' && (
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                  )}
                  {provider === 'facebook' && (
                    <div className="p-2 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2]">
                      <Facebook className="w-6 h-6" />
                    </div>
                  )}
                  {provider === 'linkedin' && (
                    <div className="p-2 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5]">
                      <Linkedin className="w-6 h-6" />
                    </div>
                  )}
                  {provider === 'twitter' && (
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-white">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Conectar com {provider === 'twitter' ? 'X (Twitter)' : provider === 'google' ? 'Google' : provider === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Autenticação rápida de conta social</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Quick Select Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-lg shadow-emerald-500/20">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(socialEmailInput || 'pablo')}`}
                      alt="Avatar"
                      className="w-full h-full rounded-full bg-slate-900"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{socialNameInput || 'Pablo Ricardo'}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-400 truncate">{socialEmailInput || 'pabloracl@gmail.com'}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => onExecute(socialEmailInput, socialNameInput)}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Continuar como {socialNameInput.split(' ')[0] || 'Pablo'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Custom Input Option */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-slate-400">Ou entre com outra conta {provider}:</p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">E-mail {provider}</label>
                  <input
                    type="email"
                    value={socialEmailInput}
                    onChange={(e) => setSocialEmailInput(e.target.value)}
                    placeholder="seu@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Perfil</label>
                  <input
                    type="text"
                    value={socialNameInput}
                    onChange={(e) => setSocialNameInput(e.target.value)}
                    placeholder="Seu Nome"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY CINEMATOGRÁFICO DE TRANSIÇÃO PARA CONEXÃO SOCIAL */}
      <AnimatePresence>
        {connectingProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070E]/90 backdrop-blur-2xl p-6"
          >
            <div
              className={`absolute w-[460px] h-[460px] rounded-full blur-[140px] pointer-events-none animate-pulse ${
                connectingProvider === 'google'
                  ? 'bg-gradient-to-tr from-blue-500/25 via-red-500/20 to-emerald-500/25'
                  : connectingProvider === 'twitter'
                  ? 'bg-gradient-to-tr from-white/20 via-slate-400/25 to-slate-600/20'
                  : 'bg-gradient-to-tr from-[#0077B5]/35 via-sky-500/25 to-blue-600/25'
              }`}
            />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center max-w-sm w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-700/60 shadow-2xl space-y-6"
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                  className={`w-24 h-24 rounded-full border-2 border-dashed p-1 ${
                    connectingProvider === 'google'
                      ? 'border-blue-400/80 border-t-red-500 border-r-yellow-400 border-b-emerald-400'
                      : connectingProvider === 'twitter'
                      ? 'border-white/90 border-t-slate-300'
                      : 'border-[#0077B5] border-t-sky-300'
                  }`}
                />

                <div className="absolute inset-2 rounded-full bg-slate-950/90 border border-white/10 flex items-center justify-center shadow-inner">
                  {connectingProvider === 'google' && (
                    <svg className="w-10 h-10 drop-shadow-[0_0_16px_rgba(66,133,244,0.6)]" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {connectingProvider === 'twitter' && (
                    <svg className="w-9 h-9 text-white fill-current drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {connectingProvider === 'linkedin' && (
                    <Linkedin className="w-9 h-9 text-[#0077B5] fill-[#0077B5]/20 drop-shadow-[0_0_16px_rgba(0,119,181,0.8)]" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-white capitalize">
                  Conectando com {connectingProvider === 'twitter' ? 'X (Twitter)' : connectingProvider}...
                </h4>
                <p className="text-xs text-slate-400 font-medium">{connectingStep}</p>
              </div>

              <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
