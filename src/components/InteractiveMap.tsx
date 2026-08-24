import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Search, Globe, WifiOff } from 'lucide-react';
import { playDinoSound } from '../utils/data/audio';

// Comprehensive offline geocoding database mapping famous fossil sites,
// major cities, and countries to our custom SVG map coordinates (0-100%).
const OFFLINE_GEO_DATABASE: Record<string, { lat: number; lng: number }> = {
  // Countries
  "maroc": { lat: 35, lng: 44 },
  "morocco": { lat: 35, lng: 44 },
  "france": { lat: 22, lng: 43 },
  "allemagne": { lat: 21, lng: 45.5 },
  "germany": { lat: 21, lng: 45.5 },
  "royaume-uni": { lat: 19, lng: 42 },
  "royaume uni": { lat: 19, lng: 42 },
  "uk": { lat: 19, lng: 42 },
  "united kingdom": { lat: 19, lng: 42 },
  "usa": { lat: 22, lng: 15 },
  "etats-unis": { lat: 22, lng: 15 },
  "etats unis": { lat: 22, lng: 15 },
  "états-unis": { lat: 22, lng: 15 },
  "canada": { lat: 17, lng: 12 },
  "chine": { lat: 24, lng: 78 },
  "china": { lat: 24, lng: 78 },
  "liban": { lat: 28, lng: 51.5 },
  "lebanon": { lat: 28, lng: 51.5 },
  "italie": { lat: 25, lng: 46 },
  "italy": { lat: 25, lng: 46 },
  "madagascar": { lat: 74, lng: 58 },
  "brésil": { lat: 65, lng: 32 },
  "bresil": { lat: 65, lng: 32 },
  "brazil": { lat: 65, lng: 32 },
  "australie": { lat: 74, lng: 83 },
  "australia": { lat: 74, lng: 83 },
  "russie": { lat: 15, lng: 65 },
  "russia": { lat: 15, lng: 65 },
  "espagne": { lat: 25, lng: 42 },
  "spain": { lat: 25, lng: 42 },
  "portugal": { lat: 25, lng: 41 },

  // Famous fossil sites / regions
  "kem kem": { lat: 36, lng: 44.5 },
  "erfoud": { lat: 35.5, lng: 44.8 },
  "khouribga": { lat: 35, lng: 44 },
  "oulad abdoun": { lat: 35, lng: 44 },
  "solnhofen": { lat: 21, lng: 45.5 },
  "holzmaden": { lat: 21.5, lng: 45.2 },
  "messel": { lat: 21.2, lng: 45.3 },
  "lyme regis": { lat: 19, lng: 42 },
  "dorset": { lat: 19, lng: 42 },
  "green river": { lat: 22, lng: 15 },
  "wyoming": { lat: 22, lng: 15 },
  "utah": { lat: 23, lng: 14 },
  "hell creek": { lat: 20, lng: 16 },
  "montana": { lat: 20, lng: 16 },
  "alberta": { lat: 17, lng: 12 },
  "burgess": { lat: 16, lng: 11 },
  "liaoning": { lat: 24, lng: 78 },
  "byblos": { lat: 28, lng: 51.5 },
  "haqel": { lat: 28, lng: 51.5 },
  "bolca": { lat: 25, lng: 46 },
  "santana": { lat: 65, lng: 32 },
  "araripe": { lat: 65, lng: 32 },
  "lightning ridge": { lat: 74, lng: 83 },

  // French regions / cities / departments
  "aveyron": { lat: 23.5, lng: 43.1 },
  "millau": { lat: 23.5, lng: 43.1 },
  "normandie": { lat: 21.5, lng: 42.8 },
  "normandy": { lat: 21.5, lng: 42.8 },
  "boulonnais": { lat: 21.0, lng: 43.0 },
  "paris": { lat: 21.8, lng: 43.0 },
  "lyon": { lat: 22.8, lng: 43.2 },
  "marseille": { lat: 23.8, lng: 43.3 },
  "provence": { lat: 23.7, lng: 43.4 },
  "alpes": { lat: 23.0, lng: 43.6 },
  "jura": { lat: 22.4, lng: 43.5 },
  "alsace": { lat: 21.8, lng: 43.8 },
  "bretagne": { lat: 21.8, lng: 42.0 },
  "loire": { lat: 22.2, lng: 42.6 },
  "gironde": { lat: 23.2, lng: 42.2 },
  "bordeaux": { lat: 23.2, lng: 42.2 },
  "toulouse": { lat: 23.6, lng: 42.6 },
  "dordogne": { lat: 23.0, lng: 42.4 },
  "charente": { lat: 22.6, lng: 42.3 },
  "ardèche": { lat: 23.3, lng: 43.1 },
  "ardeche": { lat: 23.3, lng: 43.1 },
  "lozère": { lat: 23.4, lng: 43.1 },
  "lozere": { lat: 23.4, lng: 43.1 },
  "hérault": { lat: 23.6, lng: 43.0 },
  "herault": { lat: 23.6, lng: 43.0 },
  "gard": { lat: 23.5, lng: 43.2 },
  "bouches du rhône": { lat: 23.8, lng: 43.2 },
  "bouches du rhone": { lat: 23.8, lng: 43.2 },
  "var": { lat: 23.8, lng: 43.4 },
  "vaucluse": { lat: 23.6, lng: 43.2 },
  "drôme": { lat: 23.3, lng: 43.2 },
  "drome": { lat: 23.3, lng: 43.2 },
  "isère": { lat: 23.1, lng: 43.3 },
  "isere": { lat: 23.1, lng: 43.3 },
  "savoie": { lat: 23.0, lng: 43.5 },
  "haute savoie": { lat: 22.8, lng: 43.5 },
  "haute-savoie": { lat: 22.8, lng: 43.5 },
  "ain": { lat: 22.7, lng: 43.3 },
  "rhône": { lat: 22.8, lng: 43.1 },
  "rhone": { lat: 22.8, lng: 43.1 },
  "loire-atlantique": { lat: 22.1, lng: 42.0 },
  "vendée": { lat: 22.4, lng: 42.0 },
  "vendee": { lat: 22.4, lng: 42.0 },
  "morbihan": { lat: 21.9, lng: 41.8 },
  "finistère": { lat: 21.8, lng: 41.5 },
  "finistere": { lat: 21.8, lng: 41.5 },
  "côtes d'armor": { lat: 21.7, lng: 41.8 },
  "cotes d'armor": { lat: 21.7, lng: 41.8 },
  "ille et vilaine": { lat: 21.8, lng: 42.1 },
  "ille-et-vilaine": { lat: 21.8, lng: 42.1 },
  "manche": { lat: 21.4, lng: 42.4 },
  "calvados": { lat: 21.4, lng: 42.7 },
  "seine-maritime": { lat: 21.2, lng: 43.0 },
  "eure": { lat: 21.4, lng: 42.9 },
  "orne": { lat: 21.6, lng: 42.7 },
  "sarthe": { lat: 21.9, lng: 42.5 },
  "mayenne": { lat: 21.8, lng: 42.3 },
  "maine et loire": { lat: 22.0, lng: 42.3 },
  "maine-et-loire": { lat: 22.0, lng: 42.3 },
  "indre et loire": { lat: 22.1, lng: 42.6 },
  "indre-et-loire": { lat: 22.1, lng: 42.6 },
  "loir et cher": { lat: 22.0, lng: 42.8 },
  "loir-et-cher": { lat: 22.0, lng: 42.8 },
  "loiret": { lat: 21.9, lng: 43.0 },
  "yonne": { lat: 22.1, lng: 43.3 },
  "nièvre": { lat: 22.3, lng: 43.3 },
  "nievre": { lat: 22.3, lng: 43.3 },
  "côte d'or": { lat: 22.1, lng: 43.6 },
  "cote d'or": { lat: 22.1, lng: 43.6 },
  "saône et loire": { lat: 22.4, lng: 43.4 },
  "saone-et-loire": { lat: 22.4, lng: 43.4 },
  "doubs": { lat: 22.3, lng: 43.8 },
  "haute saône": { lat: 22.1, lng: 43.8 },
  "territoire de belfort": { lat: 22.1, lng: 43.9 },
  "vosges": { lat: 21.9, lng: 43.8 },
  "meurthe et moselle": { lat: 21.6, lng: 43.7 },
  "moselle": { lat: 21.5, lng: 43.8 },
  "meuse": { lat: 21.6, lng: 43.5 },
  "marne": { lat: 21.6, lng: 43.3 },
  "haute marne": { lat: 21.9, lng: 43.4 },
  "aube": { lat: 21.8, lng: 43.2 },
  "ardennes": { lat: 21.3, lng: 43.4 },
  "aisne": { lat: 21.3, lng: 43.2 },
  "somme": { lat: 21.1, lng: 42.9 },
  "pas de calais": { lat: 20.9, lng: 42.8 },
  "nord": { lat: 20.9, lng: 43.1 },
  "oise": { lat: 21.4, lng: 43.0 },
  "val d'oise": { lat: 21.7, lng: 43.0 },
  "yvelines": { lat: 21.8, lng: 42.8 },
  "seine et marne": { lat: 21.8, lng: 43.2 },
  "essonne": { lat: 21.9, lng: 43.0 },
  "val de marne": { lat: 21.8, lng: 43.1 },
  "seine saint denis": { lat: 21.7, lng: 43.1 },
  "hauts de seine": { lat: 21.7, lng: 42.9 },
  "cher": { lat: 22.2, lng: 42.9 },
  "indre": { lat: 22.3, lng: 42.7 },
  "creuse": { lat: 22.5, lng: 42.8 },
  "haute vienne": { lat: 22.6, lng: 42.5 },
  "corrèze": { lat: 22.8, lng: 42.6 },
  "correze": { lat: 22.8, lng: 42.6 },
  "allier": { lat: 22.4, lng: 43.0 },
  "puy de dôme": { lat: 22.7, lng: 43.0 },
  "puy de dome": { lat: 22.7, lng: 43.0 },
  "cantal": { lat: 22.9, lng: 42.8 },
  "haute loire": { lat: 23.0, lng: 43.1 },
  "lot": { lat: 23.1, lng: 42.5 },
  "lot et garonne": { lat: 23.3, lng: 42.3 },
  "tarn et garonne": { lat: 23.4, lng: 42.5 },
  "gers": { lat: 23.6, lng: 42.3 },
  "hautes pyrénées": { lat: 23.8, lng: 42.3 },
  "hautes pyrenees": { lat: 23.8, lng: 42.3 },
  "ariège": { lat: 23.8, lng: 42.6 },
  "ariege": { lat: 23.8, lng: 42.6 },
  "pyrénées orientales": { lat: 23.9, lng: 42.8 },
  "pyrenees orientales": { lat: 23.9, lng: 42.8 },
  "aude": { lat: 23.8, lng: 42.8 },
  "tarn": { lat: 23.5, lng: 42.7 },
  "aveyron (millau)": { lat: 23.5, lng: 43.1 },
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 ]/g, " ") // replace punctuation with space
    .trim();
}

function findOfflineCoords(locationName: string): { lat: number; lng: number } | null {
  if (!locationName) return null;
  const normalized = normalizeText(locationName);
  
  // Sort keys by length descending to match most specific terms first
  const sortedKeys = Object.keys(OFFLINE_GEO_DATABASE).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return OFFLINE_GEO_DATABASE[key];
    }
  }
  return null;
}

interface InteractiveMapProps {
  coords: { lat: number; lng: number }; // coords stored as relative X, Y percentages (0 - 100)
  locationName: string;
  onChange?: (coords: { lat: number; lng: number }, locationName: string) => void;
  readOnly?: boolean;
}

export default function InteractiveMap({ coords, locationName, onChange, readOnly = false }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [searchQuery, setSearchQuery] = useState(locationName || "");
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'searching' | 'success_offline' | 'success_online' | 'not_found'>('idle');

  // Keep search query aligned with prop updates
  useEffect(() => {
    setSearchQuery(locationName || "");
  }, [locationName]);

  // Handle map click to drop a pin (only if not readonly)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    if (isDragging) return; // ignore click on drag release

    const mapElement = mapRef.current;
    if (!mapElement) return;

    const rect = mapElement.getBoundingClientRect();
    // Calculate click coordinates relative to the map container width & height
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Accounts for current zoom & pan translations
    const relativeX = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    const relativeY = Math.min(100, Math.max(0, (clickY / rect.height) * 100));

    onChange({ lat: relativeY, lng: relativeX }, searchQuery || locationName);
    setGeocodingStatus('idle'); // marked manually
  };

  const handleZoomIn = () => {
    playDinoSound();
    setZoom(prev => Math.min(4, prev + 0.3));
  };

  const handleZoomOut = () => {
    playDinoSound();
    setZoom(prev => Math.max(1, prev - 0.3));
    if (zoom === 1) setPan({ x: 0, y: 0 });
  };

  const handleReset = () => {
    playDinoSound();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Perform geocoding (tries offline first, then online if requested)
  const performGeocoding = async (query: string, useOnlineFallback: boolean = false) => {
    if (!query.trim() || !onChange) return;
    setGeocodingStatus('searching');

    // 1. Try offline database search (instantly, no internet needed!)
    const offlineMatch = findOfflineCoords(query);
    if (offlineMatch) {
      onChange(offlineMatch, query);
      setGeocodingStatus('success_offline');
      playDinoSound();
      return;
    }

    // 2. Try online search via OpenStreetMap (Nominatim API) if requested and online
    if (useOnlineFallback) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'fr,en'
          }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          
          // Conversion using our high-precision map projection formula:
          const x = Math.max(0, Math.min(100, 0.3 * lon + 45));
          const y = Math.max(0, Math.min(100, -0.75 * lat + 56.5));
          
          // Use shortened display name
          const displayName = item.display_name.split(',').slice(0, 3).join(',').trim();
          
          onChange({ lat: y, lng: x }, displayName);
          setGeocodingStatus('success_online');
          playDinoSound();
          return;
        }
      } catch (err) {
        console.warn("Online geocoding failed, offline fallback preserved:", err);
      }
    }

    setGeocodingStatus('not_found');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!onChange) return;

    // Direct auto-matching on typing: instantly updates if matched offline!
    const offlineMatch = findOfflineCoords(val);
    if (offlineMatch) {
      onChange(offlineMatch, val);
      setGeocodingStatus('success_offline');
    } else {
      onChange(coords, val);
      setGeocodingStatus('idle');
    }
  };

  // Ensure default coordinate alignment
  const currentX = coords?.lng ?? 50;
  const currentY = coords?.lat ?? 40;

  return (
    <div className="bg-slate-950/80 border border-yellow-700/20 rounded-xl p-3 shadow-lg space-y-3">
      {/* Map Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-yellow-500/90 font-medium">
            <MapPin className="w-4 h-4 text-rose-500 animate-bounce shrink-0" />
            <span className="uppercase tracking-wider">
              PROVENANCE : {locationName || "Non spécifiée"}
            </span>
          </div>

          {/* Status Badge */}
          {!readOnly && onChange && (
            <div className="flex items-center gap-1">
              {geocodingStatus === 'success_offline' && (
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Positionné (Hors-ligne)
                </span>
              )}
              {geocodingStatus === 'success_online' && (
                <span className="bg-blue-950/80 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Précisé (Internet)
                </span>
              )}
              {geocodingStatus === 'searching' && (
                <span className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[10px] animate-pulse">
                  Recherche...
                </span>
              )}
              {geocodingStatus === 'not_found' && (
                <span className="bg-rose-950/80 text-rose-400 border border-rose-800/40 px-2 py-0.5 rounded text-[10px] font-medium">
                  Non trouvé (Placez manuellement)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search & Location Editor Panel */}
        {!readOnly && onChange && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-yellow-600/50"
                placeholder="Entrez une ville, pays ou site de fossile..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    performGeocoding(searchQuery, true);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => performGeocoding(searchQuery, true)}
                className="bg-yellow-700/80 hover:bg-yellow-600 text-white border border-yellow-500/30 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Préciser l'emplacement exact en ligne"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Préciser en ligne</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              💡 <span className="font-semibold text-slate-400">Fonctionnement :</span> Positionnement instantané <span className="text-emerald-400">100% hors-ligne</span> pour les grands pays et sites de fossiles célèbres (ex: <i>"Maroc"</i>, <i>"Kem Kem"</i>, <i>"Solnhofen"</i>, <i>"Aveyron"</i>, <i>"Millau"</i>). Cliquez sur le bouton pour préciser n'importe quelle ville avec internet.
            </p>
          </div>
        )}
      </div>

      {/* Map Frame */}
      <div 
        className="relative h-60 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center select-none cursor-crosshair"
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={mapRef}
          className="w-full h-full relative transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Simple Vector-styled earth map background silhouette */}
          <svg
            className="absolute inset-0 w-full h-full text-slate-800/80 fill-current opacity-75"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            {/* Simple simplified continents for fossil location picking */}
            {/* North America */}
            <path d="M50,100 L180,80 L220,130 L260,140 L280,220 L220,250 L110,240 L160,200 L110,180 L70,165 Z" />
            <path d="M120,40 L160,30 L180,50 L130,60 Z" /> {/* Greenland */}
            {/* South America */}
            <path d="M250,260 L290,260 L350,330 L320,430 L270,470 L260,450 L270,400 L250,330 Z" />
            {/* Africa */}
            <path d="M430,180 L520,150 L560,220 L585,260 L540,350 L500,410 L470,390 L480,310 L430,260 Z" />
            <path d="M570,350 L590,340 L580,390 Z" /> {/* Madagascar */}
            {/* Europe */}
            <path d="M410,70 L480,60 L520,90 L510,135 L440,150 L410,140 L415,100 Z" />
            {/* Asia */}
            <path d="M500,60 L680,40 L840,70 L860,110 L820,170 L890,200 L850,280 L740,290 L710,230 L660,250 L630,280 L540,240 L500,160 Q540,110 500,60 Z" />
            {/* India and Indochina */}
            <path d="M660,220 L680,270 L650,280 Z" />
            <path d="M720,250 L755,290 L735,300 Z" />
            {/* Australia */}
            <path d="M780,320 L870,330 L890,380 L840,420 L780,390 Z" />
            
            {/* Gridlines for a gorgeous technical look */}
            <g className="stroke-slate-700/30 stroke-1 fill-none">
              <line x1="0" y1="125" x2="1000" y2="125" />
              <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="5,5" /> {/* Equator */}
              <line x1="0" y1="375" x2="1000" y2="375" />
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="5,5" /> {/* Prime Meridian */}
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>
          </svg>

          {/* User's Pin position */}
          {currentX !== undefined && currentY !== undefined && (
            <div
              className="absolute group"
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                transform: 'translate(-50%, -100%)' // align pin point to target
              }}
            >
              {/* Pulse effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/30 animate-ping -z-10" />
              
              <MapPin className="w-7 h-7 text-rose-500 block drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter" />
              
              {/* Coordinates tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-slate-950 text-[9px] text-yellow-500 font-mono border border-yellow-700/30 rounded px-1.5 py-0.5 whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                {locationName || `Découverte [${Math.round(currentX)}%, ${Math.round(currentY)}%]`}
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-15">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/60 hover:border-yellow-600/40 rounded text-slate-300 hover:text-yellow-500 transition-all"
            title="Zoom +"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/60 hover:border-yellow-600/40 rounded text-slate-300 hover:text-yellow-500 transition-all"
            title="Zoom -"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/60 hover:border-yellow-600/40 rounded text-slate-300 hover:text-yellow-500 transition-all"
            title="Réinitialiser la carte"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Instructional overlays */}
        {!readOnly && onChange && (
          <div className="absolute top-2 left-2 bg-slate-950/80 text-[9px] text-slate-400 border border-slate-800 rounded px-2 py-1">
            Cliquez sur la carte ou saisissez un lieu pour l'épingler
          </div>
        )}
      </div>
    </div>
  );
}
