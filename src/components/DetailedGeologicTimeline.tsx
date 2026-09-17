import React, { useState, useMemo } from 'react';
import { playDinoSound } from '../utils/data/audio';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Clock,
  Compass,
  Maximize2,
  Minimize2,
  BookOpen,
} from 'lucide-react';

interface StageInfo {
  name: string;
  subName?: string;
}

interface EpochInfo {
  name: string;
  duration?: string;
  stages: string[];
  description?: string;
}

interface PeriodInfo {
  id: string;
  name: string;
  altName?: string;
  duration: string;
  description?: string;
  epochs: EpochInfo[];
}

interface EraSection {
  id: string;
  number: number;
  name: string;
  altName?: string;
  duration: string;
  summary: string;
  color: {
    badge: string;
    border: string;
    bgGradient: string;
    text: string;
    subBadge: string;
    accent: string;
  };
  periods?: PeriodInfo[];
  // For Precambrian (divided into eons)
  eons?: {
    name: string;
    duration: string;
    description: string;
    highlights: string[];
  }[];
}

export const DETAILED_GEOLOGICAL_DATA: EraSection[] = [
  {
    id: 'precambrian',
    number: 1,
    name: 'Le Précambrien',
    altName: 'Super-éon Précambrien',
    duration: '4,5 milliards à 541 millions d\'années',
    summary: 'Ce super-éon représente 88 % de l\'histoire de la Terre. Il précède l\'explosion de la vie complexe coquillière et osseuse et se divise en trois éons fondamentaux.',
    color: {
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
      border: 'border-emerald-700/40 hover:border-emerald-500/60',
      bgGradient: 'from-emerald-950/30 via-slate-950/60 to-slate-950/90',
      text: 'text-emerald-400',
      subBadge: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/60',
      accent: 'emerald',
    },
    eons: [
      {
        name: 'Hadéen (ou Hadhéen)',
        duration: '4,5 à 4,0 milliards d\'années',
        description: 'Naissance de la Terre, bombardements intérieurs et météoritiques, formation de la Lune et des premiers océans.',
        highlights: [
          'Accrétion planétaire & différenciation du noyau terrestre',
          'Bombardement intense tardif (météorites)',
          'Condensation de la vapeur d\'eau & premiers océans primitifs',
          'Absence d\'oxygène libre dans l\'atmosphère',
        ],
      },
      {
        name: 'Archéen',
        duration: '4,0 à 2,5 milliards d\'années',
        description: 'Apparition de la vie unicellulaire et des premiers stromatolites (cyanobactéries photosynthétiques).',
        highlights: [
          'Apparition des premières cellules procaryotes (bactéries et archées)',
          'Développement des stromatolites (structures bioconstruites)',
          'Première activité photosynthétique anoxygénique puis oxygénique',
          'Stabilisation des premiers microcontinents (cratons)',
        ],
      },
      {
        name: 'Protérozoïque',
        duration: '2,5 milliards à 541 millions d\'années',
        description: 'Grande Oxydation, cellules eucaryotes, faune d\'Édiacara et épisodes glaciaires extrêmes.',
        highlights: [
          'Grande Oxydation (« Catastrophe de l\'Oxygène »)',
          'Émergence des cellules eucaryotes complexes puis de la multicellularité',
          'Épisodes glaciaires extrêmes mondiaux (« Terre boule de neige »)',
          'Faune d\'Édiacara : premiers organismes multicellulaires mous complexes',
        ],
      },
    ],
  },
  {
    id: 'paleozoic',
    number: 2,
    name: 'Le Paléozoïque',
    altName: 'Ère Primaire',
    duration: '541 à 252 millions d\'années',
    summary: 'Ère de l\'explosion cambrienne, de la colonisation de la terre ferme par les végétaux et les tétrapodes, des vastes forêts houillères et de la grande extinction permienne.',
    color: {
      badge: 'bg-amber-950 text-amber-300 border-amber-700/60',
      border: 'border-amber-700/40 hover:border-amber-500/60',
      bgGradient: 'from-amber-950/30 via-slate-950/60 to-slate-950/90',
      text: 'text-amber-400',
      subBadge: 'bg-amber-900/40 text-amber-300 border-amber-800/60',
      accent: 'amber',
    },
    periods: [
      {
        id: 'cambrian',
        name: 'Cambrien',
        duration: '541 à 485 Ma',
        description: 'Explosion de la biodiversité marine, apparition des animaux à squelettes minéralisés et trilobites.',
        epochs: [
          {
            name: 'Terreneuvien',
            stages: ['Fortunien (Étage 1)', 'Étage 2 (non nommé officiellement)'],
          },
          {
            name: 'Sérygien',
            stages: ['Étage 3', 'Étage 4'],
          },
          {
            name: 'Miaolingien',
            stages: ['Wuliuen', 'Drumien', 'Guzhangien'],
          },
          {
            name: 'Furongien',
            stages: ['Paibien', 'Jiangshanien', 'Étage 10'],
          },
        ],
      },
      {
        id: 'ordovician',
        name: 'Ordovicien',
        duration: '485 à 444 Ma',
        description: 'Grande biodiversification ordovicienne (GOBE), premiers poissons sans mâchoires et extinction glaciaire finale.',
        epochs: [
          {
            name: 'Ordovicien inférieur',
            stages: ['Trémadocien', 'Floien'],
          },
          {
            name: 'Ordovicien moyen',
            stages: ['Dapingien', 'Darriwilien'],
          },
          {
            name: 'Ordovicien supérieur',
            stages: ['Sandbien', 'Katien', 'Hirnantien'],
          },
        ],
      },
      {
        id: 'silurian',
        name: 'Silurien',
        duration: '444 à 419 Ma',
        description: 'Récupération après l\'extinction, premiers récifs coralliens modernes, premières plantes vasculaires terrestres (Cooksonia).',
        epochs: [
          {
            name: 'Llandovery',
            stages: ['Rhuddanien', 'Aéronien', 'Télychien'],
          },
          {
            name: 'Wenlock',
            stages: ['Sheinwoodien', 'Homérien'],
          },
          {
            name: 'Ludlow',
            stages: ['Gorstien', 'Ludfordien'],
          },
          {
            name: 'Pridoli',
            stages: ['Époque terminale non subdivisée en étages formels'],
          },
        ],
      },
      {
        id: 'devonian',
        name: 'Dévonien',
        duration: '419 à 359 Ma',
        description: '« Âge des poissons », apparition des ammonoïdes, des premiers arbres et des premiers tétrapodes terrestres.',
        epochs: [
          {
            name: 'Dévonien inférieur',
            stages: ['Lochkovien', 'Praguien', 'Emsien'],
          },
          {
            name: 'Dévonien moyen',
            stages: ['Eifélien', 'Givétien'],
          },
          {
            name: 'Dévonien supérieur',
            stages: ['Frasnien', 'Famennien'],
          },
        ],
      },
      {
        id: 'carboniferous',
        name: 'Carbonifère',
        duration: '359 à 299 Ma',
        description: 'Vastes forêts marécageuses à l\'origine du charbon, taux d\'oxygène record (35 %), arthropodes géants et apparition de l\'œuf amniotique.',
        epochs: [
          {
            name: 'Mississippien (Carbonifère inférieur)',
            stages: ['Tournaisien', 'Viséen', 'Serpukhovien'],
          },
          {
            name: 'Pennsylvanien (Carbonifère supérieur)',
            stages: ['Bashkirien', 'Moscovien', 'Kasimovien', 'Gzhelien'],
          },
        ],
      },
      {
        id: 'permian',
        name: 'Permien',
        duration: '299 à 252 Ma',
        description: 'Rassemblement de la Pangée, diversification des reptiles mammaliens (synapsides) et plus grande extinction massive de tous les temps.',
        epochs: [
          {
            name: 'Cisuralien (Permien inférieur)',
            stages: ['Assélien', 'Sakmarien', 'Artinskien', 'Koungourien'],
          },
          {
            name: 'Guadalupien (Permien moyen)',
            stages: ['Roadien', 'Wordien', 'Capitanien'],
          },
          {
            name: 'Lopingien (Permien supérieur)',
            stages: ['Wuchiapingien', 'Changhsingien'],
          },
        ],
      },
    ],
  },
  {
    id: 'mesozoic',
    number: 3,
    name: 'Le Mésozoïque',
    altName: 'Ère Secondaire',
    duration: '252 à 66 millions d\'années',
    summary: 'Ère des Dinosaures, des ptérosaures, des reptiles marins géants, des ammonites et de l\'apparition des premières plantes à fleurs et oiseaux.',
    color: {
      badge: 'bg-orange-950 text-orange-300 border-orange-700/60',
      border: 'border-orange-700/40 hover:border-orange-500/60',
      bgGradient: 'from-orange-950/30 via-slate-950/60 to-slate-950/90',
      text: 'text-orange-400',
      subBadge: 'bg-orange-900/40 text-orange-300 border-orange-800/60',
      accent: 'orange',
    },
    periods: [
      {
        id: 'triassic',
        name: 'Trias',
        duration: '252 à 201 Ma',
        description: 'Renaissance biologique après l\'extinction permienne, apparition des premiers dinosaures, ptérosaures et premiers mammifères.',
        epochs: [
          {
            name: 'Trias inférieur',
            stages: ['Indusien', 'Olénékien'],
          },
          {
            name: 'Trias moyen',
            stages: ['Anisien', 'Ladinien'],
          },
          {
            name: 'Trias supérieur',
            stages: ['Carnien', 'Norien', 'Rétien'],
          },
        ],
      },
      {
        id: 'jurassic',
        name: 'Jurassique',
        duration: '201 à 145 Ma',
        description: 'Climat chaud et humide, domination des sauropodes géants, prolifération des ammonites et bélemnites, premiers oiseaux (Archéoptéryx).',
        epochs: [
          {
            name: 'Jurassique inférieur / Lias',
            stages: ['Hettangien', 'Sinémurien', 'Pliensbachien', 'Toarcien'],
          },
          {
            name: 'Jurassique moyen / Dogger',
            stages: ['Aalénien', 'Bajocien', 'Bathonien', 'Callovien'],
          },
          {
            name: 'Jurassique supérieur / Malm',
            stages: ['Oxfordien', 'Kimméridgien', 'Tithonien'],
          },
        ],
      },
      {
        id: 'cretaceous',
        name: 'Crétacé',
        duration: '145 à 66 Ma',
        description: 'Apparition et explosion des plantes à fleurs (Angiospermes), apogée des cératopsiens et tyrannosaures, terminée par l\'impact météoritique de Chicxulub.',
        epochs: [
          {
            name: 'Crétacé inférieur',
            stages: ['Berriasien', 'Valanginien', 'Hauterivien', 'Barrémien', 'Aptien', 'Albien'],
          },
          {
            name: 'Crétacé supérieur',
            stages: ['Cénomanien', 'Turonien', 'Coniacien', 'Santonien', 'Campanien', 'Maastrichtien'],
          },
        ],
      },
    ],
  },
  {
    id: 'cenozoic',
    number: 4,
    name: 'Le Cénozoïque',
    altName: 'Ère Tertiaire & Quaternaire',
    duration: '66 millions d\'années à nos jours',
    summary: 'Ère de l\'essor spectaculaire des mammifères et des oiseaux, du refroidissement climatique mondial, des glaciations quaternaires et de l\'émergence de l\'Humanité.',
    color: {
      badge: 'bg-sky-950 text-sky-300 border-sky-700/60',
      border: 'border-sky-700/40 hover:border-sky-500/60',
      bgGradient: 'from-sky-950/30 via-slate-950/60 to-slate-950/90',
      text: 'text-sky-400',
      subBadge: 'bg-sky-900/40 text-sky-300 border-sky-800/60',
      accent: 'sky',
    },
    periods: [
      {
        id: 'paleogene',
        name: 'Paléogène',
        duration: '66 à 23 Ma',
        description: 'Radiation adaptative des mammifères après la disparition des dinosaures non-aviens, fermeture de la Téthys et climat tropical.',
        epochs: [
          {
            name: 'Paléocène',
            stages: ['Danien', 'Sélandien', 'Thanétien'],
          },
          {
            name: 'Éocène',
            stages: ['Yprésien', 'Lutétien', 'Bartonien', 'Priabonien'],
          },
          {
            name: 'Oligocène',
            stages: ['Rupélien', 'Chattien'],
          },
        ],
      },
      {
        id: 'neogene',
        name: 'Néogène',
        duration: '23 à 2,58 Ma',
        description: 'Expansion des prairies herbacées, faune moderne de grands mammifères herbivores et carnivores, premiers hominidés bipèdes.',
        epochs: [
          {
            name: 'Miocène',
            stages: ['Aquitanien', 'Burdigalien', 'Langhien', 'Serravallien', 'Tortonien', 'Messinien'],
          },
          {
            name: 'Pliocène',
            stages: ['Zancléen', 'Plaisancien'],
          },
        ],
      },
      {
        id: 'quaternary',
        name: 'Quaternaire',
        duration: '2,58 Ma à aujourd\'hui',
        description: 'Cycles glaciaires et interglaciaires répétés, évolution du genre Homo et émergence de notre civilisation moderne.',
        epochs: [
          {
            name: 'Pléistocène',
            stages: ['Gélasien', 'Calabrien', 'Chibanien', 'Pléistocène supérieur'],
          },
          {
            name: 'Holocène',
            stages: ['Groenlandien', 'Northgrippien', 'Meghalayen (époque actuelle)'],
          },
        ],
      },
    ],
  },
];

export default function DetailedGeologicTimeline() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEraFilter, setActiveEraFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    precambrian: true,
    paleozoic: true,
    mesozoic: true,
    cenozoic: true,
  });

  const toggleSection = (id: string) => {
    playDinoSound();
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    playDinoSound();
    setExpandedSections({
      precambrian: true,
      paleozoic: true,
      mesozoic: true,
      cenozoic: true,
    });
  };

  const handleCollapseAll = () => {
    playDinoSound();
    setExpandedSections({
      precambrian: false,
      paleozoic: false,
      mesozoic: false,
      cenozoic: false,
    });
  };

  // Filter sections based on era selection and search query
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return DETAILED_GEOLOGICAL_DATA.filter((era) => {
      if (activeEraFilter !== 'all' && era.id !== activeEraFilter) {
        return false;
      }

      if (!q) return true;

      // Check era names
      if (era.name.toLowerCase().includes(q) || (era.altName && era.altName.toLowerCase().includes(q))) {
        return true;
      }

      // Check eons (for Precambrian)
      if (era.eons) {
        const matchEon = era.eons.some(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.highlights.some((h) => h.toLowerCase().includes(q))
        );
        if (matchEon) return true;
      }

      // Check periods and stages
      if (era.periods) {
        const matchPeriod = era.periods.some((p) => {
          if (p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) {
            return true;
          }
          return p.epochs.some((ep) => {
            if (ep.name.toLowerCase().includes(q)) return true;
            return ep.stages.some((s) => s.toLowerCase().includes(q));
          });
        });
        if (matchPeriod) return true;
      }

      return false;
    });
  }, [searchQuery, activeEraFilter]);

  return (
    <div className="w-full space-y-6 pt-6 border-t border-slate-800 text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-yellow-700/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-yellow-400" />
                Chart Stratigraphique Détaillée
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                4,5 Ga — Aujourd'hui
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-white tracking-wide">
              Échelle Géologique Approfondie : Éons, Époques & Étages
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Consultez la hiérarchie stratigraphique complète de l'histoire de la Terre : du super-éon Précambrien aux subdivisions détaillées (Séries, Époques et Étages) des ères Paléozoïque, Mésozoïque et Cénozoïque.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs px-3 py-2 rounded-xl transition font-mono cursor-pointer"
              title="Déplier toutes les ères"
            >
              <Maximize2 className="w-3.5 h-3.5 text-yellow-500" />
              <span>Tout Déplier</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs px-3 py-2 rounded-xl transition font-mono cursor-pointer"
              title="Replier toutes les ères"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Tout Replier</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-800/80 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un étage (ex: Maastrichtien, Lias, Hettangien, Stromatolites...)"
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-600/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Era Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setActiveEraFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg border transition ${
                activeEraFilter === 'all'
                  ? 'bg-yellow-600 text-slate-950 font-bold border-yellow-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Toutes (4)
            </button>
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setActiveEraFilter('precambrian');
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition ${
                activeEraFilter === 'precambrian'
                  ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300'
              }`}
            >
              1. Précambrien
            </button>
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setActiveEraFilter('paleozoic');
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition ${
                activeEraFilter === 'paleozoic'
                  ? 'bg-amber-600 text-slate-950 font-bold border-amber-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              2. Paléozoïque
            </button>
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setActiveEraFilter('mesozoic');
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition ${
                activeEraFilter === 'mesozoic'
                  ? 'bg-orange-600 text-slate-950 font-bold border-orange-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-orange-300'
              }`}
            >
              3. Mésozoïque
            </button>
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setActiveEraFilter('cenozoic');
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition ${
                activeEraFilter === 'cenozoic'
                  ? 'bg-sky-600 text-slate-950 font-bold border-sky-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-sky-300'
              }`}
            >
              4. Cénozoïque
            </button>
          </div>
        </div>
      </div>

      {/* Main List of Era Sections */}
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400">
            <p className="text-sm font-serif mb-2">Aucune subdivision stratigraphique ne correspond à votre recherche « {searchQuery} ».</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveEraFilter('all');
              }}
              className="text-xs text-yellow-500 hover:underline font-mono"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredData.map((era) => {
            const isExpanded = !!expandedSections[era.id];

            return (
              <div
                key={era.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-gradient-to-b ${era.color.bgGradient} ${era.color.border} shadow-xl`}
              >
                {/* Era Card Header Bar */}
                <div
                  onClick={() => toggleSection(era.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-950/50 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-bold tracking-wider uppercase ${era.color.badge}`}>
                        {era.number}. {era.name}
                      </span>
                      {era.altName && (
                        <span className="text-xs font-mono text-slate-400">
                          ({era.altName})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-yellow-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {era.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                      {isExpanded ? 'Réduire' : 'Développer'}
                    </span>
                    <div className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary bar */}
                <div className="px-5 pb-3 text-xs text-slate-300/90 leading-relaxed font-sans italic border-b border-slate-900">
                  {era.summary}
                </div>

                {/* Expandable detailed content */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* CASE 1: PRECAMBRIAN (EONS) */}
                    {era.eons && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {era.eons.map((eon, eIdx) => (
                          <div
                            key={eIdx}
                            className="bg-slate-950/85 border border-emerald-800/40 rounded-xl p-4 flex flex-col justify-between shadow-md space-y-3"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="text-base font-serif font-bold text-emerald-300">
                                  {eon.name}
                                </h4>
                              </div>
                              <span className="inline-block text-[10.5px] font-mono font-bold text-yellow-500/95 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {eon.duration}
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                                {eon.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-900 space-y-1.5">
                              <span className="block text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                Événements Majeurs :
                              </span>
                              <ul className="space-y-1 text-[11px] text-slate-300/90">
                                {eon.highlights.map((h, hIdx) => (
                                  <li key={hIdx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CASE 2: PHANEROZOIC ERAS (PERIODS & EPOCHS & STAGES) */}
                    {era.periods && (
                      <div className="space-y-4">
                        {era.periods.map((period) => (
                          <div
                            key={period.id}
                            className="bg-slate-950/80 border border-slate-850 hover:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 transition-colors shadow-md"
                          >
                            {/* Period Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2.5 border-b border-slate-900">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${era.color.badge.split(' ')[0]} border border-yellow-500/50`} />
                                <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                                  {period.name}
                                </h3>
                                {period.altName && (
                                  <span className="text-xs text-slate-400 font-mono">
                                    ({period.altName})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono font-bold text-yellow-500/95 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                                {period.duration}
                              </span>
                            </div>

                            {period.description && (
                              <p className="text-xs text-slate-400 italic">
                                {period.description}
                              </p>
                            )}

                            {/* Epochs & Stages Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                              {period.epochs.map((epoch, epIdx) => (
                                <div
                                  key={epIdx}
                                  className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-2 flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-serif font-bold text-slate-200">
                                        {epoch.name}
                                      </span>
                                      {epoch.duration && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          {epoch.duration}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-1.5">
                                      Étages Stratigraphiques :
                                    </span>
                                  </div>

                                  {/* Stage Chips */}
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {epoch.stages.map((stage, sIdx) => {
                                      const isSpecial = stage.includes('actuelle') || stage.includes('Maastrichtien');
                                      return (
                                        <span
                                          key={sIdx}
                                          className={`text-[10px] px-2 py-0.5 rounded font-sans transition-colors ${
                                            isSpecial
                                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold'
                                              : 'bg-slate-950 border border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
                                          }`}
                                          title={`Étage ${stage}`}
                                        >
                                          {stage}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
