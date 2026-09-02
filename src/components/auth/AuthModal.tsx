import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Facebook,
  Linkedin,
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';
import { BioCyberLogo } from '../layout/BioCyberLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    setUser,
  } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'linkedin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    setAuthModalOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await authService.login({ email, password });
      setUser(user);
      setSuccessMessage(`Bem-vindo de volta, ${user.name}!`);
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao realizar o login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setError(null);

    try {
      const user = await authService.register({ name, email, password });
      setUser(user);
      setSuccessMessage(`Conta criada com sucesso! Bem-vindo, ${user.name}.`);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao realizar cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(email);
      setSuccessMessage(`Enviamos as instruções de redefinição para o email: ${email}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao enviar solicitação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = async (provider: 'google' | 'facebook' | 'linkedin') => {
    setSocialLoading(provider);
    setError(null);

    if (provider === 'google') {
      const result = await authService.loginWithGoogleReal();
      if (result.error) {
        setError(result.error);
        setSocialLoading(null);
      }
      return;
    }

    try {
      const user = await authService.loginSocial(provider);
      setUser(user);
      setSuccessMessage(`Conectado com sucesso via ${provider.toUpperCase()}!`);
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch {
      setError(`Falha na conexão com ${provider}. Tente novamente.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const tabs = [
    { id: 'login', label: 'Entrar', icon: LogIn },
    { id: 'register', label: 'Cadastrar', icon: UserPlus },
    { id: 'forgot', label: 'Recuperar', icon: KeyRound },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop glassmorphism */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden z-10 backdrop-blur-2xl transition-all"
        >
          {/* Top Banner Gradient Glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
          
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <BioCyberLogo size="md" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  NossoBolso <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">OFICIAL</span>
                </h3>
                <p className="text-xs text-slate-400">Gestão financeira pessoal integrada</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Futuristic Animated Tab Switcher */}
          <div className="relative flex border-b border-slate-800 bg-slate-950/80 p-1.5 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = authMode === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAuthMode(tab.id);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAuthTabModal"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md shadow-emerald-500/30 border border-emerald-400/40"
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {/* Feedback Animated Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-3 text-rose-400 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {error.includes('painel do Supabase') && (
                    <div className="pt-2 border-t border-rose-500/20 text-[11px] text-slate-300 space-y-1">
                      <p className="font-semibold text-rose-300">Como ativar a autenticação com Google:</p>
                      <p className="text-slate-400">
                        Ative o Google em{' '}
                        <a
                          href="https://supabase.com/dashboard/project/nhskpvlnbbhqqzxmxirh/auth/providers"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 underline font-bold"
                        >
                          Authentication &gt; Providers
                        </a>{' '}
                        no painel do Supabase.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <motion.form
                  key="modal-login"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleLoginSubmit}
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
                        onClick={() => setAuthMode('forgot')}
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
                        <span>Acessar Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* REGISTER FORM */}
              {authMode === 'register' && (
                <motion.form
                  key="modal-register"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleRegisterSubmit}
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
                        placeholder="Seu nome"
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
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar Minha Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === 'forgot' && (
                <motion.form
                  key="modal-forgot"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleForgotSubmit}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-400 font-medium">
                    Informe o seu e-mail cadastrado para receber o link de redefinição.
                  </p>

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
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Instruções</span>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social Logins */}
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-center text-xs font-semibold text-slate-400 mb-3">Ou conecte com sua rede social</p>
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  disabled={socialLoading !== null || loading}
                  title="Google"
                  className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/40 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <svg className="w-5 h-5 relative drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleSocialClick('facebook')}
                  disabled={socialLoading !== null || loading}
                  title="Facebook"
                  className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#1877F2]/50 transition-all hover:bg-[#1877F2]/15 disabled:opacity-50"
                >
                  {socialLoading === 'facebook' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#1877F2]" />
                  ) : (
                    <Facebook className="w-5 h-5 text-[#1877F2] relative fill-[#1877F2]/20 drop-shadow-[0_0_12px_rgba(24,119,242,0.8)] transition-all group-hover:scale-110" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleSocialClick('linkedin')}
                  disabled={socialLoading !== null || loading}
                  title="LinkedIn"
                  className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#0077B5]/50 transition-all hover:bg-[#0077B5]/15 disabled:opacity-50"
                >
                  {socialLoading === 'linkedin' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#0077B5]" />
                  ) : (
                    <Linkedin className="w-5 h-5 text-[#0077B5] relative fill-[#0077B5]/20 drop-shadow-[0_0_12px_rgba(0,119,181,0.8)] transition-all group-hover:scale-110" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Guest / Offline Mode Note */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dados criptografados
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="hover:text-slate-300 underline underline-offset-2 transition-colors font-semibold"
              >
                Continuar como Convidado
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
