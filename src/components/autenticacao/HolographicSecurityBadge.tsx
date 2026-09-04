import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, HardDrive, CheckCircle2 } from 'lucide-react';

export const HolographicSecurityBadge: React.FC = () => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -y * 0.15, y: x * 0.15 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      style={{ perspective: 800 }}
      className="w-full pt-4 cursor-pointer select-none"
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] backdrop-blur-xl transition-all group overflow-hidden"
      >
        {/* Holographic Light Beam Diagonal Sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                DISPOSITIVO 100% BLINDADO
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
              Dados armazenados localmente e criptografados.
            </p>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase shrink-0">
            Seguro
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
