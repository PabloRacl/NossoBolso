import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, name, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const selectName = name || selectId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={selectName}
          className={twMerge(
            clsx(
              'w-full bg-[#162032] border border-[#2E3B52] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] transition-all duration-200 focus:outline-none focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] cursor-pointer',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500',
              className
            )
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#162032] text-[#F8FAFC]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
