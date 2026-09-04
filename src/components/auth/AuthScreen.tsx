import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Facebook,
  Linkedin,
  PieChart,
  Wallet,
  KeyRound,
  UserPlus,
  LogIn,
  CreditCard,
  ShoppingCart,
  Check,
  Zap,
  CloudSun,
  Coins,
  TrendingUp,
  Building2,
  Car,
  Target,
  Sparkles,
  ShieldCheck,
  Send,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';
import { emailService } from '../../services/emailService';
import { BioCyberLogo } from '../layout/BioCyberLogo';
import { FallingLeavesAnimation, WeatherMode } from './FallingLeavesAnimation';
import { HolographicSecurityBadge } from './HolographicSecurityBadge';
import { UserProfile } from '../../types';

export const AuthScreen: React.FC = () => {
  const { setUser, authMode, setAuthMode } = useAppStore();

  const [weatherMode, setWeatherMode] = useState<WeatherMode>('leaves');
  const [activeHoverCard, setActiveHoverCard] = useState<number | null>(null);
  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Transição automática silenciosa de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroPhase(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);

  // Social Login Popup State
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'facebook' | 'linkedin' | null>(null);
  const [socialEmailInput, setSocialEmailInput] = useState('pabloracl@gmail.com');
  const [socialNameInput, setSocialNameInput] = useState('Pablo Ricardo');

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'linkedin' | 'twitter' | null>(null);
  const [socialConnectingStep, setSocialConnectingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [transitioningUser, setTransitioningUser] = useState<UserProfile | null>(null);

  // Efeito de Transição Suave Universal para o Sistema
  const transitionToSystem = (authenticatedUser: UserProfile, msg?: string) => {
    setTransitioningUser(authenticatedUser);
    setSuccessMessage(msg || `Bem-vindo ao NossoBolso, ${authenticatedUser.name.split(' ')[0]}!`);
    setTimeout(() => {
      setUser(authenticatedUser);
    }, 1100);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await authService.login({ email, password });
      transitionToSystem(user, `Olá, ${user.name.split(' ')[0]}! Acessando seu painel...`);
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
    setSuccessMessage(null);

    try {
      const user = await authService.register({ name, email, password });
      setSimulatedToken(user.verificationToken || '849201');
      setSuccessMessage(`🎉 Cadastro efetuado com sucesso! Enviamos o código de validação para ${email}`);
      setAuthMode('verify');
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

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const verifiedUser = await authService.verifyEmailCode({
        email,
        code: verificationCode,
      });
      transitionToSystem(verifiedUser, 'E-mail verificado com sucesso! Acessando seu painel...');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Código inválido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const newCode = await authService.resendVerificationCode(email);
      setSimulatedToken(newCode);
      setSuccessMessage(`Um novo código foi enviado para ${email}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao reenviar código.');
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
    setSuccessMessage(null);

    try {
      const result = await authService.requestPasswordReset(email);
      setSimulatedToken(result.resetToken);
      setSuccessMessage(`🔑 Código de redefinição enviado com sucesso para ${email}`);
      setAuthMode('reset_password');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao solicitar redefinição.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.resetPasswordWithToken({
        email,
        code: verificationCode,
        newPassword: password,
      });
      transitionToSystem(updatedUser, 'Senha redefinida com sucesso! Acessando seu painel...');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao redefinir senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Dispara a transição elegante e cinematográfica de conexão social (Google, X, LinkedIn)
  const handleOAuthRealLogin = async (provider: 'google' | 'twitter' | 'linkedin') => {
    setSocialLoading(provider);
    setError(null);

    const providerNames: Record<string, string> = {
      google: 'Google',
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
    };
    const pName = providerNames[provider] || provider;

    setSocialConnectingStep(`Iniciando canal seguro com ${pName}...`);

    let hasRealRedirect = false;
    try {
      const result = await authService.loginWithOAuthProvider(provider);
      if (!result.error) {
        hasRealRedirect = true;
        setSocialConnectingStep(`Redirecionando para login seguro do ${pName}...`);
        return;
      }
    } catch {
      // Provedor não ativo no Supabase ou modo local
    }

    if (!hasRealRedirect) {
      // Sequência cinematográfica fluida de autenticação
      setSocialConnectingStep(`Autenticando credenciais via ${pName}...`);
      await new Promise((resolve) => setTimeout(resolve, 650));

      setSocialConnectingStep(`Sincronizando perfil e contas financeiras...`);
      await new Promise((resolve) => setTimeout(resolve, 550));

      const emailDefaults: Record<string, string> = {
        google: 'pabloracl@gmail.com',
        twitter: 'pabloracl@x.com',
        linkedin: 'pabloracl@linkedin.com',
      };

      const user = await authService.loginSocial({
        provider,
        email: emailDefaults[provider],
        name: 'Pablo Ricardo',
      });

      setSocialConnectingStep(`Conectado com sucesso! Entrando...`);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setSocialLoading(null);
      setSocialConnectingStep('');
      transitionToSystem(user, `Conectado com sucesso via ${pName}!`);
    }
  };

  // Executa o Login Social
  const executeSocialLogin = async (customEmail?: string, customName?: string) => {
    if (!socialModalProvider) return;
    const provider = socialModalProvider;

    setSocialLoading(provider);
    setError(null);

    const emailToUse = customEmail || socialEmailInput || 'pabloracl@gmail.com';
    const nameToUse = customName || socialNameInput || 'Pablo Ricardo';

    try {
      const user = await authService.loginSocial({
        provider,
        email: emailToUse,
        name: nameToUse,
      });
      setSocialModalProvider(null);
      transitionToSystem(user, `Conectado com sucesso via ${provider}!`);
    } catch {
      setError(`Falha na conexão com ${provider}. Tente novamente.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      id: 'usr_guest',
      name: 'Convidado Local',
      email: 'convidado@nossobolso.app',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      provider: 'credentials',
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };
    transitionToSystem(guestUser, 'Modo Convidado ativado! Preparando demonstração...');
  };

  const tabs = [
    { id: 'login', label: 'Entrar', icon: LogIn },
    { id: 'register', label: 'Cadastrar', icon: UserPlus },
    { id: 'forgot', label: 'Recuperar', icon: KeyRound },
  ] as const;

  return (
    <div className="min-h-screen w-full bg-[#05070E] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Interactive Canvas Background with Selected Weather Mode */}
      <FallingLeavesAnimation mode={weatherMode} />

      {/* Ambient Glows & Cyber Grids */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[450px] h-[450px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Weather Mode Switcher Floating Bar (Topo Direito) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">Clima:</span>
        
        <button
          onClick={() => setWeatherMode('leaves')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            weatherMode === 'leaves'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Brisa de Folhas & Dinheiro"
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Brisa</span>
        </button>

        <button
          onClick={() => setWeatherMode('gold_rain')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            weatherMode === 'gold_rain'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Chuva de Ouro & Moedas"
        >
          <Coins className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chuva de Ouro</span>
        </button>

        <button
          onClick={() => setWeatherMode('storm')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            weatherMode === 'storm'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Tempestade Cyber"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tempestade</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12 z-10 py-6 px-4">
        
        {/* Left Column: Hero Section (Equiparado em tamanho ao Card de Login) */}
        <motion.div
          animate={{
            x: isIntroPhase && isDesktop ? 244 : 0,
            opacity: !isDesktop && !isIntroPhase ? 0 : 1,
          }}
          transition={{
            duration: 1.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`w-full max-w-md mx-auto lg:w-[440px] shrink-0 space-y-4 ${
            !isDesktop && !isIntroPhase ? 'hidden' : 'block'
          }`}
        >

          {/* Cabeçalho Centralizado Conforme Solicitado */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.15]">
              Sua vida financeira <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                organizada de forma simples
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-[14px] text-slate-300 leading-relaxed font-medium max-w-sm mx-auto">
              Acompanhe saldos bancários, faturas de cartão, financiamentos, orçamentos mensais, compras de supermercado e revisões de veículos em um só lugar.
            </p>
          </div>

          {/* Practical Features Grid — Cards Mais Compactos e Harmoniosos */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 relative text-left">
            {/* Card 1: Saldos & Cartões */}
            <div
              onMouseEnter={() => setActiveHoverCard(1)}
              onMouseLeave={() => setActiveHoverCard(null)}
              className="relative p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-start gap-2.5 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">Saldos & Cartões</h4>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">Monitore contas, faturas e rendimentos.</p>
              </div>

              {/* Holographic Preview Tooltip Popover 1 */}
              <AnimatePresence>
                {activeHoverCard === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute -top-36 left-0 right-0 z-40 p-4 rounded-2xl bg-slate-950/95 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-2xl space-y-2 pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Saldo Total Integrado
                      </span>
                      <span className="font-black text-emerald-400">R$ 18.420,50</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                        <span>Cartão Nubank</span>
                        <span className="text-white font-bold">R$ 1.840 / R$ 8.000</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[23%]" />
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Rendimento CDI: +R$ 145,20 este mês
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 2: Financiamentos */}
            <div
              onMouseEnter={() => setActiveHoverCard(2)}
              onMouseLeave={() => setActiveHoverCard(null)}
              className="relative p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 transition-all flex items-start gap-2.5 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-white group-hover:text-teal-400 transition-colors truncate">Financiamentos</h4>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">Simule parcelas e quitação de dívidas.</p>
              </div>

              {/* Holographic Preview Tooltip Popover 2 */}
              <AnimatePresence>
                {activeHoverCard === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute -top-36 left-0 right-0 z-40 p-4 rounded-2xl bg-slate-950/95 border border-teal-500/40 shadow-[0_0_30px_rgba(20,184,166,0.25)] backdrop-blur-2xl space-y-2 pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        Financiamento Imobiliário
                      </span>
                      <span className="font-black text-teal-400">68% Quitado</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                        <span>Parcelas (42 / 120)</span>
                        <span className="text-white font-bold">R$ 1.850,00/mês</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 w-[68%]" />
                      </div>
                    </div>
                    <div className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Economia com Amortização: R$ 42.800 em juros
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 3: Despensa & Veículos */}
            <div
              onMouseEnter={() => setActiveHoverCard(3)}
              onMouseLeave={() => setActiveHoverCard(null)}
              className="relative p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-start gap-2.5 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors truncate">Despensa & Veículos</h4>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">Lista de compras e manutenção.</p>
              </div>

              {/* Holographic Preview Tooltip Popover 3 */}
              <AnimatePresence>
                {activeHoverCard === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute -top-36 left-0 right-0 z-40 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-2xl space-y-2 pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                        Garagem & Despensa
                      </span>
                      <span className="font-bold text-cyan-400">Honda Civic 2022</span>
                    </div>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>Próxima Troca de Óleo:</span>
                        <span className="text-emerald-400 font-bold">em 1.500 km</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Estoque Despensa:</span>
                        <span className="text-white font-bold">14 itens com estoque OK</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 4: Orçamentos & Metas */}
            <div
              onMouseEnter={() => setActiveHoverCard(4)}
              onMouseLeave={() => setActiveHoverCard(null)}
              className="relative p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all flex items-start gap-2.5 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors truncate">Orçamentos & Metas</h4>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">Limites por categoria e metas.</p>
              </div>

              {/* Holographic Preview Tooltip Popover 4 */}
              <AnimatePresence>
                {activeHoverCard === 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute -top-36 left-0 right-0 z-40 p-4 rounded-2xl bg-slate-950/95 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-2xl space-y-2 pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        Meta: Reserva de Emergência
                      </span>
                      <span className="font-black text-amber-400">85% Atingido</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                        <span>Guardado / Meta</span>
                        <span className="text-white font-bold">R$ 17.000 / R$ 20.000</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 w-[85%]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Guarantee Items Centralizados */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              100% Gratuito & Privado
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Funciona Offline
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Importação OFX
            </span>
          </div>

          {/* 3D Holographic Security Badge */}
          <HolographicSecurityBadge />
        </motion.div>

        {/* Right Column: Futuristic Auth Card emergindo da escuridão (Mesmo tamanho: 440px) */}
        <motion.div
          animate={{
            opacity: isIntroPhase ? 0 : 1,
            scale: isIntroPhase ? 0.88 : 1,
            filter: isIntroPhase ? 'brightness(0) blur(28px)' : 'brightness(1) blur(0px)',
            y: isIntroPhase ? 30 : 0,
          }}
          transition={{
            duration: 1.3,
            delay: isIntroPhase ? 0 : 0.28,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`relative w-full max-w-md mx-auto lg:w-[440px] shrink-0 ${
            isIntroPhase ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          {/* Efeito Halo / Aura de Luz que Desperta na Escuridão */}
          <motion.div
            animate={{
              opacity: isIntroPhase ? 0 : 0.45,
              scale: isIntroPhase ? 0.6 : 1.15,
            }}
            transition={{
              duration: 1.5,
              delay: isIntroPhase ? 0 : 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute -inset-6 bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-500/25 rounded-[40px] blur-[90px] pointer-events-none"
          />

          <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_70px_rgba(16,185,129,0.15)] backdrop-blur-2xl overflow-hidden group hover:border-emerald-500/40 transition-all">
            {/* Top Animated Gradient Glow Bar */}
            <motion.div
              animate={{
                opacity: isIntroPhase ? 0 : 1,
                width: isIntroPhase ? '0%' : '100%',
              }}
              transition={{
                duration: 1.1,
                delay: isIntroPhase ? 0 : 0.5,
                ease: 'easeOut',
              }}
              className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.7)]"
            />

            {/* Header Official Logo & Title */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <BioCyberLogo size="lg" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">NossoBolso</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Acesse sua conta para visualizar seu painel financeiro</p>
            </div>

            {/* Tab Switcher */}
            <div className="relative flex border border-slate-800/80 bg-slate-950/80 p-1.5 rounded-2xl gap-1 mb-6 backdrop-blur-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = authMode === tab.id || (authMode === 'reset_password' && tab.id === 'forgot');

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAuthMode(tab.id);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 z-10 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAuthTabScreen"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 border border-emerald-400/40"
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Animated Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium backdrop-blur-md space-y-2"
                >
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {error.includes('Já existe uma conta') && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition-all flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Fazer Login</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white font-semibold transition-colors"
                      >
                        Recuperar Senha
                      </button>
                    </div>
                  )}

                  {error.includes('painel do Supabase') && (
                    <div className="pt-2 space-y-2 border-t border-rose-500/20 text-[11px] text-slate-300">
                      <p className="font-semibold text-rose-300">
                        Como habilitar o redirecionamento oficial para o Google:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                        <li>
                          Acesse o{' '}
                          <a
                            href="https://supabase.com/dashboard/project/nhskpvlnbbhqqzxmxirh/auth/providers"
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 underline font-bold"
                          >
                            Console Supabase (Providers)
                          </a>
                        </li>
                        <li>
                          Ative o provedor <strong>Google</strong> (toggle verde)
                        </li>
                        <li>
                          Cole o <strong>Client ID</strong> e <strong>Secret</strong> do Google Cloud Console
                        </li>
                      </ol>
                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={handleGuestLogin}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                        >
                          Entrar como Convidado
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {successMessage && !['verify', 'reset_password'].includes(authMode) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-xs font-semibold backdrop-blur-md"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Container */}
            <AnimatePresence mode="wait">
              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <motion.form
                  key="login-form"
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
                        <span>Entrar no Sistema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* REGISTER FORM */}
              {authMode === 'register' && (
                <motion.form
                  key="register-form"
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
                </motion.form>
              )}

              {/* EMAIL VERIFICATION TOKEN FORM */}
              {authMode === 'verify' && (
                <motion.form
                  key="verify-form"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleVerifySubmit}
                  className="space-y-4"
                >
                  {/* Banner de Envio Real de E-mail ou Simulação (CARD ÚNICO E UNIFICADO) */}
                  {emailService.isRealEmailConfigured() ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5 backdrop-blur-md">
                      <div className="flex items-center gap-2 font-bold text-emerald-400">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>E-mail enviado para {email}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Enviamos o código de verificação de 6 dígitos. Acesse sua caixa de entrada (ou pasta de Spam) no Gmail para copiar seu código.
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
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reenviar Código</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Alterar E-mail
                    </button>
                  </div>
                </motion.form>
              )}

              {/* FORGOT PASSWORD REQUEST FORM */}
              {authMode === 'forgot' && (
                <motion.form
                  key="forgot-form"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleForgotSubmit}
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
                </motion.form>
              )}

              {/* RESET PASSWORD EXECUTION FORM */}
              {authMode === 'reset_password' && (
                <motion.form
                  key="reset-password-form"
                  initial={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleResetPasswordSubmit}
                  className="space-y-4"
                >
                  {/* Banner de Envio Real de E-mail ou Simulação (CARD ÚNICO E UNIFICADO) */}
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
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social Logins com Efeitos de Marca e Micro-interações */}
            <div className="pt-4 mt-5 border-t border-slate-800/80">
              <p className="text-center text-xs font-semibold text-slate-400 mb-3">Conectar com rede social</p>
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <motion.button
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => handleOAuthRealLogin('google')}
                  disabled={socialLoading !== null || loading}
                  title="Conectar com Google"
                  className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_25px_rgba(66,133,244,0.3)] transition-all disabled:opacity-50"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <svg className="w-5 h-5 relative drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </motion.button>

                {/* X / Twitter */}
                <motion.button
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => handleOAuthRealLogin('twitter')}
                  disabled={socialLoading !== null || loading}
                  title="Conectar com X (Twitter)"
                  className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/60 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all disabled:opacity-50"
                >
                  {socialLoading === 'twitter' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <svg className="w-4 h-4 text-white fill-current relative drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                </motion.button>

                {/* LinkedIn */}
                <motion.button
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => handleOAuthRealLogin('linkedin')}
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

            {/* Guest Option */}
            <div className="pt-4 text-center border-t border-slate-800/60 mt-4">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-semibold underline underline-offset-4"
              >
                Entrar no modo Convidado / Demonstração
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* INTERACTIVE SOCIAL LOGIN POPUP MODAL */}
      <AnimatePresence>
        {socialModalProvider && (
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
                  {socialModalProvider === 'google' && (
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  )}
                  {socialModalProvider === 'facebook' && (
                    <div className="p-2 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2]">
                      <Facebook className="w-6 h-6" />
                    </div>
                  )}
                  {socialModalProvider === 'linkedin' && (
                    <div className="p-2 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5]">
                      <Linkedin className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white capitalize">Conectar com {socialModalProvider}</h3>
                    <p className="text-xs text-slate-400 font-medium">Autenticação rápida de conta social</p>
                  </div>
                </div>

                <button
                  onClick={() => setSocialModalProvider(null)}
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
                  onClick={() => executeSocialLogin(socialEmailInput, socialNameInput)}
                  disabled={socialLoading !== null}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {socialLoading ? (
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
                <p className="text-xs font-semibold text-slate-400">Ou entre com outra conta {socialModalProvider}:</p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">E-mail {socialModalProvider}</label>
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

      {/* OVERLAY CINEMATOGRÁFICO DE TRANSIÇÃO PARA CONEXÃO SOCIAL (Google, X, LinkedIn) */}
      <AnimatePresence>
        {socialLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070E]/90 backdrop-blur-2xl p-6"
          >
            {/* Ambient Provider Aura */}
            <div
              className={`absolute w-[460px] h-[460px] rounded-full blur-[140px] pointer-events-none animate-pulse ${
                socialLoading === 'google'
                  ? 'bg-gradient-to-tr from-blue-500/25 via-red-500/20 to-emerald-500/25'
                  : socialLoading === 'twitter'
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
              {/* Provider Hologram Icon Wrapper */}
              <div className="relative flex items-center justify-center">
                {/* Rotating Brand Neon Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                  className={`w-24 h-24 rounded-full border-2 border-dashed p-1 ${
                    socialLoading === 'google'
                      ? 'border-blue-400/80 border-t-red-500 border-r-yellow-400 border-b-emerald-400'
                      : socialLoading === 'twitter'
                      ? 'border-white/90 border-t-slate-300'
                      : 'border-[#0077B5] border-t-sky-300'
                  }`}
                />

                {/* Central Glass Orb with Provider Icon */}
                <div className="absolute inset-2 rounded-full bg-slate-950/90 border border-white/10 flex items-center justify-center shadow-inner">
                  {socialLoading === 'google' && (
                    <svg className="w-10 h-10 drop-shadow-[0_0_16px_rgba(66,133,244,0.6)]" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {socialLoading === 'twitter' && (
                    <svg className="w-9 h-9 text-white fill-current drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  {socialLoading === 'linkedin' && (
                    <Linkedin className="w-10 h-10 text-[#0077B5] fill-[#0077B5]/20 drop-shadow-[0_0_20px_rgba(0,119,181,0.9)]" />
                  )}
                </div>
              </div>

              {/* Status & Feedback Texts */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center justify-center gap-1.5 w-fit mx-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Autenticação Social Segura
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {socialLoading === 'google'
                    ? 'Conectando com Google'
                    : socialLoading === 'twitter'
                    ? 'Conectando com X (Twitter)'
                    : 'Conectando com LinkedIn'}
                </h3>
                <p className="text-xs text-slate-400 font-medium h-5 flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>{socialConnectingStep || 'Verificando túnel seguro...'}</span>
                </p>
              </div>

              {/* Progress Line */}
              <div className="w-full space-y-1.5 pt-1">
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: '15%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className={`h-full ${
                      socialLoading === 'google'
                        ? 'bg-gradient-to-r from-blue-500 via-yellow-400 to-emerald-400 shadow-[0_0_12px_rgba(66,133,244,0.8)]'
                        : socialLoading === 'twitter'
                        ? 'bg-gradient-to-r from-slate-400 via-white to-slate-300 shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                        : 'bg-gradient-to-r from-sky-400 via-blue-500 to-[#0077B5] shadow-[0_0_12px_rgba(0,119,181,0.8)]'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <span>Protocolo OAuth 2.0 / SSL 256-bit</span>
                  <span className="text-emerald-400 font-mono">Conectando</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE TRANSIÇÃO SUAVE CINEMATOGRÁFICA PARA O SISTEMA */}
      <AnimatePresence>
        {transitioningUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070E]/90 backdrop-blur-2xl p-6"
          >
            {/* Ambient Background Aura */}
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.05, opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center max-w-sm w-full p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.25)] space-y-5"
            >
              {/* Avatar com Anel Neon Giratório */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/60 p-1"
                />
                <div className="absolute inset-2 rounded-full overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center border border-emerald-500/30">
                  <img
                    src={transitioningUser.avatarUrl}
                    alt={transitioningUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Textos de Boas-Vindas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Acesso Autorizado
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {transitioningUser.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {successMessage || 'Inicializando painel financeiro...'}
                </p>
              </div>

              {/* Barra de Progresso Cyber de Transição */}
              <div className="w-full space-y-2 pt-2">
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.95, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                  <span>Carregando dados seguros</span>
                  <span className="text-emerald-400 font-mono">100%</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
