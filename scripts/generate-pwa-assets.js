import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const iconSvgPath = path.join(ICONS_DIR, 'icon.svg');
const iconMaskableSvgPath = path.join(ICONS_DIR, 'icon-maskable.svg');

const iconSvgBuffer = fs.readFileSync(iconSvgPath);
const iconMaskableSvgBuffer = fs.readFileSync(iconMaskableSvgPath);

async function generateAssets() {
  console.log('Generating PWA Icons and Screenshots...');

  const standardSizes = [48, 72, 96, 128, 144, 192, 384, 512];

  for (const size of standardSizes) {
    await sharp(iconSvgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Maskable icons (Android Adaptive Icons / App Drawer & Folders)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    await sharp(iconMaskableSvgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`));
    console.log(`Generated icon-maskable-${size}x${size}.png`);
  }

  // Apple Touch Icon (180x180)
  await sharp(iconSvgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));

  // Favicon (64x64)
  await sharp(iconSvgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(ICONS_DIR, 'favicon.png'));

  // Favicon.ico (32x32)
  await sharp(iconSvgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon.ico'));

  // Screenshots for Google Play WebAPK & Rich Install Dialog
  // 1. Mobile Screenshot (1080x1920)
  const mobileSvg = `
    <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#020617"/>
      <rect x="40" y="80" width="1000" height="120" rx="30" fill="#0f172a" stroke="#ca8a04" stroke-width="2"/>
      <text x="100" y="155" fill="#fde047" font-size="44" font-family="sans-serif" font-weight="bold">CONSERVATOIRE DE FOSSILES</text>
      <rect x="40" y="240" width="1000" height="1500" rx="36" fill="#0b1120" stroke="#1e293b" stroke-width="3"/>
      <circle cx="540" cy="700" r="220" fill="#0f172a" stroke="#ca8a04" stroke-width="4"/>
      <text x="540" y="1050" text-anchor="middle" fill="#f8fafc" font-size="52" font-family="sans-serif" font-weight="bold">Galerie Paléontologique</text>
      <text x="540" y="1120" text-anchor="middle" fill="#94a3b8" font-size="36" font-family="sans-serif">Spécimens Authentiques &amp; Frise Chronologique</text>
      <rect x="240" y="1250" width="600" height="100" rx="30" fill="#ca8a04"/>
      <text x="540" y="1315" text-anchor="middle" fill="#020617" font-size="38" font-family="sans-serif" font-weight="bold">EXPLORER L'EXPOSITION</text>
    </svg>
  `;
  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(SCREENSHOTS_DIR, 'screenshot-mobile.png'));

  // 2. Desktop / Tablet Screenshot (1920x1080)
  const desktopSvg = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#020617"/>
      <rect x="60" y="50" width="1800" height="90" rx="20" fill="#0f172a" stroke="#ca8a04" stroke-width="2"/>
      <text x="120" y="110" fill="#fde047" font-size="36" font-family="sans-serif" font-weight="bold">CONSERVATOIRE DE FOSSILES — EXPOSITION PERMANENTE</text>
      <rect x="60" y="180" width="1800" height="820" rx="28" fill="#0b1120" stroke="#1e293b" stroke-width="3"/>
      <circle cx="480" cy="590" r="220" fill="#0f172a" stroke="#ca8a04" stroke-width="4"/>
      <text x="800" y="480" fill="#f8fafc" font-size="56" font-family="sans-serif" font-weight="bold">Collection Paléontologique &amp; Archives</text>
      <text x="800" y="560" fill="#94a3b8" font-size="32" font-family="sans-serif">Accès interactif à tous les fossiles, cartes de provenance, frise géologique et fiches d'authenticité.</text>
      <rect x="800" y="650" width="400" height="80" rx="20" fill="#ca8a04"/>
      <text x="1000" y="702" text-anchor="middle" fill="#020617" font-size="28" font-family="sans-serif" font-weight="bold">DÉCOUVRIR LES SPÉCIMENS</text>
    </svg>
  `;
  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(SCREENSHOTS_DIR, 'screenshot-desktop.png'));

  console.log('PWA Assets successfully generated!');
}

generateAssets().catch(console.error);
