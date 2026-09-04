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

    let nextTrapTime = Date.now() + 4000;

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
        nextTrapTime = now + 12000 + Math.random() * 9000;
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
