import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { Bell, Calendar, AlertCircle, CheckCircle2, CreditCard, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const AlertsModal: React.FC = () => {
  const { isAlertsModalOpen, setAlertsModalOpen, isPrivacyMode } = useAppStore();
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const recurring = useLiveQuery(() => db.recurringTransactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const upcomingAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 10);

    const alerts: {
      id: string;
      title: string;
      amount: number;
      date: string;
      daysRemaining: number;
      type: 'financing' | 'bill' | 'recurring';
      category: string;
      walletId?: string;
    }[] = [];

    // 1. Transações agendadas nos próximos 10 dias
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const txDate = new Date(tx.date + 'T00:00:00');
        if (txDate >= today && txDate <= nextWeek) {
          const diffTime = txDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          alerts.push({
            id: tx.id,
            title: tx.description,
            amount: tx.amount,
            date: tx.date,
            daysRemaining: diffDays,
            type: tx.contractId ? 'financing' : 'bill',
            category: tx.category,
            walletId: tx.walletId,
          });
        }
      }
    });

    // 2. Contas recorrentes mensais (ex: SISMEPE, Consignado Bradesco, Internet)
    const currentMonthStr = today.toISOString().substring(0, 7);
    recurring.forEach((rec) => {
      if (rec.lastGeneratedMonth !== currentMonthStr) {
        const day = rec.dayOfMonth || 5;
        const recDate = new Date(today.getFullYear(), today.getMonth(), day);
        const diffTime = recDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= -2 && diffDays <= 10) {
          alerts.push({
            id: `rec_${rec.id}`,
            title: rec.description,
            amount: rec.amount,
            date: recDate.toISOString().substring(0, 10),
            daysRemaining: diffDays,
            type: 'recurring',
            category: rec.category,
            walletId: rec.walletId,
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [transactions, recurring]);

  const handleMarkAsPaid = async (alertItem: typeof upcomingAlerts[number]) => {
    const targetWalletId = alertItem.walletId || (wallets.length > 0 ? wallets[0].id : 'w1');

    // Registra o pagamento no banco
    await db.transactions.add({
      id: `paid_${Date.now()}`,
      description: `[Pago ⚡] ${alertItem.title}`,
      amount: alertItem.amount,
      date: new Date().toISOString().substring(0, 10),
      type: 'expense',
      category: alertItem.category,
      walletId: targetWalletId,
      createdAt: new Date().toISOString(),
    });

    // Debitar da carteira
    const wallet = await db.wallets.get(targetWalletId);
    if (wallet) {
      await db.wallets.update(targetWalletId, { balance: wallet.balance - alertItem.amount });
    }

    // Se for conta recorrente, atualiza lastGeneratedMonth
    if (alertItem.type === 'recurring') {
      const recId = alertItem.id.replace('rec_', '');
      const recItem = await db.recurringTransactions.get(recId);
      if (recItem) {
        await db.recurringTransactions.update(recId, {
          lastGeneratedMonth: new Date().toISOString().substring(0, 7),
        });
      }
    }

    alert(`⚡ "${alertItem.title}" marcada como paga com sucesso no NossoBolso!`);
  };

  return (
    <Modal
      isOpen={isAlertsModalOpen}
      onClose={() => setAlertsModalOpen(false)}
      title="Central de Alertas & Vencimentos Inteligentes"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Lembretes Automáticos de Contas</h4>
            <p className="text-[11px] text-[#94A3B8]">
              Você possui <strong className="text-[#00FF88]">{upcomingAlerts.length}</strong> conta(s) ou parcela(s) a vencer nos próximos 10 dias.
            </p>
          </div>
        </div>

        {upcomingAlerts.length === 0 ? (
          <div className="p-8 text-center bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-[#00FF88]" />
            <h5 className="text-sm font-bold text-[#F8FAFC]">Tudo em Dia!</h5>
            <p className="text-xs text-[#94A3B8]">Nenhuma conta ou parcela de financiamento a vencer nos próximos 10 dias.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
            {upcomingAlerts.map((alert) => {
              const isToday = alert.daysRemaining <= 0;
              const isTomorrow = alert.daysRemaining === 1;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isToday
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/40'
                      : isTomorrow
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40'
                      : 'bg-[#12141A] border-[#1E2330]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[200px] flex-1">
                    <div className={`p-2 rounded-lg border ${alert.type === 'financing' ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]' : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'}`}>
                      {alert.type === 'financing' ? <CreditCard className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#F8FAFC]">{alert.title}</h5>
                      <span className="text-[10px] text-[#94A3B8]">
                        Vencimento: {alert.date.split('-').reverse().join('/')} • {alert.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-[#F8FAFC]">
                        {formatBRL(alert.amount, isPrivacyMode)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        isToday
                          ? 'bg-[#EF4444] text-white animate-pulse'
                          : isTomorrow
                          ? 'bg-[#F59E0B] text-black'
                          : 'bg-[#1E293B] text-[#94A3B8]'
                      }`}>
                        {isToday ? 'Vence Hoje' : isTomorrow ? 'Amanhã' : `Em ${alert.daysRemaining} dias`}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMarkAsPaid(alert)}
                      className="px-3 py-1.5 text-xs bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 hover:bg-[#00FF88]/30"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Dar Baixa</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
