import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorUtils';

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onSuccess: (resetToken: string, email: string) => void;
  onError: (msg: string) => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  initialEmail = '',
  onSuccess,
  onError,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(email);
      onSuccess(result.resetToken, email);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Erro ao solicitar redefinição de senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="forgot-form"
      initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <p className="text-xs text-slate-400 font-medium">
        Informe o seu e-mail cadastrado para receber o código de redefinição de senha diretamente na sua caixa de entrada.
      </p>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail Cadastrado</label>
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
            <span>Enviando Código por E-mail...</span>
          </>
        ) : (
          <>
            <span>Enviar Código por E-mail</span>
            <Send className="w-4 h-4" />
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
