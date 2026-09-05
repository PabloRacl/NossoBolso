import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../servicos/db';
import { formatBRL } from '../../utilidades/formatters';
import { useAppStore } from '../../estado/useAppStore';
import { Globe, DollarSign, Bitcoin, RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, Award } from 'lucide-react';

interface CurrencyRate {
  code: string;
  name: string;
  bid: number;
  pctChange: number;
  icon: React.ReactNode;
}

export const CurrencyMarketWidget: React.FC = () => {
  const { isPrivacyMode } = useAppStore();
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) || [];
  const debtContracts = useLiveQuery(() => db.debtContracts.toArray(), []) || [];

  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const totalDebt = debtContracts.reduce((acc, d) => acc + (d.totalAmount || d.installmentAmount * d.totalInstallments), 0);
  const netWorthBrl = Math.max(totalBalance - totalDebt, 0);

  const [rates, setRates] = useState<CurrencyRate[]>([
    { code: 'USD', name: 'Dólar Comercial', bid: 5.48, pctChange: 0.35, icon: <DollarSign className="w-4 h-4 text-[#00FF88]" /> },
    { code: 'EUR', name: 'Euro', bid: 6.12, pctChange: -0.12, icon: <Globe className="w-4 h-4 text-[#06B6D4]" /> },
    { code: 'BTC', name: 'Bitcoin (BTC)', bid: 365000.00, pctChange: 2.45, icon: <Bitcoin className="w-4 h-4 text-[#F59E0B]" /> },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
      if (res.ok) {
        const data = await res.json();
        setRates([
          {
            code: 'USD',
            name: 'Dólar Comercial',
            bid: parseFloat(data.USDBRL?.bid || '5.48'),
            pctChange: parseFloat(data.USDBRL?.pctChange || '0'),
            icon: <DollarSign className="w-4 h-4 text-[#00FF88]" />,
          },
          {
            code: 'EUR',
            name: 'Euro',
            bid: parseFloat(data.EURBRL?.bid || '6.12'),
            pctChange: parseFloat(data.EURBRL?.pctChange || '0'),
            icon: <Globe className="w-4 h-4 text-[#06B6D4]" />,
          },
          {
            code: 'BTC',
            name: 'Bitcoin (BTC)',
            bid: parseFloat(data.BTCBRL?.bid || '365000'),
            pctChange: parseFloat(data.BTCBRL?.pctChange || '0'),
            icon: <Bitcoin className="w-4 h-4 text-[#F59E0B]" />,
          },
        ]);
      }
    } catch (err) {
      console.warn('Usando cotações locais em cache.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const usdBid = rates.find((r) => r.code === 'USD')?.bid || 5.48;
  const btcBid = rates.find((r) => r.code === 'BTC')?.bid || 365000;

  const netWorthUsd = netWorthBrl > 0 ? netWorthBrl / usdBid : 0;
  const netWorthBtc = netWorthBrl > 0 ? netWorthBrl / btcBid : 0;

  return (
    <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-[#06B6D4] hover:border-[#06B6D4]/60 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#06B6D4]/15 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30">
            <Globe className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Cotações Globais & Moeda Forte</h3>
            <p className="text-[11px] text-[#94A3B8] font-medium">Patrimônio dolarizado e precificação em Bitcoin ao vivo</p>
          </div>
        </div>

        <button
          onClick={fetchRates}
          disabled={isLoading}
          className="p-2 bg-[#162032] border border-[#2E3B52] hover:border-[#06B6D4]/40 text-[#94A3B8] hover:text-[#06B6D4] rounded-xl transition-all cursor-pointer"
          title="Atualizar Cotações ao Vivo"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#06B6D4]' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rates.map((r) => (
          <div key={r.code} className="p-3 bg-[#090D18]/90 border border-[#1E293B] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#121929] border border-[#2E3B52] rounded-lg">{r.icon}</div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#F8FAFC]">{r.code}/BRL</span>
                <span className="text-[10px] text-[#94A3B8] font-medium">{r.name}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-[#F8FAFC]">
                R$ {r.code === 'BTC' ? r.bid.toLocaleString('pt-BR') : r.bid.toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-bold flex items-center gap-0.5 ${
                  r.pctChange >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
                }`}
              >
                {r.pctChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {r.pctChange >= 0 ? '+' : ''}{r.pctChange.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dolarização do Patrimônio */}
      <div className="p-3 bg-[#0A0D1A] border border-[#06B6D4]/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#00FF88]" />
          <span className="text-[#94A3B8] font-semibold">Seu Patrimônio Dolarizado:</span>
          <strong className="text-[#00FF88] font-black text-sm">
            {isPrivacyMode ? 'US$ ••••••' : `US$ ${netWorthUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[#94A3B8] font-semibold">Em Bitcoin:</span>
          <strong className="text-[#F59E0B] font-black text-sm">
            {isPrivacyMode ? '₿ ••••••' : `₿ ${netWorthBtc.toFixed(6)} BTC`}
          </strong>
        </div>
      </div>
    </Card>
  );
};
