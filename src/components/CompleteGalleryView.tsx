import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Fossil } from '../types';
import { playDinoSound } from '../utils/data/audio';
import CroppedImage from './CroppedImage';
import FossilDetailSheet from './FossilDetailSheet';
import {
  MicrobeIcon,
  TrilobiteIcon,
  AmmoniteIcon,
  MammothIcon
} from '../utils/data/PeriodIcons';
import {
  Search,
  LayoutGrid,
  Grid,
  Grid3X3,
  List,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Tag,
  AlertCircle,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { sortFossilsChronologically } from '../utils/chronology';

interface CompleteGalleryViewProps {
  fossils: Fossil[];
  isAdmin: boolean;
  initialSearch?: string;
  initialFossilId?: string | null;
  onBackToHome: () => void;
  onOpenEditForm: (fossil: Fossil) => void;
  onModifyFossil?: (fossil: Fossil) => Promise<void> | void;
  onDeleteFossil: (id: string) => void;
  onNavigateToEra?: (eraView: 'era_precambrian' | 'era_paleozoic' | 'era_mesozoic' | 'era_cenozoic') => void;
}

type ViewMode = 'carousels' | 'list' | 'grid3';

// Helper to identify era
const getNormalizedEraKey = (era: string | undefined): 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic' => {
  const clean = (era || '').toLowerCase().replace('é', 'e');
  if (clean === 'precambrien' || clean === 'precambrian') return 'precambrian';
  if (clean === 'paleozoique' || clean === 'paleozoic') return 'paleozoic';
  if (clean === 'mesozoique' || clean === 'mesozoic') return 'mesozoic';
  return 'cenozoic';
};

// Era metadata definitions (without presentation images as requested)
const ERAS_META = [
  {
    key: 'precambrian' as const,
    title: 'Précambrien',
    dates: '4600 à 541 millions d\'années',
    Icon: MicrobeIcon,
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/50 text-amber-300 border-amber-600/40',
    borderColor: 'border-amber-500/30'
  },
  {
    key: 'paleozoic' as const,
    title: 'Paléozoïque',
    dates: '541 à 252 millions d\'années',
    Icon: TrilobiteIcon,
    accentColor: 'text-sky-400',
    badgeBg: 'bg-sky-950/50 text-sky-300 border-sky-600/40',
    borderColor: 'border-sky-500/30'
  },
  {
    key: 'mesozoic' as const,
    title: 'Mésozoïque',
    dates: '252 à 66 millions d\'années',
    Icon: AmmoniteIcon,
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40',
    borderColor: 'border-emerald-500/30'
  },
  {
    key: 'cenozoic' as const,
    title: 'Cénozoïque',
    dates: '66 millions d\'années à nos jours',
    Icon: MammothIcon,
    accentColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/50 text-purple-300 border-purple-600/40',
    borderColor: 'border-purple-500/30'
  }
];

// Single Era Carousel Row Component
interface EraCarouselLineProps {
  eraKey: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic';
  title: string;
  dates: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  fossils: Fossil[];
  isSearching: boolean;
  isAdmin: boolean;
  onSelectFossil: (fossilId: string) => void;
  onOpenEditForm: (fossil: Fossil) => void;
  onAddNewFossil: (era: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic') => void;
}

function EraCarouselLine({
  eraKey,
  title,
  dates,
  Icon,
  accentColor,
  badgeBg,
  borderColor,
  fossils,
  isSearching,
  isAdmin,
  onSelectFossil,
  onOpenEditForm,
  onAddNewFossil
}: EraCarouselLineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    playDinoSound();
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 transition-colors">
      {/* Era Line Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-yellow-500">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif uppercase tracking-wider text-white">
                {title}
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {fossils.length} {fossils.length > 1 ? 'spécimens' : 'spécimen'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono italic">
              {dates}
            </p>
          </div>
        </div>

        {/* Right side controls: Admin Add + Scroll buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => onAddNewFossil(eraKey)}
              className="flex items-center gap-1.5 bg-yellow-950/50 hover:bg-yellow-900/60 border border-yellow-700/40 text-yellow-400 text-xs px-3 py-1.5 rounded-lg transition-all font-mono cursor-pointer active:scale-95"
              title={`Ajouter un fossile pour ${title}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajouter ({title})</span>
            </button>
          )}

          {/* Carousel Arrows */}
          {fossils.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => scroll('left')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-600/40 text-slate-300 hover:text-yellow-400 transition-all cursor-pointer active:scale-90"
                title="Défiler vers la gauche"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-600/40 text-slate-300 hover:text-yellow-400 transition-all cursor-pointer active:scale-90"
                title="Défiler vers la droite"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      {fossils.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-slate-850 rounded-xl bg-slate-900/20">
          <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-mono">
            {isSearching
              ? `Aucun spécimen ne correspond à la recherche dans l'ère ${title}.`
              : `Aucun spécimen répertorié pour l'ère ${title}.`}
          </p>
        </div>
      ) : (
        <div
          ref={trackRef}
          className="flex gap-4 md:gap-5 overflow-x-auto py-2 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {fossils.map((fos) => (
            <div
              key={fos.id}
              onClick={() => {
                playDinoSound();
                onSelectFossil(fos.id);
              }}
              className="flex-none w-60 sm:w-64 snap-start bg-slate-950/90 border border-slate-800 hover:border-yellow-500/60 rounded-xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group select-none hover:bg-slate-900/80 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Image Thumbnail Container (kept exact size h-32 from before) */}
              <div className="h-32 rounded-lg overflow-hidden bg-transparent mb-3 relative flex items-center justify-center pointer-events-none">
                <CroppedImage
                  settings={fos.image}
                  alt={fos.title}
                  className="w-full h-full"
                />
              </div>

              {/* Title */}
              <h3 className="text-center font-serif text-sm font-bold uppercase text-white break-words [overflow-wrap:anywhere] hyphens-auto line-clamp-2 mb-1.5 leading-snug group-hover:text-yellow-400 transition-colors">
                {fos.title || 'Spécimen de Fossile'}
              </h3>

              {/* Reference pill */}
              {fos.reference && (
                <div className="text-center mt-2">
                  <span className="inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold tracking-wide text-amber-200 bg-amber-950/80 border border-amber-500/60 px-3 py-1 rounded-md shadow-md shadow-amber-950/70 group-hover:border-amber-400 group-hover:bg-amber-900/80 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                    <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">RÉF.</span>
                    <span className="text-amber-100 font-bold">{fos.reference}</span>
                  </span>
                </div>
              )}

              {/* Admin Quick Action */}
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playDinoSound();
                      onOpenEditForm(fos);
                    }}
                    className="p-1.5 bg-yellow-950/90 border border-yellow-600/40 text-yellow-400 rounded-md hover:bg-yellow-900 text-xs shadow-md"
                    title="Modifier la fiche"
                  >
                    🔧
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CompleteGalleryView({
  fossils,
  isAdmin,
  initialSearch = '',
  initialFossilId = null,
  onBackToHome,
  onOpenEditForm,
  onModifyFossil,
  onDeleteFossil
}: CompleteGalleryViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<ViewMode>('carousels');
  const [activeFossilId, setActiveFossilId] = useState<string | null>(initialFossilId);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper to open a fossil sheet and instantly scroll all the way to the top
  const handleSelectFossil = (id: string | null) => {
    if (id) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    setActiveFossilId(id);
  };

  // Sync external changes
  useEffect(() => {
    if (initialFossilId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setActiveFossilId(initialFossilId);
    }
  }, [initialFossilId]);

  // When activeFossilId is activated, ensure window is scrolled to the very top
  useEffect(() => {
    if (activeFossilId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const raf = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 50);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [activeFossilId]);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Filtered fossils logic sorted chronologically
  const filteredFossils = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = !query
      ? fossils
      : fossils.filter((f) => {
          const refMatch = (f.reference || '').toLowerCase().includes(query);
          const titleMatch = (f.title || '').toLowerCase().includes(query);
          const descMatch = (f.description || '').toLowerCase().includes(query);
          const provMatch = (f.provenanceName || '').toLowerCase().includes(query);
          const eraMatch = (f.era || '').toLowerCase().includes(query);

          return refMatch || titleMatch || descMatch || provMatch || eraMatch;
        });

    return sortFossilsChronologically(base);
  }, [fossils, searchQuery]);

  // Segregate fossils by era
  const eraFossilsMap = useMemo(() => {
    const map = {
      precambrian: [] as Fossil[],
      paleozoic: [] as Fossil[],
      mesozoic: [] as Fossil[],
      cenozoic: [] as Fossil[]
    };

    filteredFossils.forEach((f) => {
      const key = getNormalizedEraKey(f.era);
      map[key].push(f);
    });

    return map;
  }, [filteredFossils]);

  // Search submission handler: exact match opens directly
  const handleQuickReferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // 1. Exact match by reference
    const exactRefMatch = fossils.find(
      (f) => (f.reference || '').trim().toLowerCase() === query
    );
    if (exactRefMatch) {
      playDinoSound();
      handleSelectFossil(exactRefMatch.id);
      return;
    }

    // 2. Exact match by title
    const exactTitleMatch = fossils.find(
      (f) => (f.title || '').trim().toLowerCase() === query
    );
    if (exactTitleMatch) {
      playDinoSound();
      handleSelectFossil(exactTitleMatch.id);
      return;
    }

    // 3. Single match across all filters
    if (filteredFossils.length === 1) {
      playDinoSound();
      handleSelectFossil(filteredFossils[0].id);
    }
  };

  // Admin New Fossil Creator
  const handleCreateNewFossil = (era: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic' = 'precambrian') => {
    playDinoSound();
    const newFossil: Fossil = {
      id: Math.random().toString(),
      era: era,
      title: '',
      image: { url: '', scale: 1, posX: 0, posY: 0 },
      reference: '',
      description: '',
      descImages: [],
      dietText: '',
      dietImages: [],
      leFossileText: '',
      leFossileImage: { url: '', scale: 1, posX: 0, posY: 0 },
      provenanceCoords: { lat: 46.2, lng: 2.2 },
      provenanceName: '',
      lifespanPeriodStart: '',
      lifespanPeriodEnd: '',
      saviezVousText: '',
      saviezVousImage: { url: '', scale: 1, posX: 0, posY: 0 }
    };
    onOpenEditForm(newFossil);
  };

  // Active fossil for detailed sheet
  const activeFossil = fossils.find((f) => f.id === activeFossilId);

  // If a fossil sheet is actively opened, show it!
  if (activeFossil) {
    return (
      <div className="space-y-6">
        <FossilDetailSheet
          fossil={activeFossil}
          isAdmin={isAdmin}
          onClose={() => setActiveFossilId(null)}
          onEdit={(f) => {
            setActiveFossilId(null);
            onOpenEditForm(f);
          }}
          onDelete={(id) => {
            setActiveFossilId(null);
            onDeleteFossil(id);
          }}
          onSaveTraceability={onModifyFossil}
        />
      </div>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-12">
      {/* TOP NAVIGATION */}
      <div className="flex items-center justify-start">
        <button
          onClick={() => {
            playDinoSound();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer w-fit shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-500" />
          <span>Retour à l'accueil</span>
        </button>
      </div>

      {/* SEARCH BAR (COMPACT & SLEEK) */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-yellow-600/40 focus-within:border-yellow-500/60 rounded-xl p-2 sm:p-2.5 shadow-md transition-all">
        {/* Input form */}
        <form onSubmit={handleQuickReferenceSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-yellow-500 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche par référence (ex: P1) ou par nom de fossile..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950/70 border border-slate-800/80 focus:border-yellow-500/50 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all font-mono flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 shrink-0"
          >
            <span>Trouver la Fiche</span>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Search Results Feedback Bar */}
        {isSearching && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-xs font-mono px-1">
            <span className="text-yellow-400 text-[11px]">
              {filteredFossils.length} résultat{filteredFossils.length > 1 ? 's' : ''} trouvé{filteredFossils.length > 1 ? 's' : ''} pour « {searchQuery} »
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* VIEW CONTROLS (CARROUSELS VS LISTE VS GRILLE 3 COLONNES) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          <span className="text-slate-400 text-[11px]">Ordre chronologique :</span>
          <span className="text-yellow-400/90 font-bold text-[11px]">Précambrien → Cénozoïque</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 border border-slate-800 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => {
              playDinoSound();
              setViewMode('carousels');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
              viewMode === 'carousels'
                ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affichage en carrousels horizontaux"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Carrousels</span>
          </button>

          <button
            onClick={() => {
              playDinoSound();
              setViewMode('list');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affichage en liste verticale"
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste</span>
          </button>

          <button
            onClick={() => {
              playDinoSound();
              setViewMode('grid3');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
              viewMode === 'grid3'
                ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affichage en quadrillage de 3 colonnes"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>3 Colonnes</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIEW */}
      {viewMode === 'carousels' && (
        <div className="space-y-8">
          {ERAS_META.map((meta) => {
            const eraFossils = eraFossilsMap[meta.key];
            return (
              <EraCarouselLine
                key={meta.key}
                eraKey={meta.key}
                title={meta.title}
                dates={meta.dates}
                Icon={meta.Icon}
                accentColor={meta.accentColor}
                badgeBg={meta.badgeBg}
                borderColor={meta.borderColor}
                fossils={eraFossils}
                isSearching={isSearching}
                isAdmin={isAdmin}
                onSelectFossil={handleSelectFossil}
                onOpenEditForm={onOpenEditForm}
                onAddNewFossil={handleCreateNewFossil}
              />
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        /* CHRONOLOGICAL LIST VIEW (1 column on mobile / 2-4 on larger displays) */
        <div className="space-y-8">
          {filteredFossils.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-mono">
                Aucun spécimen ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            ERAS_META.map((meta) => {
              const eraFossils = eraFossilsMap[meta.key];
              if (eraFossils.length === 0) return null;
              return (
                <div key={meta.key} className="space-y-4">
                  {/* Era Chronological Section Header */}
                  <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${meta.badgeBg} border ${meta.borderColor}`}>
                        <meta.Icon className={`w-4 h-4 ${meta.accentColor}`} />
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h3 className="font-serif text-sm md:text-base font-bold uppercase tracking-wider text-slate-100">
                          {meta.title}
                        </h3>
                        <span className="text-[11px] font-mono text-amber-400/90 font-medium">
                          {meta.dates}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-900/90 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full shrink-0">
                      {eraFossils.length} spécimen{eraFossils.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {eraFossils.map((fos) => (
                      <div
                        key={fos.id}
                        onClick={() => {
                          playDinoSound();
                          handleSelectFossil(fos.id);
                        }}
                        className="bg-slate-950/90 border border-slate-800 hover:border-yellow-500/60 rounded-xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group select-none hover:bg-slate-900/80 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:scale-[1.02]"
                      >
                        <div className="h-36 rounded-lg overflow-hidden bg-transparent mb-3 relative flex items-center justify-center pointer-events-none">
                          <CroppedImage
                            settings={fos.image}
                            alt={fos.title}
                            className="w-full h-full"
                          />
                        </div>

                        <h3 className="text-center font-serif text-sm font-bold uppercase text-white break-words line-clamp-2 mb-1 leading-snug group-hover:text-yellow-400 transition-colors">
                          {fos.title || 'Spécimen de Fossile'}
                        </h3>

                        {fos.reference && (
                          <div className="text-center mt-2">
                            <span className="inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold tracking-wide text-amber-200 bg-amber-950/80 border border-amber-500/60 px-3 py-1 rounded-md shadow-md shadow-amber-950/70 group-hover:border-amber-400 group-hover:bg-amber-900/80 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">RÉF.</span>
                              <span className="text-amber-100 font-bold">{fos.reference}</span>
                            </span>
                          </div>
                        )}

                        {isAdmin && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playDinoSound();
                                onOpenEditForm(fos);
                              }}
                              className="p-1.5 bg-yellow-950/90 border border-yellow-600/40 text-yellow-400 rounded-md hover:bg-yellow-900 text-xs shadow-md"
                              title="Modifier la fiche"
                            >
                              🔧
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'grid3' && (
        /* CHRONOLOGICAL 3-COLUMN GRID VIEW */
        <div className="space-y-8">
          {filteredFossils.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-mono">
                Aucun spécimen ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            ERAS_META.map((meta) => {
              const eraFossils = eraFossilsMap[meta.key];
              if (eraFossils.length === 0) return null;
              return (
                <div key={meta.key} className="space-y-3 sm:space-y-4">
                  {/* Era Chronological Section Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 sm:p-1.5 rounded-lg ${meta.badgeBg} border ${meta.borderColor}`}>
                        <meta.Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${meta.accentColor}`} />
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3 className="font-serif text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-slate-100">
                          {meta.title}
                        </h3>
                        <span className="text-[10px] sm:text-[11px] font-mono text-amber-400/90 font-medium">
                          {meta.dates}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono bg-slate-900/90 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full shrink-0">
                      {eraFossils.length} spécimen{eraFossils.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* 3 Columns Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3.5 md:gap-4.5">
                    {eraFossils.map((fos) => (
                      <div
                        key={fos.id}
                        onClick={() => {
                          playDinoSound();
                          handleSelectFossil(fos.id);
                        }}
                        className="bg-slate-950/90 border border-slate-800 hover:border-yellow-500/60 rounded-lg sm:rounded-xl p-2 sm:p-3 cursor-pointer transition-all duration-300 relative overflow-hidden group select-none hover:bg-slate-900/80 hover:shadow-[0_0_16px_rgba(234,179,8,0.15)] hover:scale-[1.02] flex flex-col justify-between"
                      >
                        <div className="h-20 sm:h-28 md:h-36 rounded-md sm:rounded-lg overflow-hidden bg-transparent mb-1.5 sm:mb-2 relative flex items-center justify-center pointer-events-none">
                          <CroppedImage
                            settings={fos.image}
                            alt={fos.title}
                            className="w-full h-full"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <h3 className="text-center font-serif text-[11px] sm:text-xs md:text-sm font-bold uppercase text-white break-words line-clamp-2 mb-1 leading-tight group-hover:text-yellow-400 transition-colors">
                            {fos.title || 'Spécimen de Fossile'}
                          </h3>

                          {fos.reference && (
                            <div className="text-center mt-1">
                              <span className="inline-flex items-center justify-center gap-1 text-[9px] sm:text-[11px] font-mono font-bold tracking-wide text-amber-200 bg-amber-950/80 border border-amber-500/60 px-1.5 sm:px-2 py-0.5 rounded shadow-sm group-hover:border-amber-400 group-hover:bg-amber-900/80 transition-all">
                                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-400/90 tracking-wider">RÉF.</span>
                                <span className="text-amber-100 font-bold">{fos.reference}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playDinoSound();
                                onOpenEditForm(fos);
                              }}
                              className="p-1 bg-yellow-950/90 border border-yellow-600/40 text-yellow-400 rounded hover:bg-yellow-900 text-[10px] sm:text-xs shadow-md"
                              title="Modifier la fiche"
                            >
                              🔧
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
