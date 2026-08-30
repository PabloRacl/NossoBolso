import React from 'react';
import { Sprout, Sparkles, Orbit, ShieldCheck, Zap } from 'lucide-react';

export const BioCyberLogo: React.FC = () => {
  return (
    <div
      className="relative flex items-center justify-center w-11 h-11 group cursor-pointer select-none"
      title="NossoBolso — Sistema Operacional Financeiro Bio-Cibernético"
    >
      {/* 🌟 1. Anel Orbital Cibernético Externo Gira em 360 Graus */}
      <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#00FF88]/40 bio-cyber-spin pointer-events-none" />

      {/* 🌟 2. Brilho Neon Ambiente Bio-Esmeralda & Ouro Puríssimo */}
      <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-[#00FF88]/25 via-[#FFD700]/20 to-[#06B6D4]/30 blur-md group-hover:blur-lg transition-all duration-500 pointer-events-none" />

      {/* 🌟 3. Núcleo Prismático Hexagonal / Redondo */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D1526] via-[#090D18] to-[#04060A] border border-[#00FF88]/60 shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#FFD700] group-hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]">
        
        {/* Raio Holográfico em Diagonal */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF88]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        {/* 🌟 4. Ícone Bio-Orgânico com Movimento Vivo (Broto de Ouro & Esmeralda) */}
        <div className="relative z-10 bio-cyber-pulse flex items-center justify-center">
          <Sprout className="w-5 h-5 text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.9)] stroke-[2.5]" />
        </div>

        {/* 🌟 5. Partícula Flutuante de Ouro Vivo (Bens & Riqueza) */}
        <div className="absolute top-1 right-1 z-20">
          <Sparkles className="w-3 h-3 text-[#FFD700] animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
        </div>
      </div>
    </div>
  );
};
