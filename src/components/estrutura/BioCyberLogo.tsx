import React from 'react';

interface BioCyberLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BioCyberLogo: React.FC<BioCyberLogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses[size]} group cursor-pointer select-none`}
      title="NossoBolso — Sistema Inteligente de Gestão Financeira Pessoal"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-amber-500/20 blur-md group-hover:blur-lg transition-all duration-300 pointer-events-none" />

      {/* SVG Vector Logo */}
      <svg className="relative z-10 w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform duration-300 group-hover:scale-105" viewBox="0 0 512 512" fill="none">
        <defs>
          <linearGradient id="noteGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="goldGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* BANKNOTE CARD */}
        <rect x="86" y="80" width="340" height="200" rx="36" fill="url(#noteGradComp)" stroke="#34D399" strokeWidth="12" />
        <rect x="106" y="100" width="300" height="160" rx="24" fill="none" stroke="#A7F3D0" strokeOpacity="0.4" strokeWidth="6" strokeDasharray="12 8" />
        <circle cx="136" cy="180" r="18" fill="#047857" opacity="0.6" />
        <circle cx="376" cy="180" r="18" fill="#047857" opacity="0.6" />

        {/* CENTER CURRENCY BADGE ($) */}
        <circle cx="256" cy="180" r="50" fill="url(#goldGradComp)" stroke="#FEF08A" strokeWidth="8" />
        <path d="M256 148 V212 M240 162 C240 154 272 150 272 166 C272 182 240 178 240 194 C240 210 272 206 272 198" 
              stroke="#78350F" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* BRANCHING FLOW CONNECTORS */}
        <path d="M256 280 V360" stroke="#38BDF8" strokeWidth="14" strokeLinecap="round" />
        <path d="M146 360 H366" stroke="#38BDF8" strokeWidth="14" strokeLinecap="round" />

        <path d="M146 360 V400" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" />
        <path d="M256 360 V400" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" />
        <path d="M366 360 V400" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />

        {/* NODES */}
        <circle cx="146" cy="416" r="28" fill="#EF4444" stroke="#FCA5A5" strokeWidth="8" />
        <circle cx="146" cy="416" r="10" fill="#FFFFFF" />

        <circle cx="256" cy="416" r="32" fill="#3B82F6" stroke="#93C5FD" strokeWidth="8" />
        <circle cx="256" cy="416" r="12" fill="#FFFFFF" />

        <circle cx="366" cy="416" r="28" fill="#F59E0B" stroke="#FDE68A" strokeWidth="8" />
        <circle cx="366" cy="416" r="10" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
