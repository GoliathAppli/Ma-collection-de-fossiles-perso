import React, { useState, useRef, useMemo } from 'react';
import { Fossil } from '../types';
import CroppedImage from './CroppedImage';
import { playDinoSound } from '../utils/data/audio';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  Compass,
  X,
  Ruler
} from 'lucide-react';

interface CollectionFossilsTimelineProps {
  fossils: Fossil[];
  onSelectFossil?: (fossil: Fossil) => void;
}

interface PeriodBucket {
  id: string;
  name: string;
  subName?: string;
  era: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic';
  eraLabel: string;
  duration: string;
  color: {
    badge: string;
    border: string;
    bgGradient: string;
    text: string;
    accent: string;
  };
  keywords: string[];
}

const COLLECTION_PERIODS: PeriodBucket[] = [
  {
    id: 'precambrian',
    name: 'Précambrien',
    subName: 'Hadéen • Archéen • Protérozoïque',
    era: 'precambrian',
    eraLabel: 'Précambrien',
    duration: '4 500 - 541 Ma',
    color: {
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
      border: 'border-emerald-700/50',
      bgGradient: 'from-emerald-950/40 via-slate-950/70 to-slate-950',
      text: 'text-emerald-400',
      accent: 'emerald',
    },
    keywords: ['precambrien', 'précambrien', 'stromatolite', 'ediacara', 'archeen', 'archéen', 'proterozoique', 'protérozoïque', 'hadeen', 'hadéen'],
  },
  {
    id: 'cambrian',
    name: 'Cambrien',
    subName: 'Explosion cambrienne',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '541 - 485 Ma',
    color: {
      badge: 'bg-amber-950 text-amber-300 border-amber-700/60',
      border: 'border-amber-700/50',
      bgGradient: 'from-amber-950/40 via-slate-950/70 to-slate-950',
      text: 'text-amber-400',
      accent: 'amber',
    },
    keywords: ['cambrien', 'cambrian', 'terreneuvien', 'serygien', 'sérygien', 'miaolingien', 'furongien', 'chengjiang', 'burgess', 'trilobite'],
  },
  {
    id: 'ordovician',
    name: 'Ordovicien',
    subName: 'Mers chaudes & Céphalopodes',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '485 - 444 Ma',
    color: {
      badge: 'bg-teal-950 text-teal-300 border-teal-700/60',
      border: 'border-teal-700/50',
      bgGradient: 'from-teal-950/40 via-slate-950/70 to-slate-950',
      text: 'text-teal-400',
      accent: 'teal',
    },
    keywords: ['ordovicien', 'ordovician', 'fezouata', 'orthocere', 'orthocère', 'nautiloide', 'graptolite'],
  },
  {
    id: 'silurian',
    name: 'Silurien',
    subName: 'Sortie des eaux & Premiers poissons',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '444 - 419 Ma',
    color: {
      badge: 'bg-cyan-950 text-cyan-300 border-cyan-700/60',
      border: 'border-cyan-700/50',
      bgGradient: 'from-cyan-950/40 via-slate-950/70 to-slate-950',
      text: 'text-cyan-400',
      accent: 'cyan',
    },
    keywords: ['silurien', 'silurian', 'llandovery', 'wenlock', 'ludlow', 'pridoli', 'euryptéride', 'eurypteride', 'scorpions de mer'],
  },
  {
    id: 'devonian',
    name: 'Dévonien',
    subName: 'Âge d\'or des poissons',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '419 - 359 Ma',
    color: {
      badge: 'bg-sky-950 text-sky-300 border-sky-700/60',
      border: 'border-sky-700/50',
      bgGradient: 'from-sky-950/40 via-slate-950/70 to-slate-950',
      text: 'text-sky-400',
      accent: 'sky',
    },
    keywords: ['devonien', 'dévonien', 'devonian', 'placoderme', 'dunkleosteus', 'erfoud', 'goniatite', 'tetrapode'],
  },
  {
    id: 'carboniferous',
    name: 'Carbonifère',
    subName: 'Forêts géantes & Arthropodes',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '359 - 299 Ma',
    color: {
      badge: 'bg-blue-950 text-blue-300 border-blue-700/60',
      border: 'border-blue-700/50',
      bgGradient: 'from-blue-950/40 via-slate-950/70 to-slate-950',
      text: 'text-blue-400',
      accent: 'blue',
    },
    keywords: ['carbonifere', 'carbonifère', 'carboniferous', 'mississippien', 'pennsylvanien', 'lepidodendron', 'meganeura', 'houille'],
  },
  {
    id: 'permian',
    name: 'Permien',
    subName: 'Pangée & Synapsides',
    era: 'paleozoic',
    eraLabel: 'Paléozoïque',
    duration: '299 - 252 Ma',
    color: {
      badge: 'bg-indigo-950 text-indigo-300 border-indigo-700/60',
      border: 'border-indigo-700/50',
      bgGradient: 'from-indigo-950/40 via-slate-950/70 to-slate-950',
      text: 'text-indigo-400',
      accent: 'indigo',
    },
    keywords: ['permien', 'permian', 'dimetrodon', 'dimétrodon', 'cisuralien', 'guadalupien', 'lopingien', 'gorgonopsien'],
  },
  {
    id: 'triassic',
    name: 'Trias',
    subName: 'Aube des dinosaures',
    era: 'mesozoic',
    eraLabel: 'Mésozoïque',
    duration: '252 - 201 Ma',
    color: {
      badge: 'bg-amber-950 text-amber-300 border-amber-700/60',
      border: 'border-amber-700/50',
      bgGradient: 'from-amber-950/40 via-slate-950/70 to-slate-950',
      text: 'text-amber-400',
      accent: 'amber',
    },
    keywords: ['trias', 'triassic', 'indusien', 'olenekien', 'anisien', 'ladinien', 'carnien', 'norien', 'retien', 'rétien', 'coelophysis'],
  },
  {
    id: 'jurassic',
    name: 'Jurassique',
    subName: 'Lias • Dogger • Malm',
    era: 'mesozoic',
    eraLabel: 'Mésozoïque',
    duration: '201 - 145 Ma',
    color: {
      badge: 'bg-orange-950 text-orange-300 border-orange-700/60',
      border: 'border-orange-700/50',
      bgGradient: 'from-orange-950/40 via-slate-950/70 to-slate-950',
      text: 'text-orange-400',
      accent: 'orange',
    },
    keywords: ['jurassique', 'jurassic', 'lias', 'dogger', 'malm', 'toarcien', 'oxfordien', 'kimmeridgien', 'kimméridgien', 'bathonien', 'bajocien', 'hettangien', 'callovien', 'sinemurien', 'tithonien', 'solnhofen', 'holzmaden', 'aveyron', 'millau'],
  },
  {
    id: 'cretaceous',
    name: 'Crétacé',
    subName: 'Apogée des dinosaures & K-Pg',
    era: 'mesozoic',
    eraLabel: 'Mésozoïque',
    duration: '145 - 66 Ma',
    color: {
      badge: 'bg-rose-950 text-rose-300 border-rose-700/60',
      border: 'border-rose-700/50',
      bgGradient: 'from-rose-950/40 via-slate-950/70 to-slate-950',
      text: 'text-rose-400',
      accent: 'rose',
    },
    keywords: ['cretace', 'crétacé', 'cretaceous', 'cenomanien', 'cénomanien', 'maastrichtien', 'turonien', 'campanien', 'albien', 'aptien', 'barremien', 'barrémien', 'hauterivien', 'valanginien', 'berriasien', 'kem kem', 'santana', 'haqel', 'spinosaurus', 'tyrannosaurus', 'mosasaure'],
  },
  {
    id: 'paleogene',
    name: 'Paléogène',
    subName: 'Paléocène • Éocène • Oligocène',
    era: 'cenozoic',
    eraLabel: 'Cénozoïque',
    duration: '66 - 23 Ma',
    color: {
      badge: 'bg-yellow-950 text-yellow-300 border-yellow-700/60',
      border: 'border-yellow-700/50',
      bgGradient: 'from-yellow-950/40 via-slate-950/70 to-slate-950',
      text: 'text-yellow-400',
      accent: 'yellow',
    },
    keywords: ['paleogene', 'paléogène', 'paleocene', 'paléocène', 'eocene', 'éocène', 'oligocene', 'oligocène', 'messel', 'bolca', 'khouribga', 'phosphates', 'lutétien', 'yprésien'],
  },
  {
    id: 'neogene',
    name: 'Néogène',
    subName: 'Miocène • Pliocène',
    era: 'cenozoic',
    eraLabel: 'Cénozoïque',
    duration: '23 - 2,58 Ma',
    color: {
      badge: 'bg-lime-950 text-lime-300 border-lime-700/60',
      border: 'border-lime-700/50',
      bgGradient: 'from-lime-950/40 via-slate-950/70 to-slate-950',
      text: 'text-lime-400',
      accent: 'lime',
    },
    keywords: ['neogene', 'néogène', 'miocene', 'miocène', 'pliocene', 'pliocène', 'megalodon', 'mégalodon', 'otodus', 'messinien', 'tortonien', 'burdigalien', 'aquitanien'],
  },
  {
    id: 'quaternary',
    name: 'Quaternaire',
    subName: 'Pléistocène • Holocène (Actuel)',
    era: 'cenozoic',
    eraLabel: 'Cénozoïque',
    duration: '2,58 Ma - Aujourd\'hui',
    color: {
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
      border: 'border-emerald-700/50',
      bgGradient: 'from-emerald-950/40 via-slate-950/70 to-slate-950',
      text: 'text-emerald-400',
      accent: 'emerald',
    },
    keywords: ['quaternaire', 'quaternary', 'pleistocene', 'pléistocène', 'holocene', 'holocène', 'mammouth', 'mammoth', 'smilodon', 'ours des cavernes', 'glaciaire', 'actuel'],
  },
];

export default function CollectionFossilsTimeline({
  fossils = [],
  onSelectFossil,
}: CollectionFossilsTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewFossil, setPreviewFossil] = useState<Fossil | null>(null);

  // Classify each fossil into its corresponding period bucket
  const mappedFossils = useMemo(() => {
    const buckets: Record<string, Fossil[]> = {};
    COLLECTION_PERIODS.forEach((p) => {
      buckets[p.id] = [];
    });

    fossils.forEach((fossil) => {
      // Build searchable normalized text for the fossil
      const searchTarget = [
        fossil.title || '',
        fossil.lifespanPeriodStart || '',
        fossil.lifespanPeriodEnd || '',
        fossil.periodeDatation || '',
        fossil.provenanceName || '',
        fossil.description || '',
      ]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Check for exact period matches first
      let matched = false;
      for (const period of COLLECTION_PERIODS) {
        for (const kw of period.keywords) {
          const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (searchTarget.includes(normKw)) {
            buckets[period.id].push(fossil);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      // Fallback matching using era if specific period was not identified
      if (!matched) {
        if (fossil.era === 'precambrian') {
          buckets['precambrian'].push(fossil);
        } else if (fossil.era === 'paleozoic') {
          buckets['devonian'].push(fossil); // fallback middle paleozoic
        } else if (fossil.era === 'mesozoic') {
          buckets['jurassic'].push(fossil); // fallback middle mesozoic
        } else if (fossil.era === 'cenozoic') {
          buckets['paleogene'].push(fossil); // fallback early cenozoic
        } else {
          // Default to Jurassic if completely unspecified
          buckets['jurassic'].push(fossil);
        }
      }
    });

    return buckets;
  }, [fossils]);

  const scrollLeft = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 w-full text-slate-100">
      {/* Header with Title and Scroll Controls */}
      <div className="bg-slate-950/80 border border-yellow-700/30 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-yellow-600/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-extrabold uppercase tracking-wide bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.25)]">
              Frise Chronologique des Fossiles de la Collection
            </h2>
            <p className="text-xs sm:text-sm text-amber-300/80 font-mono italic mt-0.5">
              Positionnement temporel de chaque spécimen du conservatoire
            </p>
          </div>
        </div>

        {/* Scroll Nav Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={scrollLeft}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-yellow-400 transition-all shadow-md active:scale-95"
            title="Faire défiler vers le passé"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-yellow-400 transition-all shadow-md active:scale-95"
            title="Faire défiler vers le présent"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL TIMELINE TRACK FOR FOSSILS */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto py-3 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {COLLECTION_PERIODS.map((period) => {
          const periodFossils = mappedFossils[period.id] || [];
          const hasFossils = periodFossils.length > 0;

          return (
            <div
              key={period.id}
              className={`flex-none w-72 sm:w-80 snap-start rounded-2xl border transition-all duration-300 bg-gradient-to-b ${period.color.bgGradient} ${
                hasFossils
                  ? 'border-slate-800/90 shadow-lg ring-1 ring-slate-800/50'
                  : 'border-slate-900/80 opacity-70 hover:opacity-100'
              } p-4 flex flex-col justify-between select-none relative overflow-hidden`}
            >
              {/* Period Top Indicator Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  hasFossils ? 'bg-yellow-500' : 'bg-slate-800'
                }`}
              />

              <div className="space-y-3">
                {/* Header: Era badge + duration */}
                <div className="flex justify-between items-center pt-1">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${period.color.badge}`}
                  >
                    {period.eraLabel}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    {period.duration}
                  </span>
                </div>

                {/* Period Title & Fossil Count Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-serif font-extrabold text-white">
                      {period.name}
                    </h3>
                    {period.subName && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {period.subName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      hasFossils
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {periodFossils.length} {periodFossils.length > 1 ? 'spécimens' : 'spécimen'}
                  </span>
                </div>

                {/* FOSSILS LIST OR EMPTY PLACEHOLDER */}
                <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                  {hasFossils ? (
                    periodFossils.map((fossil) => (
                      <div
                        key={fossil.id}
                        onClick={() => {
                          playDinoSound();
                          if (onSelectFossil) {
                            onSelectFossil(fossil);
                          } else {
                            setPreviewFossil(fossil);
                          }
                        }}
                        className="group flex gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-yellow-500/50 transition-all cursor-pointer shadow-md hover:shadow-yellow-500/5 active:scale-[0.98]"
                      >
                        {/* Thumbnail Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 relative">
                          {fossil.image?.url ? (
                            <CroppedImage
                              settings={fossil.thumbnailImage || fossil.image}
                              alt={fossil.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Sparkles className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Info details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-serif font-bold text-slate-100 group-hover:text-yellow-400 transition-colors truncate">
                              {fossil.title}
                            </h4>
                            {fossil.periodeDatation ? (
                              <span className="text-[10px] font-mono text-yellow-500/90 block truncate mt-0.5">
                                {fossil.periodeDatation}
                              </span>
                            ) : fossil.lifespanPeriodStart ? (
                              <span className="text-[10px] font-mono text-slate-400 block truncate mt-0.5">
                                {fossil.lifespanPeriodStart}
                              </span>
                            ) : null}
                          </div>

                          {/* Provenance site */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="flex items-center gap-1 truncate max-w-[130px]">
                              <MapPin className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
                              <span className="truncate">{fossil.provenanceName || 'Lieu non précisé'}</span>
                            </span>
                            <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-850 p-4 space-y-1.5">
                      <Layers className="w-6 h-6 text-slate-700 mx-auto" />
                      <p className="text-[11px] font-mono text-slate-500">
                        Aucun spécimen pour le moment
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Période sans fossile répertorié
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Period Footer */}
              <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{period.name}</span>
                <span className="text-slate-400 font-semibold">
                  {periodFossils.length > 0 ? '✓ Collection active' : 'En attente'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK MODAL PREVIEW FOR A FOSSIL (IF ONSELECTFOSSIL IS NOT NAVIGATING DIRECTLY) */}
      {previewFossil && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setPreviewFossil(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo preview */}
            <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
              {previewFossil.image?.url && (
                <CroppedImage
                  settings={previewFossil.image}
                  alt={previewFossil.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                {previewFossil.era}
              </span>
              <h3 className="text-xl font-serif font-bold text-white">
                {previewFossil.title}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-400 pt-1">
                {previewFossil.periodeDatation && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Calendar className="w-3 h-3" /> {previewFossil.periodeDatation}
                  </span>
                )}
                {previewFossil.provenanceName && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3 h-3 text-rose-400" /> {previewFossil.provenanceName}
                  </span>
                )}
                {previewFossil.dimensions && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Ruler className="w-3 h-3" /> {previewFossil.dimensions}
                  </span>
                )}
                {previewFossil.tailleEspece && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Ruler className="w-3 h-3 text-amber-400" /> Espèce : {previewFossil.tailleEspece}
                  </span>
                )}
              </div>
            </div>

            {previewFossil.description && (
              <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                {previewFossil.description}
              </p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setPreviewFossil(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-mono text-slate-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
