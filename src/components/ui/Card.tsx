import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#162032]/85 border border-[#2E3B52] rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl shadow-xl hover:border-[#3B4C6A]',
          glow && 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#00FF88]/10 before:to-transparent before:pointer-events-none',
          className
        )
      )}
    >
      {children}
    </div>
  );
};
