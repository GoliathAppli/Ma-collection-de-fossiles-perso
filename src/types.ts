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
  
  description: string;
  descImages: ImageSettings[]; // up to 6
  
  dietText: string;
  dietImages: ImageSettings[]; // up to 6
  
  leFossileText: string;
  leFossileImage: ImageSettings;
  provenanceCoords: { lat: number; lng: number };
  provenanceName: string;
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
