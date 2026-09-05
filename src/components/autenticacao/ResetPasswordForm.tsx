import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../servicos/authService';
import { emailService } from '../../servicos/emailService';
import { UserProfile } from '../../tipos';
import { getErrorMessage } from '../../utilidades/errorUtils';

interface ResetPasswordFormProps {
  email: string;
  simulatedToken: string | null;
  onSuccess: (user: UserProfile) => void;
  onError: (msg: string) => void;
  onBackToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  simulatedToken,
  onSuccess,
  onError,
  onBackToLogin,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode || !password) return;

    setLoading(true);
    try {
      const updatedUser = await authService.resetPasswordWithToken({
        email,
        code: verificationCode,
        newPassword: password,
      });
      onSuccess(updatedUser);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Erro ao redefinir senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="reset-password-form"
      initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Banner de Envio Real de E-mail ou Simulação */}
      {emailService.isRealEmailConfigured() ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Código enviado para {email}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Enviamos o código de redefinição de 6 dígitos por e-mail. Abra sua caixa de entrada para resgatá-lo.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Simulação do Código de Redefinição</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Seu código de redefinição é:{' '}
            <strong className="text-emerald-400 text-sm font-black tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              {simulatedToken || '742019'}
            </strong>
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Código do E-mail (6 dígitos)
        </label>
        <div className="relative group">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            placeholder="Ex: 742019"
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-center text-lg font-black tracking-widest text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all uppercase"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">Criar Nova Senha</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
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
            <span>Redefinindo Senha...</span>
          </>
        ) : (
          <>
            <span>Redefinir Senha e Entrar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </>
        )}
      </motion.button>

      <div className="pt-2 text-center text-xs">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-slate-400 hover:text-emerald-400 transition-colors font-semibold flex items-center justify-center gap-1.5 w-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o Login</span>
        </button>
      </div>
    </motion.form>
  );
};
