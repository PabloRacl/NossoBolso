import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Trophy, ShieldCheck, Zap, Car, ShoppingCart, CreditCard, Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  progressPercent: number;
  unlockedText: string;
}

export const FinancialBadgesWidget: React.FC = () => {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), []) || [];
  const vehicleRecords = useLiveQuery(() => db.vehicleRecords.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const badges = useMemo((): BadgeItem[] => {
    // 1. Guardião da Reserva (Reserva > R$ 10.000)
    const savingsBalance = wallets
      .filter((w) => w.type === 'savings' || w.yieldRateCdi)
      .reduce((acc, w) => acc + (w.balance || 0), 0);
    const savingsUnlocked = savingsBalance >= 10000;
    const savingsProgress = Math.min(Math.round((savingsBalance / 10000) * 100), 100);

    // 2. Retenção de Elite (Salvação no Mês > 20%)
    const income = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const retentionRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const retentionUnlocked = retentionRate >= 20;

    // 3. Piloto Consciente (2+ registros na garagem)
    const garageUnlocked = vehicleRecords.length >= 2;
    const garageProgress = Math.min(Math.round((vehicleRecords.length / 2) * 100), 100);

    // 4. Mestre das Carteiras (3+ carteiras de banco)
    const walletsUnlocked = wallets.length >= 3;
    const walletsProgress = Math.min(Math.round((wallets.length / 3) * 100), 100);

    // 5. Comprador Inteligente (5+ itens na despensa)
    const pantryUnlocked = pantryItems.length >= 5;
    const pantryProgress = Math.min(Math.round((pantryItems.length / 5) * 100), 100);

    // 6. Caçador de Juros (Financiamentos cadastrados)
    const debtsUnlocked = debtContracts.length >= 1;

    return [
      {
        id: 'b_savings',
        title: 'Guardião da Reserva',
        description: 'Construiu mais de R$ 10.000 em Reserva de Emergência.',
        icon: <ShieldCheck className="w-5 h-5 text-[#00FF88]" />,
        isUnlocked: savingsUnlocked,
        progressPercent: savingsProgress,
        unlockedText: 'Reserva Blindada',
      },
      {
        id: 'b_retention',
        title: 'Retenção de Elite',
        description: 'Guardou mais de 20% do salário líquido no período.',
        icon: <Zap className="w-5 h-5 text-[#06B6D4]" />,
        isUnlocked: retentionUnlocked,
        progressPercent: Math.min(Math.round(retentionRate), 100),
        unlockedText: 'Poupador Nível Máximo',
      },
      {
        id: 'b_wallets',
        title: 'Mestre das Carteiras',
        description: 'Organizou 3 ou mais contas bancárias e cartões.',
        icon: <CreditCard className="w-5 h-5 text-[#FFD700]" />,
        isUnlocked: walletsUnlocked,
        progressPercent: walletsProgress,
        unlockedText: 'Multibanco Conectado',
      },
      {
        id: 'b_garage',
        title: 'Piloto Consciente',
        description: 'Registrou abastecimentos e custos em KM/L na Garagem.',
        icon: <Car className="w-5 h-5 text-[#38BDF8]" />,
        isUnlocked: garageUnlocked,
        progressPercent: garageProgress,
        unlockedText: 'Garagem Otimizada',
      },
      {
        id: 'b_pantry',
        title: 'Comprador Inteligente',
        description: 'Mapeou mais de 5 itens no estoque da despensa doméstica.',
        icon: <ShoppingCart className="w-5 h-5 text-[#F59E0B]" />,
        isUnlocked: pantryUnlocked,
        progressPercent: pantryProgress,
        unlockedText: 'Despensa Controlada',
      },
      {
        id: 'b_debts',
        title: 'Caçador de Amortização',
        description: 'Mapeou e amortizou contratos de longo prazo.',
        icon: <Trophy className="w-5 h-5 text-[#A855F7]" />,
        isUnlocked: debtsUnlocked,
        progressPercent: debtsUnlocked ? 100 : 0,
        unlockedText: 'Contrato Sob Controle',
      },
    ];
  }, [transactions, wallets, pantryItems, vehicleRecords, debtContracts]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-[#FFD700] hover:border-[#FFD700]/60 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#FFD700]/15 text-[#FFD700] rounded-xl border border-[#FFD700]/30">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Conquistas de Disciplina Financeira</h3>
            <p className="text-[11px] text-[#94A3B8] font-medium">Badges desbloqueados com o seu progresso patrimonial</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-[#FFD700]/15 border border-[#FFD700]/40 rounded-full text-xs font-black text-[#FFD700] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{unlockedCount} / {badges.length} Unlocked</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
              b.isUnlocked
                ? 'bg-[#090D18]/90 border-[#00FF88]/40 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                : 'bg-[#090D18]/40 border-[#1E293B] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border ${b.isUnlocked ? 'bg-[#121929] border-[#2E3B52]' : 'bg-[#0D1424] border-[#1E293B]'}`}>
                  {b.icon}
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-[#F8FAFC]">{b.title}</h4>
                  <span className="text-[10px] text-[#94A3B8] line-clamp-1">{b.description}</span>
                </div>
              </div>

              {b.isUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-[#00FF88] shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
              <span className="text-[#64748B] font-bold">Status:</span>
              <span className={b.isUnlocked ? 'text-[#00FF88] font-black' : 'text-[#94A3B8]'}>
                {b.isUnlocked ? b.unlockedText : `${b.progressPercent}% Concluído`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
