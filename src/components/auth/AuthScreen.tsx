import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';
import { BioCyberLogo } from '../layout/BioCyberLogo';
import { FallingLeavesAnimation, WeatherMode } from './FallingLeavesAnimation';
import { HolographicSecurityBadge } from './HolographicSecurityBadge';

export const AuthScreen: React.FC = () => {
  const { setUser, authMode, setAuthMode } = useAppStore();

  const [weatherMode, setWeatherMode] = useState<WeatherMode>('leaves');
  const [activeHoverCard, setActiveHoverCard] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'linkedin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await authService.login({ email, password });
      setUser(user);
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

    try {
      const user = await authService.loginSocial(provider);
      setUser(user);
    } catch {
      setError(`Falha na conexão com ${provider}. Tente novamente.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGuestLogin = () => {
    setUser({
      id: 'usr_guest',
      name: 'Convidado Local',
      email: 'convidado@nossobolso.app',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      provider: 'credentials',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
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

      {/* Main Container Grid */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Practical Value & System Demonstrations */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block pr-6">

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]"
          >
            Sua vida financeira <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              organizada de forma simples
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-300 leading-relaxed font-medium"
          >
            Acompanhe saldos bancários, faturas de cartão, financiamentos, orçamentos mensais, compras de supermercado e revisões de veículos em um só lugar.
          </motion.p>

          {/* Practical Features Grid com Previews Holográficos em Hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4 pt-2 relative"
          >
            {/* Card 1: Saldos & Cartões */}
            <div
              onMouseEnter={() => setActiveHoverCard(1)}
              onMouseLeave={() => setActiveHoverCard(null)}
              className="relative p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-start gap-3 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Saldos & Cartões</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Monitore contas, faturas e rendimentos em tempo real.</p>
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
              className="relative p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 transition-all flex items-start gap-3 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">Financiamentos</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Simule parcelas, amortização de dívidas e quitação.</p>
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
              className="relative p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-start gap-3 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Despensa & Veículos</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Controle de lista de compras e manutenção de veículos.</p>
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
              className="relative p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all flex items-start gap-3 backdrop-blur-xl group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Orçamentos & Metas</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Defina limites por categoria e acompanhe objetivos.</p>
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
          </motion.div>

          {/* Guarantee Items */}
          <div className="flex items-center gap-6 pt-1 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              100% Gratuito & Privado
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Funciona Offline
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Importação OFX
            </span>
          </div>

          {/* 3D Holographic Security Badge */}
          <HolographicSecurityBadge />
        </div>

        {/* Right Side: Futuristic Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.12)] backdrop-blur-2xl overflow-hidden group hover:border-emerald-500/40 transition-all"
          >
            {/* Top Animated Gradient Glow Bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />

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
                const isActive = authMode === tab.id;

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
                  className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs font-medium backdrop-blur-md"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs font-semibold backdrop-blur-md"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce" />
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
                        <span>Criar Conta e Acessar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* FORGOT PASSWORD FORM */}
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
                    Informe o seu e-mail cadastrado para receber as instruções de redefinição de senha.
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
                      <span>Enviar Link de Recuperação</span>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social Logins */}
            <div className="pt-4 mt-5 border-t border-slate-800/80">
              <p className="text-center text-xs font-semibold text-slate-400 mb-3">Conectar com rede social</p>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};
