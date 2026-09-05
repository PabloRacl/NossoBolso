import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Linkedin } from 'lucide-react';
import { authService } from '../../servicos/authService';
import { UserProfile } from '../../tipos';
import { getErrorMessage } from '../../utilidades/errorUtils';

interface LoginFormProps {
  onSuccess: (user: UserProfile, msg?: string) => void;
  onError: (msg: string) => void;
  onForgotPassword: () => void;
  onSocialLogin: (provider: 'google' | 'twitter' | 'linkedin') => void;
  onGuestLogin: () => void;
  socialLoading: 'google' | 'facebook' | 'linkedin' | 'twitter' | null;
  onUnverifiedEmail?: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  onForgotPassword,
  onSocialLogin,
  onGuestLogin,
  socialLoading,
  onUnverifiedEmail,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const user = await authService.login({ email, password });
      onSuccess(user, `Olá, ${user.name.split(' ')[0]}! Acessando seu painel...`);
    } catch (err: unknown) {
      const rawMsg = getErrorMessage(err, 'Ocorreu um erro ao realizar o login.');
      if (rawMsg.includes('EMAIL_NOT_VERIFIED')) {
        const cleanMsg = rawMsg.replace('EMAIL_NOT_VERIFIED:', '').trim();
        onError(cleanMsg);
        if (onUnverifiedEmail) {
          setTimeout(() => {
            onUnverifiedEmail(email);
          }, 1400);
        }
      } else {
        onError(rawMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="login-form"
      initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail</label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-300">Senha</label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Esqueceu a senha?
          </button>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Entrando...</span>
          </>
        ) : (
          <>
            <span>Entrar no Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>

      {/* Social Logins */}
      <div className="pt-4 mt-5 border-t border-slate-800/80">
        <p className="text-center text-xs font-semibold text-slate-400 mb-3">Conectar com rede social</p>
        <div className="grid grid-cols-3 gap-3">
          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSocialLogin('google')}
            disabled={socialLoading !== null || loading}
            title="Conectar com Google"
            className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_25px_rgba(66,133,244,0.3)] transition-all disabled:opacity-50"
          >
            {socialLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            ) : (
              <svg className="w-5 h-5 relative drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
          </motion.button>

          {/* X / Twitter */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSocialLogin('twitter')}
            disabled={socialLoading !== null || loading}
            title="Conectar com X (Twitter)"
            className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/60 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all disabled:opacity-50"
          >
            {socialLoading === 'twitter' ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4 text-white fill-current relative drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
          </motion.button>

          {/* LinkedIn */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSocialLogin('linkedin')}
            disabled={socialLoading !== null || loading}
            title="Conectar com LinkedIn"
            className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#0077B5]/70 hover:bg-[#0077B5]/15 hover:shadow-[0_0_25px_rgba(0,119,181,0.35)] transition-all disabled:opacity-50"
          >
            {socialLoading === 'linkedin' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0077B5]" />
            ) : (
              <Linkedin className="w-5 h-5 text-[#0077B5] relative fill-[#0077B5]/20 drop-shadow-[0_0_12px_rgba(0,119,181,0.8)] transition-all group-hover:scale-110" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Guest Mode Option */}
      <div className="pt-4 text-center border-t border-slate-800/60 mt-4">
        <button
          type="button"
          onClick={onGuestLogin}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-semibold underline underline-offset-4"
        >
          Entrar no modo Convidado / Demonstração
        </button>
      </div>
    </motion.form>
  );
};
