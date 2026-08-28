import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

// Variantes com efeito "onda do mar" (suavidade líquida, spring leve, blur dissipando)
const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)'
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 70,
      damping: 14,
      mass: 0.8
    }
  }
};

export const Card: React.FC<CardProps> = ({ children, className, glow }) => {
  return (
    <motion.div
      variants={cardVariants}
      className={twMerge(
        clsx(
          'bg-[#162032]/85 border border-[#2E3B52] rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl shadow-xl hover:border-[#3B4C6A]',
          glow && 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#00FF88]/10 before:to-transparent before:pointer-events-none',
          className
        )
      )}
    >
      {children}
    </motion.div>
  );
};
