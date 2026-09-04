import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'emerald',
  size = 'md',
  showLabel = false,
  label,
  className,
  barClassName,
  ...props
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const containerSizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    emerald: 'bg-gradient-to-r from-emerald-500 to-[#00FF88] shadow-sm shadow-[#00FF88]/20',
    cyan: 'bg-gradient-to-r from-blue-500 to-[#06B6D4] shadow-sm shadow-[#06B6D4]/20',
    amber: 'bg-gradient-to-r from-yellow-500 to-[#F59E0B] shadow-sm shadow-[#F59E0B]/20',
    rose: 'bg-gradient-to-r from-red-500 to-[#FF4D6D] shadow-sm shadow-[#FF4D6D]/20',
    purple: 'bg-gradient-to-r from-indigo-500 to-[#A855F7] shadow-sm shadow-[#A855F7]/20',
    gradient: 'bg-gradient-to-r from-[#00FF88] via-[#06B6D4] to-[#A855F7] shadow-sm shadow-[#00FF88]/20',
  };

  return (
    <div className={twMerge('w-full flex flex-col gap-1.5', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8]">
          <span>{label || 'Progresso'}</span>
          <span className="font-bold text-[#F8FAFC]">{clampedPercentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-[#1E293B]/80 rounded-full overflow-hidden p-0.5 border border-[#2E3B52]/40', containerSizes[size])}>
        <div
          className={twMerge(
            clsx(
              'h-full rounded-full transition-all duration-500 ease-out',
              variants[variant],
              barClassName
            )
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};
