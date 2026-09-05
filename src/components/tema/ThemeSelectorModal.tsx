import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Palette, CheckCircle2, Sparkles } from 'lucide-react';

export type ThemePreset = 'emerald' | 'gold' | 'cyan' | 'violet' | 'crimson';

interface ThemeOption {
  id: ThemePreset;
  name: string;
  primaryColor: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'emerald',
    name: 'Cyber Emerald (Padrão)',
    primaryColor: '#00FF88',
    accentBg: 'bg-[#00FF88]/15',
    borderColor: 'border-[#00FF88]/40',
    textColor: 'text-[#00FF88]',
    badgeBg: 'bg-[#00FF88] text-[#0B0F19]',
    description: 'Estilo cibernético bio-esmeralda vibrante.',
  },
  {
    id: 'gold',
    name: 'Midnight Gold (Ouro)',
    primaryColor: '#FFD700',
    accentBg: 'bg-[#FFD700]/15',
    borderColor: 'border-[#FFD700]/40',
    textColor: 'text-[#FFD700]',
    badgeBg: 'bg-[#FFD700] text-[#090D16]',
    description: 'Design de luxo executivo com tons de ouro 24k.',
  },
  {
    id: 'cyan',
    name: 'Deep Ocean (Ciano)',
    primaryColor: '#06B6D4',
    accentBg: 'bg-[#06B6D4]/15',
    borderColor: 'border-[#06B6D4]/40',
    textColor: 'text-[#06B6D4]',
    badgeBg: 'bg-[#06B6D4] text-[#090D16]',
    description: 'Ciano neon inspirado em tecnologia marinha.',
  },
  {
    id: 'violet',
    name: 'Neon Violet (Roxo)',
    primaryColor: '#A855F7',
    accentBg: 'bg-[#A855F7]/15',
    borderColor: 'border-[#A855F7]/40',
    textColor: 'text-[#A855F7]',
    badgeBg: 'bg-[#A855F7] text-[#FFFFFF]',
    description: 'Roxo futurista cyberpunk com alto contraste.',
  },
  {
    id: 'crimson',
    name: 'Sunset Crimson (Laser)',
    primaryColor: '#FF4D6D',
    accentBg: 'bg-[#FF4D6D]/15',
    borderColor: 'border-[#FF4D6D]/40',
    textColor: 'text-[#FF4D6D]',
    badgeBg: 'bg-[#FF4D6D] text-[#FFFFFF]',
    description: 'Vermelho carmesim de alta energia e atitude.',
  },
];

export const ThemeSelectorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    return (localStorage.getItem('nossobolso_theme') as ThemePreset) || 'emerald';
  });

  const applyTheme = (themeId: ThemePreset) => {
    setCurrentTheme(themeId);
    localStorage.setItem('nossobolso_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  useEffect(() => {
    const saved = localStorage.getItem('nossobolso_theme') as ThemePreset;
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Central de Temas Customizáveis">
      <div className="flex flex-col gap-6 py-2">
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <Palette className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Personalização Visual Neon</h4>
            <p className="mt-1">
              Escolha o tema de iluminação futurista do sistema para personalizar botões, bordas e destaques visuais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? `${theme.accentBg} ${theme.borderColor} shadow-[0_0_20px_rgba(0,255,136,0.15)] scale-[1.01]`
                    : 'bg-[#090D18]/80 border-[#1E293B] hover:border-[#2E3B52]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center font-bold text-xs ${theme.badgeBg}`}
                  >
                    ★
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-[#F8FAFC]">{theme.name}</h4>
                    <span className="text-xs text-[#94A3B8]">{theme.description}</span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${theme.textColor}`} />
                ) : (
                  <span className="text-xs text-[#64748B] font-bold">Selecionar</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
