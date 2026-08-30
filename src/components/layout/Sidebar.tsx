import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Target, ShoppingCart, Car, FileSpreadsheet, Calculator, Sparkles, PanelLeftClose, PanelLeftOpen, Calendar, Search, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebarCollapsed, isMobileMenuOpen, toggleMobileMenu, setCommandPaletteOpen } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'calendar', label: 'Calendário de Caixa', icon: Calendar },
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
          {/* Cabeçalho Permanente da Sidebar com Botão de Recolhimento/Expansão */}
          <div className={clsx(
            'flex items-center justify-between py-1.5 mb-1 text-[11px] font-black uppercase tracking-wider text-[#64748B] w-full',
            isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : 'px-3'
          )}>
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Navegação</span>}
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-xl hover:bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 transition-all cursor-pointer shadow-sm hover:scale-105"
              title={isSidebarCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
            >
              {isSidebarCollapsed && !isMobileMenuOpen ? (
                <PanelLeftOpen className="w-4 h-4 text-[#00FF88]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[#00FF88]" />
              )}
            </button>
          </div>

          {/* Botão de Busca Rápida (Ctrl+K) posicionado diretamente ABAIXO de NAVEGAÇÃO e ACIMA de Dashboard */}
          <div className="w-full mb-1">
            <button
              onClick={() => {
                setCommandPaletteOpen(true);
                if (isMobileMenuOpen) toggleMobileMenu();
              }}
              title="Abrir Busca Rápida (Ctrl + K)"
              className={clsx(
                'flex items-center gap-3 py-2.5 bg-[#162032] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#00FF88]/40 transition-all group cursor-pointer w-full',
                isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : 'px-3.5 justify-between'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#00FF88] group-hover:scale-110 transition-transform shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Buscar...</span>}
              </div>

              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <kbd className="px-1.5 py-0.5 bg-[#0D1424] border border-[#2E3B52] rounded text-[10px] font-mono text-[#00FF88] shrink-0">
                  Ctrl K
                </kbd>
              )}
            </button>
          </div>

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

        {/* Rodapé Elegante com Botão de Instalar App no Celular */}
        <div className="w-full pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              useAppStore.getState().setPwaModalOpen(true);
              if (isMobileMenuOpen) toggleMobileMenu();
            }}
            title="Instalar NossoBolso no Celular / Tablet"
            className={clsx(
              'flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#00FF88]/15 to-[#06B6D4]/15 border border-[#00FF88]/40 hover:border-[#00FF88] rounded-xl text-xs font-black text-[#00FF88] transition-all cursor-pointer shadow-md shadow-[#00FF88]/10 group w-full',
              isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : 'justify-between'
            )}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00FF88] group-hover:scale-110 transition-transform shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Instalar no Celular</span>}
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#00FF88]/20 px-1.5 py-0.5 rounded text-[#00FF88]">PWA</span>}
          </button>

          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="p-2.5 bg-[#162032]/80 border border-[#2E3B52] rounded-xl flex items-center justify-between text-xs text-[#94A3B8] w-full">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00FF88] shrink-0" />
                <span className="font-extrabold text-[#F8FAFC] text-[11px]">Finance OS v2.0</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
