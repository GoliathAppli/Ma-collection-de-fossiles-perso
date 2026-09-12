// Conservatoire de Fossiles - Native Web Speech API Audio Guide (100% Offline & Client-Side)
import { Fossil } from '../types';

export interface SpeechSection {
  id: 'intro' | 'description' | 'diet' | 'fossile' | 'saviezVous';
  label: string;
  iconName: string;
  text: string;
}

/**
 * Checks if the browser natively supports the Web Speech API (SpeechSynthesis).
 * Completely client-side, zero network requests required.
 */
export function isWebSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

/**
 * Clean and format text for optimal, natural French pronunciation
 */
export function formatTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Clean markdown characters
    .replace(/[*_#`~[\]]/g, '')
    // Pronounce "Ma" as "millions d'années"
    .replace(/~(\d+)\s*Ma\b/gi, 'environ $1 millions d\'années')
    .replace(/(\d+)\s*Ma\b/gi, '$1 millions d\'années')
    .replace(/Ma\b/g, 'millions d\'années')
    // Abbreviations
    .replace(/\bca\.\s*/gi, 'environ ')
    .replace(/\bav\.\s*J\.-C\./gi, 'avant Jésus-Christ')
    .replace(/\bap\.\s*J\.-C\./gi, 'après Jésus-Christ')
    .replace(/\bex:\s*/gi, 'par exemple : ')
    .replace(/\bsp\./gi, 'espèce')
    // Clean excessive whitespaces and line breaks
    .replace(/\r?\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Translates era identifiers to natural French phrases for narration
 */
function getEraSpeechName(era?: string): string {
  switch (era) {
    case 'precambrian':
      return 'Précambrien';
    case 'paleozoic':
      return 'Paléozoïque, ou ère primaire';
    case 'mesozoic':
      return 'Mésozoïque, ou ère secondaire';
    case 'cenozoic':
      return 'Cénozoïque, ou ère tertiaire';
    default:
      return '';
  }
}

/**
 * Builds coherent, educational narration sections from a fossil record
 */
export function buildFossilSpeechSections(fossil: Fossil): SpeechSection[] {
  const sections: SpeechSection[] = [];

  // 1. Intro Section (Title, era, dating, provenance)
  const introParts: string[] = [];
  if (fossil.title) {
    introParts.push(`Spécimen : ${fossil.title}.`);
  }
  if (fossil.reference) {
    introParts.push(`Référence de collection : ${fossil.reference}.`);
  }
  const eraName = getEraSpeechName(fossil.era);
  if (eraName) {
    introParts.push(`Période géologique : ${eraName}.`);
  }
  if (fossil.periodeDatation) {
    introParts.push(`Datation estimée : ${fossil.periodeDatation}.`);
  } else if (fossil.lifespanPeriodStart) {
    const periodStr = fossil.lifespanPeriodEnd
      ? `du ${fossil.lifespanPeriodStart} au ${fossil.lifespanPeriodEnd}`
      : `durant le ${fossil.lifespanPeriodStart}`;
    introParts.push(`Espèce ayant vécu ${periodStr}.`);
  }
  if (fossil.provenanceName) {
    introParts.push(`Origine de la découverte : ${fossil.provenanceName}.`);
  }

  if (introParts.length > 0) {
    sections.push({
      id: 'intro',
      label: 'Présentation',
      iconName: 'Sparkles',
      text: formatTextForSpeech(introParts.join(' ')),
    });
  }

  // 2. Scientific Description
  if (fossil.description && fossil.description.trim()) {
    sections.push({
      id: 'description',
      label: 'Description Scientifique',
      iconName: 'BookOpen',
      text: formatTextForSpeech(fossil.description),
    });
  }

  // 3. Diet
  if (fossil.dietText && fossil.dietText.trim()) {
    sections.push({
      id: 'diet',
      label: 'Alimentation',
      iconName: 'Utensils',
      text: formatTextForSpeech(`Alimentation et mode de vie : ${fossil.dietText}`),
    });
  }

  // 4. Le Fossile / Particularités
  if (fossil.leFossileText && fossil.leFossileText.trim()) {
    sections.push({
      id: 'fossile',
      label: 'Le Fossile',
      iconName: 'Info',
      text: formatTextForSpeech(`Particularités du spécimen : ${fossil.leFossileText}`),
    });
  }

  // 5. Le Saviez-vous ?
  if (fossil.saviezVousText && fossil.saviezVousText.trim()) {
    sections.push({
      id: 'saviezVous',
      label: 'Le Saviez-Vous ?',
      iconName: 'HelpCircle',
      text: formatTextForSpeech(`Le saviez-vous ? ${fossil.saviezVousText}`),
    });
  }

  return sections;
}

/**
 * Splits a text into small sentence chunks (<= 150 chars) to prevent Chrome / Safari
 * from prematurely cutting off long TTS utterances after 15 seconds.
 */
export function splitTextIntoSpeechChunks(text: string, maxChunkLength = 150): string[] {
  if (!text) return [];

  // Match sentences or logical punctuation splits
  const rawSentences = text.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [text];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChunkLength) {
      chunks.push(trimmed);
    } else {
      // Split by commas or spaces if sentence is too long
      const parts = trimmed.split(/,\s*/);
      let currentSub = '';
      for (const p of parts) {
        if (!currentSub) {
          currentSub = p;
        } else if ((currentSub + ', ' + p).length <= maxChunkLength) {
          currentSub += ', ' + p;
        } else {
          chunks.push(currentSub + ',');
          currentSub = p;
        }
      }
      if (currentSub) {
        chunks.push(currentSub);
      }
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Select the best local French voice available in the browser
 */
export function findBestFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Filter French voices
  const frenchVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('fr')
  );

  if (frenchVoices.length === 0) {
    // Fallback: system default voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  // Preference 1: Natural / Premium local voices
  const preferredNatural = frenchVoices.find(
    (v) =>
      /natural|premium|thomas|amelie|aurelie|hortense|julie|celine|siri/i.test(v.name) &&
      v.localService
  );
  if (preferredNatural) return preferredNatural;

  // Preference 2: Any local French voice
  const localFrench = frenchVoices.find((v) => v.localService);
  if (localFrench) return localFrench;

  // Preference 3: fr-FR
  const frFR = frenchVoices.find(
    (v) => v.lang.toLowerCase().replace('_', '-') === 'fr-fr'
  );
  if (frFR) return frFR;

  return frenchVoices[0];
}
