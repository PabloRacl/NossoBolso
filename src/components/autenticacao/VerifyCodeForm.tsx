import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, KeyRound, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { authService } from '../../servicos/authService';
import { emailService } from '../../servicos/emailService';
import { UserProfile } from '../../tipos';
import { getErrorMessage } from '../../utilidades/errorUtils';

interface VerifyCodeFormProps {
  email: string;
  simulatedToken: string | null;
  onSuccess: (user: UserProfile) => void;
  onError: (msg: string) => void;
  onResendSuccess: (newCode: string, msg: string) => void;
  onChangeEmail: () => void;
}

export const VerifyCodeForm: React.FC<VerifyCodeFormProps> = ({
  email,
  simulatedToken,
  onSuccess,
  onError,
  onResendSuccess,
  onChangeEmail,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) return;

    setLoading(true);
    try {
      const verifiedUser = await authService.verifyEmailCode({
        email,
        code: verificationCode,
      });
      onSuccess(verifiedUser);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Código de verificação inválido.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const newCode = await authService.resendVerificationCode(email);
      onResendSuccess(newCode, `Um novo código foi enviado para ${email}`);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Erro ao reenviar código de verificação.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="verify-form"
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
            <span>E-mail enviado para {email}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Enviamos o código de verificação de 6 dígitos. Acesse sua caixa de entrada (ou pasta de Spam) para copiar seu código.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Simulação de E-mail Enviado para {email}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Seu código de verificação de 6 dígitos é:{' '}
            <strong className="text-emerald-400 text-sm font-black tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              {simulatedToken || '849201'}
            </strong>
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Código de Verificação (6 dígitos)
        </label>
        <div className="relative group">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            placeholder="Ex: 849201"
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-center text-lg font-black tracking-widest text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all uppercase"
          />
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
            <span>Validando E-mail...</span>
          </>
        ) : (
          <>
            <span>Validar E-mail e Acessar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </>
        )}
      </motion.button>

      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          <span>Reenviar Código</span>
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Alterar E-mail
        </button>
      </div>
    </motion.form>
  );
};
