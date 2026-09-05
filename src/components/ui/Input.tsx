import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, name, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const inputName = name || inputId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-[#64748B]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={inputName}
            className={twMerge(
              clsx(
                'w-full bg-[#162032] border border-[#2E3B52] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] transition-all duration-200 focus:outline-none focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]',
                icon && 'pl-10',
                error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
