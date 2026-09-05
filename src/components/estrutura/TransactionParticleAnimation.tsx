import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../estado/useAppStore';
import { formatBRL } from '../../utilidades/formatters';

export const TransactionParticleAnimation: React.FC = () => {
  const { activeParticleAnimation, isPrivacyMode } = useAppStore();

  if (!activeParticleAnimation) return null;

  const isIncome = activeParticleAnimation.type === 'income';
  const amount = activeParticleAnimation.amount || 0;
  const title = activeParticleAnimation.title;

  // Generate 14 particles with random trajectories
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const randomAngle = (i / 14) * 360 + (Math.random() * 30 - 15);
    const rad = (randomAngle * Math.PI) / 180;
    const distance = 160 + Math.random() * 220;
    const endX = Math.cos(rad) * distance;
    const endY = isIncome ? -180 - Math.random() * 250 : 180 + Math.random() * 250;
    const scale = 0.8 + Math.random() * 0.7;
    const rotation = Math.random() * 720 - 360;

    const incomeEmojis = ['💰', '🪙', '✨', '🌟', '💎', '🟢', '⚡'];
    const expenseEmojis = ['💸', '💔', '🔻', '📉', '🔴', '⚡', '💥'];
    const emoji = isIncome
      ? incomeEmojis[i % incomeEmojis.length]
      : expenseEmojis[i % expenseEmojis.length];

    return {
      id: i,
      endX,
      endY,
      scale,
      rotation,
      emoji,
      delay: Math.random() * 0.15,
    };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
        {/* Full-screen backdrop pulse glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.8 }}
          className={`absolute inset-0 ${
            isIncome
              ? 'bg-radial from-[#00FF88]/20 via-transparent to-transparent'
              : 'bg-radial from-[#FF4D6D]/20 via-transparent to-transparent'
          }`}
        />

        {/* Central HUD Notification Badge */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: isIncome ? 50 : -50 }}
          animate={{
            scale: [0.3, 1.1, 1],
            opacity: [0, 1, 1, 0],
            y: isIncome ? [50, -20, -40] : [-50, 20, 40],
          }}
          transition={{ duration: 2.2, times: [0, 0.2, 0.8, 1] }}
          className={`px-6 py-4 rounded-2xl border-2 backdrop-blur-2xl shadow-2xl flex items-center gap-4 z-10 ${
            isIncome
              ? 'bg-[#091510]/95 border-[#00FF88] shadow-[0_0_50px_rgba(0,255,136,0.5)]'
              : 'bg-[#18090C]/95 border-[#FF4D6D] shadow-[0_0_50px_rgba(255,77,109,0.5)]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
              isIncome
                ? 'bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88] animate-bounce'
                : 'bg-[#FF4D6D]/20 border-[#FF4D6D] text-[#FF4D6D] animate-pulse'
            }`}
          >
            {isIncome ? '💰' : '💸'}
          </div>

          <div className="flex flex-col">
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isIncome ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
              }`}
            >
              {isIncome ? '✨ Entrada Confirmada' : '🔥 Saída Registrada'}
            </span>
            <span className="text-xl font-black text-[#F8FAFC]">
              {title ? title : isIncome ? 'Receita Incluída' : 'Despesa Registrada'}
            </span>
            {amount > 0 && (
              <span
                className={`text-base font-extrabold mt-0.5 ${
                  isIncome ? 'text-[#00FF88]' : 'text-[#FF4D6D]'
                }`}
              >
                {isIncome ? '+' : '-'} {formatBRL(amount, isPrivacyMode)}
              </span>
            )}
          </div>
        </motion.div>

        {/* 14 Flying Particles / Coins Animation */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
            animate={{
              x: p.endX,
              y: p.endY,
              scale: [0, p.scale, p.scale * 1.2, 0],
              opacity: [0, 1, 1, 0],
              rotate: p.rotation,
            }}
            transition={{
              duration: 1.8,
              delay: p.delay,
              ease: 'easeOut',
            }}
            className="absolute text-3xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          >
            {p.emoji}
          </motion.div>
        ))}

        {/* Laser Ring Shockwave Effect */}
        <motion.div
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`absolute w-40 h-40 rounded-full border-4 ${
            isIncome ? 'border-[#00FF88] shadow-[0_0_40px_#00FF88]' : 'border-[#FF4D6D] shadow-[0_0_40px_#FF4D6D]'
          }`}
        />
      </div>
    </AnimatePresence>
  );
};
