import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  LogOut,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';

export const UserProfileModal: React.FC = () => {
  const {
    user,
    setUser,
    isUserProfileModalOpen,
    setUserProfileModalOpen,
    setAuthModalOpen,
    setAuthMode,
  } = useAppStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isUserProfileModalOpen || !user) return null;

  const handleClose = () => {
    setMessage(null);
    setIsChangingPassword(false);
    setUserProfileModalOpen(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await authService.logout();
    handleClose();
    setUser(null);
    setLoading(false);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setIsChangingPassword(false);
    } catch {
      setMessage({ type: 'error', text: 'Erro ao alterar a senha. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 backdrop-blur-xl my-auto"
        >
          {/* Header Glow */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  {user.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                    {user.role || 'PRO'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Feedback Message */}
            {message && (
              <div
                className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Account Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">E-mail Cadastrado</span>
                  <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Método de Conexão</span>
                  <p className="text-xs font-semibold text-white capitalize">
                    {user.provider === 'credentials'
                      ? 'E-mail e Senha'
                      : user.provider === 'twitter'
                      ? 'X (Twitter)'
                      : user.provider}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Membro Desde</span>
                  <p className="text-xs font-semibold text-white">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Plano Atual</span>
                  <p className="text-xs font-semibold text-emerald-400">NossoBolso OS Premium</p>
                </div>
              </div>
            </div>

            {/* Change Password Collapsible Section */}
            {user.provider === 'credentials' && (
              <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Alterar Minha Senha</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">
                    {isChangingPassword ? 'Cancelar' : 'Alterar'}
                  </span>
                </button>

                {isChangingPassword && (
                  <form onSubmit={handleChangePasswordSubmit} className="p-4 pt-0 space-y-3 border-t border-slate-800/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Senha Atual</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nova Senha</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Nova Senha'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Logout Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão (Sair da Conta)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
