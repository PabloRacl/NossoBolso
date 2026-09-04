import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import { getErrorMessage } from '../../utils/errorUtils';

interface RegisterFormProps {
  onSuccess: (user: UserProfile, email: string) => void;
  onError: (msg: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  onSwitchToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const user = await authService.register({ name, email, password });
      onSuccess(user, email);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Erro ao realizar cadastro.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="register-form"
      initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo</label>
        <div className="relative group">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Seu nome completo"
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
          />
        </div>
      </div>

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
        <label className="block text-xs font-bold text-slate-300 mb-1.5">Criar Senha</label>
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
            <span>Criando conta...</span>
          </>
        ) : (
          <>
            <span>Criar Conta e Gerar Código</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>

      <div className="pt-2 text-center text-xs">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-slate-400 hover:text-emerald-400 transition-colors font-medium"
        >
          Já tem uma conta? <strong className="text-emerald-400 font-bold">Fazer Login</strong>
        </button>
      </div>
    </motion.form>
  );
};
