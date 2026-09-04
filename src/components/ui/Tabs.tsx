import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
  };

  return (
    <div
      className={twMerge(
        variant === 'pills'
          ? 'flex flex-wrap items-center gap-1.5 p-1 bg-[#101726]/80 backdrop-blur-md rounded-2xl border border-[#2E3B52]/50'
          : 'flex items-center gap-2 border-b border-[#2E3B52]/50',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative inline-flex items-center justify-center font-bold rounded-xl transition-colors focus:outline-none select-none',
              sizes[size],
              isActive
                ? 'text-[#00FF88]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/40'
            )}
          >
            {isActive && variant === 'pills' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-[#00FF88]/10 border border-[#00FF88]/40 rounded-xl"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}

            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF88] shadow-sm shadow-[#00FF88]/50"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-extrabold',
                    isActive
                      ? 'bg-[#00FF88] text-[#0B0F19]'
                      : 'bg-[#2E3B52] text-[#94A3B8]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
