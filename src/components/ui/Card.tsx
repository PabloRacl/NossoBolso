import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string; // ex: '#00FF88', '#10B981', '#FF4D6D', '#F59E0B', '#06B6D4'
  onClick?: () => void;
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

export const Card: React.FC<CardProps> = ({ children, className, glow, glowColor = '#00FF88', onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      variants={cardVariants}
      className={twMerge(
        clsx(
          'bg-[#162032]/85 border border-[#2E3B52] rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl shadow-xl hover:border-[#3B4C6A] relative overflow-hidden',
          className
        )
      )}
    >
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, ${glowColor}1A 0%, rgba(0,0,0,0) 70%)`
          }}
        />
      )}
      {children}
    </motion.div>
  );
};
