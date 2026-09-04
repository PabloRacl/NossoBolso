import React from 'react';
import { Card } from '../ui/Card';
import { Badge, type BadgeProps } from '../ui/Badge';
import { useAppStore } from '../../store/useAppStore';
import {
  Palette,
  Keyboard,
  FileText,
  Database,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Sliders,
  Compass,
  Activity
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    setWhatIfModalOpen,
    setThemeModalOpen,
    setShortcutsModalOpen,
    setReceiptModalOpen,
    setBackupModalOpen,
    setPwaModalOpen,
    setScoreModalOpen,
  } = useAppStore();

  const settingsCards: Array<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconStyles: string;
    badgeVariant: NonNullable<BadgeProps['variant']>;
    actionLabel: string;
    onAction: () => void;
  }> = [
    {
      id: 'score',
      title: 'Score de Saúde Financeira & Crédito',
      subtitle: 'Diagnóstico Patrimonial',
      description: 'Pontuação calculada de 0 a 1000 pontos com análise em tempo real dos 4 pilares: reserva de emergência, saúde de dívidas, retenção e organização bancária.',
      icon: Activity,
      iconStyles: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      badgeVariant: 'success',
      actionLabel: 'Ver Diagnóstico',
      onAction: () => setScoreModalOpen(true),
    },
    {
      id: 'whatIf',
      title: 'Simulador de Cenários ("E Se?")',
      subtitle: 'Projeção Estratégica',
      description: 'Simule impactos de aumentos de despesas, demissão, renda extra e amortização acelerada antes de tomar decisões financeiras reais.',
      icon: Compass,
      iconStyles: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      badgeVariant: 'warning',
      actionLabel: 'Abrir Simulador',
      onAction: () => setWhatIfModalOpen(true),
    },
    {
      id: 'theme',
      title: 'Central de Temas Customizáveis',
      subtitle: 'Estilização Neon',
      description: 'Alterne instantaneamente a paleta visual do sistema (Cyber Emerald, Midnight Gold, Deep Ocean, Neon Violet, Sunset Crimson).',
      icon: Palette,
      iconStyles: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      badgeVariant: 'purple',
      actionLabel: 'Personalizar Temas',
      onAction: () => setThemeModalOpen(true),
    },
    {
      id: 'shortcuts',
      title: 'Central de Teclas de Atalho',
      subtitle: 'Produtividade por Teclado',
      description: 'Visualize todos os atalhos de teclado globais para operar o NossoBolso em velocidade máxima (Ctrl + /, Ctrl + K, M, Q, E, H, B, T, R, P).',
      icon: Keyboard,
      iconStyles: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      badgeVariant: 'success',
      actionLabel: 'Ver Atalhos',
      onAction: () => setShortcutsModalOpen(true),
    },
    {
      id: 'receipt',
      title: 'Gerador de Recibos & Comprovantes',
      subtitle: 'Emissão Profissional',
      description: 'Gere recibos e comprovantes de pagamento profissionais formatados para impressão física ou envio direto em PDF/WhatsApp.',
      icon: FileText,
      iconStyles: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
      badgeVariant: 'info',
      actionLabel: 'Gerar Recibo',
      onAction: () => setReceiptModalOpen(true),
    },
    {
      id: 'backup',
      title: 'Backup & Segurança de Dados (JSON)',
      subtitle: 'Gestão de Dados Local',
      description: 'Exporte um backup em JSON 100% criptografado e seguro da sua base local IndexedDB ou restaure dados salvos previamente.',
      icon: Database,
      iconStyles: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
      badgeVariant: 'info',
      actionLabel: 'Gerenciar Backup',
      onAction: () => setBackupModalOpen(true),
    },
    {
      id: 'pwa',
      title: 'Instalação no Celular / Tablet (PWA)',
      subtitle: 'App Nativo Mobile',
      description: 'Instale o NossoBolso como aplicativo nativo offline na tela inicial do seu celular Android ou iPhone sem depender da App Store.',
      icon: Smartphone,
      iconStyles: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      badgeVariant: 'success',
      actionLabel: 'Instalar no Celular',
      onAction: () => setPwaModalOpen(true),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-24 md:pb-6">
      <div className="p-6 bg-gradient-to-r from-[#0D1526] via-[#0A0E1A] to-[#0D1424] border border-[#00FF88]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#00FF88]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="p-3.5 bg-[#00FF88]/15 text-[#00FF88] rounded-2xl border border-[#00FF88]/30 shadow-md">
            <Sliders className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#F8FAFC]">Central de Configurações</h2>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
                SISTEMA OK
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">
              Gerencie utilitários avançados, backups, temas, recibos e simulações do NossoBolso OS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10">
          <span className="px-3 py-1.5 rounded-xl bg-[#162032] border border-[#2E3B52] text-xs font-bold text-[#94A3B8] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            <span>Dados Locais Protegidos</span>
          </span>
        </div>
      </div>

      {/* Grid de Cards de Ferramentas de Configuração */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              onClick={card.onAction}
              className="p-5 flex flex-col justify-between border border-[#2E3B52]/80 hover:border-[#00FF88]/50 transition-all duration-300 cursor-pointer group hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(0,255,136,0.12)] min-h-[220px]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-2xl border transition-transform group-hover:scale-105 ${card.iconStyles}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <Badge variant={card.badgeVariant} size="sm">
                    {card.subtitle}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <h3 className="text-base font-black text-[#F8FAFC] group-hover:text-[#00FF88] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1 group-hover:text-[#00FF88] transition-colors">
                  <span>{card.actionLabel}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#00FF88] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
                <Sparkles className="w-4 h-4 text-[#64748B] group-hover:text-[#00FF88] transition-colors" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
