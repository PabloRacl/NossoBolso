import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG Premium Oficial do App Icon — NossoBolso Finance OS
const createSvgIcon = ({ isMaskable = false, isForeground = false } = {}) => {
  const scale = isMaskable ? 0.78 : (isForeground ? 0.65 : 0.88);
  const translate = isMaskable ? 56.32 : (isForeground ? 89.6 : 30.72);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#132338" />
      <stop offset="60%" stop-color="#070D18" />
      <stop offset="100%" stop-color="#03060B" />
    </radialGradient>

    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00FF88" />
      <stop offset="40%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="goldCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="35%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur1" />
      <feGaussianBlur stdDeviation="8" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  ${
    isForeground
      ? '' // Foreground não deve ter background para ícone adaptativo
      : isMaskable
      ? '<rect width="512" height="512" fill="url(#bgGlow)" />'
      : '<rect width="512" height="512" rx="115" fill="url(#bgGlow)" /><rect width="504" height="504" x="4" y="4" rx="111" fill="none" stroke="#00FF88" stroke-opacity="0.25" stroke-width="6" />'
  }

  ${!isForeground ? '<circle cx="256" cy="180" r="140" fill="#00FF88" opacity="0.12" filter="url(#neonGlow)" />' : ''}

  <g transform="translate(${translate}, ${translate}) scale(${scale})">
    <g filter="url(#softShadow)">
      <rect x="76" y="86" width="360" height="220" rx="44" fill="#071A1A" stroke="#00FF88" stroke-width="14" stroke-opacity="0.9" />
      <rect x="86" y="96" width="340" height="200" rx="36" fill="url(#emeraldGrad)" />
      <rect x="108" y="118" width="296" height="156" rx="24" fill="none" stroke="#A7F3D0" stroke-opacity="0.45" stroke-width="5" stroke-dasharray="16 10" />

      <circle cx="140" cy="196" r="20" fill="#065F46" opacity="0.7" />
      <circle cx="140" cy="196" r="10" fill="#A7F3D0" opacity="0.5" />
      <circle cx="372" cy="196" r="20" fill="#065F46" opacity="0.7" />
      <circle cx="372" cy="196" r="10" fill="#A7F3D0" opacity="0.5" />

      <g filter="url(#softShadow)">
        <circle cx="256" cy="196" r="56" fill="url(#goldCore)" stroke="#FEF08A" stroke-width="8" />
        <circle cx="256" cy="196" r="46" fill="none" stroke="#78350F" stroke-width="2" opacity="0.3" />
        <path d="M256 160 V232 M238 176 C238 166 274 162 274 182 C274 202 238 196 238 216 C238 236 274 230 274 220" 
              stroke="#5E2207" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </g>
    </g>

    <g stroke-linecap="round" stroke-linejoin="round" filter="url(#neonGlow)">
      <path d="M256 306 V376" stroke="#38BDF8" stroke-width="14" />
      <path d="M136 376 H376" stroke="#38BDF8" stroke-width="14" />
      <path d="M136 376 V410" stroke="#F43F5E" stroke-width="12" />
      <path d="M256 376 V410" stroke="#38BDF8" stroke-width="12" />
      <path d="M376 376 V410" stroke="#F59E0B" stroke-width="12" />
    </g>

    <circle cx="136" cy="426" r="26" fill="#F43F5E" stroke="#FECDD3" stroke-width="7" filter="url(#softShadow)" />
    <circle cx="136" cy="426" r="9" fill="#FFFFFF" />

    <circle cx="256" cy="426" r="30" fill="#0284C7" stroke="#BAE6FD" stroke-width="8" filter="url(#softShadow)" />
    <circle cx="256" cy="426" r="11" fill="#FFFFFF" />

    <circle cx="376" cy="426" r="26" fill="#F59E0B" stroke="#FEF3C7" stroke-width="7" filter="url(#softShadow)" />
    <circle cx="376" cy="426" r="9" fill="#FFFFFF" />
  </g>
</svg>
`;
};

// SVG Splash Screen para Android
const createSvgSplash = () => {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <radialGradient id="splashBg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#111B2E" />
      <stop offset="60%" stop-color="#080D18" />
      <stop offset="100%" stop-color="#04060B" />
    </radialGradient>
  </defs>

  <!-- Fundo Escuro Obsidian -->
  <rect width="1080" height="1920" fill="url(#splashBg)" />

  <!-- Logo Centralizada -->
  <g transform="translate(284, 704)">
    ${createSvgIcon({ isMaskable: false })}
  </g>

  <!-- Tipografia Oficial NossoBolso -->
  <text x="540" y="1320" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
    NossoBolso
  </text>
  <text x="540" y="1380" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#00FF88" text-anchor="middle" letter-spacing="4">
    FINANCE OS
  </text>
</svg>
`;
};

async function generateAllIcons() {
  const publicDir = path.resolve('public');
  const androidResDir = path.resolve('android/app/src/main/res');

  console.log('🎨 Renderizando ícones para Web/PWA e Android Nativo...');

  const standardSvg = createSvgIcon({ isMaskable: false });
  const maskableSvg = createSvgIcon({ isMaskable: true });
  const foregroundSvg = createSvgIcon({ isForeground: true });
  const splashSvg = createSvgSplash();

  // 1. PWA & Web
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg.trim(), 'utf8');

  await sharp(Buffer.from(standardSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(Buffer.from(standardSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(Buffer.from(standardSvg)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 2. Android Mipmap (Ícones de Launcher em todas as densidades)
  if (fs.existsSync(androidResDir)) {
    const mipmapConfigs = [
      { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
      { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
      { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
      { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
      { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
    ];

    for (const conf of mipmapConfigs) {
      const targetDir = path.join(androidResDir, conf.dir);
      if (fs.existsSync(targetDir)) {
        await sharp(Buffer.from(standardSvg)).resize(conf.size, conf.size).png().toFile(path.join(targetDir, 'ic_launcher.png'));
        await sharp(Buffer.from(maskableSvg)).resize(conf.size, conf.size).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
        await sharp(Buffer.from(foregroundSvg)).resize(conf.fgSize, conf.fgSize).png().toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
      }
    }

    // 3. Android Splash Screens
    const splashDirs = [
      'drawable',
      'drawable-port-mdpi',
      'drawable-port-hdpi',
      'drawable-port-xhdpi',
      'drawable-port-xxhdpi',
      'drawable-port-xxxhdpi',
      'drawable-land-mdpi',
      'drawable-land-hdpi',
      'drawable-land-xhdpi',
      'drawable-land-xxhdpi',
      'drawable-land-xxxhdpi',
    ];

    const splashBuffer = await sharp(Buffer.from(splashSvg)).resize(1080, 1920).png().toBuffer();

    for (const d of splashDirs) {
      const targetDir = path.join(androidResDir, d);
      if (fs.existsSync(targetDir)) {
        fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuffer);
      }
    }
  }

  console.log('✅ Todos os ícones e telas de splash foram gerados com sucesso!');
}

generateAllIcons().catch((err) => {
  console.error('❌ Erro ao gerar ícones:', err);
  process.exit(1);
});
