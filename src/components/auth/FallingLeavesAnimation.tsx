import React, { useEffect, useRef } from 'react';

export type WeatherMode = 'leaves' | 'gold_rain' | 'storm';

interface FallingLeavesProps {
  mode?: WeatherMode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: 'bg' | 'md' | 'fg';
  rotation: number;
  rotationSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  leafType: 'emerald' | 'gold' | 'mint';
  isMorphed: boolean;
  morphProgress: number;
  opacity: number;
}

interface TrapLeafState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  isTrapped: boolean;
  trapTimer: number;
  stolenText: string | null;
  stolenTextY: number;
  stolenTextOpacity: number;
  prisonerSway: number;
}

interface LightningFlash {
  active: boolean;
  x: number;
  opacity: number;
  timer: number;
}

export const FallingLeavesAnimation: React.FC<FallingLeavesProps> = ({ mode = 'leaves' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse Tracking
    let mouseX = -1000;
    let mouseY = -1000;
    let prevMouseX = -1000;
    let prevMouseY = -1000;
    let mouseVx = 0;
    let mouseVy = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prevMouseX !== -1000) {
        mouseVx = (e.clientX - prevMouseX) * 0.4;
        mouseVy = (e.clientY - prevMouseY) * 0.4;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // PARTICLES (Adjusted per weather mode)
    const PARTICLE_COUNT = mode === 'gold_rain' ? 35 : mode === 'storm' ? 30 : 20;
    const particles: Particle[] = [];

    const createParticle = (resetAtTop = false): Particle => {
      const types: Array<'emerald' | 'gold' | 'mint'> = ['emerald', 'gold', 'mint'];
      const depthRand = Math.random();
      
      let depth: 'bg' | 'md' | 'fg' = 'md';
      let size = 18;
      let opacity = 0.8;
      let vy = 1.2;

      if (mode === 'gold_rain') {
        size = 14 + Math.random() * 16;
        opacity = 0.7 + Math.random() * 0.3;
        vy = 2.5 + Math.random() * 2.5; // Fast gold rain fall
      } else if (mode === 'storm') {
        size = 12 + Math.random() * 18;
        opacity = 0.6 + Math.random() * 0.4;
        vy = 3.0 + Math.random() * 3.0; // Fast storm fall
      } else {
        if (depthRand < 0.35) {
          depth = 'bg';
          size = 10 + Math.random() * 5;
          opacity = 0.35 + Math.random() * 0.2;
          vy = 0.7 + Math.random() * 0.5;
        } else if (depthRand < 0.8) {
          depth = 'md';
          size = 18 + Math.random() * 6;
          opacity = 0.7 + Math.random() * 0.2;
          vy = 1.2 + Math.random() * 0.8;
        } else {
          depth = 'fg';
          size = 28 + Math.random() * 8;
          opacity = 0.9 + Math.random() * 0.1;
          vy = 1.6 + Math.random() * 0.8;
        }
      }

      const initialVx = mode === 'storm' ? 2.5 + Math.random() * 3.5 : (Math.random() - 0.5) * 0.6;

      return {
        x: Math.random() * width,
        y: resetAtTop ? -30 - Math.random() * 60 : Math.random() * height,
        vx: initialVx,
        vy,
        size,
        depth,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * (mode === 'storm' ? 0.12 : 0.04),
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: 0.02 + Math.random() * 0.03,
        swayFreq: 0.008 + Math.random() * 0.015,
        swayAmp: 0.5 + Math.random() * 0.9,
        swayPhase: Math.random() * Math.PI * 2,
        leafType: types[Math.floor(Math.random() * types.length)],
        isMorphed: mode === 'gold_rain', // In gold rain mode, all particles are gold/money from the start!
        morphProgress: mode === 'gold_rain' ? 1 : 0,
        opacity,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }

    // TRAP LEAF / PRISON CELL STATE
    const trapLeaf: TrapLeafState = {
      active: false,
      x: -100,
      y: -100,
      vx: 0.5,
      vy: 1.1,
      size: 26,
      rotation: 0,
      rotationSpeed: 0.03,
      swayPhase: 0,
      swayFreq: 0.01,
      swayAmp: 0.8,
      isTrapped: false,
      trapTimer: 0,
      stolenText: null,
      stolenTextY: 0,
      stolenTextOpacity: 0,
      prisonerSway: 0,
    };

    let nextTrapTime = Date.now() + 4000;

    const spawnTrapLeaf = () => {
      trapLeaf.active = true;
      trapLeaf.x = Math.random() * width;
      trapLeaf.y = -30;
      trapLeaf.vx = (Math.random() - 0.5) * 0.7;
      trapLeaf.vy = 1.1 + Math.random() * 0.6;
      trapLeaf.size = 26 + Math.random() * 6;
      trapLeaf.isTrapped = false;
      trapLeaf.trapTimer = 0;
      trapLeaf.stolenText = null;
      trapLeaf.prisonerSway = 0;
    };

    // LIGHTNING FLASH STATE FOR STORM MODE
    const lightning: LightningFlash = {
      active: false,
      x: 0,
      opacity: 0,
      timer: 0,
    };

    let nextLightningTime = Date.now() + 3000;

    // DRAW LEAF
    const drawPremiumLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      type: 'emerald' | 'gold' | 'mint',
      flipScale: number
    ) => {
      const colors = {
        emerald: { leftFill: '#10B981', rightFill: '#059669', stroke: '#34D399', stem: '#047857' },
        gold: { leftFill: '#F59E0B', rightFill: '#D97706', stroke: '#FBBF24', stem: '#B45309' },
        mint: { leftFill: '#34D399', rightFill: '#10B981', stroke: '#6EE7B7', stem: '#059669' },
      };
      const col = colors[type];

      c.save();
      c.scale(flipScale, 1);

      c.fillStyle = col.leftFill;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.fill();

      c.fillStyle = col.rightFill;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.85, -size * 0.4, size * 0.7, size * 0.5, 0, size);
      c.fill();

      c.strokeStyle = col.stroke;
      c.lineWidth = size * 0.06;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.bezierCurveTo(size * 0.7, size * 0.5, size * 0.85, -size * 0.4, 0, -size);
      c.stroke();

      c.strokeStyle = col.stem;
      c.lineWidth = size * 0.08;
      c.beginPath();
      c.moveTo(0, -size * 0.9);
      c.lineTo(0, size * 1.15);
      c.stroke();

      c.restore();
    };

    // DRAW MONEY NOTE / GOLD COIN
    const drawPremiumMoney = (
      c: CanvasRenderingContext2D,
      size: number,
      flipScale: number,
      isGoldCoinMode = false
    ) => {
      c.save();
      c.scale(flipScale, 1);

      if (isGoldCoinMode) {
        // GOLD COIN (🪙)
        c.shadowColor = '#F59E0B';
        c.shadowBlur = 14;

        c.fillStyle = '#F59E0B';
        c.strokeStyle = '#FEF08A';
        c.lineWidth = 2.5;

        c.beginPath();
        c.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.shadowBlur = 0;
        c.strokeStyle = '#D97706';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 0, size * 0.52, 0, Math.PI * 2);
        c.stroke();

        c.fillStyle = '#78350F';
        c.font = `bold ${Math.round(size * 0.65)}px sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('$', 0, 1);
      } else {
        // BANKNOTE CARD (💵)
        const w = size * 1.9;
        const h = size * 1.15;

        c.shadowColor = '#10B981';
        c.shadowBlur = 12;

        c.fillStyle = '#059669';
        c.strokeStyle = '#34D399';
        c.lineWidth = 2.5;

        c.beginPath();
        c.roundRect(-w / 2, -h / 2, w, h, 7);
        c.fill();
        c.stroke();

        c.shadowBlur = 0;
        c.strokeStyle = '#A7F3D0';
        c.lineWidth = 1;
        c.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);

        c.fillStyle = '#F59E0B';
        c.strokeStyle = '#FEF08A';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 0, size * 0.38, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = '#78350F';
        c.font = `bold ${Math.round(size * 0.55)}px sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('$', 0, 1);
      }

      c.restore();
    };

    // DRAW GOLDEN TRAP LEAF
    const drawGoldenTrapLeaf = (c: CanvasRenderingContext2D, size: number) => {
      c.save();
      c.shadowColor = '#F59E0B';
      c.shadowBlur = 18;

      c.fillStyle = '#FBBF24';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.fill();

      c.fillStyle = '#D97706';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.85, -size * 0.4, size * 0.7, size * 0.5, 0, size);
      c.fill();

      c.strokeStyle = '#FEF08A';
      c.lineWidth = size * 0.08;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.bezierCurveTo(size * 0.7, size * 0.5, size * 0.85, -size * 0.4, 0, -size);
      c.stroke();

      c.strokeStyle = '#B45309';
      c.lineWidth = size * 0.09;
      c.beginPath();
      c.moveTo(0, -size * 0.9);
      c.lineTo(0, size * 1.15);
      c.stroke();

      c.restore();
    };

    // DRAW ANIMATED PRISON CELL WITH PRISONER
    const drawPrisonCellWithPrisoner = (
      c: CanvasRenderingContext2D,
      size: number,
      prisonerSway: number
    ) => {
      const w = size * 2.2;
      const h = size * 2.6;

      c.save();
      c.shadowColor = '#EF4444';
      c.shadowBlur = 25;

      c.fillStyle = '#111827';
      c.strokeStyle = '#DC2626';
      c.lineWidth = 3.5;

      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, 14);
      c.fill();
      c.stroke();

      c.shadowBlur = 0;

      const shakeX = Math.sin(prisonerSway * 1.8) * 3.5;
      const headY = -h * 0.15 + Math.cos(prisonerSway * 2.2) * 2;

      c.fillStyle = '#FCA5A5';
      c.beginPath();
      c.arc(shakeX, headY, size * 0.35, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#111827';
      c.beginPath();
      c.arc(shakeX - 5, headY - 2, 2.5, 0, Math.PI * 2);
      c.arc(shakeX + 5, headY - 2, 2.5, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#991B1B';
      c.beginPath();
      c.arc(shakeX, headY + 5, 4, 0, Math.PI);
      c.fill();

      c.fillStyle = '#EF4444';
      c.beginPath();
      c.roundRect(shakeX - size * 0.45, headY + size * 0.35, size * 0.9, size * 0.9, 6);
      c.fill();

      c.fillStyle = '#FFFFFF';
      c.fillRect(shakeX - size * 0.45, headY + size * 0.5, size * 0.9, 3);
      c.fillRect(shakeX - size * 0.45, headY + size * 0.7, size * 0.9, 3);

      c.fillStyle = '#FCA5A5';
      c.beginPath();
      c.arc(-w * 0.2, h * 0.05 + shakeX * 0.5, 4, 0, Math.PI * 2);
      c.arc(w * 0.2, h * 0.05 - shakeX * 0.5, 4, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#94A3B8';
      c.lineWidth = 3.5;
      const barPositions = [-w * 0.32, -w * 0.16, 0, w * 0.16, w * 0.32];

      barPositions.forEach((bx) => {
        c.beginPath();
        c.moveTo(bx, -h / 2 + 5);
        c.lineTo(bx, h / 2 - 5);
        c.stroke();
      });

      c.fillStyle = '#DC2626';
      c.strokeStyle = '#FEE2E2';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(w * 0.25, h * 0.1, 7, Math.PI, 0);
      c.stroke();

      c.beginPath();
      c.roundRect(w * 0.25 - 8, h * 0.1, 16, 14, 3);
      c.fill();
      c.stroke();

      c.restore();
    };

    // Main Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      // Handle Storm Mode Lightning Flash
      if (mode === 'storm') {
        if (!lightning.active && now > nextLightningTime) {
          lightning.active = true;
          lightning.x = Math.random() * width;
          lightning.opacity = 0.4 + Math.random() * 0.4;
          lightning.timer = 0;
          nextLightningTime = now + 2500 + Math.random() * 4000;
        }

        if (lightning.active) {
          lightning.timer++;
          lightning.opacity -= 0.04;

          // Lightning Background Ambient Glow
          ctx.save();
          ctx.fillStyle = `rgba(168, 85, 247, ${Math.max(lightning.opacity * 0.2, 0)})`;
          ctx.fillRect(0, 0, width, height);

          // Lightning Bolt Line
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(lightning.opacity, 0)})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 15;

          ctx.beginPath();
          let lx = lightning.x;
          let ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < height * 0.7) {
            lx += (Math.random() - 0.5) * 40;
            ly += 20 + Math.random() * 30;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
          ctx.restore();

          if (lightning.opacity <= 0) {
            lightning.active = false;
          }
        }
      }

      // Check Trap Leaf Spawn (only in leaves mode)
      if (mode === 'leaves' && !trapLeaf.active && now > nextTrapTime) {
        spawnTrapLeaf();
        nextTrapTime = now + 10000 + Math.random() * 8000;
      }

      // Dampen mouse velocity
      mouseVx *= 0.92;
      mouseVy *= 0.92;

      // Render Regular Particles
      particles.sort((a, b) => {
        const order = { bg: 1, md: 2, fg: 3 };
        return order[a.depth] - order[b.depth];
      });

      particles.forEach((p) => {
        p.swayPhase += p.swayFreq;
        const sway = Math.sin(p.swayPhase) * p.swayAmp;
        p.x += p.vx + sway;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.flipAngle += p.flipSpeed;

        const flipScale = Math.cos(p.flipAngle);

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxWindDist = mode === 'storm' ? 260 : 200;

        if (dist < maxWindDist) {
          const force = (1 - dist / maxWindDist) * (mode === 'storm' ? 14 : p.depth === 'fg' ? 10 : 6);
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force + mouseVx * force * 0.4;
          p.y += Math.sin(angle) * force + mouseVy * force * 0.4;
          p.rotation += (Math.random() - 0.5) * 0.15;
        }

        if (mode === 'leaves') {
          const morphThreshold = height * 0.55;
          if (p.y > morphThreshold && !p.isMorphed) {
            p.isMorphed = true;
          }

          if (p.isMorphed && p.morphProgress < 1) {
            p.morphProgress = Math.min(p.morphProgress + 0.05, 1);
          }
        }

        if (p.y > height + 50 || p.x < -80 || p.x > width + 80) {
          Object.assign(p, createParticle(true));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (mode === 'gold_rain') {
          ctx.globalAlpha = p.opacity;
          drawPremiumMoney(ctx, p.size, flipScale, true);
        } else if (p.morphProgress < 0.5) {
          ctx.globalAlpha = p.opacity * (1 - p.morphProgress);
          drawPremiumLeaf(ctx, p.size, p.leafType, flipScale);
        } else {
          ctx.globalAlpha = p.opacity * p.morphProgress;
          drawPremiumMoney(ctx, p.size, flipScale, false);
        }

        ctx.restore();
      });

      // RENDER FINANCIAL TRAP LEAF / PRISON CELL (leaves mode only)
      if (mode === 'leaves' && trapLeaf.active) {
        trapLeaf.swayPhase += trapLeaf.swayFreq;
        const sway = Math.sin(trapLeaf.swayPhase) * trapLeaf.swayAmp;
        trapLeaf.x += trapLeaf.vx + sway;
        trapLeaf.y += trapLeaf.vy;
        trapLeaf.rotation += trapLeaf.rotationSpeed;
        trapLeaf.prisonerSway += 0.15;

        const tdx = mouseX - trapLeaf.x;
        const tdy = mouseY - trapLeaf.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

        if (tdist < 52 && !trapLeaf.isTrapped) {
          trapLeaf.isTrapped = true;
          trapLeaf.trapTimer = 0;
          const trapLosses = ['-R$ 250,00', '-R$ 500,00', '-R$ 750,00', '-R$ 1.500,00'];
          trapLeaf.stolenText = trapLosses[Math.floor(Math.random() * trapLosses.length)];
          trapLeaf.stolenTextY = trapLeaf.y - 30;
          trapLeaf.stolenTextOpacity = 1.0;
        }

        ctx.save();
        ctx.translate(trapLeaf.x, trapLeaf.y);
        if (!trapLeaf.isTrapped) {
          ctx.rotate(trapLeaf.rotation);
          drawGoldenTrapLeaf(ctx, trapLeaf.size);
        } else {
          drawPrisonCellWithPrisoner(ctx, trapLeaf.size, trapLeaf.prisonerSway);
        }
        ctx.restore();

        if (trapLeaf.isTrapped) {
          trapLeaf.trapTimer++;
          trapLeaf.stolenTextY -= 1.6;
          trapLeaf.stolenTextOpacity -= 0.02;

          if (trapLeaf.stolenText && trapLeaf.stolenTextOpacity > 0) {
            ctx.save();
            ctx.fillStyle = '#EF4444';
            ctx.shadowColor = '#DC2626';
            ctx.shadowBlur = 14;
            ctx.font = 'black 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.max(trapLeaf.stolenTextOpacity, 0);
            ctx.fillText(`🔒 PRESO NA ARMADILHA: ${trapLeaf.stolenText}`, trapLeaf.x, trapLeaf.stolenTextY);
            ctx.restore();
          }

          if (trapLeaf.trapTimer > 50) {
            trapLeaf.active = false;
          }
        }

        if (
          trapLeaf.y > height + 60 ||
          trapLeaf.x < -80 ||
          trapLeaf.x > width + 80
        ) {
          trapLeaf.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
    />
  );
};
