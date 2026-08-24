import { AppConfig, Fossil, TechnicalSheetRow } from '../types';
import { optimizeAppConfigImages } from './imageCompressor';

export interface ImportResult {
  success: boolean;
  config?: AppConfig;
  error?: string;
  recoveredCount?: number;
  isRepaired?: boolean;
}

/**
 * Attempts to repair a JSON string that was truncated (e.g. cut off mid-string or mid-object).
 */
function attemptJsonRepair(rawStr: string): any {
  // Strategy 1: Find the last unclosed string and close open brackets
  try {
    let clean = rawStr.trim();

    // Check if ends inside a string (odd number of unescaped quotes or unterminated string)
    // Find the last complete object boundary
    const lastValidBrace = clean.lastIndexOf('}');
    if (lastValidBrace > 0) {
      let candidate = clean.substring(0, lastValidBrace + 1);

      // Count open brackets
      let openBrackets = 0;
      let openBraces = 0;
      let inString = false;
      let isEscaped = false;

      for (let i = 0; i < candidate.length; i++) {
        const char = candidate[i];
        if (char === '\\' && !isEscaped) {
          isEscaped = true;
          continue;
        }
        if (char === '"' && !isEscaped) {
          inString = !inString;
        } else if (!inString) {
          if (char === '[') openBrackets++;
          else if (char === ']') openBrackets = Math.max(0, openBrackets - 1);
          else if (char === '{') openBraces++;
          else if (char === '}') openBraces = Math.max(0, openBraces - 1);
        }
        isEscaped = false;
      }

      // Close open brackets
      for (let b = 0; b < openBrackets; b++) {
        candidate += ']';
      }
      for (let b = 0; b < openBraces; b++) {
        candidate += '}';
      }

      return JSON.parse(candidate);
    }
  } catch (err) {
    console.warn('Strategy 1 repair failed:', err);
  }

  // Strategy 2: Individual item recovery (extracting valid fossil objects by regex)
  try {
    const fossils: Fossil[] = [];
    const technicalSheets: TechnicalSheetRow[] = [];

    // Regex to match JSON objects with "id" and other characteristic keys
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match: RegExpExecArray | null;

    while ((match = objectRegex.exec(rawStr)) !== null) {
      try {
        const item = JSON.parse(match[0]);
        if (item && item.id) {
          if (item.fossilName !== undefined || item.fossilImage !== undefined) {
            technicalSheets.push(item);
          } else if (item.title !== undefined || item.era !== undefined) {
            fossils.push(item);
          }
        }
      } catch {
        // Skip malformed individual segment
      }
    }

    if (fossils.length > 0 || technicalSheets.length > 0) {
      return {
        fossils,
        technicalSheets,
        lastUpdated: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Strategy 2 recovery failed:', err);
  }

  throw new Error('Impossible de réparer le fichier JSON corrompu.');
}

/**
 * Safely reads and parses a JSON file, even for very large files on mobile devices.
 */
export async function readAndParseJsonFile(
  file: File,
  onProgress?: (percent: number, statusText: string) => void
): Promise<ImportResult> {
  if (!file) {
    return { success: false, error: 'Aucun fichier sélectionné.' };
  }

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
  if (onProgress) {
    onProgress(10, `Lecture du fichier (${fileSizeMB} Mo)...`);
  }

  let textContent = '';
  try {
    // Prefer modern stream-backed file.text()
    if (typeof file.text === 'function') {
      textContent = await file.text();
    } else {
      textContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = (e) => reject(new Error('Erreur de lecture FileReader.'));
        reader.readAsText(file);
      });
    }
  } catch (readErr: any) {
    return {
      success: false,
      error: `Erreur lors de la lecture du fichier (${readErr.message || 'Mémoire insuffisante sur cet appareil'}).`,
    };
  }

  if (onProgress) {
    onProgress(40, 'Analyse et validation des données...');
  }

  let parsed: any = null;
  let isRepaired = false;

  // 1. Direct standard parse
  try {
    parsed = JSON.parse(textContent);
  } catch (parseErr: any) {
    console.warn('Standard JSON.parse failed, attempting auto-repair for large/truncated file:', parseErr);
    if (onProgress) {
      onProgress(50, 'Fichier volumineux ou tronqué : Récupération automatique en cours...');
    }

    // 2. Resilient Auto-Repair
    try {
      parsed = attemptJsonRepair(textContent);
      isRepaired = true;
    } catch (repairErr: any) {
      return {
        success: false,
        error: `Fichier corrompu ou tronqué (${parseErr.message}). La taille du fichier (${fileSizeMB} Mo) a dépassé la limite de mémoire de votre appareil.`,
      };
    }
  }

  if (!parsed || (typeof parsed !== 'object')) {
    return { success: false, error: 'Le fichier ne contient pas une structure JSON valide.' };
  }

  // Handle single array format or full AppConfig format
  let finalConfig: AppConfig;
  if (Array.isArray(parsed)) {
    finalConfig = {
      fossils: parsed,
      technicalSheets: [],
      videoUrl1: '',
      scaleVideoUrl: '',
      secondHomeTitle: 'Collection de Fossiles',
      secondHomeImage: { url: '', scale: 1, posX: 0, posY: 0 },
      eraPrecambrianImage: { url: '', scale: 1, posX: 0, posY: 0 },
      eraPaleozoicImage: { url: '', scale: 1, posX: 0, posY: 0 },
      eraMesozoicImage: { url: '', scale: 1, posX: 0, posY: 0 },
      eraCenozoicImage: { url: '', scale: 1, posX: 0, posY: 0 },
    };
  } else {
    finalConfig = {
      ...parsed,
      fossils: Array.isArray(parsed.fossils) ? parsed.fossils : [],
      technicalSheets: Array.isArray(parsed.technicalSheets) ? parsed.technicalSheets : [],
    };
  }

  const fossilCount = finalConfig.fossils?.length || 0;
  const sheetCount = finalConfig.technicalSheets?.length || 0;

  if (fossilCount === 0 && sheetCount === 0) {
    return {
      success: false,
      error: 'Le fichier ne contient aucune fiche de fossile reconnue.',
    };
  }

  // 3. Compress images to ensure light payload on the device
  if (onProgress) {
    onProgress(70, `Optimisation et compression des images (${fossilCount} fossiles)...`);
  }

  try {
    finalConfig = await optimizeAppConfigImages(finalConfig, (pct, label) => {
      if (onProgress) {
        onProgress(70 + Math.round(pct * 0.28), label);
      }
    });
  } catch (optErr) {
    console.warn('Post-import optimization warning:', optErr);
  }

  if (onProgress) {
    onProgress(100, 'Importation terminée avec succès !');
  }

  return {
    success: true,
    config: finalConfig,
    recoveredCount: fossilCount,
    isRepaired,
  };
}
