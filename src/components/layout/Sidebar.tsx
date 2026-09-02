import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Target, ShoppingCart, Car, FileSpreadsheet, Calculator, Sparkles, PanelLeftClose, PanelLeftOpen, Calendar, Search, Smartphone, Sliders, Compass, Palette, Keyboard, FileText, Database, ChevronDown, ChevronRight, Activity, LogIn, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user, setUser, setUserProfileModalOpen, setAuthMode, activePage, setActivePage, isSidebarCollapsed, toggleSidebarCollapsed, isMobileMenuOpen, toggleMobileMenu, setCommandPaletteOpen } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'wallets', label: 'Carteiras & Cartões', icon: Wallet },
    { id: 'calendar', label: 'Calendário de Caixa', icon: Calendar },
    { id: 'pantry', label: 'Mercado & Estoque', icon: ShoppingCart },
    { id: 'vehicles', label: 'Veículos & Garagem', icon: Car },
    { id: 'debts', label: 'Financiamentos', icon: CreditCard },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'settings', label: 'Configurações', icon: Sliders },
  ] as const;

  const subSettings = [
    { id: 'score', label: 'Score de Saúde', icon: Activity, action: () => useAppStore.getState().setScoreModalOpen(true) },
    { id: 'whatIf', label: 'Simulador "E Se?"', icon: Compass, action: () => useAppStore.getState().setWhatIfModalOpen(true) },
    { id: 'theme', label: 'Central de Temas', icon: Palette, action: () => useAppStore.getState().setThemeModalOpen(true) },
    { id: 'shortcuts', label: 'Teclas de Atalho', icon: Keyboard, action: () => useAppStore.getState().setShortcutsModalOpen(true) },
    { id: 'receipt', label: 'Gerador de Recibo', icon: FileText, action: () => useAppStore.getState().setReceiptModalOpen(true) },
    { id: 'backup', label: 'Backup & Segurança', icon: Database, action: () => useAppStore.getState().setBackupModalOpen(true) },
  ];

  const handleNavClick = (page: typeof navItems[number]['id']) => {
    setActivePage(page);
    if (page === 'settings') {
      setIsSettingsOpen(true);
    }
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
          className="md:hidden fixed inset-x-0 top-[65px] bottom-0 bg-[#0A0B0E]/80 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      <aside
        className={clsx(
          'bg-[#0D1424]/95 backdrop-blur-xl border-r border-[#2E3B52]/60 flex flex-col justify-between p-3.5 shrink-0 transition-all duration-300 z-40 select-none overflow-y-auto max-h-[calc(100vh-65px)]',
          // Desktop behavior
          'hidden md:flex',
          isSidebarCollapsed ? 'md:w-20 md:items-center' : 'md:w-64',
          // Mobile overlay behavior
          isMobileMenuOpen && '!flex fixed top-[65px] bottom-0 left-0 w-64 shadow-2xl z-40'
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
              const isSettings = item.id === 'settings';

              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      if (isSettings) {
                        handleNavClick('settings');
                        setIsSettingsOpen(!isSettingsOpen);
                      } else {
                        handleNavClick(item.id);
                      }
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={clsx(
                      'flex items-center gap-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer group justify-between',
                      isSidebarCollapsed ? 'md:justify-center md:px-0 w-full px-4' : 'px-4 w-full',
                      isActive
                        ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shadow-md shadow-[#00FF88]/10 font-black'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162032]'
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={clsx('w-5 h-5 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-[#00FF88]' : 'text-[#64748B] group-hover:text-[#F8FAFC]')} />
                      {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">{item.label}</span>}
                    </div>

                    {isSettings && (!isSidebarCollapsed || isMobileMenuOpen) && (
                      <div className="text-[#64748B] group-hover:text-[#00FF88]">
                        {isSettingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    )}
                  </button>

                  {/* Submenu de Configurações */}
                  {isSettings && isSettingsOpen && (!isSidebarCollapsed || isMobileMenuOpen) && (
                    <div className="flex flex-col gap-1 pl-6 pr-1 py-1 border-l-2 border-[#00FF88]/30 ml-4 my-0.5 animate-fadeIn">
                      {subSettings.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setActivePage('settings');
                              sub.action();
                              if (isMobileMenuOpen) toggleMobileMenu();
                            }}
                            className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl text-xs font-bold text-[#94A3B8] hover:text-[#00FF88] hover:bg-[#00FF88]/10 border border-transparent hover:border-[#00FF88]/20 transition-all text-left cursor-pointer group"
                          >
                            <SubIcon className="w-4 h-4 text-[#00FF88] group-hover:scale-110 transition-transform shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
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

          {/* User Profile / Login Card na base da Sidebar */}
          {user ? (
            <button
              onClick={() => {
                setUserProfileModalOpen(true);
                if (isMobileMenuOpen) toggleMobileMenu();
              }}
              title={`Perfil de ${user.name}`}
              className={clsx(
                'p-2 bg-[#162032]/90 border border-[#2E3B52] hover:border-[#00FF88]/50 rounded-xl flex items-center gap-2.5 transition-all text-left group w-full',
                isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : 'justify-between'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#00FF88]/40 shrink-0"
                />
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#00FF88] transition-colors">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] truncate">{user.email}</span>
                  </div>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setUser(null);
                if (isMobileMenuOpen) toggleMobileMenu();
              }}
              title="Entrar na sua Conta NossoBolso"
              className={clsx(
                'p-2 bg-[#162032]/80 border border-[#2E3B52] hover:border-[#00FF88] rounded-xl flex items-center gap-2 text-xs font-bold text-[#F8FAFC] transition-all group w-full',
                isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#00FF88] group-hover:scale-110 transition-transform shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Entrar / Cadastrar</span>}
              </div>
            </button>
          )}

          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="px-2 py-1 flex items-center justify-between text-[10px] text-[#64748B] w-full">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00FF88] shrink-0" />
                <span className="font-extrabold text-[#F8FAFC]">NossoBolso OS v2.0</span>
              </div>
              <span className="text-[#00FF88] font-semibold">Online</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
