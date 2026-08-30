import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Target, ShoppingCart, Car, FileSpreadsheet, Calculator, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebarCollapsed, isMobileMenuOpen, toggleMobileMenu } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'wallets', label: 'Carteiras', icon: Wallet },
    { id: 'debts', label: 'Financiamentos', icon: CreditCard },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'pantry', label: 'Mercado & Estoque', icon: ShoppingCart },
    { id: 'vehicles', label: 'Veículos & Garagem', icon: Car },
    { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
  ] as const;

  const handleNavClick = (page: typeof navItems[number]['id']) => {
    setActivePage(page);
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  return (
    <>
      {/* Overlay Backdrop para Mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={toggleMobileMenu}
          className="md:hidden fixed inset-0 bg-[#0A0B0E]/80 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <aside
        className={clsx(
          'bg-[#0D1424]/95 backdrop-blur-xl border-r border-[#2E3B52]/60 flex flex-col justify-between p-3.5 shrink-0 transition-all duration-300 z-50 select-none',
          // Desktop behavior
          'hidden md:flex',
          isSidebarCollapsed ? 'md:w-20 md:items-center' : 'md:w-64',
          // Mobile overlay behavior
          isMobileMenuOpen && '!flex fixed inset-y-0 left-0 w-64 shadow-2xl top-[65px]'
        )}
      >
        <div className="w-full flex flex-col gap-2">
          {/* Cabeçalho Discreto da Sidebar com Botão de Mapeamento/Recolhimento */}
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-black uppercase tracking-wider text-[#64748B]">
              <span>Navegação</span>
              <button
                onClick={toggleSidebarCollapsed}
                className="p-1 rounded-lg hover:bg-[#00FF88]/15 hover:text-[#00FF88] text-[#64748B] transition-all cursor-pointer"
                title="Recolher Sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-[#00FF88]" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={clsx(
                    'flex items-center gap-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer group',
                    isSidebarCollapsed ? 'md:justify-center md:px-0 w-full px-4' : 'px-4 w-full',
                    isActive
                      ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10 font-black'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
                  )}
                >
                  <Icon className={clsx('w-5 h-5 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-[#00FF88]' : 'text-[#64748B] group-hover:text-[#F8FAFC]')} />
                  {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Elegante com Alternador de Expandir/Recolher */}
        <div className="w-full pt-2">
          {isSidebarCollapsed && !isMobileMenuOpen ? (
            <button
              onClick={toggleSidebarCollapsed}
              className="w-full p-2.5 bg-[#162032] border border-[#2E3B52] hover:border-[#00FF88]/40 text-[#00FF88] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Expandir Menu Lateral"
            >
              <PanelLeftOpen className="w-5 h-5 text-[#00FF88]" />
            </button>
          ) : (
            <div className="p-3 bg-[#162032]/80 border border-[#2E3B52] rounded-xl flex items-center justify-between text-xs text-[#94A3B8] w-full">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00FF88] shrink-0" />
                <span className="font-extrabold text-[#F8FAFC] text-[11px]">Finance OS v2.0</span>
              </div>

              <button
                onClick={toggleSidebarCollapsed}
                className="p-1 rounded-lg hover:bg-[#00FF88]/15 hover:text-[#00FF88] text-[#64748B] transition-all cursor-pointer"
                title="Recolher Menu Lateral"
              >
                <PanelLeftClose className="w-4 h-4 text-[#00FF88]" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
