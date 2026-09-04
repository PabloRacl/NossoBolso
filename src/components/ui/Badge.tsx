import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-full transition-colors border select-none';

  const variants = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/10',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-sm shadow-purple-500/10',
    neutral: 'bg-[#1E293B]/80 text-[#94A3B8] border-[#2E3B52]/60',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    purple: 'bg-purple-400',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
