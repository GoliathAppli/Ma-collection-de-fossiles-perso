import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Globe, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Navigation
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { playDinoSound } from '../utils/data/audio';

// Map layer configurations for realistic rendering
type MapLayerType = 'satellite' | 'streets' | 'topo';

interface LayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const TILE_LAYERS: Record<MapLayerType, LayerConfig> = {
  satellite: {
    name: 'Satellite Réaliste',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS',
    maxZoom: 19
  },
  streets: {
    name: 'Carte & Villes',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  topo: {
    name: 'Relief Géologique',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, USGS, NOAA',
    maxZoom: 18
  }
};

// Comprehensive offline database with exact real-world GPS coordinates
// covering famous fossil formations, world countries, and French departments
const GPS_FOSSIL_DATABASE: Record<string, { lat: number; lng: number; zoom: number; label: string }> = {
  // --- MAROC (Gisements emblématiques du Sahara & Crétacé/Dévonien) ---
  "kem kem": { lat: 30.8250, lng: -4.0170, zoom: 9, label: "Lits des Kem Kem (Maroc) - Dinosaures & Ptérosaures" },
  "kemkem": { lat: 30.8250, lng: -4.0170, zoom: 9, label: "Lits des Kem Kem (Maroc)" },
  "erfoud": { lat: 31.4333, lng: -4.2333, zoom: 9, label: "Erfoud (Maroc) - Dévonien, Goniatites & Orthocères" },
  "taouz": { lat: 30.8986, lng: -3.9875, zoom: 9, label: "Taouz (Maroc) - Gisements à Vertébrés Crétacé" },
  "khouribga": { lat: 32.8833, lng: -6.9067, zoom: 9, label: "Khouribga (Maroc) - Phosphates & Dents de Mosasaures" },
  "oulad abdoun": { lat: 32.8500, lng: -6.9500, zoom: 9, label: "Bassin d'Oulad Abdoun (Maroc) - Crétacé/Paléocène" },
  "sidi daoui": { lat: 32.9000, lng: -6.8500, zoom: 9, label: "Sidi Daoui, Khouribga (Maroc) - Dents de Squales & Reptiles" },
  "alnif": { lat: 31.1167, lng: -5.1667, zoom: 9, label: "Alnif (Maroc) - Capitale mondiale des Trilobites" },
  "merzouga": { lat: 31.0990, lng: -4.0110, zoom: 8, label: "Merzouga, Erg Chebbi (Maroc)" },
  "fezouata": { lat: 30.4000, lng: -5.8333, zoom: 9, label: "Formation des Fezouata, Zagora (Maroc) - Faune Cambrien/Ordovicien" },
  "zagora": { lat: 30.3333, lng: -5.8333, zoom: 8, label: "Zagora, Vallée du Drâa (Maroc)" },
  "midelt": { lat: 32.6833, lng: -4.7333, zoom: 8, label: "Midelt (Maroc) - Minéraux & Fossiles" },
  "maroc": { lat: 31.7917, lng: -7.0926, zoom: 6, label: "Royaume du Maroc" },
  "morocco": { lat: 31.7917, lng: -7.0926, zoom: 6, label: "Morocco" },

  // --- ALLEMAGNE (Calcaires lithographiques & schistes) ---
  "solnhofen": { lat: 48.8936, lng: 10.9922, zoom: 10, label: "Solnhofen (Bavière, Allemagne) - Archæopteryx & Jurassique" },
  "eichstätt": { lat: 48.8920, lng: 11.1860, zoom: 10, label: "Eichstätt (Allemagne) - Carrières de calcaire lithographique" },
  "eichstatt": { lat: 48.8920, lng: 11.1860, zoom: 10, label: "Eichstätt (Allemagne)" },
  "holzmaden": { lat: 48.6364, lng: 9.5186, zoom: 10, label: "Holzmaden (Bade-Wurtemberg) - Schistes à Ichthyosaures" },
  "messel": { lat: 49.9194, lng: 8.7561, zoom: 10, label: "Fosse de Messel (Hesse, Allemagne) - Éocène" },
  "bundenbach": { lat: 49.8500, lng: 7.3833, zoom: 10, label: "Bundenbach (Hunsrück, Allemagne) - Schistes dévoniens" },
  "bavière": { lat: 48.7904, lng: 11.4979, zoom: 7, label: "Bavière (Allemagne)" },
  "baviere": { lat: 48.7904, lng: 11.4979, zoom: 7, label: "Bavière (Allemagne)" },
  "allemagne": { lat: 51.1657, lng: 10.4515, zoom: 6, label: "Allemagne" },
  "germany": { lat: 51.1657, lng: 10.4515, zoom: 6, label: "Germany" },

  // --- FRANCE (Grands sites géologiques & départements) ---
  "aveyron": { lat: 44.3500, lng: 2.5700, zoom: 8, label: "Aveyron, Occitanie (France)" },
  "millau": { lat: 44.0984, lng: 3.0783, zoom: 10, label: "Millau, Grands Causses (Aveyron, France) - Marnes toarciennes & ammonites" },
  "tournemire": { lat: 43.9710, lng: 3.0180, zoom: 11, label: "Tournemire (Aveyron, France) - Toarcien, vertébrés marins" },
  "roquefort": { lat: 43.9760, lng: 2.9890, zoom: 11, label: "Roquefort-sur-Soulzon (Aveyron, France)" },
  "villers-sur-mer": { lat: 49.3210, lng: -0.0070, zoom: 11, label: "Villers-sur-Mer (Calvados) - Falaises des Vaches Noires" },
  "vaches noires": { lat: 49.3250, lng: -0.0150, zoom: 11, label: "Falaises des Vaches Noires (Normandie, France) - Oxfordien/Callovien" },
  "normandie": { lat: 49.1800, lng: -0.3700, zoom: 8, label: "Normandie (France)" },
  "normandy": { lat: 49.1800, lng: -0.3700, zoom: 8, label: "Normandie (France)" },
  "boulonnais": { lat: 50.7200, lng: 1.6100, zoom: 9, label: "Boulonnais, Pas-de-Calais (France) - Côtes jurassiques" },
  "la voulte": { lat: 44.8010, lng: 4.7810, zoom: 11, label: "La Voulte-sur-Rhône (Ardèche, France) - Konservat-Lagerstätte Callovien" },
  "ardeche": { lat: 44.7500, lng: 4.4500, zoom: 8, label: "Ardèche (France)" },
  "ardèche": { lat: 44.7500, lng: 4.4500, zoom: 8, label: "Ardèche (France)" },
  "cerin": { lat: 45.7800, lng: 5.5500, zoom: 11, label: "Cerin (Ain, France) - Calcaires lithographiques kimméridgiens" },
  "jura": { lat: 46.6700, lng: 5.5500, zoom: 8, label: "Massif du Jura (France)" },
  "crayssac": { lat: 44.5100, lng: 1.3200, zoom: 11, label: "Plage aux Ptérosaures de Crayssac (Lot, France)" },
  "esperaza": { lat: 42.9300, lng: 2.2100, zoom: 10, label: "Espéraza (Aude, France) - Dinosaures du Crétacé supérieur" },
  "charente": { lat: 45.7000, lng: 0.1500, zoom: 8, label: "Charente / Angeac-Charente (France)" },
  "angeac": { lat: 45.6300, lng: -0.0600, zoom: 11, label: "Angeac-Charente (France) - Dinosaures géants" },
  "aix-en-provence": { lat: 43.5297, lng: 5.4474, zoom: 11, label: "Aix-en-Provence (Bouches-du-Rhône, France) - Œufs de dinosaures d'Hypsélosaure" },
  "aix en provence": { lat: 43.5297, lng: 5.4474, zoom: 11, label: "Aix-en-Provence (France) - Œufs d'Hypsélosaure" },
  "rompon": { lat: 44.7578, lng: 4.7172, zoom: 11, label: "Rompon, Vallée de l'Ouvèze (Ardèche, France) - Lys de mer jurassiques" },
  "valence": { lat: 44.9333, lng: 4.8917, zoom: 10, label: "Valence, Vallée du Rhône (Drôme, France)" },
  "montelimar": { lat: 44.5569, lng: 4.7495, zoom: 10, label: "Montélimar (Drôme, France)" },
  "luberon": { lat: 43.8300, lng: 5.3800, zoom: 9, label: "Luberon / Apt (Vaucluse, France) - Oligocène, fossiles d'insectes et plantes" },
  "provence": { lat: 43.5300, lng: 5.4400, zoom: 8, label: "Provence (France) - Dinosaures & ammonites barrémiennes" },
  "mer du nord": { lat: 54.0000, lng: 3.0000, zoom: 7, label: "Mer du Nord (Doggerland) - Faune glaciaire pléistocène draguée" },
  "doggerland": { lat: 54.0000, lng: 3.0000, zoom: 7, label: "Doggerland (Mer du Nord)" },
  "north sea": { lat: 54.0000, lng: 3.0000, zoom: 7, label: "North Sea / Mer du Nord" },
  "dordogne": { lat: 45.1500, lng: 0.7000, zoom: 8, label: "Dordogne (France)" },
  "alpes": { lat: 45.0000, lng: 6.0000, zoom: 8, label: "Alpes (France)" },
  "paris": { lat: 48.8566, lng: 2.3522, zoom: 9, label: "Bassin Parisien (France) - Lutétien, coquilles fossiles" },
  "lyon": { lat: 45.7640, lng: 4.8357, zoom: 9, label: "Région Lyonnaise (France)" },
  "marseille": { lat: 43.2965, lng: 5.3698, zoom: 9, label: "Marseille (Bouches-du-Rhône, France)" },
  "bordeaux": { lat: 44.8378, lng: -0.5792, zoom: 9, label: "Bordeaux, Aquitaine (France)" },
  "toulouse": { lat: 43.6047, lng: 1.4442, zoom: 9, label: "Toulouse, Occitanie (France)" },
  "france": { lat: 46.2276, lng: 2.2137, zoom: 6, label: "France" },

  // --- ROYAUME-UNI (Jurassic Coast & îles) ---
  "lyme regis": { lat: 50.7254, lng: -2.9358, zoom: 10, label: "Lyme Regis (Dorset, UK) - Berceau de Mary Anning & Ichthyosaures" },
  "dorset": { lat: 50.7400, lng: -2.3300, zoom: 9, label: "Dorset (Angleterre) - Jurassic Coast" },
  "jurassic coast": { lat: 50.7000, lng: -2.5500, zoom: 9, label: "Jurassic Coast (Devon/Dorset, Royaume-Uni)" },
  "isle of wight": { lat: 50.6900, lng: -1.3000, zoom: 10, label: "Île de Wight (Royaume-Uni) - Dinosaures du Crétacé" },
  "whitby": { lat: 54.4858, lng: -0.6136, zoom: 10, label: "Whitby (Yorkshire, UK) - Ammonites & Jais" },
  "royaume-uni": { lat: 55.3781, lng: -3.4360, zoom: 6, label: "Royaume-Uni" },
  "uk": { lat: 55.3781, lng: -3.4360, zoom: 6, label: "United Kingdom" },

  // --- ÉTATS-UNIS (Formations mythiques de l'Ouest américain) ---
  "green river": { lat: 41.5286, lng: -109.4663, zoom: 9, label: "Green River Formation (Wyoming, USA) - Éocène, poissons & plantes" },
  "kemmerer": { lat: 41.7944, lng: -110.5361, zoom: 10, label: "Kemmerer (Wyoming, USA) - Fossil Butte National Monument" },
  "wyoming": { lat: 43.0759, lng: -107.2903, zoom: 7, label: "Wyoming (États-Unis)" },
  "hell creek": { lat: 47.5000, lng: -106.9000, zoom: 8, label: "Formation Hell Creek (Montana/Dakotas, USA) - T-Rex & Triceratops" },
  "montana": { lat: 46.8797, lng: -110.3626, zoom: 6, label: "Montana (États-Unis)" },
  "morrison": { lat: 39.6536, lng: -105.1911, zoom: 8, label: "Formation Morrison (Colorado/Utah, USA) - Sauropodes jurassiques" },
  "colorado": { lat: 39.5501, lng: -105.7821, zoom: 6, label: "Colorado (États-Unis)" },
  "utah": { lat: 39.3200, lng: -111.0937, zoom: 6, label: "Utah (États-Unis) - Parcs géologiques & dinosaures" },
  "calvert cliffs": { lat: 38.3800, lng: -76.4500, zoom: 10, label: "Calvert Cliffs (Maryland, USA) - Dents de Mégalodon miocènes" },
  "usa": { lat: 37.0902, lng: -95.7129, zoom: 4, label: "États-Unis d'Amérique" },
  "etats-unis": { lat: 37.0902, lng: -95.7129, zoom: 4, label: "États-Unis d'Amérique" },

  // --- CANADA (Faunes cambriennes & gisements à dinosaures) ---
  "burgess": { lat: 51.4394, lng: -116.4789, zoom: 9, label: "Schistes de Burgess (Parc national Yoho, Canada) - Explosion Cambrienne" },
  "alberta": { lat: 53.9333, lng: -116.5765, zoom: 6, label: "Alberta (Canada)" },
  "dinosaur provincial park": { lat: 50.7583, lng: -111.5167, zoom: 9, label: "Dinosaur Provincial Park (Alberta, Canada)" },
  "joggins": { lat: 45.7000, lng: -64.4400, zoom: 10, label: "Falaises fossilifères de Joggins (Nouvelle-Écosse, Canada) - Carbonifère" },
  "canada": { lat: 56.1304, lng: -106.3468, zoom: 4, label: "Canada" },

  // --- CHINE (Jehol Biota & faune de Chengjiang) ---
  "liaoning": { lat: 41.2956, lng: 122.6085, zoom: 7, label: "Province du Liaoning (Chine) - Dinosaures à plumes & Oiseaux primitifs" },
  "chaoyang": { lat: 41.5761, lng: 120.4503, zoom: 9, label: "Chaoyang (Liaoning, Chine) - Gisement du biote de Jehol" },
  "jehol": { lat: 41.5000, lng: 120.5000, zoom: 8, label: "Biote de Jehol (Chine Crétacé)" },
  "chengjiang": { lat: 24.6750, lng: 102.9128, zoom: 9, label: "Site fossilifère de Chengjiang (Yunnan, Chine) - Cambrien inférieur" },
  "yunnan": { lat: 24.4798, lng: 101.3431, zoom: 7, label: "Yunnan (Chine)" },
  "chine": { lat: 35.8617, lng: 104.1954, zoom: 4, label: "Chine" },
  "china": { lat: 35.8617, lng: 104.1954, zoom: 4, label: "China" },

  // --- LIBAN (Carrières de poissons crétacés mondialement réputées) ---
  "byblos": { lat: 34.1230, lng: 35.6510, zoom: 11, label: "Byblos / Jbail (Liban) - Calcaires fossilifères à Poissons" },
  "haqel": { lat: 34.1970, lng: 35.7920, zoom: 11, label: "Haqel (Liban) - Poissons, raies & crevettes du Cénomanien" },
  "hjoula": { lat: 34.1740, lng: 35.7510, zoom: 11, label: "Hjoula (Liban) - Exceptionnelle préservation marine Crétacé" },
  "nammoura": { lat: 34.0830, lng: 35.7500, zoom: 11, label: "Nammoura (Liban) - Raies & poissons fossiles" },
  "liban": { lat: 33.8547, lng: 35.8623, zoom: 8, label: "Liban" },
  "lebanon": { lat: 33.8547, lng: 35.8623, zoom: 8, label: "Lebanon" },

  // --- BRÉSIL (Formation Santana & Bassin d'Araripe) ---
  "araripe": { lat: -7.2800, lng: -39.5000, zoom: 9, label: "Bassin d'Araripe (Ceará, Brésil) - Poissons & Ptérosaures 3D" },
  "santana": { lat: -7.1800, lng: -39.7300, zoom: 10, label: "Formation Santana (Ceará, Brésil) - Nodules à poissons pétrifiés" },
  "crato": { lat: -7.2300, lng: -39.4100, zoom: 10, label: "Formation Crato (Brésil) - Insectes & plantes du Crétacé inférieur" },
  "bresil": { lat: -14.2350, lng: -51.9253, zoom: 4, label: "Brésil" },
  "brésil": { lat: -14.2350, lng: -51.9253, zoom: 4, label: "Brésil" },
  "brazil": { lat: -14.2350, lng: -51.9253, zoom: 4, label: "Brazil" },

  // --- MADAGASCAR (Gisements crétacés & faunes insulaires) ---
  "mahajanga": { lat: -15.7167, lng: 46.3167, zoom: 8, label: "Bassin de Mahajanga (Madagascar) - Majungasaurus & ammonites irisées" },
  "majunga": { lat: -15.7167, lng: 46.3167, zoom: 8, label: "Majunga / Mahajanga (Madagascar)" },
  "madagascar": { lat: -18.7669, lng: 46.8691, zoom: 5, label: "Madagascar - Ammonites, bois pétrifiés & fossiles crétacés" },

  // --- ITALIE (Monte Bolca & lagunes) ---
  "bolca": { lat: 45.5975, lng: 11.2069, zoom: 11, label: "Monte Bolca (Vénétie, Italie) - Poissons fossiles éocènes" },
  "pesciara": { lat: 45.6000, lng: 11.2100, zoom: 12, label: "Pesciara di Bolca (Italie)" },
  "italie": { lat: 41.8719, lng: 12.5674, zoom: 6, label: "Italie" },
  "italy": { lat: 41.8719, lng: 12.5674, zoom: 6, label: "Italy" },

  // --- AUSTRALIE (Opales & faune d'Ediacara) ---
  "lightning ridge": { lat: -29.4267, lng: 147.9781, zoom: 9, label: "Lightning Ridge (NSW, Australie) - Fossiles fossilisés en opale précieuse" },
  "ediacara": { lat: -30.8000, lng: 138.1500, zoom: 8, label: "Collines d'Ediacara (Australie-Méridionale) - Première faune multicellulaire" },
  "australie": { lat: -25.2744, lng: 133.7751, zoom: 4, label: "Australie" },
  "australia": { lat: -25.2744, lng: 133.7751, zoom: 4, label: "Australia" },

  // --- ESPAGNE ---
  "las hoyas": { lat: 40.0800, lng: -2.0000, zoom: 10, label: "Las Hoyas (Cuenca, Espagne) - Konservat-Lagerstätte Crétacé" },
  "teruel": { lat: 40.3400, lng: -1.1000, zoom: 9, label: "Teruel (Aragon, Espagne) - Dinosaures du Jurassique/Crétacé" },
  "espagne": { lat: 40.4637, lng: -3.7492, zoom: 6, label: "Espagne" },
  "spain": { lat: 40.4637, lng: -3.7492, zoom: 6, label: "Spain" },

  // --- INDONÉSIE (Dents de mégalodon & vertébrés marins de Java) ---
  "java": { lat: -7.6145, lng: 110.7122, zoom: 8, label: "Java (Indonésie) - Gisements marins miocènes & Mégalodon" },
  "indonesie": { lat: -0.7893, lng: 113.9213, zoom: 5, label: "Indonésie" },
  "indonesia": { lat: -0.7893, lng: 113.9213, zoom: 5, label: "Indonesia" },

  // --- POLOGNE (Grottes jurassiques d'Ojców & faune glaciaire) ---
  "pologne": { lat: 50.1700, lng: 19.8000, zoom: 8, label: "Pologne (Grottes jurassiques d'Ojców) - Ours des cavernes" },
  "poland": { lat: 50.1700, lng: 19.8000, zoom: 8, label: "Pologne" },

  // --- RUSSIE ---
  "yakoutie": { lat: 62.0397, lng: 129.7422, zoom: 5, label: "République de Sakha / Yakoutie (Sibérie, Russie) - Mammouths & faune du Pléistocène" },
  "sibérie": { lat: 60.0000, lng: 105.0000, zoom: 4, label: "Sibérie (Russie)" },
  "russie": { lat: 61.5240, lng: 105.3188, zoom: 3, label: "Russie" },
};

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim();
}

/**
 * Searches our rich offline database for a matching fossil formation or locality
 */
function findOfflineGps(locationName: string): { lat: number; lng: number; zoom: number; label: string } | null {
  if (!locationName) return null;
  const normalized = normalizeText(locationName);
  
  // Sort keys by length descending to match most specific terms first (e.g. "Kem Kem" before "Maroc")
  const sortedKeys = Object.keys(GPS_FOSSIL_DATABASE).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return GPS_FOSSIL_DATABASE[key];
    }
  }
  return null;
}

/**
 * Determines whether raw coordinates are real GPS (-90..90, -180..180) or old 0..100 percentages
 */
function resolveCoords(
  rawCoords?: { lat: number; lng: number },
  locationName?: string
): { lat: number; lng: number; zoom: number; source: 'offline_match' | 'custom_gps' | 'converted' } {
  // 1. Try offline database match for the fossil site name
  if (locationName) {
    const match = findOfflineGps(locationName);
    if (match) {
      if (!rawCoords) {
        return { lat: match.lat, lng: match.lng, zoom: match.zoom, source: 'offline_match' };
      }

      // Check if rawCoords is a default placeholder (40, 50) or (46.2, 2.2) or (0, 0)
      const isDefaultPlaceholder =
        (Math.round(rawCoords.lat) === 40 && Math.round(rawCoords.lng) === 50) ||
        (Math.abs(rawCoords.lat - 46.2) < 0.1 && Math.abs(rawCoords.lng - 2.2) < 0.1) ||
        (rawCoords.lat === 0 && rawCoords.lng === 0);

      // Check if rawCoords is outside valid GPS boundaries (e.g. old SVG percentages where lat > 85)
      const isOutOfGpsBounds = rawCoords.lat < -85 || rawCoords.lat > 85 || rawCoords.lng < -180 || rawCoords.lng > 180;

      // Check distance in degrees from the matched authentic location.
      // Legacy SVG world map coordinates (e.g. Rompon {lat:22, lng:43} vs France {lat:44.7, lng:4.7},
      // or Montana {lat:20, lng:16} vs USA {lat:46.8, lng:-110.3}) have huge offsets (> 7 degrees / ~750km).
      const degreeDistance = Math.hypot(rawCoords.lat - match.lat, rawCoords.lng - match.lng);
      const isLegacySvgCoord = degreeDistance > 7.0;

      if (isDefaultPlaceholder || isOutOfGpsBounds || isLegacySvgCoord) {
        return { lat: match.lat, lng: match.lng, zoom: match.zoom, source: 'offline_match' };
      }

      // If coordinates are within 7 degrees of the known site, user fine-tuned the pin position
      return { lat: rawCoords.lat, lng: rawCoords.lng, zoom: match.zoom, source: 'custom_gps' };
    }
  }

  // 2. If rawCoords exists without database match
  if (rawCoords && typeof rawCoords.lat === 'number' && typeof rawCoords.lng === 'number') {
    const isNormalGps = rawCoords.lat >= -85 && rawCoords.lat <= 85 && rawCoords.lng >= -180 && rawCoords.lng <= 180;
    
    const isDefaultMock = (Math.round(rawCoords.lat) === 40 && Math.round(rawCoords.lng) === 50) ||
      (rawCoords.lat === 0 && rawCoords.lng === 0);

    if (locationName && isDefaultMock) {
      const match = findOfflineGps(locationName);
      if (match) {
        return { lat: match.lat, lng: match.lng, zoom: match.zoom, source: 'offline_match' };
      }
    }

    if (isNormalGps && !isDefaultMock) {
      return { 
        lat: rawCoords.lat, 
        lng: rawCoords.lng, 
        zoom: 9, 
        source: 'custom_gps' 
      };
    }
  }

  // 3. Default fallback: France / Europe center
  return { lat: 46.2276, lng: 2.2137, zoom: 5, source: 'offline_match' };
}

function formatGpsCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'O';
  const absLat = Math.abs(lat).toFixed(4);
  const absLng = Math.abs(lng).toFixed(4);
  return `${absLat}° ${latDir}, ${absLng}° ${lngDir}`;
}

export interface InteractiveMapProps {
  coords?: { lat: number; lng: number };
  locationName?: string;
  onChange?: (coords: { lat: number; lng: number }, locationName: string) => void;
  readOnly?: boolean;
}

export default function InteractiveMap({ 
  coords, 
  locationName = "", 
  onChange, 
  readOnly = false 
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Refs for callbacks to avoid re-triggering map recreation effect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const locationNameRef = useRef(locationName);
  locationNameRef.current = locationName;

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(locationName || "");
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingFeedback, setGeocodingFeedback] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Compute the current active GPS location
  const resolved = resolveCoords(coords, locationName);

  // Custom pixel-perfect pin icon whose bottom tip is mathematically fixed at (16, 44)
  const createPinIcon = useCallback((label: string) => {
    return L.divIcon({
      className: 'fossil-custom-pin',
      html: `
        <div style="position: relative; width: 32px; height: 44px; margin: 0; padding: 0; pointer-events: auto;">
          <!-- Ground contact shadow ellipse -->
          <div style="position: absolute; bottom: -1px; left: 16px; width: 14px; height: 4px; margin-left: -7px; background: rgba(0, 0, 0, 0.65); border-radius: 50%; filter: blur(1px); pointer-events: none;"></div>
          
          <!-- Ground radar pulse ping centered exactly at the ground contact point (16, 44) -->
          <div style="position: absolute; bottom: -3px; left: 16px; width: 24px; height: 8px; margin-left: -12px; border-radius: 50%; background: rgba(225, 29, 72, 0.45); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>

          <!-- SVG Pin whose bottom tip point terminates with exact pixel precision at (16, 44) -->
          <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; position: absolute; top: 0; left: 0; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7)); pointer-events: auto;">
            <path d="M16 44 C16 44 2 28 2 16 C2 8.268 8.268 2 16 2 C23.732 2 30 8.268 30 16 C30 28 16 44 16 44 Z" fill="#e11d48" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="16" r="4.5" fill="#ffffff"/>
          </svg>
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -44]
    });
  }, []);

  // Continuous ResizeObserver to keep tiles and markers locked on resize/fullscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize or update the Leaflet map
  useEffect(() => {
    if (!containerRef.current) return;

    // If map does not exist yet, create it
    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [resolved.lat, resolved.lng],
        zoom: resolved.zoom,
        zoomControl: false, // custom controls placed via React
        attributionControl: false
      });

      // Add initial tile layer
      const layerCfg = TILE_LAYERS[activeLayer];
      const tiles = L.tileLayer(layerCfg.url, {
        attribution: layerCfg.attribution,
        maxZoom: layerCfg.maxZoom,
        subdomains: 'abcd'
      }).addTo(map);

      tileLayerRef.current = tiles;

      // Add marker anchored precisely
      const pin = L.marker([resolved.lat, resolved.lng], {
        icon: createPinIcon(locationName || "Lieu de découverte"),
        draggable: !readOnly
      }).addTo(map);

      // Bind popup with authentic discovery site details
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 4px; min-width: 140px; color: #1e293b;">
          <strong style="color: #991b1b; display: block; font-size: 12px; margin-bottom: 2px;">
            ${locationName || "Gisement Géologique"}
          </strong>
          <span style="color: #64748b; font-family: monospace; font-size: 10px;">
            ${formatGpsCoordinates(resolved.lat, resolved.lng)}
          </span>
        </div>
      `;
      pin.bindPopup(popupContent);

      // Handle marker drag in edit mode
      if (!readOnly) {
        pin.on('dragend', (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          playDinoSound();
          if (onChangeRef.current) {
            onChangeRef.current({ lat: pos.lat, lng: pos.lng }, searchQueryRef.current || locationNameRef.current);
          }
          setGeocodingFeedback("Position ajustée avec précision");
        });

        // Handle map click in edit mode
        map.on('click', (e) => {
          playDinoSound();
          pin.setLatLng(e.latlng);
          if (onChangeRef.current) {
            onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }, searchQueryRef.current || locationNameRef.current);
          }
          setGeocodingFeedback("Épinglé sur la carte");
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = pin;
    } else {
      // Map already exists: update marker position and ensure sync
      const map = mapInstanceRef.current;
      const marker = markerRef.current;

      if (marker && map) {
        marker.setLatLng([resolved.lat, resolved.lng]);
        marker.setIcon(createPinIcon(locationName || "Lieu de découverte"));
        marker.setPopupContent(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px; min-width: 140px; color: #1e293b;">
            <strong style="color: #991b1b; display: block; font-size: 12px; margin-bottom: 2px;">
              ${locationName || "Gisement Géologique"}
            </strong>
            <span style="color: #64748b; font-family: monospace; font-size: 10px;">
              ${formatGpsCoordinates(resolved.lat, resolved.lng)}
            </span>
          </div>
        `);

        // If coordinates changed externally to another site, pan smoothly
        const currentCenter = map.getCenter();
        const dist = Math.hypot(currentCenter.lat - resolved.lat, currentCenter.lng - resolved.lng);
        if (dist > 0.005) {
          map.panTo([resolved.lat, resolved.lng], { animate: true });
        }
      }
    }

    // Invalidate map size to ensure full rendering
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [resolved.lat, resolved.lng, resolved.zoom, locationName, readOnly, createPinIcon]);

  // Clean destruction when component completely unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Handle tile layer change
  const handleLayerSwitch = (newLayer: MapLayerType) => {
    setActiveLayer(newLayer);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[newLayer];
    const newTileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      subdomains: 'abcd'
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
    playDinoSound();
  };

  // Center view on marker
  const handleCenterMarker = () => {
    if (!mapInstanceRef.current) return;
    playDinoSound();
    mapInstanceRef.current.flyTo([resolved.lat, resolved.lng], Math.max(8, resolved.zoom), {
      duration: 1.2
    });
    markerRef.current?.openPopup();
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    playDinoSound();
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    playDinoSound();
    mapInstanceRef.current.zoomOut();
  };

  // Copy GPS Coordinates
  const handleCopyGps = () => {
    const text = formatGpsCoordinates(resolved.lat, resolved.lng);
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Geocoding execution (offline first, then online OpenStreetMap fallback)
  const executeSearch = async (query: string) => {
    if (!query.trim() || !onChange) return;
    setIsSearching(true);
    setGeocodingFeedback(null);

    // 1. Check instant offline database
    const offlineMatch = findOfflineGps(query);
    if (offlineMatch) {
      onChange({ lat: offlineMatch.lat, lng: offlineMatch.lng }, query);
      setGeocodingFeedback(`Localisé : ${offlineMatch.label}`);
      playDinoSound();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([offlineMatch.lat, offlineMatch.lng], offlineMatch.zoom, { duration: 1.2 });
        markerRef.current?.setLatLng([offlineMatch.lat, offlineMatch.lng]);
      }
      setIsSearching(false);
      return;
    }

    // 2. Fallback to OpenStreetMap Nominatim for exact world localities
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'fr,en' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const cleanName = item.display_name.split(',').slice(0, 3).join(',').trim();

        onChange({ lat, lng }, cleanName || query);
        setGeocodingFeedback(`Trouvé en ligne : ${cleanName}`);
        playDinoSound();

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 8, { duration: 1.2 });
          markerRef.current?.setLatLng([lat, lng]);
        }
      } else {
        setGeocodingFeedback("Lieu non trouvé. Vous pouvez cliquer sur la carte pour l'épingler.");
      }
    } catch (err) {
      console.warn("Online geocoding unavailable:", err);
      setGeocodingFeedback("Recherche hors-ligne active. Cliquez sur la carte.");
    } finally {
      setIsSearching(false);
    }
  };

  // Synchronize search input when locationName updates
  useEffect(() => {
    setSearchQuery(locationName || "");
  }, [locationName]);

  // Handle container resize when fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  return (
    <div 
      className={`bg-slate-950 border border-yellow-700/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-slate-950/98 backdrop-blur-md shadow-2xl border-yellow-500/50' : 'space-y-2.5 p-3'
      }`}
    >
      {/* Map Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 ${isFullscreen ? 'p-3 border-b border-slate-800' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400 shrink-0 shadow">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-yellow-500/90 uppercase font-semibold">
                ORIGINE GÉOGRAPHIQUE DU FOSSILE
              </span>
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.2 rounded text-[9px] font-medium flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> Précis & Réaliste
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide">
              {locationName || "Lieu de découverte non renseigné"}
            </h4>
          </div>
        </div>

        {/* Action badges / tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* GPS Coordinates chip with click-to-copy */}
          <button
            type="button"
            onClick={handleCopyGps}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-700/60 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono transition-colors shadow-sm"
            title="Copier les coordonnées GPS exactes"
          >
            {copiedCoords ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>{formatGpsCoordinates(resolved.lat, resolved.lng)}</span>
              </>
            )}
          </button>

          {/* Fullscreen modal toggle */}
          <button
            type="button"
            onClick={() => {
              playDinoSound();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-yellow-400 rounded transition-colors shadow-sm"
            title={isFullscreen ? "Réduire la carte" : "Agrandir en plein écran"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Search Bar in Edit Mode */}
      {!readOnly && onChange && (
        <div className={`space-y-1.5 ${isFullscreen ? 'px-3 pt-2' : ''}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearch(searchQuery);
                  }
                }}
                placeholder="Ex: Kem Kem Maroc, Solnhofen Allemagne, Millau Aveyron, Burgess..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-yellow-600 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={isSearching}
              onClick={() => executeSearch(searchQuery)}
              className="bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? "Recherche..." : "Localiser"}</span>
            </button>
          </div>

          {/* Feedback badge */}
          {geocodingFeedback && (
            <div className="text-[11px] text-amber-300/90 font-medium px-1 flex items-center gap-1">
              <span>📍</span> {geocodingFeedback}
            </div>
          )}
        </div>
      )}

      {/* Map Canvas Frame */}
      <div 
        className={`relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner ${
          isFullscreen ? 'flex-1 m-3 min-h-[400px]' : 'h-64 sm:h-72 w-full'
        }`}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
          style={{ minHeight: '100%', width: '100%' }}
        />

        {/* Floating Layer Switcher (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 shadow-xl text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => handleLayerSwitch('satellite')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              activeLayer === 'satellite'
                ? 'bg-yellow-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🛰️ Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => handleLayerSwitch('streets')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              activeLayer === 'streets'
                ? 'bg-yellow-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🗺️ Carte</span>
          </button>
          <button
            type="button"
            onClick={() => handleLayerSwitch('topo')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              activeLayer === 'topo'
                ? 'bg-yellow-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>⛰️ Relief</span>
          </button>
        </div>

        {/* Floating Zoom & Center Controls (Bottom Right) */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col gap-1 shadow-2xl">
          <button
            type="button"
            onClick={handleCenterMarker}
            className="p-2 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-yellow-400 hover:text-yellow-300 rounded-xl transition-all shadow-lg group"
            title="Recadrer sur le lieu de découverte"
          >
            <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-slate-200 hover:text-white rounded-xl transition-all shadow-lg"
            title="Zoom +"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-slate-200 hover:text-white rounded-xl transition-all shadow-lg"
            title="Zoom -"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Left Instruction in Edit Mode */}
        {!readOnly && onChange && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-950/85 backdrop-blur-sm text-[10px] text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1 shadow-lg pointer-events-none">
            💡 Cliquez ou glissez l'épingle pour affiner l'emplacement
          </div>
        )}
      </div>

      {/* Footer info in Sheet view */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
        <span className="flex items-center gap-1 text-slate-400">
          <Layers className="w-3 h-3 text-yellow-600" />
          Imagerie satellite & relief topographique haute définition
        </span>
        <span className="font-mono text-slate-500">
          WGS84 • {TILE_LAYERS[activeLayer].name}
        </span>
      </div>
    </div>
  );
}
