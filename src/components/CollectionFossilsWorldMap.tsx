import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Fossil } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveCoords, isUnknownLocation, formatGpsCoordinates } from './InteractiveMap';
import { resolveImageUrl } from '../utils/imageUrl';
import { playDinoSound } from '../utils/data/audio';
import {
  Globe,
  Maximize2,
  Minimize2,
  Compass,
  MapPin,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

type MapLayerType = 'satellite' | 'topo' | 'streets' | 'dark';

interface LayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

const WORLD_TILE_LAYERS: Record<MapLayerType, LayerConfig> = {
  satellite: {
    name: 'Satellite Réaliste',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS',
    maxZoom: 19,
  },
  topo: {
    name: 'Relief Géologique',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, USGS, NOAA',
    maxZoom: 18,
  },
  streets: {
    name: 'Villes & Frontières',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  dark: {
    name: 'Contraste Sombre',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd',
  },
};

export interface LocalizedFossil {
  fossil: Fossil;
  lat: number;
  lng: number;
  locationLabel: string;
  source: string;
}

export interface FossilSiteGroup {
  id: string;
  key: string;
  lat: number;
  lng: number;
  locationLabel: string;
  fossils: Fossil[];
  dominantEra: string;
}

interface CollectionFossilsWorldMapProps {
  fossils: Fossil[];
  onSelectFossil?: (fossil: Fossil) => void;
}

export default function CollectionFossilsWorldMap({
  fossils = [],
  onSelectFossil,
}: CollectionFossilsWorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSiteKey, setActiveSiteKey] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Classify fossils into localized vs unknown provenance
  const { localizedFossils } = useMemo(() => {
    const localized: LocalizedFossil[] = [];

    fossils.forEach((fossil) => {
      const isUnk = isUnknownLocation(fossil.provenanceName);
      const coords = fossil.provenanceCoords;
      const hasValidGps =
        coords &&
        typeof coords.lat === 'number' &&
        typeof coords.lng === 'number' &&
        !(Math.round(coords.lat) === 40 && Math.round(coords.lng) === 50) &&
        !(coords.lat === 0 && coords.lng === 0) &&
        coords.lat >= -85 &&
        coords.lat <= 85 &&
        coords.lng >= -180 &&
        coords.lng <= 180;

      if (isUnk && !hasValidGps) {
        return;
      }

      const resolved = resolveCoords(fossil.provenanceCoords, fossil.provenanceName);
      if (resolved.source !== 'unknown') {
        localized.push({
          fossil,
          lat: resolved.lat,
          lng: resolved.lng,
          locationLabel: fossil.provenanceName?.trim() || 'Site répertorié',
          source: resolved.source,
        });
      } else if (hasValidGps) {
        localized.push({
          fossil,
          lat: coords.lat,
          lng: coords.lng,
          locationLabel: fossil.provenanceName?.trim() || 'Coordonnées GPS',
          source: 'custom_gps',
        });
      }
    });

    return { localizedFossils: localized };
  }, [fossils]);

  // Era color helper for map markers
  const getEraColorHex = (era: string): string => {
    switch (era) {
      case 'precambrian':
        return '#10b981'; // emerald
      case 'paleozoic':
        return '#f59e0b'; // amber
      case 'mesozoic':
        return '#f97316'; // orange
      case 'cenozoic':
        return '#eab308'; // yellow
      default:
        return '#e11d48'; // rose
    }
  };

  // Group localized fossils by proximate geographic site
  const groupedSites = useMemo<FossilSiteGroup[]>(() => {
    const groupsMap = new Map<string, FossilSiteGroup>();

    localizedFossils.forEach((item) => {
      const latKey = item.lat.toFixed(2);
      const lngKey = item.lng.toFixed(2);
      const groupKey = `${latKey}_${lngKey}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: groupKey,
          key: groupKey,
          lat: item.lat,
          lng: item.lng,
          locationLabel: item.locationLabel,
          fossils: [item.fossil],
          dominantEra: item.fossil.era,
        });
      } else {
        const existing = groupsMap.get(groupKey)!;
        existing.fossils.push(item.fossil);
        if (item.locationLabel.length > existing.locationLabel.length && !existing.locationLabel.includes('/')) {
          existing.locationLabel = item.locationLabel;
        }
      }
    });

    return Array.from(groupsMap.values());
  }, [localizedFossils]);

  // Create custom marker icon for site group
  const createSiteMarkerIcon = useCallback((site: FossilSiteGroup, isSelected: boolean) => {
    const count = site.fossils.length;
    const color = getEraColorHex(site.dominantEra);
    const primaryFossil = site.fossils[0];
    const imageUrl = primaryFossil.thumbnailImage?.url || primaryFossil.image?.url;
    const resolvedUrl = imageUrl ? resolveImageUrl(imageUrl) : '';

    const avatarHtml = resolvedUrl
      ? `<img src="${resolvedUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; pointer-events: none;" alt="" />`
      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0f172a; color: ${color}; font-size: 11px; font-weight: bold;">F</div>`;

    const countBadge =
      count > 1
        ? `<div style="
            position: absolute;
            top: -4px;
            right: -4px;
            background: #e11d48;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            font-family: ui-monospace, monospace;
            width: 19px;
            height: 19px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #0f172a;
            box-shadow: 0 0 6px rgba(0,0,0,0.8);
            z-index: 10;
          ">${count}</div>`
        : '';

    return L.divIcon({
      className: 'fossil-world-pin',
      html: `
        <div style="position: relative; width: 44px; height: 56px; margin: 0; padding: 0; pointer-events: auto;">
          <!-- Ground Shadow -->
          <div style="position: absolute; bottom: 0; left: 22px; width: 16px; height: 5px; margin-left: -8px; background: rgba(0,0,0,0.7); border-radius: 50%; filter: blur(1.5px);"></div>

          <!-- Radar ring when selected -->
          ${
            isSelected
              ? `<div style="position: absolute; bottom: -2px; left: 22px; width: 34px; height: 12px; margin-left: -17px; border-radius: 50%; background: rgba(234, 179, 8, 0.4); animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          
          <!-- Pin Body -->
          <div style="
            position: absolute; 
            top: 0; 
            left: 2px; 
            width: 40px; 
            height: 52px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.85));
            transform: ${isSelected ? 'scale(1.22) translateY(-4px)' : 'scale(1)'};
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
          ">
            <div style="
              position: relative;
              width: 38px; 
              height: 38px; 
              border-radius: 50%; 
              border: 2.5px solid ${isSelected ? '#facc15' : color}; 
              box-shadow: 0 0 ${isSelected ? '16px rgba(250,204,21,0.9)' : '8px ' + color}; 
              overflow: hidden; 
              background: #020617;
            ">
              ${avatarHtml}
            </div>

            ${countBadge}

            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent; 
              border-right: 6px solid transparent; 
              border-top: 10px solid ${isSelected ? '#facc15' : color}; 
              margin-top: -2px;
            "></div>
          </div>
        </div>
      `,
      iconSize: [44, 56],
      iconAnchor: [22, 52],
      popupAnchor: [0, -50],
    });
  }, []);

  // 1. Initialize Map instance safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [25, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 19,
        attributionControl: true,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerConfig = WORLD_TILE_LAYERS[activeLayer];
      const tiles = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: layerConfig.subdomains || 'abc',
      }).addTo(map);

      const markerGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markerGroup;

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;
      setIsMapReady(true);

      requestAnimationFrame(() => map.invalidateSize());
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        tileLayerRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // 2. Continuous ResizeObserver for container resizing
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Switch Tile Layer
  const handleLayerChange = (type: MapLayerType) => {
    playDinoSound();
    setActiveLayer(type);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = WORLD_TILE_LAYERS[type];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  };

  // 4. Render markers whenever groupedSites or activeSiteKey changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group || !isMapReady) return;

    group.clearLayers();

    groupedSites.forEach((site) => {
      const isSelected = site.key === activeSiteKey;
      const icon = createSiteMarkerIcon(site, isSelected);

      const marker = L.marker([site.lat, site.lng], {
        icon,
        title: `${site.locationLabel} (${site.fossils.length} spécimen${site.fossils.length > 1 ? 's' : ''})`,
      });

      const fossilCount = site.fossils.length;
      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; width: 260px; padding: 2px;">
          <!-- Header Site -->
          <div style="background: #090d16; color: #ffffff; padding: 8px 10px; border-radius: 8px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
                📍 ${site.locationLabel}
              </span>
              <span style="background: #e11d48; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px;">
                ${fossilCount} spécimen${fossilCount > 1 ? 's' : ''}
              </span>
            </div>
            <div style="font-size: 9px; color: #94a3b8; font-family: ui-monospace, monospace; margin-top: 3px;">
              GPS: ${formatGpsCoordinates(site.lat, site.lng)}
            </div>
          </div>

          <!-- Fossils List in this Site -->
          <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px;">
            ${site.fossils
              .map((fossil) => {
                const imgUrl = fossil.thumbnailImage?.url || fossil.image?.url;
                const resolvedImg = imgUrl ? resolveImageUrl(imgUrl) : '';
                const eraCol = getEraColorHex(fossil.era);

                return `
                  <div style="
                    display: flex; 
                    gap: 8px; 
                    align-items: center; 
                    padding: 6px 8px; 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 8px; 
                    transition: all 0.2s ease;
                  ">
                    <div style="width: 42px; height: 42px; border-radius: 6px; overflow: hidden; background: #0f172a; flex-shrink: 0; border: 1.5px solid ${eraCol};">
                      ${
                        resolvedImg
                          ? `<img src="${resolvedImg}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: ${eraCol}; font-weight: bold; font-size: 10px;">F</div>`
                      }
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <h4 style="margin: 0; font-size: 11px; font-weight: 700; color: #0f172a; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${fossil.title}
                      </h4>
                      <div style="font-size: 9px; font-weight: 600; color: ${eraCol}; text-transform: uppercase; margin-top: 1px;">
                        ${fossil.era}
                      </div>
                      ${
                        fossil.periodeDatation
                          ? `<div style="font-size: 9px; color: #64748b; font-family: ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              🗓️ ${fossil.periodeDatation}
                            </div>`
                          : ''
                      }
                      <button
                        id="popup-fossil-btn-${fossil.id}"
                        style="
                          margin-top: 4px; 
                          display: inline-flex; 
                          align-items: center; 
                          gap: 3px; 
                          background: #0f172a; 
                          color: #ffffff; 
                          font-size: 9px; 
                          font-weight: 600; 
                          padding: 3px 7px; 
                          border-radius: 4px; 
                          border: none; 
                          cursor: pointer;
                        "
                      >
                        Consulter la fiche →
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300, minWidth: 260 });

      marker.on('click', () => {
        setActiveSiteKey(site.key);
      });

      marker.on('popupopen', () => {
        setActiveSiteKey(site.key);

        setTimeout(() => {
          site.fossils.forEach((fossil) => {
            const btn = document.getElementById(`popup-fossil-btn-${fossil.id}`);
            if (btn && onSelectFossil) {
              btn.onclick = () => {
                playDinoSound();
                onSelectFossil(fossil);
              };
            }
          });
        }, 50);
      });

      group.addLayer(marker);
    });

    if (groupedSites.length > 0 && !activeSiteKey) {
      setTimeout(() => {
        const m = mapInstanceRef.current;
        const g = markersGroupRef.current;
        if (!m || !g) return;
        m.invalidateSize();
        const bounds = g.getBounds();
        const size = m.getSize();
        if (bounds.isValid() && size.x > 0 && size.y > 0) {
          try {
            m.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
          } catch (e) {
            console.warn('fitBounds caught:', e);
          }
        }
      }, 100);
    }
  }, [groupedSites, activeSiteKey, createSiteMarkerIcon, onSelectFossil, isMapReady]);

  // Fly to specific site
  const flyToSite = (site: FossilSiteGroup) => {
    playDinoSound();
    setActiveSiteKey(site.key);
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([site.lat, site.lng], 8, {
      duration: 1.4,
    });

    const group = markersGroupRef.current;
    if (group) {
      group.eachLayer((layer: any) => {
        if (layer.getLatLng) {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - site.lat) < 0.0001 && Math.abs(pos.lng - site.lng) < 0.0001) {
            setTimeout(() => layer.openPopup(), 1500);
          }
        }
      });
    }
  };

  // Reset to global world view
  const resetWorldView = () => {
    playDinoSound();
    setActiveSiteKey(null);
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([25, 10], 2, { duration: 1.2 });
  };

  // Center on all markers
  const fitAllMarkers = () => {
    playDinoSound();
    setActiveSiteKey(null);
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;
    map.invalidateSize();
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  };

  // Fullscreen toggle with map resizing
  const toggleFullscreen = () => {
    playDinoSound();
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
  };

  return (
    <div
      className={`space-y-4 w-full text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 overflow-y-auto' : ''
      }`}
    >
      {/* CSS Overrides for Leaflet pins */}
      <style>{`
        .fossil-world-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          background: #ffffff;
        }
        .leaflet-popup-content {
          margin: 10px 12px;
          line-height: 1.4;
        }
      `}</style>

      {/* Top Banner / Header without clutter */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 shadow-inner">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>Carte Mondiale des Gisements de la Collection</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                {localizedFossils.length} spécimens géolocalisés
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Localisation par satellite des gisements et formations géologiques où ont été découverts les fossiles de votre collection.
            </p>
          </div>
        </div>

        {/* Quick Actions: Tile Layers + Cadrer + Reset + Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Tile Layer Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => handleLayerChange('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Imagerie satellite haute définition"
            >
              Satellite
            </button>
            <button
              onClick={() => handleLayerChange('topo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeLayer === 'topo'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Relief et topographie géologique"
            >
              Relief
            </button>
            <button
              onClick={() => handleLayerChange('streets')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeLayer === 'streets'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Villes et repères géographiques"
            >
              Carte
            </button>
            <button
              onClick={() => handleLayerChange('dark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeLayer === 'dark'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fond contrasté sombre"
            >
              Nuit
            </button>
          </div>

          {/* Fit All Markers button */}
          <button
            onClick={fitAllMarkers}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-yellow-500/50 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-all"
            title="Centrer la vue sur tous les gisements"
          >
            <Compass className="w-3.5 h-3.5 text-yellow-400" />
            <span>Cadrer</span>
          </button>

          {/* Reset World */}
          <button
            onClick={resetWorldView}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            title="Vue globale du monde"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* MAP STAGE CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950">
        <div
          ref={mapContainerRef}
          className="w-full h-[520px] sm:h-[620px] z-10"
          style={{ minHeight: '500px' }}
        />

        {/* Floating Era Legend in Map bottom-left */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-xl pointer-events-auto space-y-1.5 hidden sm:block">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
            Légende Géologique
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
              <span className="text-slate-300">Paléozoïque</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
              <span className="text-slate-300">Mésozoïque</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.7)]" />
              <span className="text-slate-300">Cénozoïque</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
              <span className="text-slate-300">Précambrien</span>
            </div>
          </div>
        </div>

        {/* Floating Sites Counter Badge top-right */}
        <div className="absolute top-4 right-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-xl text-xs font-mono text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{groupedSites.length} gisements sur le globe</span>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL OF SITES */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-mono text-slate-400">
            {groupedSites.length} gisements répertoriés • Cliquez sur un gisement pour vous y déplacer
          </span>
          {activeSiteKey && (
            <button
              onClick={() => setActiveSiteKey(null)}
              className="text-[11px] font-mono text-yellow-400 hover:text-yellow-300"
            >
              Afficher tous les sites
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {groupedSites.map((site) => {
            const isSelected = site.key === activeSiteKey;
            const primaryFossil = site.fossils[0];
            const imageUrl = primaryFossil.thumbnailImage?.url || primaryFossil.image?.url;
            const resolvedImg = imageUrl ? resolveImageUrl(imageUrl) : '';
            const eraCol = getEraColorHex(site.dominantEra);

            return (
              <div
                key={site.key}
                onClick={() => flyToSite(site)}
                className={`flex-none w-72 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none flex gap-3 items-center ${
                  isSelected
                    ? 'bg-slate-900 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.25)] ring-1 ring-yellow-500/50'
                    : 'bg-slate-950/90 hover:bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Thumbnail Avatar */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                  {resolvedImg ? (
                    <img
                      src={resolvedImg}
                      alt={site.locationLabel}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}

                  {site.fossils.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-tl-md">
                      +{site.fossils.length - 1}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      style={{ color: eraCol }}
                      className="text-[9px] font-mono font-bold uppercase tracking-wider truncate"
                    >
                      {site.dominantEra}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {site.fossils.length} {site.fossils.length > 1 ? 'spécimens' : 'spécimen'}
                    </span>
                  </div>

                  <h4 className="text-xs font-serif font-bold text-white truncate mt-0.5">
                    {site.fossils.map((f) => f.title).join(', ')}
                  </h4>

                  <p className="text-[10px] text-slate-300 truncate flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
                    <span className="truncate">{site.locationLabel}</span>
                  </p>

                  <span className="text-[9px] font-mono text-yellow-400/90 block mt-0.5">
                    {formatGpsCoordinates(site.lat, site.lng)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
