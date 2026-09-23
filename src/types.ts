export interface ImageSettings {
  url: string;
  scale: number; // e.g. 1.0, 1.5, etc.
  posX: number;  // Translate X in %
  posY: number;  // Translate Y in %
}

export interface Fossil {
  id: string;
  era: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic';
  title: string;
  image: ImageSettings;
  thumbnailImage?: ImageSettings;
  reference: string;
  
  dimensions?: string; // Taille / dimensions du fossile (ex: 12 × 8 cm)
  tailleEspece?: string; // Taille estimée de l'espèce vivante (ex: ~1,5 m, Envergure: 80 cm)
  description: string;
  descImages: ImageSettings[]; // up to 6
  
  dietText: string;
  dietImages?: ImageSettings[]; // Legacy / empty
  dietTypes?: string[]; // Types d'alimentation sélectionnés (ex: 'Carnivore', 'Piscivore'...)
  
  leFossileText: string;
  leFossileImage: ImageSettings;
  provenanceCoords: { lat: number; lng: number };
  provenanceName: string;
  provenanceVille?: string;       // Ville / localité séparée
  provenancePays?: string;        // Pays séparé
  provenanceFormation?: string;   // Formation géologique séparée
  lifespanPeriodStart: string; // e.g., "Cambrien"
  lifespanPeriodEnd: string;   // e.g., "Ordovicien"
  
  saviezVousText: string;
  saviezVousImage: ImageSettings;

  // Technical sheet info (optional fields for mirroring to Technical Sheets)
  provenanceDate?: string;
  periodeDatation?: string;
  dateLieuAchat?: string;
  prixAchat?: string;
  certificatImage?: ImageSettings;
}

export interface GeologicPeriodInfo {
  name: string;
  era: string; // e.g. "Paléozoïque"
  duration: string; // e.g. "541 - 252 Ma"
  description: string;
  details: string;
  color: string;
}

export interface TechnicalSheetRow {
  id: string;
  fossilName: string;
  fossilImage: ImageSettings;
  provenanceDate: string;
  periodeDatation: string;
  dateLieuAchat: string;
  prixAchat?: string;
  certificatImage: ImageSettings;
}

export interface AppConfig {
  lastUpdated?: number; // Unix timestamp of last modification
  adminPassword?: string; // Optional custom admin password
  videoUrl1: string; // Admin video on landing page
  secondHomeTitle: string; // Second home title
  secondHomeImage: ImageSettings; // Second home image
  eraPrecambrianImage?: ImageSettings;
  eraPaleozoicImage?: ImageSettings;
  eraMesozoicImage?: ImageSettings;
  eraCenozoicImage?: ImageSettings;
  scaleVideoUrl: string; // Video under geological timeline
  fossils: Fossil[];
  technicalSheets: TechnicalSheetRow[];
}

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  filePath: string;
  autoSync: boolean;
  lastSyncTime?: number;
  lastCommitSha?: string;
}

export interface GitHubSyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  lastSyncTime?: number;
}

export const DIET_CATEGORIES = [
  { id: 'Insectivore', label: 'Insectivore', icon: 'Bug' },
  { id: 'Herbivore', label: 'Herbivore', icon: 'Leaf' },
  { id: 'Molluscivore', label: 'Molluscivore', icon: 'Shell' },
  { id: 'Piscivore', label: 'Piscivore', icon: 'Fish' },
  { id: 'Carnivore', label: 'Carnivore', icon: 'Drumstick' },
  { id: 'Omnivore', label: 'Omnivore', icon: 'Utensils' },
  { id: 'Suspensivore', label: 'Suspensivore', icon: 'Waves' },
  { id: 'Planctonivore', label: 'Planctonivore', icon: 'Sparkles' },
  { id: 'Charognard', label: 'Charognard', icon: 'Skull' },
  { id: 'Detritivore', label: 'Detritivore', icon: 'Recycle' },
  { id: 'Crustacivore', label: 'Crustacivore', icon: 'Shrimp' },
  { id: 'Alimentation inconnu', label: 'Alimentation inconnu', icon: 'HelpCircle' },
] as const;

export type DietCategoryName = typeof DIET_CATEGORIES[number]['id'];
