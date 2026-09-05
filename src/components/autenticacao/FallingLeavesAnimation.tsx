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

interface UmbrellaFlyer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swayFreq: number;
  umbrellaColor: string;
  coatColor: string;
}

interface PacmanEntity {
  active: boolean;
  type: 'yellow' | 'red' | 'cyan';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  direction: 1 | -1;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  isTriggered: boolean;
  triggerTimer: number;
  stolenText: string | null;
  stolenTextY: number;
  stolenTextOpacity: number;
  mouthPhase: number;
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
        mouseVx = (e.clientX - prevMouseX) * 0.2;
        mouseVy = (e.clientY - prevMouseY) * 0.2;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // PARTICLES (Ajustados para queda ultra-suave sem cansar a vista)
    const PARTICLE_COUNT = mode === 'gold_rain' ? 30 : mode === 'storm' ? 22 : 18;
    const particles: Particle[] = [];

    const createParticle = (resetAtTop = false): Particle => {
      const types: Array<'emerald' | 'gold' | 'mint'> = ['emerald', 'gold', 'mint'];
      const depthRand = Math.random();
      
      let depth: 'bg' | 'md' | 'fg' = 'md';
      let size = 18;
      let opacity = 0.8;
      let vy = 0.6;

      if (mode === 'gold_rain') {
        size = 14 + Math.random() * 16;
        opacity = 0.7 + Math.random() * 0.3;
        vy = 0.5 + Math.random() * 0.45;
      } else if (mode === 'storm') {
        size = 12 + Math.random() * 18;
        opacity = 0.6 + Math.random() * 0.4;
        vy = 0.7 + Math.random() * 0.55;
      } else {
        if (depthRand < 0.35) {
          depth = 'bg';
          size = 10 + Math.random() * 5;
          opacity = 0.35 + Math.random() * 0.2;
          vy = 0.35 + Math.random() * 0.25;
        } else if (depthRand < 0.8) {
          depth = 'md';
          size = 18 + Math.random() * 6;
          opacity = 0.7 + Math.random() * 0.2;
          vy = 0.5 + Math.random() * 0.35;
        } else {
          depth = 'fg';
          size = 28 + Math.random() * 8;
          opacity = 0.9 + Math.random() * 0.1;
          vy = 0.7 + Math.random() * 0.4;
        }
      }

      const initialVx = mode === 'storm' ? 0.8 + Math.random() * 0.8 : (Math.random() - 0.5) * 0.4;

      return {
        x: Math.random() * width,
        y: resetAtTop ? -30 - Math.random() * 60 : Math.random() * height,
        vx: initialVx,
        vy,
        size,
        depth,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * (mode === 'storm' ? 0.03 : 0.02),
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: 0.01 + Math.random() * 0.015,
        swayFreq: 0.005 + Math.random() * 0.008,
        swayAmp: 0.4 + Math.random() * 0.6,
        swayPhase: Math.random() * Math.PI * 2,
        leafType: types[Math.floor(Math.random() * types.length)],
        isMorphed: mode === 'gold_rain',
        morphProgress: mode === 'gold_rain' ? 1 : 0,
        opacity,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }

    // FLYING PEOPLE WITH UMBRELLAS FOR STORM MODE
    const umbrellaFlyers: UmbrellaFlyer[] = [];
    if (mode === 'storm') {
      const flyerColors = [
        { umbrella: '#EF4444', coat: '#3B82F6' },
        { umbrella: '#F59E0B', coat: '#10B981' },
        { umbrella: '#A855F7', coat: '#EC4899' },
        { umbrella: '#06B6D4', coat: '#F97316' },
        { umbrella: '#10B981', coat: '#6366F1' },
      ];

      const createFlyer = (reset = false): UmbrellaFlyer => {
        const col = flyerColors[Math.floor(Math.random() * flyerColors.length)];
        return {
          x: reset ? -100 - Math.random() * 200 : Math.random() * width,
          y: reset ? Math.random() * (height * 0.7) : Math.random() * height,
          vx: 0.9 + Math.random() * 0.7,
          vy: 0.35 + Math.random() * 0.4,
          size: 26 + Math.random() * 12,
          rotation: -0.2 + (Math.random() - 0.5) * 0.2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          swayPhase: Math.random() * Math.PI * 2,
          swayFreq: 0.008 + Math.random() * 0.01,
          umbrellaColor: col.umbrella,
          coatColor: col.coat,
        };
      };

      for (let f = 0; f < 5; f++) {
        umbrellaFlyers.push(createFlyer());
      }
    }

    // TRAP LEAF / PRISON CELL STATE
    const trapLeaf: TrapLeafState = {
      active: false,
      x: -100,
      y: -100,
      vx: 0.3,
      vy: 0.5,
      size: 26,
      rotation: 0,
      rotationSpeed: 0.015,
      swayPhase: 0,
      swayFreq: 0.006,
      swayAmp: 0.5,
      isTrapped: false,
      trapTimer: 0,
      stolenText: null,
      stolenTextY: 0,
      stolenTextOpacity: 0,
      prisonerSway: 0,
    };

    let nextTrapTime = Date.now() + 5000;

    const spawnTrapLeaf = () => {
      trapLeaf.active = true;
      trapLeaf.x = Math.random() * width;
      trapLeaf.y = -30;
      trapLeaf.vx = (Math.random() - 0.5) * 0.4;
      trapLeaf.vy = 0.5 + Math.random() * 0.3;
      trapLeaf.size = 26 + Math.random() * 6;
      trapLeaf.isTrapped = false;
      trapLeaf.trapTimer = 0;
      trapLeaf.stolenText = null;
      trapLeaf.prisonerSway = 0;
    };

    // LEPRECHAUN LEAF / DUENDE DO PREJUÍZO (VERDE INTENSO BRILHANTE)
    const leprechaunLeaf: TrapLeafState = {
      active: false,
      x: -100,
      y: -100,
      vx: 0.25,
      vy: 0.48,
      size: 28,
      rotation: 0,
      rotationSpeed: 0.018,
      swayPhase: 0,
      swayFreq: 0.007,
      swayAmp: 0.6,
      isTrapped: false,
      trapTimer: 0,
      stolenText: null,
      stolenTextY: 0,
      stolenTextOpacity: 0,
      prisonerSway: 0,
    };

    let nextLeprechaunTime = Date.now() + 2000;

    const spawnLeprechaunLeaf = () => {
      leprechaunLeaf.active = true;
      leprechaunLeaf.x = Math.random() * width;
      leprechaunLeaf.y = -30;
      leprechaunLeaf.vx = (Math.random() - 0.5) * 0.45;
      leprechaunLeaf.vy = 0.46 + Math.random() * 0.3;
      leprechaunLeaf.size = 28 + Math.random() * 6;
      leprechaunLeaf.isTrapped = false;
      leprechaunLeaf.trapTimer = 0;
      leprechaunLeaf.stolenText = null;
      leprechaunLeaf.prisonerSway = 0;
    };

    // GHOST LEAF / FANTASMA CYBER DAS TAXAS OCULTAS (ROXA BRILHANTE)
    const ghostLeaf: TrapLeafState = {
      active: false,
      x: -100,
      y: -100,
      vx: 0.2,
      vy: 0.42,
      size: 27,
      rotation: 0,
      rotationSpeed: 0.012,
      swayPhase: 0,
      swayFreq: 0.005,
      swayAmp: 0.7,
      isTrapped: false,
      trapTimer: 0,
      stolenText: null,
      stolenTextY: 0,
      stolenTextOpacity: 0,
      prisonerSway: 0,
    };

    let nextGhostTime = Date.now() + 8000;

    const spawnGhostLeaf = () => {
      ghostLeaf.active = true;
      ghostLeaf.x = Math.random() * width;
      ghostLeaf.y = -30;
      ghostLeaf.vx = (Math.random() - 0.5) * 0.35;
      ghostLeaf.vy = 0.4 + Math.random() * 0.25;
      ghostLeaf.size = 27 + Math.random() * 6;
      ghostLeaf.isTrapped = false;
      ghostLeaf.trapTimer = 0;
      ghostLeaf.stolenText = null;
      ghostLeaf.prisonerSway = 0;
    };

    // COME-COMES (PAC-MAN) DEVORADORES DE ORÇAMENTO DISFARÇADOS EM FOLHAS
    const pacmen: PacmanEntity[] = [
      {
        active: false,
        type: 'yellow',
        x: -100,
        y: -100,
        vx: 0.3,
        vy: 0.5,
        size: 26,
        rotation: 0,
        rotationSpeed: 0.015,
        direction: 1,
        swayPhase: 0,
        swayFreq: 0.006,
        swayAmp: 0.55,
        isTriggered: false,
        triggerTimer: 0,
        stolenText: null,
        stolenTextY: 0,
        stolenTextOpacity: 0,
        mouthPhase: 0,
      },
      {
        active: false,
        type: 'red',
        x: -100,
        y: -100,
        vx: 0.35,
        vy: 0.52,
        size: 26,
        rotation: 0,
        rotationSpeed: 0.017,
        direction: 1,
        swayPhase: 0,
        swayFreq: 0.007,
        swayAmp: 0.58,
        isTriggered: false,
        triggerTimer: 0,
        stolenText: null,
        stolenTextY: 0,
        stolenTextOpacity: 0,
        mouthPhase: 0,
      },
      {
        active: false,
        type: 'cyan',
        x: -100,
        y: -100,
        vx: 0.28,
        vy: 0.48,
        size: 26,
        rotation: 0,
        rotationSpeed: 0.014,
        direction: 1,
        swayPhase: 0,
        swayFreq: 0.006,
        swayAmp: 0.52,
        isTriggered: false,
        triggerTimer: 0,
        stolenText: null,
        stolenTextY: 0,
        stolenTextOpacity: 0,
        mouthPhase: 0,
      },
    ];

    const nextPacmanTimes = {
      yellow: Date.now() + 3000,
      red: Date.now() + 9000,
      cyan: Date.now() + 15000,
    };

    const spawnPacman = (pacman: PacmanEntity) => {
      pacman.active = true;
      pacman.x = Math.random() * width;
      pacman.y = -30;
      pacman.direction = Math.random() > 0.5 ? 1 : -1;
      pacman.vx = (Math.random() - 0.5) * 0.4;
      pacman.vy = 0.45 + Math.random() * 0.25;
      pacman.size = 26 + Math.random() * 5;
      pacman.rotation = Math.random() * Math.PI * 2;
      pacman.rotationSpeed = (Math.random() - 0.5) * 0.02;
      pacman.swayPhase = Math.random() * Math.PI * 2;
      pacman.swayFreq = 0.006 + Math.random() * 0.003;
      pacman.swayAmp = 0.55;
      pacman.isTriggered = false;
      pacman.triggerTimer = 0;
      pacman.stolenText = null;
      pacman.mouthPhase = 0;
    };

    // LIGHTNING FLASH STATE FOR STORM MODE
    const lightning: LightningFlash = {
      active: false,
      x: 0,
      opacity: 0,
      timer: 0,
    };

    let nextLightningTime = Date.now() + 3500;

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

    // DRAW FLYING PERSON WITH UMBRELLA
    const drawFlyingPersonWithUmbrella = (
      c: CanvasRenderingContext2D,
      flyer: UmbrellaFlyer
    ) => {
      const s = flyer.size;

      c.save();
      c.translate(flyer.x, flyer.y);
      c.rotate(flyer.rotation);

      c.shadowColor = flyer.umbrellaColor;
      c.shadowBlur = 12;

      c.fillStyle = flyer.umbrellaColor;
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 2;

      c.beginPath();
      c.arc(0, -s * 0.5, s * 0.9, Math.PI * 1.1, Math.PI * 1.9);
      c.quadraticCurveTo(0, -s * 0.8, -s * 0.85, -s * 0.22);
      c.fill();
      c.stroke();

      c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -s * 1.4);
      c.lineTo(0, -s * 0.5);
      c.moveTo(0, -s * 1.4);
      c.lineTo(-s * 0.45, -s * 0.45);
      c.moveTo(0, -s * 1.4);
      c.lineTo(s * 0.45, -s * 0.45);
      c.stroke();

      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.arc(0, -s * 1.42, 3, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#CBD5E1';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -s * 0.5);
      c.lineTo(-s * 0.2, s * 0.6);
      c.stroke();

      c.beginPath();
      c.arc(-s * 0.25, s * 0.6, 5, 0, Math.PI);
      c.stroke();

      c.shadowBlur = 0;

      const px = -s * 0.2;
      const py = s * 0.65;

      c.fillStyle = flyer.coatColor;
      c.beginPath();
      c.moveTo(px - 6, py + 12);
      c.lineTo(px - s * 1.1, py + 8 + Math.sin(flyer.swayPhase * 3) * 6);
      c.lineTo(px - s * 0.9, py + 22 + Math.cos(flyer.swayPhase * 3) * 6);
      c.closePath();
      c.fill();

      c.fillStyle = '#FCA5A5';
      c.beginPath();
      c.arc(px, py - 4, s * 0.22, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#1E293B';
      c.beginPath();
      c.ellipse(px - 2, py - 9, s * 0.28, 5, -0.3, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = flyer.coatColor;
      c.beginPath();
      c.roundRect(px - s * 0.2, py + 2, s * 0.4, s * 0.7, 5);
      c.fill();

      c.fillStyle = '#FCA5A5';
      c.beginPath();
      c.arc(px - 2, py, 4, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#1E293B';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(px - 4, py + s * 0.7);
      c.lineTo(px - s * 0.7, py + s * 0.9 + Math.sin(flyer.swayPhase) * 4);
      c.moveTo(px + 4, py + s * 0.7);
      c.lineTo(px - s * 0.6, py + s * 1.1 + Math.cos(flyer.swayPhase) * 4);
      c.stroke();

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

    // DRAW EMERALD LEPRECHAUN LEAF (VERDE INTENSO COM BRILHO NEON E PARTÍCULAS MÁGICAS)
    const drawEmeraldLeprechaunLeaf = (c: CanvasRenderingContext2D, size: number, phase: number) => {
      c.save();
      c.shadowColor = '#00FF88';
      c.shadowBlur = 26;

      // Lado esquerdo da folha - Verde Esmeralda Radiante
      c.fillStyle = '#00FF88';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Lado direito da folha - Verde Floresta Mágico
      c.fillStyle = '#059669';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.85, -size * 0.4, size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Contorno exterior verde neon
      c.strokeStyle = '#A7F3D0';
      c.lineWidth = size * 0.08;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.bezierCurveTo(size * 0.7, size * 0.5, size * 0.85, -size * 0.4, 0, -size);
      c.stroke();

      // Nervura central dourada-esmeralda
      c.strokeStyle = '#FEF08A';
      c.lineWidth = size * 0.09;
      c.beginPath();
      c.moveTo(0, -size * 0.9);
      c.lineTo(0, size * 1.15);
      c.stroke();

      c.restore();
    };

    // DRAW DANCING & LAUGHING LEPRECHAUN (DUENDE DANÇANDO E RINDO DO PREJUÍZO)
    const drawDancingLeprechaun = (
      c: CanvasRenderingContext2D,
      size: number,
      animPhase: number
    ) => {
      c.save();
      c.shadowColor = '#00FF88';
      c.shadowBlur = 20;

      // Movimentos rítmicos de dança e pulo
      const danceX = Math.sin(animPhase * 5) * 5;
      const danceY = -Math.abs(Math.cos(animPhase * 5)) * 6;
      const armWave = Math.sin(animPhase * 6) * 0.35;
      const laughMouth = 4 + Math.abs(Math.sin(animPhase * 6)) * 4;

      // 1. Aura Mágica Verde / Faíscas de Dinheiro Voando
      c.fillStyle = 'rgba(0, 255, 136, 0.15)';
      c.beginPath();
      c.arc(danceX, danceY - 5, size * 1.4, 0, Math.PI * 2);
      c.fill();

      // Moedas e notas voando descontroladas
      for (let m = 0; m < 4; m++) {
        const coinAngle = animPhase * 3 + m * 1.6;
        const coinDist = size * (1.1 + Math.sin(coinAngle) * 0.3);
        const cx = danceX + Math.cos(coinAngle) * coinDist;
        const cy = danceY - 15 + Math.sin(coinAngle) * coinDist * 0.7;
        c.fillStyle = '#FBBF24';
        c.strokeStyle = '#FEF08A';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(cx, cy, 3, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }

      // 2. Perninhas e Sapatinhos Pontudos de Duende
      const leftLegLift = Math.sin(animPhase * 5) > 0 ? 5 : 0;
      const rightLegLift = Math.sin(animPhase * 5) <= 0 ? 5 : 0;

      // Perna Esquerda
      c.strokeStyle = '#065F46';
      c.lineWidth = 3.5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(danceX - 6, danceY + size * 0.3);
      c.lineTo(danceX - 10, danceY + size * 0.75 - leftLegLift);
      c.stroke();
      // Sapatinho Esquerdo Pontudo com Curva pra Cima
      c.fillStyle = '#090D16';
      c.strokeStyle = '#FBBF24';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(danceX - 10, danceY + size * 0.75 - leftLegLift);
      c.lineTo(danceX - 18, danceY + size * 0.75 - leftLegLift);
      c.lineTo(danceX - 19, danceY + size * 0.65 - leftLegLift);
      c.closePath();
      c.fill();
      c.stroke();

      // Perna Direita
      c.strokeStyle = '#065F46';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(danceX + 6, danceY + size * 0.3);
      c.lineTo(danceX + 10, danceY + size * 0.75 - rightLegLift);
      c.stroke();
      // Sapatinho Direito Pontudo com Curva pra Cima
      c.beginPath();
      c.moveTo(danceX + 10, danceY + size * 0.75 - rightLegLift);
      c.lineTo(danceX + 18, danceY + size * 0.75 - rightLegLift);
      c.lineTo(danceX + 19, danceY + size * 0.65 - rightLegLift);
      c.closePath();
      c.fill();
      c.stroke();

      // 3. Tronco / Jaqueta Verde com Cinto de Ouro
      c.fillStyle = '#059669';
      c.strokeStyle = '#34D399';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(danceX - 12, danceY - 5, 24, 22, 6);
      c.fill();
      c.stroke();

      // Cinto Preto com Fivela Dourada
      c.fillStyle = '#0F172A';
      c.fillRect(danceX - 12, danceY + 7, 24, 5);
      c.strokeStyle = '#FBBF24';
      c.lineWidth = 1.5;
      c.strokeRect(danceX - 4, danceY + 6, 8, 7);

      // 4. Braços Levantados Dançando e Chacoalhando
      // Braço Esquerdo
      c.strokeStyle = '#059669';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(danceX - 10, danceY - 2);
      c.lineTo(danceX - 20, danceY - 14 - armWave * 10);
      c.stroke();
      // Mãozinha
      c.fillStyle = '#FBBF24';
      c.beginPath();
      c.arc(danceX - 21, danceY - 15 - armWave * 10, 3, 0, Math.PI * 2);
      c.fill();

      // Braço Direito
      c.beginPath();
      c.moveTo(danceX + 10, danceY - 2);
      c.lineTo(danceX + 20, danceY - 14 + armWave * 10);
      c.stroke();
      // Mãozinha
      c.beginPath();
      c.arc(danceX + 21, danceY - 15 + armWave * 10, 3, 0, Math.PI * 2);
      c.fill();

      // 5. Cabeça e Orelhas Pontudas
      const headY = danceY - 18;
      // Orelhas pontudas de elfo/duende
      c.fillStyle = '#FCA5A5';
      c.beginPath();
      c.moveTo(danceX - 11, headY);
      c.lineTo(danceX - 22, headY - 4);
      c.lineTo(danceX - 11, headY + 5);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(danceX + 11, headY);
      c.lineTo(danceX + 22, headY - 4);
      c.lineTo(danceX + 11, headY + 5);
      c.closePath();
      c.fill();

      // Rosto
      c.beginPath();
      c.arc(danceX, headY, 11, 0, Math.PI * 2);
      c.fill();

      // Barba Laranja Pontuda de Duende
      c.fillStyle = '#EA580C';
      c.beginPath();
      c.moveTo(danceX - 10, headY + 3);
      c.bezierCurveTo(danceX - 8, headY + 16, danceX + 8, headY + 16, danceX + 10, headY + 3);
      c.lineTo(danceX, headY + 18);
      c.closePath();
      c.fill();

      // Olhos Fechados Gargalhando (Arquinhos felizes maliciosos ^ ^)
      c.strokeStyle = '#0F172A';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(danceX - 4, headY - 2, 2.5, Math.PI, 0);
      c.stroke();
      c.beginPath();
      c.arc(danceX + 4, headY - 2, 2.5, Math.PI, 0);
      c.stroke();

      // Bocão Aberto Gargalhando
      c.fillStyle = '#7F1D1D';
      c.beginPath();
      c.arc(danceX, headY + 3, laughMouth, 0, Math.PI);
      c.closePath();
      c.fill();
      // Dentinho branco no topo
      c.fillStyle = '#FFFFFF';
      c.fillRect(danceX - 3, headY + 3, 6, 2);

      // Narizinho
      c.fillStyle = '#F87171';
      c.beginPath();
      c.arc(danceX, headY, 2, 0, Math.PI * 2);
      c.fill();

      // 6. Chapéu Verde Pontudo de Duende com Fivela
      c.fillStyle = '#047857';
      c.strokeStyle = '#34D399';
      c.lineWidth = 1.8;
      // Aba do chapéu
      c.beginPath();
      c.ellipse(danceX, headY - 9, 18, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Cone do chapéu com topo dobrado
      const hatTipX = danceX + 18 + Math.sin(animPhase * 5) * 4;
      const hatTipY = headY - 32;
      c.beginPath();
      c.moveTo(danceX - 11, headY - 11);
      c.quadraticCurveTo(danceX, headY - 30, hatTipX, hatTipY);
      c.quadraticCurveTo(danceX + 5, headY - 18, danceX + 11, headY - 11);
      c.closePath();
      c.fill();
      c.stroke();

      // Fita do chapéu
      c.fillStyle = '#0F172A';
      c.fillRect(danceX - 11, headY - 14, 22, 4);
      // Fivela de Ouro do chapéu
      c.strokeStyle = '#FBBF24';
      c.lineWidth = 1.5;
      c.strokeRect(danceX - 4, headY - 15, 8, 6);

      // Guizo / Sininho Dourado na Ponta do Chapéu
      c.fillStyle = '#FBBF24';
      c.shadowColor = '#FBBF24';
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(hatTipX, hatTipY, 3.5, 0, Math.PI * 2);
      c.fill();

      // Risos animados no ar ao redor dele
      c.fillStyle = '#FEF08A';
      c.shadowColor = '#00FF88';
      c.shadowBlur = 8;
      c.font = 'bold 9px sans-serif';
      c.fillText('HA!', danceX - 25, headY - 15 - Math.sin(animPhase * 4) * 5);
      c.fillText('HA!', danceX + 22, headY - 20 + Math.sin(animPhase * 4) * 5);

      c.restore();
    };

    // DRAW PHANTOM PURPLE LEAF (ROXA COM BRILHO VIOLETA CYBER E ECTOPLASMA)
    const drawPhantomPurpleLeaf = (c: CanvasRenderingContext2D, size: number, phase: number) => {
      c.save();
      c.shadowColor = '#C084FC';
      c.shadowBlur = 26;

      // Lado esquerdo da folha - Púrpura Neon
      c.fillStyle = '#A855F7';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Lado direito da folha - Violeta Noturno
      c.fillStyle = '#6B21A8';
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.85, -size * 0.4, size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Contorno exterior magenta neon
      c.strokeStyle = '#F472B6';
      c.lineWidth = size * 0.08;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.bezierCurveTo(size * 0.7, size * 0.5, size * 0.85, -size * 0.4, 0, -size);
      c.stroke();

      // Nervura central ciano néon
      c.strokeStyle = '#38BDF8';
      c.lineWidth = size * 0.09;
      c.beginPath();
      c.moveTo(0, -size * 0.9);
      c.lineTo(0, size * 1.15);
      c.stroke();

      c.restore();
    };

    // DRAW CYBER GHOST (FANTASMA CYBER DAS TAXAS OCULTAS E ASSINATURAS ESQUECIDAS)
    const drawCyberGhost = (
      c: CanvasRenderingContext2D,
      size: number,
      animPhase: number
    ) => {
      c.save();
      c.shadowColor = '#C084FC';
      c.shadowBlur = 24;

      const floatY = Math.sin(animPhase * 3) * 6;
      const tailWave = Math.sin(animPhase * 4) * 7;

      // 1. Corpo Ectoplasmático Fluido do Fantasma
      const grad = c.createLinearGradient(0, -size * 1.2 + floatY, 0, size * 1.2 + floatY);
      grad.addColorStop(0, 'rgba(236, 72, 153, 0.9)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.85)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

      c.fillStyle = grad;
      c.strokeStyle = '#F472B6';
      c.lineWidth = 2.2;

      c.beginPath();
      // Cabeça arredondada
      c.arc(0, -size * 0.4 + floatY, size * 0.7, Math.PI, 0);
      // Lado direito descendo
      c.bezierCurveTo(size * 0.75, 0 + floatY, size * 0.9, size * 0.8 + floatY, size * 0.5 + tailWave, size * 1.3 + floatY);
      // Cauda com 3 pontas fantasmagóricas ondulantes
      c.quadraticCurveTo(size * 0.25, size * 0.9 + floatY, 0, size * 1.3 + floatY - tailWave * 0.5);
      c.quadraticCurveTo(-size * 0.25, size * 0.9 + floatY, -size * 0.5 + tailWave, size * 1.3 + floatY);
      // Lado esquerdo subindo
      c.bezierCurveTo(-size * 0.9, size * 0.8 + floatY, -size * 0.75, 0 + floatY, -size * 0.7, -size * 0.4 + floatY);
      c.closePath();
      c.fill();
      c.stroke();

      // 2. Olhos Cibernéticos Ciano Neon
      const blink = Math.sin(animPhase * 1.5) > 0.96 ? 0.2 : 1.0;
      c.shadowColor = '#38BDF8';
      c.shadowBlur = 14;
      c.fillStyle = '#38BDF8';
      c.beginPath();
      c.ellipse(-size * 0.25, -size * 0.4 + floatY, 4.5, 6 * blink, 0.2, 0, Math.PI * 2);
      c.ellipse(size * 0.25, -size * 0.4 + floatY, 4.5, 6 * blink, -0.2, 0, Math.PI * 2);
      c.fill();

      // Pupila escura
      c.fillStyle = '#0F172A';
      c.beginPath();
      c.arc(-size * 0.23, -size * 0.4 + floatY, 2 * blink, 0, Math.PI * 2);
      c.arc(size * 0.27, -size * 0.4 + floatY, 2 * blink, 0, Math.PI * 2);
      c.fill();

      // 3. Sorriso Fantasmagórico Zombeteiro com Presas
      c.strokeStyle = '#0F172A';
      c.fillStyle = '#1E1B4B';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, -size * 0.15 + floatY, 9, 0.2, Math.PI - 0.2);
      c.closePath();
      c.fill();
      c.stroke();

      // Presinhas brancas
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.moveTo(-4, -size * 0.15 + floatY);
      c.lineTo(-2, -size * 0.07 + floatY);
      c.lineTo(0, -size * 0.15 + floatY);
      c.moveTo(0, -size * 0.15 + floatY);
      c.lineTo(2, -size * 0.07 + floatY);
      c.lineTo(4, -size * 0.15 + floatY);
      c.fill();

      // 4. Cartão de Crédito Sendo "Drenado" pelo Fantasma
      const cardX = size * 0.75 + Math.sin(animPhase * 4) * 3;
      const cardY = floatY + Math.cos(animPhase * 4) * 4;

      c.save();
      c.translate(cardX, cardY);
      c.rotate(0.3 + Math.sin(animPhase * 3) * 0.15);

      // Cartão Rosa / Púrpura Mordido
      c.shadowColor = '#EC4899';
      c.shadowBlur = 12;
      c.fillStyle = '#BE185D';
      c.strokeStyle = '#F472B6';
      c.lineWidth = 1.5;
      c.beginPath();
      c.roundRect(-14, -9, 28, 18, 3.5);
      c.fill();
      c.stroke();

      // Chip Dourado
      c.fillStyle = '#FBBF24';
      c.fillRect(-10, -4, 6, 5);

      // Símbolo de Taxa / Dinheiro Sumindo
      c.fillStyle = '#FFFFFF';
      c.font = 'bold 8px sans-serif';
      c.fillText('TAX', 1, 1);

      c.restore();

      // Moedinhas evaporando
      for (let s = 0; s < 3; s++) {
        const sparkY = floatY - 20 - s * 8 - (animPhase * 20) % 15;
        const sparkX = -size * 0.5 + Math.sin(animPhase * 4 + s) * 12;
        c.fillStyle = '#EC4899';
        c.shadowColor = '#EC4899';
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(sparkX, sparkY, 1.8, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    };

    // DRAW PACMAN DISGUISE LEAF (FOLHAS DISFARÇADAS DOS COME-COMES NAS CORES AMARELA, VERMELHA E CIANO)
    const drawPacmanLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      type: 'yellow' | 'red' | 'cyan'
    ) => {
      c.save();

      let mainColor = '#FACC15';
      let darkColor = '#CA8A04';
      let strokeColor = '#FEF08A';
      let shadowColor = '#EAB308';

      if (type === 'red') {
        mainColor = '#EF4444';
        darkColor = '#B91C1C';
        strokeColor = '#FCA5A5';
        shadowColor = '#DC2626';
      } else if (type === 'cyan') {
        mainColor = '#06B6D4';
        darkColor = '#0E7490';
        strokeColor = '#67E8F9';
        shadowColor = '#0891B2';
      }

      c.shadowColor = shadowColor;
      c.shadowBlur = 24;

      // Lado esquerdo da folha
      c.fillStyle = mainColor;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Lado direito da folha
      c.fillStyle = darkColor;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.85, -size * 0.4, size * 0.7, size * 0.5, 0, size);
      c.fill();

      // Contorno exterior neon da cor
      c.strokeStyle = strokeColor;
      c.lineWidth = size * 0.08;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.85, -size * 0.4, -size * 0.7, size * 0.5, 0, size);
      c.bezierCurveTo(size * 0.7, size * 0.5, size * 0.85, -size * 0.4, 0, -size);
      c.stroke();

      // Nervura central
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = size * 0.09;
      c.beginPath();
      c.moveTo(0, -size * 0.9);
      c.lineTo(0, size * 1.15);
      c.stroke();

      c.restore();
    };

    // DRAW COME-COME (PAC-MAN) DEVORADOR DE ORÇAMENTO COM VIDA E ANIMAÇÃO
    const drawPacmanEntity = (
      c: CanvasRenderingContext2D,
      pacman: PacmanEntity
    ) => {
      const { type, size, direction, mouthPhase, triggerTimer } = pacman;
      c.save();

      let mainColor = '#FACC15';
      let shadowCol = '#EAB308';
      let strokeCol = '#FEF08A';

      if (type === 'red') {
        mainColor = '#EF4444';
        shadowCol = '#DC2626';
        strokeCol = '#FCA5A5';
      } else if (type === 'cyan') {
        mainColor = '#06B6D4';
        shadowCol = '#0891B2';
        strokeCol = '#A5F3FC';
      }

      c.shadowColor = shadowCol;
      c.shadowBlur = 24;

      // 1. Rastro de Velocidade e Poeira de Corrida Atrás do Come-Come
      const runCycle = triggerTimer * 0.45;
      const trailDir = -direction;
      c.strokeStyle = strokeCol;
      c.lineWidth = 1.5;
      for (let t = 0; t < 3; t++) {
        const lineY = (t - 1) * (size * 0.35);
        const lineLen = size * (0.6 + Math.sin(runCycle + t) * 0.25);
        c.beginPath();
        c.moveTo(trailDir * (size * 0.9), lineY);
        c.lineTo(trailDir * (size * 0.9 + lineLen), lineY);
        c.stroke();
      }

      // Fumacinha de corrida nos pés
      c.fillStyle = 'rgba(255, 255, 255, 0.25)';
      const dustPulse = Math.sin(runCycle * 2) * 3;
      c.beginPath();
      c.arc(trailDir * (size * 0.8), size * 0.7 + dustPulse, 4, 0, Math.PI * 2);
      c.arc(trailDir * (size * 1.1), size * 0.6 - dustPulse, 3, 0, Math.PI * 2);
      c.fill();

      // 2. Patinhas / Pezinhos Correndo Velozes Embaixo
      const foot1X = Math.sin(runCycle) * (size * 0.4);
      const foot1Y = size * 0.85 + Math.abs(Math.cos(runCycle)) * 3;
      const foot2X = Math.sin(runCycle + Math.PI) * (size * 0.4);
      const foot2Y = size * 0.85 + Math.abs(Math.cos(runCycle + Math.PI)) * 3;

      c.fillStyle = '#0F172A';
      c.strokeStyle = strokeCol;
      c.lineWidth = 1.5;

      // Pé 1
      c.beginPath();
      c.ellipse(foot1X, foot1Y, size * 0.22, size * 0.14, 0.1 * direction, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Pé 2
      c.beginPath();
      c.ellipse(foot2X, foot2Y, size * 0.22, size * 0.14, -0.1 * direction, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // 3. Trilha de Moedas à Frente Sendo "Sugadas" para Dentro da Boca
      c.fillStyle = type === 'yellow' ? '#FEF08A' : type === 'red' ? '#FCA5A5' : '#A5F3FC';
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 1;
      for (let b = 1; b <= 4; b++) {
        // Moedas deslizam em direção à boca conforme o ciclo
        const slideOffset = (mouthPhase * 25) % (size * 0.75);
        const dotDist = size * 0.95 + b * (size * 0.75) - slideOffset;
        if (dotDist > size * 0.4) {
          const dotX = direction * dotDist;
          const dotPulse = Math.max(1.8, 3.2 - b * 0.35 + Math.sin(mouthPhase * 8 + b) * 0.8);
          c.beginPath();
          c.arc(dotX, Math.sin(mouthPhase * 4 + b) * 2, dotPulse, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      }

      // 4. Corpo do Come-Come com Squash & Stretch Anatômico Vivo
      c.save();
      if (direction === -1) {
        c.scale(-1, 1);
      }

      // Ciclo de mastigação dinâmico
      const chompVal = Math.sin(mouthPhase * 9);
      const mouthOpen = 0.12 + Math.abs(chompVal) * 0.52;

      // Squash & Stretch: estica ao abrir a boca, achata ao morder com impacto
      const stretchX = chompVal > 0 ? 1.08 : 0.94;
      const stretchY = chompVal > 0 ? 0.94 : 1.06;
      c.scale(stretchX, stretchY);

      // Corpo principal
      c.fillStyle = mainColor;
      c.strokeStyle = strokeCol;
      c.lineWidth = 2;

      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, size, mouthOpen, Math.PI * 2 - mouthOpen);
      c.closePath();
      c.fill();
      c.stroke();

      // Dentes afiados para o Vermelho (Inflação)
      if (type === 'red') {
        c.fillStyle = '#FFFFFF';
        // Dentes superiores
        c.beginPath();
        c.moveTo(size * 0.5, -size * 0.35);
        c.lineTo(size * 0.65, -size * 0.15);
        c.lineTo(size * 0.35, -size * 0.15);
        c.closePath();
        c.fill();
        // Dentes inferiores
        c.beginPath();
        c.moveTo(size * 0.5, size * 0.35);
        c.lineTo(size * 0.65, size * 0.15);
        c.lineTo(size * 0.35, size * 0.15);
        c.closePath();
        c.fill();
      }

      // Língua gulosa vermelha no fundo da boca
      c.fillStyle = '#DC2626';
      c.beginPath();
      c.arc(size * 0.15, 0, size * 0.35, -0.3, 0.3);
      c.fill();

      // 5. Olhos Vivos e Expressivos
      const eyeX = size * 0.22;
      const eyeY = -size * 0.52;
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.arc(eyeX, eyeY, size * 0.25, 0, Math.PI * 2);
      c.fill();

      // Pupila focada nas moedas à frente
      c.fillStyle = '#0F172A';
      c.beginPath();
      c.arc(eyeX + 2.5, eyeY, size * 0.14, 0, Math.PI * 2);
      c.fill();

      // Reflexo brilhante de luz na pupila
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.arc(eyeX + 3.5, eyeY - 1.5, size * 0.06, 0, Math.PI * 2);
      c.fill();

      // Sobrancelha expressiva
      c.strokeStyle = '#0F172A';
      c.lineWidth = 1.8;
      c.beginPath();
      if (type === 'red') {
        // Sobrancelha zangada/travessa
        c.moveTo(eyeX - 4, eyeY - 8);
        c.lineTo(eyeX + 6, eyeY - 5);
      } else {
        // Sobrancelha arqueada divertida
        c.moveTo(eyeX - 5, eyeY - 6);
        c.quadraticCurveTo(eyeX, eyeY - 9, eyeX + 5, eyeY - 6);
      }
      c.stroke();

      // Detalhes extras por tipo:
      if (type === 'red') {
        // Chifrinhos de diabinho da inflação com brilho
        c.fillStyle = '#B91C1C';
        c.strokeStyle = '#FCA5A5';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(-size * 0.35, -size * 0.75);
        c.lineTo(-size * 0.58, -size * 1.25);
        c.lineTo(-size * 0.15, -size * 0.9);
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(size * 0.35, -size * 0.75);
        c.lineTo(size * 0.58, -size * 1.25);
        c.lineTo(size * 0.15, -size * 0.9);
        c.closePath();
        c.fill();
        c.stroke();
      } else if (type === 'cyan') {
        // Anteninha cibernética neon oscilando
        const antennaWave = Math.sin(triggerTimer * 0.3) * 3;
        c.strokeStyle = '#38BDF8';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(antennaWave, -size - 12);
        c.stroke();
        c.fillStyle = '#E0F2FE';
        c.shadowColor = '#38BDF8';
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(antennaWave, -size - 13, 3.8, 0, Math.PI * 2);
        c.fill();
      } else if (type === 'yellow') {
        // Bochecha coradinha charmosa
        c.fillStyle = 'rgba(239, 68, 68, 0.4)';
        c.beginPath();
        c.ellipse(size * 0.1, -size * 0.15, 5, 3, 0, 0, Math.PI * 2);
        c.fill();
      }

      // 6. Migalhas e Faíscas de Mastigação Estourando
      c.fillStyle = strokeCol;
      for (let p = 0; p < 6; p++) {
        const sparkAngle = (p * Math.PI * 2) / 6 + mouthPhase * 5;
        const sparkDist = size * (1.1 + Math.sin(triggerTimer * 0.3 + p) * 0.3);
        const spX = Math.cos(sparkAngle) * sparkDist;
        const spY = Math.sin(sparkAngle) * sparkDist;
        c.beginPath();
        c.arc(spX, spY, 2.2, 0, Math.PI * 2);
        c.fill();
      }

      c.restore(); // Fecha espelhamento de direção
      c.restore(); // Fecha contexto do come-come
    };


    // DRAW STAIRS & STICKMAN CLIMBING (Escada Conectada com Bordas da Tela + Boneco em Postura Real de Subida + Vitória)
    const drawStairsStickmanAndVictory = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      now: number
    ) => {
      c.save();

      // Configuração Geométrica Proporcional da Escada
      const numSteps = 7;
      const stepWidth = Math.min(w * 0.038, 48);
      const stepHeight = Math.min(h * 0.048, 36);

      // Posicionamento base da escada (Recuada 160px para cabeçalhos e bandeira total)
      const startX = w - numSteps * stepWidth - 160;
      const startY = h - 60;

      // Desenhar Degraus da Escada e Conexão com as Bordas da Tela
      c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      c.lineWidth = 2.0;
      c.lineCap = 'square';
      c.lineJoin = 'miter';

      c.beginPath();

      // 1. CONECTAR PONTA INFERIOR DA ESCADA COM O FINAL DA TELA (Linha vertical até o fundo y = h)
      c.moveTo(startX, h + 10);
      c.lineTo(startX, startY);

      let currentX = startX;
      let currentY = startY;

      const stepTreads: Array<{ xStart: number; xEnd: number; y: number }> = [];

      for (let i = 0; i < numSteps; i++) {
        // Subida Vertical
        currentY -= stepHeight;
        c.lineTo(currentX, currentY);

        const treadXStart = currentX;
        // Caminho Horizontal (Superfície Plana do Degrau)
        currentX += stepWidth;
        const treadXEnd = currentX;
        c.lineTo(currentX, currentY);

        stepTreads.push({ xStart: treadXStart, xEnd: treadXEnd, y: currentY });
      }

      // 2. CONECTAR PONTA SUPERIOR DA ESCADA COM O FINAL DA TELA (Linha horizontal até o final da tela x = w)
      c.lineTo(w + 10, currentY);

      c.stroke();

      // --- BONECO PALITO VETORIAL REALISTA SUBINDO A ESCADA ---
      // Escala ampliada e proporções anatômicas naturais para harmonia com a escada
      const targetStepIndex = 2; // Degrau 2
      const targetStep = stepTreads[targetStepIndex];
      const guyX = targetStep.xStart + stepWidth * 0.35;
      const guyY = targetStep.y; // Superfície exata do degrau 2

      // Parede vertical que sobe para o próximo degrau
      const wallX = targetStep.xEnd - guyX;

      // Respiração e impulso dinâmico sutil de escalada
      const climbBreath = Math.sin(now * 0.0035) * 1.5;
      const bagSway = Math.sin(now * 0.0035) * 0.08;

      c.save();
      c.translate(guyX, guyY);
      c.strokeStyle = '#FFFFFF';
      c.fillStyle = '#FFFFFF';
      c.lineWidth = 3.0; // Traço mais firme, nítido e presente
      c.lineCap = 'round';
      c.lineJoin = 'round';

      // Posicionamento biomecânico e proporções ampliadas:
      // 1. Pé Traseiro (apoiado no degrau atual Y = 0 em linha reta de impulsão pura e firme)
      const footBackX = -6;
      const footBackY = 0;

      // 3. Quadril (projetado para cima e para a frente, acima dos degraus)
      const hipX = 10;
      const hipY = -stepHeight - 16 + climbBreath;

      // 2. Pé Dianteiro (plantado com firmeza no patamar do degrau superior Y = -stepHeight)
      const footFrontX = wallX + 8;
      const footFrontY = -stepHeight;
      // Joelho dianteiro flexionado para a frente e ACIMA do degrau superior (geometria anatômica real)
      const kneeFrontX = wallX + 13;
      const kneeFrontY = -stepHeight - 14 + climbBreath * 0.3;

      // 4. Tronco / Coluna (alongado e inclinado ~22° rumo ao topo da escada)
      const neckX = hipX + 16;
      const neckY = hipY - 34;

      // 5. Cabeça (proporção ampliada harmônica: raio 10.5px)
      const headX = neckX + 7;
      const headY = neckY - 11;
      const headRadius = 10.5;

      // --- Desenho das Pernas e Pés ---
      // Perna Traseira (Linha reta, firme e atlética de impulsão do quadril ao degrau inferior - sem joelho troncho)
      c.beginPath();
      c.moveTo(hipX, hipY);
      c.lineTo(footBackX, footBackY);
      // Sola do pé traseiro assentada no piso do degrau
      c.lineTo(footBackX + 9, footBackY);
      c.stroke();

      // Perna Dianteira (Coxa do quadril ao joelho alto -> Canela descendo até o pé plantado no degrau superior)
      c.beginPath();
      c.moveTo(hipX, hipY);
      c.lineTo(kneeFrontX, kneeFrontY);
      c.lineTo(footFrontX, footFrontY);
      // Sola do pé dianteiro plantada no degrau superior
      c.lineTo(footFrontX + 9, footFrontY);
      c.stroke();

      // Sombra sutil de apoio sob os pés nos degraus
      c.fillStyle = 'rgba(16, 185, 129, 0.3)';
      c.beginPath();
      c.ellipse(footBackX + 4, footBackY + 1, 8, 2.2, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(footFrontX + 4, footFrontY + 1, 8, 2.2, 0, 0, Math.PI * 2);
      c.fill();

      // --- Tronco ---
      c.strokeStyle = '#FFFFFF';
      c.beginPath();
      c.moveTo(hipX, hipY);
      c.lineTo(neckX, neckY);
      c.stroke();

      // --- Cabeça ---
      c.beginPath();
      c.arc(headX, headY, headRadius, 0, Math.PI * 2);
      c.stroke();

      // Brilho sutil dos olhos / visão determinada rumo ao topo
      c.fillStyle = '#34D399';
      c.beginPath();
      c.arc(headX + 5, headY - 1, 2.0, 0, Math.PI * 2);
      c.fill();

      // --- Braço Traseiro (balanço atlético para trás para contrapeso) ---
      const elbowBackX = neckX - 13;
      const elbowBackY = neckY + 16 - climbBreath * 0.5;
      const handBackX = neckX - 22;
      const handBackY = neckY + 10 - climbBreath * 0.5;

      c.strokeStyle = '#FFFFFF';
      c.beginPath();
      c.moveTo(neckX - 2, neckY + 5);
      c.lineTo(elbowBackX, elbowBackY);
      c.lineTo(handBackX, handBackY);
      c.stroke();

      // --- Braço Dianteiro (erguendo a maleta com determinação) ---
      const elbowFrontX = neckX + 15;
      const elbowFrontY = neckY + 11 + climbBreath * 0.5;
      const handFrontX = neckX + 26;
      const handFrontY = neckY - 2 + climbBreath * 0.5;

      c.beginPath();
      c.moveTo(neckX + 3, neckY + 5);
      c.lineTo(elbowFrontX, elbowFrontY);
      c.lineTo(handFrontX, handFrontY);
      c.stroke();

      // --- Maleta de Sucesso / Bolsa de Dinheiro Esmeralda (ampliada proporcional) ---
      c.save();
      c.translate(handFrontX, handFrontY);
      c.rotate(bagSway);

      // Alça da maleta
      c.strokeStyle = '#34D399';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(7, -3, 5, Math.PI, 0);
      c.stroke();

      // Corpo da maleta com brilho esmeralda
      c.shadowColor = '#10B981';
      c.shadowBlur = 16;
      c.fillStyle = '#059669';
      c.strokeStyle = '#6EE7B7';
      c.lineWidth = 1.8;
      c.beginPath();
      c.roundRect(-3, 0, 20, 15, 3.5);
      c.fill();
      c.stroke();

      // Cifrão de Ouro Central
      c.fillStyle = '#FEF08A';
      c.shadowColor = '#FBBF24';
      c.shadowBlur = 10;
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('$', 7, 8);

      c.restore(); // Fecha contexto da maleta
      c.restore(); // Fecha contexto do boneco

      // --- SÍMBOLO DE VITÓRIA E BANDEIRA (100% VISÍVEL NO TOPO DA ESCADA) ---
      const topTread = stepTreads[numSteps - 1];
      const topX = topTread.xEnd - 10;
      const topY = topTread.y;

      c.save();
      c.translate(topX, topY);

      // Mastro Vetorial e Bandeira de Vitória
      const flagX = 20;
      const flagY = -45;

      // Mastro Branco
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 2.2;
      c.shadowColor = '#FFFFFF';
      c.shadowBlur = 6;
      c.beginPath();
      c.moveTo(flagX, 0);
      c.lineTo(flagX, flagY - 18);
      c.stroke();

      // Esfera Dourada no Topo do Mastro
      c.fillStyle = '#F59E0B';
      c.shadowColor = '#FBBF24';
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(flagX, flagY - 18, 4, 0, Math.PI * 2);
      c.fill();

      // Flâmula de Vitória Ondulante Verde Esmeralda & Ouro (Ondulação Dinâmica no Vento)
      const flagWave = Math.sin(now * 0.005) * 3;
      c.fillStyle = '#10B981';
      c.strokeStyle = '#FEF08A';
      c.lineWidth = 1.5;
      c.shadowColor = '#10B981';
      c.shadowBlur = 14;
      c.beginPath();
      c.moveTo(flagX, flagY - 16);
      c.lineTo(flagX + 42, flagY - 8 + flagWave);
      c.lineTo(flagX, flagY);
      c.closePath();
      c.fill();
      c.stroke();

      // Cifrão Dourado na Bandeira
      c.fillStyle = '#FEF08A';
      c.font = 'bold 10px sans-serif';
      c.fillText('$', flagX + 14, flagY - 8 + flagWave * 0.5);

      // Insígnia de Texto "🏁 VITÓRIA"
      c.fillStyle = '#34D399';
      c.shadowColor = '#10B981';
      c.shadowBlur = 12;
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.fillText('🏁 VITÓRIA', flagX + 20, flagY - 28);

      c.restore();
      c.restore();
    };

    // Main Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();


      // 2. Desenha a Escada no Lado Direito, o Boneco Palito Fixo e a Flâmula de Vitória no Topo
      drawStairsStickmanAndVictory(ctx, width, height, now);

      // Handle Storm Mode Lightning Flash
      if (mode === 'storm') {
        if (!lightning.active && now > nextLightningTime) {
          lightning.active = true;
          lightning.x = Math.random() * width;
          lightning.opacity = 0.3 + Math.random() * 0.3;
          lightning.timer = 0;
          nextLightningTime = now + 4000 + Math.random() * 5000;
        }

        if (lightning.active) {
          lightning.timer++;
          lightning.opacity -= 0.03;

          ctx.save();
          ctx.fillStyle = `rgba(168, 85, 247, ${Math.max(lightning.opacity * 0.15, 0)})`;
          ctx.fillRect(0, 0, width, height);

          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(lightning.opacity, 0)})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          let lx = lightning.x;
          let ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < height * 0.7) {
            lx += (Math.random() - 0.5) * 35;
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
        nextTrapTime = now + 16000 + Math.random() * 9000;
      }

      // Check Leprechaun Leaf Spawn (Duende do Prejuízo)
      if (mode === 'leaves' && !leprechaunLeaf.active && now > nextLeprechaunTime) {
        spawnLeprechaunLeaf();
        nextLeprechaunTime = now + 14000 + Math.random() * 8000;
      }

      // Check Cyber Ghost Leaf Spawn (Fantasma dos Gastos Ocultos)
      if (mode === 'leaves' && !ghostLeaf.active && now > nextGhostTime) {
        spawnGhostLeaf();
        nextGhostTime = now + 15000 + Math.random() * 9000;
      }

      // Check Pacman Spawns (Come-Comes Amarelo, Vermelho e Ciano)
      pacmen.forEach((pacman) => {
        const nextTime = nextPacmanTimes[pacman.type];
        if (!pacman.active && now > nextTime) {
          spawnPacman(pacman);
          nextPacmanTimes[pacman.type] = now + 15000 + Math.random() * 10000;
        }
      });

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
        const maxWindDist = mode === 'storm' ? 220 : 180;

        if (dist < maxWindDist) {
          const force = (1 - dist / maxWindDist) * (mode === 'storm' ? 8 : p.depth === 'fg' ? 6 : 4);
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force + mouseVx * force * 0.3;
          p.y += Math.sin(angle) * force + mouseVy * force * 0.3;
          p.rotation += (Math.random() - 0.5) * 0.08;
        }

        if (mode === 'leaves') {
          const morphThreshold = height * 0.55;
          if (p.y > morphThreshold && !p.isMorphed) {
            p.isMorphed = true;
          }

          if (p.isMorphed && p.morphProgress < 1) {
            p.morphProgress = Math.min(p.morphProgress + 0.04, 1);
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

      // RENDER FLYING PEOPLE WITH UMBRELLAS IN STORM MODE
      if (mode === 'storm') {
        umbrellaFlyers.forEach((flyer) => {
          flyer.swayPhase += flyer.swayFreq;
          flyer.x += flyer.vx;
          flyer.y += flyer.vy + Math.sin(flyer.swayPhase) * 0.8;
          flyer.rotation += flyer.rotationSpeed;

          const udx = flyer.x - mouseX;
          const udy = flyer.y - mouseY;
          const udist = Math.sqrt(udx * udx + udy * udy);
          if (udist < 200) {
            const uforce = (1 - udist / 200) * 8;
            const uangle = Math.atan2(udy, udx);
            flyer.x += Math.cos(uangle) * uforce + mouseVx * 0.3;
            flyer.y += Math.sin(uangle) * uforce + mouseVy * 0.3;
          }

          drawFlyingPersonWithUmbrella(ctx, flyer);

          if (flyer.x > width + 120 || flyer.y > height + 120) {
            flyer.x = -100 - Math.random() * 150;
            flyer.y = Math.random() * (height * 0.6);
          }
        });
      }

      // RENDER FINANCIAL TRAP LEAF / PRISON CELL
      if (mode === 'leaves' && trapLeaf.active) {
        trapLeaf.swayPhase += trapLeaf.swayFreq;
        const sway = Math.sin(trapLeaf.swayPhase) * trapLeaf.swayAmp;
        trapLeaf.x += trapLeaf.vx + sway;
        trapLeaf.y += trapLeaf.vy;
        trapLeaf.rotation += trapLeaf.rotationSpeed;
        trapLeaf.prisonerSway += 0.1;

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
          trapLeaf.stolenTextY -= 0.6;
          trapLeaf.stolenTextOpacity -= 0.005;

          if (trapLeaf.stolenText && trapLeaf.stolenTextOpacity > 0) {
            ctx.save();
            ctx.fillStyle = '#EF4444';
            ctx.shadowColor = '#DC2626';
            ctx.shadowBlur = 14;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.max(trapLeaf.stolenTextOpacity, 0);
            ctx.fillText(`🔒 PRESO NA ARMADILHA: ${trapLeaf.stolenText}`, trapLeaf.x, trapLeaf.stolenTextY);
            ctx.restore();
          }

          if (trapLeaf.trapTimer > 180) {
            trapLeaf.active = false;
          }
        }

        if (trapLeaf.y > height + 50) {
          trapLeaf.active = false;
        }
      }

      // RENDER LEPRECHAUN LEAF / DUENDE DO PREJUÍZO (VERDE COM DANÇA E RISADAS)
      if (mode === 'leaves' && leprechaunLeaf.active) {
        leprechaunLeaf.swayPhase += leprechaunLeaf.swayFreq;
        const sway = Math.sin(leprechaunLeaf.swayPhase) * leprechaunLeaf.swayAmp;
        leprechaunLeaf.x += leprechaunLeaf.vx + sway;
        leprechaunLeaf.y += leprechaunLeaf.vy;
        leprechaunLeaf.rotation += leprechaunLeaf.rotationSpeed;
        leprechaunLeaf.prisonerSway += 0.09;

        const ldx = mouseX - leprechaunLeaf.x;
        const ldy = mouseY - leprechaunLeaf.y;
        const ldist = Math.sqrt(ldx * ldx + ldy * ldy);

        if (ldist < 55 && !leprechaunLeaf.isTrapped) {
          leprechaunLeaf.isTrapped = true;
          leprechaunLeaf.trapTimer = 0;
          const leprechaunLosses = [
            '-R$ 2.450,00 (Compra por Impulso!)',
            '-R$ 3.890,00 (Sem Pesquisar Preço!)',
            '-R$ 5.200,00 (Parcelou em 24x!)',
            '-R$ 4.750,00 (Taxa de Desatenção!)',
          ];
          leprechaunLeaf.stolenText = leprechaunLosses[Math.floor(Math.random() * leprechaunLosses.length)];
          leprechaunLeaf.stolenTextY = leprechaunLeaf.y - 35;
          leprechaunLeaf.stolenTextOpacity = 1.0;
        }

        ctx.save();
        ctx.translate(leprechaunLeaf.x, leprechaunLeaf.y);
        if (!leprechaunLeaf.isTrapped) {
          ctx.rotate(leprechaunLeaf.rotation);
          drawEmeraldLeprechaunLeaf(ctx, leprechaunLeaf.size, leprechaunLeaf.prisonerSway);
        } else {
          drawDancingLeprechaun(ctx, leprechaunLeaf.size, leprechaunLeaf.prisonerSway);
        }
        ctx.restore();

        if (leprechaunLeaf.isTrapped) {
          leprechaunLeaf.trapTimer++;
          leprechaunLeaf.stolenTextY -= 0.6;
          leprechaunLeaf.stolenTextOpacity -= 0.005;

          if (leprechaunLeaf.stolenText && leprechaunLeaf.stolenTextOpacity > 0) {
            ctx.save();
            ctx.fillStyle = '#10B981';
            ctx.shadowColor = '#00FF88';
            ctx.shadowBlur = 16;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.max(leprechaunLeaf.stolenTextOpacity, 0);
            ctx.fillText(`🤣 DUENDE DO PREJUÍZO: ${leprechaunLeaf.stolenText}`, leprechaunLeaf.x, leprechaunLeaf.stolenTextY);
            ctx.restore();
          }

          if (leprechaunLeaf.trapTimer > 210) {
            leprechaunLeaf.active = false;
          }
        }

        if (leprechaunLeaf.y > height + 50) {
          leprechaunLeaf.active = false;
        }
      }

      // RENDER CYBER GHOST LEAF / FANTASMA DAS TAXAS OCULTAS (ROXA CYBER)
      if (mode === 'leaves' && ghostLeaf.active) {
        ghostLeaf.swayPhase += ghostLeaf.swayFreq;
        const sway = Math.sin(ghostLeaf.swayPhase) * ghostLeaf.swayAmp;
        ghostLeaf.x += ghostLeaf.vx + sway;
        ghostLeaf.y += ghostLeaf.vy;
        ghostLeaf.rotation += ghostLeaf.rotationSpeed;
        ghostLeaf.prisonerSway += 0.07;

        const gdx = mouseX - ghostLeaf.x;
        const gdy = mouseY - ghostLeaf.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);

        if (gdist < 55 && !ghostLeaf.isTrapped) {
          ghostLeaf.isTrapped = true;
          ghostLeaf.trapTimer = 0;
          const ghostLosses = [
            '-R$ 1.850,00 (Assinaturas Esquecidas!)',
            '-R$ 960,00 (Anuidade Não Negociada!)',
            '-R$ 1.450,00 (Tarifas Bancárias Ocultas!)',
            '-R$ 2.300,00 (Juros do Rotativo!)',
          ];
          ghostLeaf.stolenText = ghostLosses[Math.floor(Math.random() * ghostLosses.length)];
          ghostLeaf.stolenTextY = ghostLeaf.y - 35;
          ghostLeaf.stolenTextOpacity = 1.0;
        }

        ctx.save();
        ctx.translate(ghostLeaf.x, ghostLeaf.y);
        if (!ghostLeaf.isTrapped) {
          ctx.rotate(ghostLeaf.rotation);
          drawPhantomPurpleLeaf(ctx, ghostLeaf.size, ghostLeaf.prisonerSway);
        } else {
          drawCyberGhost(ctx, ghostLeaf.size, ghostLeaf.prisonerSway);
        }
        ctx.restore();

        if (ghostLeaf.isTrapped) {
          ghostLeaf.trapTimer++;
          ghostLeaf.stolenTextY -= 0.6;
          ghostLeaf.stolenTextOpacity -= 0.005;

          if (ghostLeaf.stolenText && ghostLeaf.stolenTextOpacity > 0) {
            ctx.save();
            ctx.fillStyle = '#C084FC';
            ctx.shadowColor = '#A855F7';
            ctx.shadowBlur = 16;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.max(ghostLeaf.stolenTextOpacity, 0);
            ctx.fillText(`👻 GASTO FANTASMA: ${ghostLeaf.stolenText}`, ghostLeaf.x, ghostLeaf.stolenTextY);
            ctx.restore();
          }

          if (ghostLeaf.trapTimer > 210) {
            ghostLeaf.active = false;
          }
        }

        if (ghostLeaf.y > height + 50) {
          ghostLeaf.active = false;
        }
      }

      // RENDER PACMEN (COME-COMES DEVORADORES DE ORÇAMENTO DISFARÇADOS EM FOLHAS)
      pacmen.forEach((pacman) => {
        if (!pacman.active) return;

        const pdx = mouseX - pacman.x;
        const pdy = mouseY - pacman.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

        // Se o mouse passar perto da folha, REVELA O COME-COME VIVO E FAMINTO!
        if (pdist < 52 && !pacman.isTriggered) {
          pacman.isTriggered = true;
          pacman.triggerTimer = 0;

          // Decide a direção de corrida: se estiver mais pra esquerda da tela, corre pra direita; senão pra esquerda
          pacman.direction = pacman.x < width * 0.5 ? 1 : -1;

          if (pacman.type === 'yellow') {
            const yellowLosses = [
              '-R$ 1.850,00 (Comeu a Poupança!)',
              '-R$ 2.400,00 (Devorou a Reserva!)',
              '-R$ 1.200,00 (Economias Engolidas!)',
            ];
            pacman.stolenText = yellowLosses[Math.floor(Math.random() * yellowLosses.length)];
          } else if (pacman.type === 'red') {
            const redLosses = [
              '-R$ 3.600,00 (Mordida da Inflação!)',
              '-R$ 4.200,00 (Juros do Rotativo!)',
              '-R$ 2.950,00 (Poder de Compra Devorado!)',
            ];
            pacman.stolenText = redLosses[Math.floor(Math.random() * redLosses.length)];
          } else {
            const cyanLosses = [
              '-R$ 4.500,00 (Engoliu o Limite do Cartão!)',
              '-R$ 3.800,00 (Parcelas no Carnê!)',
              '-R$ 2.700,00 (Tarifa de Empréstimo!)',
            ];
            pacman.stolenText = cyanLosses[Math.floor(Math.random() * cyanLosses.length)];
          }

          pacman.stolenTextY = pacman.y - 35;
          pacman.stolenTextOpacity = 1.0;
        }

        ctx.save();
        ctx.translate(pacman.x, pacman.y);

        if (!pacman.isTriggered) {
          // Movimento de queda suave como folha
          pacman.swayPhase += pacman.swayFreq;
          const sway = Math.sin(pacman.swayPhase) * pacman.swayAmp;
          pacman.x += pacman.vx + sway;
          pacman.y += pacman.vy;
          pacman.rotation += pacman.rotationSpeed;

          ctx.rotate(pacman.rotation);
          drawPacmanLeaf(ctx, pacman.size, pacman.type);
        } else {
          // Come-Come VIVO: corre velozmente pela tela dando saltos e mastigando!
          pacman.triggerTimer++;
          pacman.mouthPhase += 0.14;

          // Corrida rápida na direção com saltinhos elásticos
          const runSpeed = pacman.direction * (2.6 + Math.min(pacman.triggerTimer * 0.02, 1.4));
          pacman.x += runSpeed;
          pacman.y += Math.sin(pacman.triggerTimer * 0.28) * 2.4 + 0.15;

          drawPacmanEntity(ctx, pacman);
        }
        ctx.restore();

        if (pacman.isTriggered) {
          pacman.stolenTextY -= 0.7;
          pacman.stolenTextOpacity -= 0.005;

          if (pacman.stolenText && pacman.stolenTextOpacity > 0) {
            ctx.save();
            const textCol =
              pacman.type === 'yellow' ? '#FACC15' : pacman.type === 'red' ? '#EF4444' : '#06B6D4';
            const shadowC =
              pacman.type === 'yellow' ? '#EAB308' : pacman.type === 'red' ? '#DC2626' : '#0891B2';
            ctx.fillStyle = textCol;
            ctx.shadowColor = shadowC;
            ctx.shadowBlur = 16;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.max(pacman.stolenTextOpacity, 0);

            const prefix =
              pacman.type === 'yellow'
                ? '🟡 COME-COME DA POUPANÇA: '
                : pacman.type === 'red'
                ? '🔴 COME-COME DA INFLAÇÃO: '
                : '🔵 COME-COME DAS PARCELAS: ';

            ctx.fillText(`${prefix}${pacman.stolenText}`, pacman.x, pacman.stolenTextY);
            ctx.restore();
          }

          if (pacman.triggerTimer > 210) {
            pacman.active = false;
          }
        }

        // Se sair da tela nas bordas inferiores ou laterais
        if (pacman.y > height + 60 || pacman.x < -80 || pacman.x > width + 80) {
          pacman.active = false;
        }
      });

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
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
