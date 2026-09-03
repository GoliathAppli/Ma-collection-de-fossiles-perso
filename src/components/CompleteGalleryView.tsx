import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Fossil, ImageSettings } from '../types';
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
  Grid,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Sparkles,
  Compass,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  ArrowUpDown,
  Filter,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

interface CompleteGalleryViewProps {
  fossils: Fossil[];
  isAdmin: boolean;
  initialSearch?: string;
  initialFossilId?: string | null;
  onBackToHome: () => void;
  onOpenEditForm: (fossil: Fossil) => void;
  onDeleteFossil: (id: string) => void;
  onNavigateToEra?: (eraView: 'era_precambrian' | 'era_paleozoic' | 'era_mesozoic' | 'era_cenozoic') => void;
}

type ViewMode = 'grid' | 'compact' | 'list' | 'carousel';
type EraFilter = 'all' | 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic';
type SortOption = 'chronological' | 'ref_asc' | 'title_asc';

export default function CompleteGalleryView({
  fossils,
  isAdmin,
  initialSearch = '',
  initialFossilId = null,
  onBackToHome,
  onOpenEditForm,
  onDeleteFossil,
  onNavigateToEra
}: CompleteGalleryViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedEra, setSelectedEra] = useState<EraFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('chronological');
  const [activeFossilId, setActiveFossilId] = useState<string | null>(initialFossilId);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initial fossil or search if changed from outside
  useEffect(() => {
    if (initialFossilId) {
      setActiveFossilId(initialFossilId);
    }
  }, [initialFossilId]);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Era helper info
  const getEraMeta = (era: string) => {
    const clean = (era || '').toLowerCase().replace('é', 'e');
    if (clean === 'precambrien' || clean === 'precambrian') {
      return {
        key: 'precambrian' as const,
        label: 'Précambrien',
        order: 0,
        badgeBg: 'bg-amber-950/40 text-amber-400 border-amber-600/40',
        dotColor: 'bg-amber-400',
        Icon: MicrobeIcon
      };
    }
    if (clean === 'paleozoique' || clean === 'paleozoic') {
      return {
        key: 'paleozoic' as const,
        label: 'Paléozoïque',
        order: 1,
        badgeBg: 'bg-sky-950/40 text-sky-400 border-sky-600/40',
        dotColor: 'bg-sky-400',
        Icon: TrilobiteIcon
      };
    }
    if (clean === 'mesozoique' || clean === 'mesozoic') {
      return {
        key: 'mesozoic' as const,
        label: 'Mésozoïque',
        order: 2,
        badgeBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-600/40',
        dotColor: 'bg-emerald-400',
        Icon: AmmoniteIcon
      };
    }
    return {
      key: 'cenozoic' as const,
      label: 'Cénozoïque',
      order: 3,
      badgeBg: 'bg-purple-950/40 text-purple-400 border-purple-600/40',
      dotColor: 'bg-purple-400',
      Icon: MammothIcon
    };
  };

  // Era counts
  const eraCounts = useMemo(() => {
    const counts = { all: fossils.length, precambrian: 0, paleozoic: 0, mesozoic: 0, cenozoic: 0 };
    fossils.forEach(f => {
      const eraKey = getEraMeta(f.era).key;
      counts[eraKey] = (counts[eraKey] || 0) + 1;
    });
    return counts;
  }, [fossils]);

  // Filtered & sorted fossils
  const filteredFossils = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matched = fossils.filter(f => {
      // Era filter
      if (selectedEra !== 'all') {
        const meta = getEraMeta(f.era);
        if (meta.key !== selectedEra) return false;
      }

      // Search query: check reference first (priority), then title, description, provenance
      if (query) {
        const refMatch = (f.reference || '').toLowerCase().includes(query);
        const titleMatch = (f.title || '').toLowerCase().includes(query);
        const descMatch = (f.description || '').toLowerCase().includes(query);
        const provMatch = (f.provenanceName || '').toLowerCase().includes(query);
        const eraLabel = getEraMeta(f.era).label.toLowerCase();
        const eraMatch = eraLabel.includes(query);

        return refMatch || titleMatch || descMatch || provMatch || eraMatch;
      }

      return true;
    });

    // Sort
    matched.sort((a, b) => {
      if (sortBy === 'chronological') {
        const orderA = getEraMeta(a.era).order;
        const orderB = getEraMeta(b.era).order;
        if (orderA !== orderB) return orderA - orderB;
        return (a.reference || a.title || '').localeCompare(b.reference || b.title || '');
      }
      if (sortBy === 'ref_asc') {
        return (a.reference || '').localeCompare(b.reference || '');
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return matched;
  }, [fossils, selectedEra, searchQuery, sortBy]);

  // List of all unique references for quick chips
  const allReferences = useMemo(() => {
    return fossils
      .map(f => f.reference?.trim())
      .filter((r): r is string => Boolean(r && r.length > 0))
      .slice(0, 16);
  }, [fossils]);

  // Quick direct search by reference on enter
  const handleQuickReferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Exact reference match
    const exactMatch = fossils.find(
      f => (f.reference || '').trim().toLowerCase() === query
    );
    if (exactMatch) {
      playDinoSound();
      setActiveFossilId(exactMatch.id);
      return;
    }

    // Partial single match
    if (filteredFossils.length === 1) {
      playDinoSound();
      setActiveFossilId(filteredFossils[0].id);
    }
  };

  // Active fossil for detailed sheet
  const activeFossil = fossils.find(f => f.id === activeFossilId);
  const activeFossilIndex = activeFossil ? filteredFossils.findIndex(f => f.id === activeFossil.id) : -1;

  const handlePrevFossil = () => {
    if (activeFossilIndex > 0) {
      setActiveFossilId(filteredFossils[activeFossilIndex - 1].id);
    }
  };

  const handleNextFossil = () => {
    if (activeFossilIndex >= 0 && activeFossilIndex < filteredFossils.length - 1) {
      setActiveFossilId(filteredFossils[activeFossilIndex + 1].id);
    }
  };

  // New fossil handler for Admin
  const handleCreateNewFossil = () => {
    playDinoSound();
    const newFossil: Fossil = {
      id: Math.random().toString(),
      era: selectedEra !== 'all' ? selectedEra : 'mesozoic',
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
          onPrev={handlePrevFossil}
          onNext={handleNextFossil}
          hasPrev={activeFossilIndex > 0}
          hasNext={activeFossilIndex >= 0 && activeFossilIndex < filteredFossils.length - 1}
          onNavigateToEra={(eraKey) => {
            setActiveFossilId(null);
            if (onNavigateToEra) {
              onNavigateToEra(eraKey as any);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      {/* TOP BANNER & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-5">
        <button
          onClick={() => {
            playDinoSound();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer w-fit shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-500" />
          <span>Retour à l'accueil</span>
        </button>

        <div className="text-center sm:text-right">
          <span className="text-[10px] font-mono tracking-widest text-yellow-500 uppercase block mb-0.5">
            CONSERVATOIRE DE FOSSILES • INVENTAIRE GLOBAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif uppercase tracking-tight">
            Galerie Complète des 4 Périodes
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {fossils.length} spécimen{fossils.length > 1 ? 's' : ''} répertorié{fossils.length > 1 ? 's' : ''} sur l'ensemble des ères
          </p>
        </div>
      </div>

      {/* QUICK REFERENCE SEARCH BAR (PRIMARY REQUIREMENT) */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border-2 border-yellow-600/30 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-500 font-mono text-xs font-bold uppercase tracking-wider">
            <Search className="w-4 h-4 text-yellow-400" />
            <span>Recherche Rapide par Référence de Fiche</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Entrez la référence exacte ou partielle
          </span>
        </div>

        {/* Input form */}
        <form onSubmit={handleQuickReferenceSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Tag className="w-4 h-4 text-yellow-500/70" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tapez la référence (ex: FOS-001, PAL-12...) ou le nom du fossile..."
              className="w-full pl-10 pr-10 py-3 bg-slate-950/90 border border-slate-700 focus:border-yellow-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 font-mono transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-500 border border-yellow-400/40 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all font-mono flex items-center justify-center gap-2 shadow-lg shadow-yellow-950/40 cursor-pointer active:scale-98"
          >
            <span>Trouver la Fiche</span>
            <Eye className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Reference Chips */}
        {allReferences.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Références existantes dans la collection :</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allReferences.map((ref) => {
                const isSelected = searchQuery.trim().toLowerCase() === ref.toLowerCase();
                return (
                  <button
                    key={ref}
                    type="button"
                    onClick={() => {
                      playDinoSound();
                      setSearchQuery(ref);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-600 text-slate-950 font-bold border-yellow-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-yellow-600/50 hover:text-yellow-400'
                    }`}
                  >
                    #{ref}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FILTER & VIEW CONTROLS TOOLBAR */}
      <div className="space-y-4">
        {/* ERA TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              playDinoSound();
              setSelectedEra('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
              selectedEra === 'all'
                ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Toutes les 4 Périodes</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
              {eraCounts.all}
            </span>
          </button>

          {/* Precambrian */}
          <button
            onClick={() => {
              playDinoSound();
              setSelectedEra('precambrian');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
              selectedEra === 'precambrian'
                ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-amber-700/40 hover:text-amber-300'
            }`}
          >
            <MicrobeIcon className="w-4 h-4" />
            <span>Précambrien</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
              {eraCounts.precambrian}
            </span>
          </button>

          {/* Paleozoic */}
          <button
            onClick={() => {
              playDinoSound();
              setSelectedEra('paleozoic');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
              selectedEra === 'paleozoic'
                ? 'bg-sky-950/60 border-sky-500 text-sky-400 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-sky-700/40 hover:text-sky-300'
            }`}
          >
            <TrilobiteIcon className="w-4 h-4" />
            <span>Paléozoïque</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
              {eraCounts.paleozoic}
            </span>
          </button>

          {/* Mesozoic */}
          <button
            onClick={() => {
              playDinoSound();
              setSelectedEra('mesozoic');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
              selectedEra === 'mesozoic'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-emerald-700/40 hover:text-emerald-300'
            }`}
          >
            <AmmoniteIcon className="w-4 h-4" />
            <span>Mésozoïque</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
              {eraCounts.mesozoic}
            </span>
          </button>

          {/* Cenozoic */}
          <button
            onClick={() => {
              playDinoSound();
              setSelectedEra('cenozoic');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
              selectedEra === 'cenozoic'
                ? 'bg-purple-950/60 border-purple-500 text-purple-400 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-purple-700/40 hover:text-purple-300'
            }`}
          >
            <MammothIcon className="w-4 h-4" />
            <span>Cénozoïque</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
              {eraCounts.cenozoic}
            </span>
          </button>
        </div>

        {/* SECOND ROW: DISPLAY MODES TOGGLE & SORTING */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
          {/* View mode toggle buttons (plusieurs façons: Quadrillage, Mosaïque compacte, Liste, Diaporama) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                playDinoSound();
                setViewMode('grid');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage en quadrillage de cartes"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Quadrillage</span>
            </button>

            <button
              onClick={() => {
                playDinoSound();
                setViewMode('compact');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage compact en mosaïque dense"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mosaïque</span>
            </button>

            <button
              onClick={() => {
                playDinoSound();
                setViewMode('list');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage en liste détaillée"
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>

            <button
              onClick={() => {
                playDinoSound();
                setViewMode('carousel');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage en carrousel / diaporama"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Diaporama</span>
            </button>
          </div>

          {/* Sort selector & Admin Add */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-yellow-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="chronological" className="bg-slate-900 text-white">Ordre Chronologique</option>
                <option value="ref_asc" className="bg-slate-900 text-white">Référence (A-Z)</option>
                <option value="title_asc" className="bg-slate-900 text-white">Nom Spécimen (A-Z)</option>
              </select>
            </div>

            {isAdmin && (
              <button
                onClick={handleCreateNewFossil}
                className="flex items-center gap-1.5 bg-yellow-600/80 hover:bg-yellow-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS STATUS */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <span>
          Affichage de <strong className="text-yellow-400">{filteredFossils.length}</strong> fiche{filteredFossils.length > 1 ? 's' : ''}
          {searchQuery && (
            <span> pour la recherche « <em className="text-white">{searchQuery}</em> »</span>
          )}
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-yellow-500 hover:underline cursor-pointer"
          >
            Réinitialiser le filtre
          </button>
        )}
      </div>

      {/* NO RESULTS FOUND */}
      {filteredFossils.length === 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <HelpCircle className="w-10 h-10 text-yellow-600/60 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-white uppercase">
            Aucun spécimen trouvé
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {searchQuery
              ? `Aucune fiche ne correspond à la référence ou au terme « ${searchQuery} ».`
              : "Aucun fossile n'est enregistré pour cette période."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-yellow-700/80 hover:bg-yellow-600 text-white text-xs font-mono font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
            >
              Voir toutes les fiches
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 1: QUADRILLAGE CLASSIQUE (CARDS WITH FULL DETAILS)      */}
      {/* ============================================================ */}
      {viewMode === 'grid' && filteredFossils.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFossils.map((fos) => {
            const eraMeta = getEraMeta(fos.era);
            const EraIcon = eraMeta.Icon;
            return (
              <div
                key={fos.id}
                onClick={() => {
                  playDinoSound();
                  setActiveFossilId(fos.id);
                }}
                className="bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800 hover:border-yellow-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Era tag & reference in card header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider border ${eraMeta.badgeBg}`}>
                    <EraIcon className="w-3.5 h-3.5" />
                    <span>{eraMeta.label}</span>
                  </div>

                  {fos.reference && (
                    <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/40 border border-yellow-700/40 px-2 py-0.5 rounded-lg font-bold">
                      Ref: {fos.reference}
                    </span>
                  )}
                </div>

                {/* Primary Transparent PNG Image with crop */}
                <div className="h-44 rounded-xl bg-transparent overflow-hidden my-2 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                  <CroppedImage
                    settings={fos.thumbnailImage?.url ? fos.thumbnailImage : fos.image}
                    alt={fos.title}
                    className="w-full h-full"
                  />
                </div>

                {/* Title & Metadata */}
                <div className="space-y-2 mt-2">
                  <h3 className="text-center font-serif text-sm sm:text-base font-bold uppercase text-white group-hover:text-yellow-400 transition-colors line-clamp-2 break-words [overflow-wrap:anywhere] hyphens-auto leading-snug">
                    {fos.title || 'Spécimen sans nom'}
                  </h3>

                  {fos.lifespanPeriodStart && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{fos.lifespanPeriodStart} {fos.lifespanPeriodEnd ? `➔ ${fos.lifespanPeriodEnd}` : ''}</span>
                    </div>
                  )}

                  {fos.provenanceName && (
                    <div className="flex items-center justify-center gap-1 text-[10.5px] font-mono text-slate-500 line-clamp-1">
                      <Compass className="w-3 h-3 text-slate-600" />
                      <span>{fos.provenanceName}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="pt-4 mt-3 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-yellow-500/80 group-hover:text-yellow-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Consulter la fiche
                  </span>
                  <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 2: MOSAÏQUE COMPACTE (DENSE VISUAL TILES)               */}
      {/* ============================================================ */}
      {viewMode === 'compact' && filteredFossils.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredFossils.map((fos) => {
            const eraMeta = getEraMeta(fos.era);
            return (
              <div
                key={fos.id}
                onClick={() => {
                  playDinoSound();
                  setActiveFossilId(fos.id);
                }}
                className="bg-slate-950/90 border border-slate-800 hover:border-yellow-500/60 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:scale-102 hover:shadow-xl flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Reference Pill Top */}
                <div className="flex items-center justify-between text-[9px] font-mono mb-2">
                  <span className={`w-2 h-2 rounded-full ${eraMeta.dotColor}`} title={eraMeta.label} />
                  {fos.reference && (
                    <span className="text-yellow-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {fos.reference}
                    </span>
                  )}
                </div>

                {/* Specimen image */}
                <div className="h-28 rounded-lg bg-transparent overflow-hidden my-1 flex items-center justify-center relative">
                  <CroppedImage
                    settings={fos.thumbnailImage?.url ? fos.thumbnailImage : fos.image}
                    alt={fos.title}
                    className="w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Specimen title */}
                <h4 className="text-center font-serif text-xs font-bold uppercase text-white truncate mt-1 group-hover:text-yellow-400">
                  {fos.title || 'Spécimen'}
                </h4>

                <span className="text-[10px] text-center text-slate-500 font-mono truncate mt-0.5">
                  {eraMeta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 3: VUE LISTE (DETAILED HORIZONTAL ROWS)                 */}
      {/* ============================================================ */}
      {viewMode === 'list' && filteredFossils.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-850">
          {filteredFossils.map((fos) => {
            const eraMeta = getEraMeta(fos.era);
            const EraIcon = eraMeta.Icon;
            return (
              <div
                key={fos.id}
                onClick={() => {
                  playDinoSound();
                  setActiveFossilId(fos.id);
                }}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-transparent border border-slate-800/80 shrink-0 overflow-hidden flex items-center justify-center">
                    <CroppedImage
                      settings={fos.thumbnailImage?.url ? fos.thumbnailImage : fos.image}
                      alt={fos.title}
                      className="w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-white uppercase group-hover:text-yellow-400 transition-colors">
                        {fos.title || 'Spécimen sans nom'}
                      </h3>
                      {fos.reference && (
                        <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-950/50 border border-yellow-700/40 px-2 py-0.5 rounded">
                          Ref: {fos.reference}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] border ${eraMeta.badgeBg}`}>
                        <EraIcon className="w-3 h-3" />
                        {eraMeta.label}
                      </span>
                      {fos.lifespanPeriodStart && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {fos.lifespanPeriodStart} {fos.lifespanPeriodEnd ? `➔ ${fos.lifespanPeriodEnd}` : ''}
                        </span>
                      )}
                      {fos.provenanceName && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Compass className="w-3 h-3" />
                          {fos.provenanceName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right button */}
                <div className="sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 group-hover:border-yellow-600/40 group-hover:bg-yellow-950/30 text-slate-300 group-hover:text-yellow-400 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all">
                    <span>Ouvrir la fiche</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 4: DIAPORAMA / CARROUSEL INTERACTIF                     */}
      {/* ============================================================ */}
      {viewMode === 'carousel' && filteredFossils.length > 0 && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {(() => {
            const currentFossil = filteredFossils[carouselIndex] || filteredFossils[0];
            const eraMeta = getEraMeta(currentFossil.era);
            const EraIcon = eraMeta.Icon;

            return (
              <div className="bg-slate-950/90 border border-yellow-700/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-bold uppercase tracking-wider border ${eraMeta.badgeBg}`}>
                    <EraIcon className="w-4 h-4" />
                    <span>{eraMeta.label}</span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Spécimen <strong className="text-yellow-400">{carouselIndex + 1}</strong> sur {filteredFossils.length}
                  </span>
                </div>

                {/* Main carousel visual */}
                <div className="relative h-64 sm:h-80 w-full max-w-xl mx-auto flex items-center justify-center">
                  <CroppedImage
                    settings={currentFossil.image}
                    alt={currentFossil.title}
                    className="w-full h-full"
                  />
                </div>

                {/* Title & reference */}
                <div className="text-center space-y-2 px-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold uppercase text-white break-words [overflow-wrap:anywhere] hyphens-auto leading-tight">
                    {currentFossil.title || 'Spécimen sans nom'}
                  </h2>
                  {currentFossil.reference && (
                    <div className="inline-block text-xs font-mono text-yellow-400 bg-yellow-950/40 border border-yellow-700/40 px-3 py-1 rounded-lg font-bold">
                      Référence : {currentFossil.reference}
                    </div>
                  )}
                  {currentFossil.description && (
                    <p className="text-xs text-slate-300 max-w-xl mx-auto line-clamp-3 leading-relaxed">
                      {currentFossil.description}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                  <button
                    onClick={() => {
                      playDinoSound();
                      setCarouselIndex(prev => (prev > 0 ? prev - 1 : filteredFossils.length - 1));
                    }}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>

                  <button
                    onClick={() => {
                      playDinoSound();
                      setActiveFossilId(currentFossil.id);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    Consulter la Fiche Complète
                  </button>

                  <button
                    onClick={() => {
                      playDinoSound();
                      setCarouselIndex(prev => (prev < filteredFossils.length - 1 ? prev + 1 : 0));
                    }}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  >
                    Suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
