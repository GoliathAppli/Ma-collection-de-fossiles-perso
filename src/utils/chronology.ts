import { Fossil } from '../types';

export const ERA_CHRONOLOGICAL_ORDER: Record<string, number> = {
  precambrian: 0,
  paleozoic: 1,
  mesozoic: 2,
  cenozoic: 3
};

export const GEOLOGIC_PERIOD_CHRONOLOGICAL_ORDER: Record<string, number> = {
  precambrien: 0,
  précambrien: 0,
  cambrien: 1,
  ordovicien: 2,
  silurien: 3,
  devonien: 4,
  dévonien: 4,
  carbonifere: 5,
  carbonifère: 5,
  permien: 6,
  trias: 7,
  jurassique: 8,
  cretace: 9,
  crétacé: 9,
  paleogene: 10,
  paléogène: 10,
  neogene: 11,
  néogène: 11,
  quaternaire: 12
};

/**
 * Returns a numerical weight representing the era in chronological sequence
 * 0 = Précambrien, 1 = Paléozoïque, 2 = Mésozoïque, 3 = Cénozoïque
 */
export function getEraChronologicalWeight(era?: string): number {
  if (!era) return 99;
  const norm = era.toLowerCase().trim();
  if (norm.includes('prec') || norm.includes('préc')) return 0;
  if (norm.includes('paleo') || norm.includes('paléo')) return 1;
  if (norm.includes('meso') || norm.includes('méso')) return 2;
  if (norm.includes('ceno') || norm.includes('céno')) return 3;
  return ERA_CHRONOLOGICAL_ORDER[norm] ?? 99;
}

/**
 * Returns a numerical weight for the geological period of a fossil
 */
export function getPeriodChronologicalWeight(fossil: Fossil): number {
  const periodStr = (
    fossil.lifespanPeriodStart ||
    fossil.periodeDatation ||
    fossil.lifespanPeriodEnd ||
    ''
  ).toLowerCase().trim();

  for (const [name, weight] of Object.entries(GEOLOGIC_PERIOD_CHRONOLOGICAL_ORDER)) {
    if (periodStr.includes(name)) {
      return weight;
    }
  }
  return 99;
}

/**
 * Parses reference string into prefix and number for natural alphanumeric sorting
 * e.g., "P1" -> { prefix: "P", num: 1 }, "M13" -> { prefix: "M", num: 13 }, "C7" -> { prefix: "C", num: 7 }
 */
export function parseFossilReference(ref?: string): { prefix: string; num: number; raw: string } {
  if (!ref || !ref.trim()) {
    return { prefix: '', num: 999999, raw: '' };
  }
  const clean = ref.trim();
  const match = clean.match(/^([a-zA-Z]+)\s*[-_.]?\s*(\d+)/);
  if (match) {
    return {
      prefix: match[1].toUpperCase(),
      num: parseInt(match[2], 10),
      raw: clean
    };
  }
  return {
    prefix: clean.toUpperCase(),
    num: 999999,
    raw: clean
  };
}

/**
 * Compares two fossils chronologically:
 * 1. Era order: Précambrien (0) -> Paléozoïque (1) -> Mésozoïque (2) -> Cénozoïque (3)
 * 2. Reference order within matching prefixes (e.g. M1 < M2 < ... < M12 < M13)
 * 3. Period order (Cambrien < Ordovicien < ... < Quaternaire)
 * 4. Fallback reference number / title
 */
export function compareFossilsChronologically(a: Fossil, b: Fossil): number {
  // 1. Primary sort: Geologic Era
  const eraA = getEraChronologicalWeight(a.era);
  const eraB = getEraChronologicalWeight(b.era);
  if (eraA !== eraB) {
    return eraA - eraB;
  }

  // 2. Reference code comparison if both have standard format (P1, M13, C7, etc.)
  const parsedA = parseFossilReference(a.reference);
  const parsedB = parseFossilReference(b.reference);

  if (parsedA.num !== 999999 && parsedB.num !== 999999) {
    if (parsedA.prefix === parsedB.prefix) {
      return parsedA.num - parsedB.num;
    }
  }

  // 3. Geological period comparison
  const periodA = getPeriodChronologicalWeight(a);
  const periodB = getPeriodChronologicalWeight(b);
  if (periodA !== periodB) {
    return periodA - periodB;
  }

  // 4. Secondary reference number comparison
  if (parsedA.num !== parsedB.num) {
    return parsedA.num - parsedB.num;
  }

  // 5. Title alphabetical fallback
  return (a.title || '').localeCompare(b.title || '');
}

/**
 * Returns a new array with all fossils sorted chronologically
 */
export function sortFossilsChronologically(fossils: Fossil[]): Fossil[] {
  if (!Array.isArray(fossils)) return [];
  return [...fossils].sort(compareFossilsChronologically);
}
