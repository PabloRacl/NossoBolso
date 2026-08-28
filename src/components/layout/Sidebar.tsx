import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Target, FileSpreadsheet, Calculator, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'wallets', label: 'Carteiras', icon: Wallet },
    { id: 'debts', label: 'Financiamentos', icon: CreditCard },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
  ] as const;

  return (
    <aside className="w-64 bg-[#0D1424]/90 backdrop-blur-xl border-r border-[#2E3B52]/60 flex flex-col justify-between p-4 min-h-screen shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00FF88] to-[#06B6D4] flex items-center justify-center text-xl shadow-lg shadow-[#00FF88]/20">
            👛
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-[#F8FAFC]">Nosso Bolso</h1>
            <span className="text-xs font-semibold text-[#00FF88] tracking-widest uppercase">Finance OS</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200',
                  isActive
                    ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10 font-bold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-[#00FF88]' : 'text-[#64748B]')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#162032]/80 border border-[#2E3B52] rounded-xl flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#00FF88]" />
        <span className="text-xs font-medium text-[#94A3B8]">v2.0 — Nosso Bolso Engine</span>
      </div>
    </aside>
  );
};
