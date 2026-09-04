import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Building2,
  Car,
  ShoppingCart,
  Target,
  Sparkles,
  WifiOff,
  Check,
  CreditCard,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { HolographicSecurityBadge } from './HolographicSecurityBadge';

export const AuthLiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'dividas' | 'veiculos'>('geral');

  return (
    <div className="w-full space-y-4 select-none">
      {/* Cabeçalho Hero */}
      <div className="space-y-2.5 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5" />
          NossoBolso OS • Inteligência Financeira
        </motion.div>

        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-[1.15]">
          Sua vida financeira <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
            organizada de forma simples
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-md mx-auto lg:mx-0">
          Acompanhe saldos, faturas, amortização de dívidas, despensa de mantimentos e manutenções veiculares em um só ecossistema.
        </p>
      </div>

      {/* Mini-Dashboard Flutuante (Glassmorphism Live Preview) */}
      <div className="relative pt-2">
        {/* Pílula Flutuante Superior 1 (Despensa) */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden sm:flex absolute -top-1 -right-2 z-20 items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_10px_25px_rgba(6,182,212,0.25)] backdrop-blur-xl text-xs font-semibold text-slate-200 pointer-events-none"
        >
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
          <span>Despensa: 14 itens estocados</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </motion.div>

        {/* Pílula Flutuante Inferior 2 (Carro / Manutenção) */}
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="hidden sm:flex absolute -bottom-3 -left-3 z-20 items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-teal-500/40 shadow-[0_10px_25px_rgba(20,184,166,0.25)] backdrop-blur-xl text-xs font-semibold text-slate-200 pointer-events-none"
        >
          <div className="p-1 rounded-lg bg-teal-500/20 text-teal-400">
            <Car className="w-3.5 h-3.5" />
          </div>
          <span>Revisão Civic: em 1.500 km</span>
          <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-1.5 py-0.5 rounded">Em dia</span>
        </motion.div>

        {/* Container Principal Glassmorphism */}
        <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-[0_0_50px_rgba(16,185,129,0.12)] backdrop-blur-2xl overflow-hidden group hover:border-emerald-500/40 transition-all">
          {/* Luz de fundo holográfica */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cartão Holográfico Titanium / Black */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-4 shadow-xl overflow-hidden">
            {/* Efeito de Reflexo Metálico */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                {/* Chip EMV Dourado em SVG */}
                <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300/80 p-0.5 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full border border-amber-900/30 rounded-sm flex flex-col justify-between p-0.5 opacity-70">
                    <div className="h-[1px] bg-amber-950/60 w-full" />
                    <div className="h-[1px] bg-amber-950/60 w-full" />
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span>+24.8% este mês</span>
              </div>
            </div>

            {/* Saldo Consolidado */}
            <div className="relative z-10 space-y-1 mb-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Patrimônio Líquido</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">R$ 48.750,00</h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> Rendendo CDI
                </span>
              </div>
            </div>

            {/* Rodapé do Cartão */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
              <span>•••• •••• •••• 8842</span>
              <span className="font-bold text-slate-300 tracking-wider">NOSSOBOLSO TITANIUM</span>
            </div>
          </div>

          {/* Mini-Widgets de Destaque */}
          <div className="grid grid-cols-2 gap-2.5 mt-3 relative z-10">
            {/* Widget 1: Amortização de Dívidas */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-teal-500/20 hover:border-teal-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  Financiamento
                </span>
                <span className="text-[10px] font-black text-teal-400">68% Quitado</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 w-[68%]" />
              </div>
              <div className="text-[10px] font-semibold text-teal-300 flex items-center gap-1 truncate">
                <Zap className="w-3 h-3 text-teal-400 shrink-0" />
                -R$ 42.800 juros poupados
              </div>
            </div>

            {/* Widget 2: Metas & Reserva de Emergência */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Reserva Emergência
                </span>
                <span className="text-[10px] font-black text-amber-400">85% Meta</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 w-[85%]" />
              </div>
              <div className="text-[10px] font-semibold text-amber-300 flex items-center gap-1 truncate">
                <Check className="w-3 h-3 text-amber-400 shrink-0" />
                R$ 17.000 / R$ 20.000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges de Garantias */}
      <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-1 text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          100% Gratuito & Privado
        </span>
        <span className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Funciona Offline
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Importação OFX
        </span>
      </div>

      {/* Selo Holográfico 3D de Segurança Local */}
      <HolographicSecurityBadge />
    </div>
  );
};
