/**
 * Utility to compress and optimize images before storing or syncing to GitHub.
 * Resizes large dimensions (max 900px) and converts heavy PNGs/BMPs/uncompressed JPEGs
 * into ultra-lightweight WebP / PNG / JPEG while 100% PRESERVING ALPHA TRANSPARENCY for PNGs.
 * Reduces JSON payloads from 270MB to < 5MB so they instantly sync to GitHub
 * and load seamlessly on mobile devices.
 */

import { AppConfig, ImageSettings, Fossil, TechnicalSheetRow } from '../types';

/**
 * Compresses a single data URL string if it's an image.
 * Guarantees that transparent PNGs remain 100% transparent (no dark background box).
 */
export async function compressDataUrl(
  dataUrl: string | undefined,
  maxDimension = 900,
  quality = 0.8
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image/')) return dataUrl; // Not a base64 image (URL or video)

  // If already very compact (< 18KB), return as is
  if (dataUrl.length < 18000) return dataUrl;

  return new Promise<string>((resolve) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(dataUrl);
      }
    }, 5000);

    try {
      const img = new Image();
      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);

        try {
          let { width, height } = img;
          if (!width || !height) {
            resolve(dataUrl);
            return;
          }

          // Calculate new dimensions maintaining aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Draw with smooth interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Clear transparent canvas - DO NOT FILL SOLID BACKGROUND to preserve PNG transparency!
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const isPng = dataUrl.startsWith('data:image/png');
          const isWebp = dataUrl.startsWith('data:image/webp');
          const isSvg = dataUrl.startsWith('data:image/svg');

          let compressed: string | undefined;

          // For transparent formats (PNG, WebP, SVG), prefer WebP (which preserves full alpha transparency with 80% compression)
          if (isPng || isWebp || isSvg) {
            try {
              compressed = canvas.toDataURL('image/webp', quality);
              // Verify that the browser actually exported WebP and not a fallback
              if (!compressed.startsWith('data:image/webp')) {
                compressed = canvas.toDataURL('image/png');
              }
            } catch {
              compressed = canvas.toDataURL('image/png');
            }
          } else {
            // For standard JPEGs, use WebP or JPEG
            try {
              compressed = canvas.toDataURL('image/webp', quality);
              if (!compressed.startsWith('data:image/webp')) {
                compressed = canvas.toDataURL('image/jpeg', quality);
              }
            } catch {
              compressed = canvas.toDataURL('image/jpeg', quality);
            }
          }

          if (compressed && compressed.length < dataUrl.length) {
            resolve(compressed);
          } else {
            resolve(dataUrl);
          }
        } catch (canvasErr) {
          console.warn('Canvas compression error, using original:', canvasErr);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        resolve(dataUrl);
      }
    }
  });
}

/**
 * Compresses an ImageSettings object while preserving transparency.
 */
export async function compressImageSettings(
  settings: ImageSettings | undefined,
  maxDim = 900,
  quality = 0.8
): Promise<ImageSettings | undefined> {
  if (!settings) return settings;
  if (!settings.url || !settings.url.startsWith('data:image/')) return settings;

  const compressedUrl = await compressDataUrl(settings.url, maxDim, quality);
  return {
    ...settings,
    url: compressedUrl,
  };
}

/**
 * Traverses all images in the museum configuration and optimizes them.
 */
export async function optimizeAppConfigImages(
  config: AppConfig,
  onProgress?: (progressPercent: number, label: string) => void
): Promise<AppConfig> {
  if (!config) return config;

  const totalFossils = config.fossils?.length || 0;
  const totalSheets = config.technicalSheets?.length || 0;
  const totalSteps = totalFossils + totalSheets + 5;
  let currentStep = 0;

  const report = (label: string) => {
    currentStep++;
    if (onProgress) {
      const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      onProgress(pct, label);
    }
  };

  // 1. Optimize Main / Era Images
  report('Optimisation des images de couverture...');
  const secondHomeImage = await compressImageSettings(config.secondHomeImage, 900, 0.8);
  const eraPrecambrianImage = await compressImageSettings(config.eraPrecambrianImage, 900, 0.8);
  const eraPaleozoicImage = await compressImageSettings(config.eraPaleozoicImage, 900, 0.8);
  const eraMesozoicImage = await compressImageSettings(config.eraMesozoicImage, 900, 0.8);
  const eraCenozoicImage = await compressImageSettings(config.eraCenozoicImage, 900, 0.8);

  // 2. Optimize Fossils
  const optimizedFossils: Fossil[] = [];
  if (Array.isArray(config.fossils)) {
    for (let i = 0; i < config.fossils.length; i++) {
      const f = config.fossils[i];
      report(`Optimisation fossile ${i + 1}/${totalFossils} (${f.title || 'Spécimen'})...`);

      // Thumbnails: 400px, quality 0.75
      const thumbnailImage = await compressImageSettings(f.thumbnailImage, 400, 0.75);
      // Main photos & certificates: 900px, quality 0.80
      const image = await compressImageSettings(f.image, 900, 0.8);
      const leFossileImage = await compressImageSettings(f.leFossileImage, 900, 0.8);
      const certificatImage = await compressImageSettings(f.certificatImage, 900, 0.8);
      const saviezVousImage = await compressImageSettings(f.saviezVousImage, 900, 0.8);

      // Multiple description images (up to 6)
      const descImages: ImageSettings[] = [];
      if (Array.isArray(f.descImages)) {
        for (let d = 0; d < f.descImages.length; d++) {
          const c = await compressImageSettings(f.descImages[d], 900, 0.8);
          if (c) descImages.push(c);
        }
      }

      // Multiple diet images (up to 6)
      const dietImages: ImageSettings[] = [];
      if (Array.isArray(f.dietImages)) {
        for (let dt = 0; dt < f.dietImages.length; dt++) {
          const c = await compressImageSettings(f.dietImages[dt], 900, 0.8);
          if (c) dietImages.push(c);
        }
      }

      optimizedFossils.push({
        ...f,
        thumbnailImage,
        image,
        leFossileImage,
        certificatImage,
        saviezVousImage: saviezVousImage || f.saviezVousImage,
        descImages,
        dietImages,
      });
    }
  }

  // 3. Optimize Technical Sheets
  const optimizedSheets: TechnicalSheetRow[] = [];
  if (Array.isArray(config.technicalSheets)) {
    for (let i = 0; i < config.technicalSheets.length; i++) {
      const s = config.technicalSheets[i];
      report(`Optimisation fiche ${i + 1}/${totalSheets}...`);

      const fossilImage = await compressImageSettings(s.fossilImage, 900, 0.8);
      const certificatImage = await compressImageSettings(s.certificatImage, 900, 0.8);

      optimizedSheets.push({
        ...s,
        fossilImage,
        certificatImage,
      });
    }
  }

  return {
    ...config,
    secondHomeImage,
    eraPrecambrianImage,
    eraPaleozoicImage,
    eraMesozoicImage,
    eraCenozoicImage,
    fossils: optimizedFossils,
    technicalSheets: optimizedSheets,
  };
}
