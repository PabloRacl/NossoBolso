import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, LogOut, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../../tipos';
import { UserAvatar } from '../ui/UserAvatar';
import { verifyPassword } from '../../utilidades/securityUtils';
import { authService } from '../../servicos/authService';

interface LockScreenProps {
  user: UserProfile;
  onUnlock: () => void;
  onLogout: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ user, onUnlock, onLogout }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasPassword = Boolean(user.passwordHash);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPassword && !password) {
      setError('Por favor, informe a senha para desbloquear.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (hasPassword && user.passwordHash) {
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          setError('Senha incorreta. Tente novamente.');
          setIsLoading(false);
          return;
        }
      } else {
        // Para contas sociais conectadas sem senha cadastrada
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      onUnlock();
    } catch {
      setError('Falha ao validar a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    await authService.logout();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05070E]/95 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-3xl bg-[#0B0F19] border border-[#1E293B] p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 text-center flex flex-col items-center"
      >
        {/* Ícone de Cadeado de Proteção */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00FF88]/20 to-emerald-500/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] shadow-lg shadow-[#00FF88]/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-[#05070E] rounded-full border border-[#1E293B]">
            <UserAvatar src={user.avatarUrl} name={user.name} size="xs" className="w-6 h-6 rounded-full" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          NossoBolso Bloqueado
        </h3>
        <p className="text-xs text-[#94A3B8] mb-6">
          {hasPassword ? (
            <>
              Sessão pausada por inatividade (15 min). Digite sua senha para continuar como <span className="text-white font-medium">{user.name}</span>.
            </>
          ) : (
            <>
              Sessão pausada por inatividade (15 min). Seus dados financeiros estão protegidos. Clique abaixo para reativar seu acesso como <span className="text-white font-medium">{user.name}</span>.
            </>
          )}
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleUnlock} className="w-full space-y-4">
          {hasPassword ? (
            <div className="relative text-left">
              <label htmlFor="lock-password" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  id="lock-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070A12] border border-[#1E293B] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl text-sm text-white placeholder-[#475569] outline-none transition-all"
                />
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00FF88] to-emerald-500 hover:from-[#00e67a] hover:to-emerald-600 text-[#05070E] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#00FF88]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                {hasPassword ? 'Desbloquear Acesso' : `Continuar como ${user.name.split(' ')[0]}`}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1E293B] w-full flex items-center justify-center">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="text-xs text-[#94A3B8] hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar sessão ou trocar de conta
          </button>
        </div>
      </motion.div>
    </div>
  );
};
