import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { Bell, Calendar, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export const AlertsModal: React.FC = () => {
  const { isAlertsModalOpen, setAlertsModalOpen, isPrivacyMode } = useAppStore();
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const upcomingAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const alerts: {
      id: string;
      title: string;
      amount: number;
      date: string;
      daysRemaining: number;
      type: 'financing' | 'bill';
      category: string;
    }[] = [];

    // Filter transactions due in the next 7 days
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
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [transactions]);

  return (
    <Modal
      isOpen={isAlertsModalOpen}
      onClose={() => setAlertsModalOpen(false)}
      title="Central de Alertas & Vencimentos da Semana"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-[#0D1424] border border-[#2E3B52] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Lembretes Automáticos de Contas</h4>
            <p className="text-[11px] text-[#94A3B8]">
              Você possui <strong className="text-[#00FF88]">{upcomingAlerts.length}</strong> conta(s) ou parcela(s) com vencimento nos próximos 7 dias.
            </p>
          </div>
        </div>

        {upcomingAlerts.length === 0 ? (
          <div className="p-8 text-center bg-[#0A0B0E] border border-[#1E2330] rounded-xl flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-[#00FF88]" />
            <h5 className="text-sm font-bold text-[#F8FAFC]">Tudo em Dia!</h5>
            <p className="text-xs text-[#94A3B8]">Nenhuma conta ou parcela de financiamento a vencer nos próximos 7 dias.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {upcomingAlerts.map((alert) => {
              const isToday = alert.daysRemaining === 0;
              const isTomorrow = alert.daysRemaining === 1;

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isToday
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/30'
                      : isTomorrow
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30'
                      : 'bg-[#12141A] border-[#1E2330]'
                  }`}
                >
                  <div className="flex items-center gap-3">
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

                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-[#F8FAFC]">
                      {formatBRL(alert.amount, isPrivacyMode)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      isToday
                        ? 'bg-[#EF4444] text-white'
                        : isTomorrow
                        ? 'bg-[#F59E0B] text-black'
                        : 'bg-[#1E293B] text-[#94A3B8]'
                    }`}>
                      {isToday ? 'Vence Hoje' : isTomorrow ? 'Amanhã' : `Em ${alert.daysRemaining} dias`}
                    </span>
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
