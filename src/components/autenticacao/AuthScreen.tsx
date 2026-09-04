import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  KeyRound,
  CloudSun,
  Coins,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';
import { BioCyberLogo } from '../layout/BioCyberLogo';
import { FallingLeavesAnimation, WeatherMode } from './FallingLeavesAnimation';
import { AuthLiveDashboard } from './AuthLiveDashboard';
import { UserProfile } from '../../types';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { VerifyCodeForm } from './VerifyCodeForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { SocialLoginModal } from './SocialLoginModal';

export const AuthScreen: React.FC = () => {
  const { setUser, authMode, setAuthMode } = useAppStore();

  const [weatherMode, setWeatherMode] = useState<WeatherMode>('leaves');
  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState('');
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);

  // Social Login Popup State
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'facebook' | 'linkedin' | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'linkedin' | 'twitter' | null>(null);
  const [socialConnectingStep, setSocialConnectingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Transição Suave Universal para o Sistema
  const transitionToSystem = (authenticatedUser: UserProfile, msg?: string) => {
    setSuccessMessage(msg || `Bem-vindo ao NossoBolso, ${authenticatedUser.name.split(' ')[0]}!`);
    setTimeout(() => {
      setUser(authenticatedUser);
    }, 1100);
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

    try {
      if (provider === 'google') {
        const res = await authService.loginWithGoogleReal();
        if (res.error) {
          setError(res.error);
          setSocialLoading(null);
          return;
        }
      } else if (provider === 'twitter') {
        const res = await authService.loginWithTwitterReal();
        if (res.error) {
          setError(res.error);
          setSocialLoading(null);
          return;
        }
      } else {
        setSocialConnectingStep('Preparando tela de autorização...');
        setTimeout(() => {
          setSocialModalProvider('linkedin');
          setSocialLoading(null);
        }, 800);
      }
    } catch {
      setError(`Falha ao conectar com ${pName}. Tente novamente.`);
      setSocialLoading(null);
    }
  };

  const executeSocialLogin = async (emailToUse: string, nameToUse: string) => {
    if (!socialModalProvider) return;
    const provider = socialModalProvider;
    setSocialLoading(provider);
    setError(null);

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

  const tabs = [
    { id: 'login', label: 'Entrar', icon: LogIn },
    { id: 'register', label: 'Cadastrar', icon: UserPlus },
    { id: 'forgot', label: 'Recuperar', icon: KeyRound },
  ] as const;

  return (
    <div className="min-h-screen w-full bg-[#05070E] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Interactive Canvas Background */}
      <FallingLeavesAnimation mode={weatherMode} />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[450px] h-[450px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Weather Mode Switcher */}
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
      <div className="relative w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12 z-10 py-6 px-4">
        {/* Left Column: Hero & Live Dashboard */}
        <motion.div
          animate={{
            x: isIntroPhase && isDesktop ? 260 : 0,
            opacity: !isDesktop && !isIntroPhase ? 0 : 1,
          }}
          transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-md mx-auto lg:w-[480px] xl:w-[520px] shrink-0 ${
            !isDesktop && !isIntroPhase ? 'hidden' : 'block'
          }`}
        >
          <AuthLiveDashboard />
        </motion.div>

        {/* Right Column: Auth Card */}
        <motion.div
          animate={{
            opacity: isIntroPhase ? 0 : 1,
            scale: isIntroPhase ? 0.88 : 1,
            filter: isIntroPhase ? 'brightness(0) blur(28px)' : 'brightness(1) blur(0px)',
            y: isIntroPhase ? 30 : 0,
          }}
          transition={{ duration: 1.3, delay: isIntroPhase ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-md mx-auto lg:w-[440px] shrink-0 ${
            isIntroPhase ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <motion.div
            animate={{
              opacity: isIntroPhase ? 0 : 0.45,
              scale: isIntroPhase ? 0.6 : 1.15,
            }}
            transition={{ duration: 1.5, delay: isIntroPhase ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -inset-6 bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-500/25 rounded-[40px] blur-[90px] pointer-events-none"
          />

          <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_70px_rgba(16,185,129,0.15)] backdrop-blur-2xl overflow-hidden group hover:border-emerald-500/40 transition-all">
            {/* Top Glow Bar */}
            <motion.div
              animate={{ opacity: isIntroPhase ? 0 : 1, width: isIntroPhase ? '0%' : '100%' }}
              transition={{ duration: 1.1, delay: isIntroPhase ? 0 : 0.5, ease: 'easeOut' }}
              className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.7)]"
            />

            {/* Header */}
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

            {/* Modular Forms Rendered Conditionality */}
            <AnimatePresence mode="wait">
              {authMode === 'login' && (
                <LoginForm
                  onSuccess={transitionToSystem}
                  onError={setError}
                  onForgotPassword={() => {
                    setAuthMode('forgot');
                    setError(null);
                  }}
                  onSocialLogin={handleOAuthRealLogin}
                  onGuestLogin={handleGuestLogin}
                  socialLoading={socialLoading}
                />
              )}

              {authMode === 'register' && (
                <RegisterForm
                  onSuccess={(newUser, emailRegistered) => {
                    setRegisteredEmail(emailRegistered);
                    setSimulatedToken(newUser.verificationToken || '849201');
                    setSuccessMessage(`🎉 Cadastro efetuado com sucesso! Código enviado para ${emailRegistered}`);
                    setAuthMode('verify');
                  }}
                  onError={setError}
                  onSwitchToLogin={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                />
              )}

              {authMode === 'verify' && (
                <VerifyCodeForm
                  email={registeredEmail}
                  simulatedToken={simulatedToken}
                  onSuccess={(verifiedUser) => {
                    transitionToSystem(verifiedUser, 'E-mail verificado com sucesso! Acessando seu painel...');
                  }}
                  onError={setError}
                  onResendSuccess={(newCode, msg) => {
                    setSimulatedToken(newCode);
                    setSuccessMessage(msg);
                  }}
                  onChangeEmail={() => setAuthMode('register')}
                />
              )}

              {authMode === 'forgot' && (
                <ForgotPasswordForm
                  initialEmail={registeredEmail}
                  onSuccess={(token, emailTarget) => {
                    setRegisteredEmail(emailTarget);
                    setSimulatedToken(token);
                    setSuccessMessage(`🔑 Código de redefinição enviado com sucesso para ${emailTarget}`);
                    setAuthMode('reset_password');
                  }}
                  onError={setError}
                  onBackToLogin={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                />
              )}

              {authMode === 'reset_password' && (
                <ResetPasswordForm
                  email={registeredEmail}
                  simulatedToken={simulatedToken}
                  onSuccess={(updatedUser) => {
                    transitionToSystem(updatedUser, 'Senha redefinida com sucesso! Acessando seu painel...');
                  }}
                  onError={setError}
                  onBackToLogin={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Social Login Popups */}
      <SocialLoginModal
        provider={socialModalProvider}
        onClose={() => setSocialModalProvider(null)}
        onExecute={executeSocialLogin}
        loading={socialLoading !== null}
        connectingProvider={socialLoading}
        connectingStep={socialConnectingStep}
      />
    </div>
  );
};
