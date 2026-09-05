import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { useAppStore, getCurrentMonthKey } from '../../estado/useAppStore';
import { formatBRL } from '../../utilidades/formatters';
import { Card } from '../ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, ShieldAlert, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';

export const CashFlowCalendarView: React.FC = () => {
  const { selectedMonth, isPrivacyMode } = useAppStore();
  const currentKey = getCurrentMonthKey();
  const activeMonthKey = selectedMonth === 'all' ? currentKey : selectedMonth;

  const [yearStr, monthStr] = activeMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];

  const totalWalletBalance = useMemo(() => {
    return wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  }, [wallets]);

  // Dias do mês para compor o calendário
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    // 0 = Domingo, 1 = Segunda... Ajustar para Segunda = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Domingo vira 6

    const gridDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Preencher dias vazios antes do dia 1
    for (let i = 0; i < startDayOfWeek; i++) {
      gridDays.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Preencher dias do mês
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      gridDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    return gridDays;
  }, [year, month]);

  // Agrupar transações por dia da data YYYY-MM-DD
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; txs: typeof transactions }>();

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const dateKey = tx.date;
      const current = map.get(dateKey) || { income: 0, expense: 0, txs: [] };

      if (tx.type === 'income') {
        current.income += tx.amount;
      } else {
        current.expense += tx.amount;
      }
      current.txs.push(tx);
      map.set(dateKey, current);
    });

    return map;
  }, [transactions]);

  const monthStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(activeMonthKey)) {
        if (tx.type === 'income') totalIn += tx.amount;
        else totalOut += tx.amount;
      }
    });
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions, activeMonthKey]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header do Calendário de Fluxo de Caixa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#0D1424]/90 border border-[#2E3B52]/60 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30">
            <CalendarIcon className="w-6 h-6 text-[#00FF88]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#F8FAFC]">Calendário de Fluxo de Caixa & Vencimentos</h2>
            <p className="text-xs text-[#94A3B8] font-medium">Previsão diária de contas, receitas e saldos disponíveis</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold bg-[#162032] border border-[#2E3B52] p-2.5 rounded-xl">
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <ArrowUpRight className="w-4 h-4 text-[#00FF88]" />
            Entradas: {formatBRL(monthStats.totalIn, isPrivacyMode)}
          </span>
          <span className="text-[#475569]">•</span>
          <span className="flex items-center gap-1.5 text-[#FF4D6D]">
            <ArrowDownRight className="w-4 h-4 text-[#FF4D6D]" />
            Saídas: {formatBRL(monthStats.totalOut, isPrivacyMode)}
          </span>
        </div>
      </div>

      {/* Grade Semanal do Calendário */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Dias da Semana (Seg a Dom) */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black uppercase text-[#64748B] tracking-wider py-2 border-b border-[#1E293B]">
            <div>Segunda</div>
            <div>Terça</div>
            <div>Quarta</div>
            <div>Quinta</div>
            <div>Sexta</div>
            <div className="text-[#00FF88]/80">Sábado</div>
            <div className="text-[#00FF88]/80">Domingo</div>
          </div>

          {/* Células de Dias */}
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return (
                  <div
                    key={`empty_${idx}`}
                    className="min-h-[100px] p-2 bg-[#090D18]/30 border border-[#1E293B]/40 rounded-xl opacity-30"
                  />
                );
              }

              const dayData = transactionsByDate.get(item.dateStr);
              const hasTxs = dayData && dayData.txs.length > 0;
              const isToday = item.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={item.dateStr}
                  className={`min-h-[110px] p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200 group ${
                    isToday
                      ? 'bg-[#00FF88]/10 border-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                      : hasTxs
                      ? 'bg-[#0D1526]/80 border-[#2E3B52] hover:border-[#00FF88]/40'
                      : 'bg-[#090D18]/60 border-[#1E293B]/80 hover:bg-[#121929]'
                  }`}
                >
                  {/* Número do Dia */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-[#00FF88] text-[#090D16]'
                          : 'text-[#F8FAFC] group-hover:text-[#00FF88]'
                      }`}
                    >
                      {item.dayNum}
                    </span>

                    {hasTxs && (
                      <span className="text-[9px] font-extrabold text-[#94A3B8] bg-[#121929] px-1.5 py-0.5 rounded border border-[#1E293B]">
                        {dayData.txs.length} {dayData.txs.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>

                  {/* Lançamentos do Dia */}
                  <div className="flex flex-col gap-1 my-1 overflow-hidden">
                    {dayData?.income ? (
                      <div className="text-[10px] font-black text-[#00FF88] bg-[#00FF88]/10 px-1.5 py-0.5 rounded flex items-center justify-between border border-[#00FF88]/20 truncate">
                        <span>+ Receitas</span>
                        <span>{formatBRL(dayData.income, isPrivacyMode)}</span>
                      </div>
                    ) : null}

                    {dayData?.expense ? (
                      <div className="text-[10px] font-black text-[#FF4D6D] bg-[#FF4D6D]/10 px-1.5 py-0.5 rounded flex items-center justify-between border border-[#FF4D6D]/20 truncate">
                        <span>- Saídas</span>
                        <span>{formatBRL(dayData.expense, isPrivacyMode)}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Saldo Líquido do Dia */}
                  {hasTxs ? (
                    <div className="text-[10px] font-bold text-[#64748B] pt-1 border-t border-[#1E293B] flex items-center justify-between truncate">
                      <span>Balanço:</span>
                      <span className={dayData.income - dayData.expense >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'}>
                        {formatBRL(dayData.income - dayData.expense, isPrivacyMode)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-[#475569] font-medium text-right">Sem contas</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
