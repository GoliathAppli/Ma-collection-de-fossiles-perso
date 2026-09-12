import { useState, useRef, useMemo } from 'react';
import { Fossil, ImageSettings } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { Plus, ChevronLeft, ChevronRight, AlertCircle, Tag } from 'lucide-react';
import CroppedImage from './CroppedImage';
import ImageAdjuster from '../utils/data/ImageAdjuster';
import FossilDetailSheet from './FossilDetailSheet';
import { sortFossilsChronologically } from '../utils/chronology';

interface FossilSelectorAndCarouselProps {
  isAdmin: boolean;
  era: 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic';
  eraImage?: ImageSettings;
  fossils: Fossil[];
  onAddFossil: (fossil: Fossil) => void;
  onModifyFossil: (updated: Fossil) => void;
  onDeleteFossil: (id: string) => void;
  onOpenEditForm: (fossil: Fossil) => void;
  onUpdateEraImage: (img: ImageSettings) => void;
}

export default function FossilSelectorAndCarousel({
  isAdmin,
  era,
  eraImage,
  fossils,
  onAddFossil,
  onModifyFossil,
  onDeleteFossil,
  onOpenEditForm,
  onUpdateEraImage
}: FossilSelectorAndCarouselProps) {
  const [selectedFossilId, setSelectedFossilId] = useState<string | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Filter fossils belonging to current active era, being defensive about manual JSON edits in French
  const normalizedTargetEra = era.toLowerCase().replace('é', 'e').replace('a', 'e'); // allow precambrian -> precambrien
  
  const eraFossils = useMemo(() => {
    const matching = fossils.filter(f => {
      if (!f.era) return false;
      const fEra = f.era.toLowerCase().replace('é', 'e');
      if (era === 'precambrian' && (fEra === 'precambrien' || fEra === 'precambrian')) return true;
      if (era === 'paleozoic' && (fEra === 'paleozoic' || fEra === 'paleozoique')) return true;
      if (era === 'mesozoic' && (fEra === 'mesozoic' || fEra === 'mesozoique')) return true;
      if (era === 'cenozoic' && (fEra === 'cenozoic' || fEra === 'cenozoique')) return true;
      return f.era === era;
    });
    return sortFossilsChronologically(matching);
  }, [fossils, era]);

  const handleCreateNewFossil = () => {
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
      provenanceCoords: { lat: 40, lng: 50 },
      provenanceName: '',
      lifespanPeriodStart: '',
      lifespanPeriodEnd: '',
      saviezVousText: '',
      saviezVousImage: { url: '', scale: 1, posX: 0, posY: 0 }
    };
    onOpenEditForm(newFossil);
  };

  const activeFossil = eraFossils.find(f => f.id === selectedFossilId);

  const getEraLabel = () => {
    switch (era) {
      case 'precambrian': return 'Précambrien';
      case 'paleozoic': return 'Paléozoïque';
      case 'mesozoic': return 'Mésozoïque';
      case 'cenozoic': return 'Cénozoïque';
    }
  };

  const getEraDates = () => {
    switch (era) {
      case 'precambrian': return '4600 à 541 millions d\'années';
      case 'paleozoic': return '541 à 252 millions d\'années';
      case 'mesozoic': return '252 à 66 millions d\'années';
      case 'cenozoic': return '66 millions d\'années à nos jours';
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Title Subheader */}
      <div className="text-center">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
          SÉLECTION / CATALOGUE DE LA PÉRIODE
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-yellow-500/90 font-serif uppercase">
          {getEraLabel()}
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-mono italic">
          {getEraDates()}
        </p>
      </div>

      {/* ERA IMAGE ZONE */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {(eraImage?.url || isAdmin) && (
          <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-transparent flex items-center justify-center">
            <CroppedImage settings={eraImage} alt={`Présentation ${getEraLabel()}`} className="w-full h-full" />
          </div>
        )}
        
        {isAdmin && (
          <div className="bg-slate-900/50 p-4 border border-yellow-700/10 rounded-xl">
            <ImageAdjuster
              label={`Image d'en-tête pour ${getEraLabel()}`}
              settings={eraImage || { url: '', scale: 1, posX: 0, posY: 0 }}
              onChange={onUpdateEraImage}
            />
          </div>
        )}
      </div>

      {/* ADMIN CONTROL: AJOUTER FOSSILE */}
      {isAdmin && (
        <div className="flex justify-center">
          <button
            onClick={handleCreateNewFossil}
            className="flex items-center gap-1.5 bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg transition-all tracking-wider uppercase"
          >
            <Plus className="w-4 h-4" /> Ajouter un Fossile à la Collection
          </button>
        </div>
      )}

      {/* CAROUSEL SWIPER TRACK COVERS */}
      {eraFossils.length === 0 ? (
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-yellow-600/60 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Aucun fossile n'est encore répertorié pour l'ère {getEraLabel()}.
          </p>
          {isAdmin ? (
            <p className="text-[11px] text-yellow-600/80">
              Activez le mode administrateur pour ajouter vos premiers spécimens !
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              En attente d'ajouts par le conservateur de la collection.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative group max-w-5xl mx-auto px-1 sm:px-12">
            {/* Left Scroll Button */}
            <button
              onClick={() => {
                playDinoSound();
                if (carouselTrackRef.current) {
                  carouselTrackRef.current.scrollBy({ left: -280, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-950/85 hover:bg-yellow-600/35 border border-yellow-750/50 text-yellow-500 rounded-full p-2 transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer hidden sm:flex"
              title="Précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Carousel Track with smooth snap scroll */}
            <div
              ref={carouselTrackRef}
              className="flex gap-4 md:gap-6 overflow-x-auto py-4 px-2 scroll-smooth snap-x snap-mandatory scrollbar-none"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {eraFossils.map((fos) => {
                const matchesSelected = selectedFossilId === fos.id;
                return (
                  <div
                    key={fos.id}
                    onClick={() => {
                      playDinoSound();
                      setSelectedFossilId(matchesSelected ? null : fos.id);
                    }}
                    className={`flex-none w-60 sm:w-64 snap-start bg-slate-950/90 border rounded-xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group select-none
                      ${matchesSelected
                        ? 'border-yellow-500 bg-gradient-to-b from-slate-950 to-amber-950/20 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-102 ring-2 ring-yellow-600/20'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                  >
                    <div className="h-32 rounded overflow-hidden bg-transparent mb-3 relative flex items-center justify-center pointer-events-none">
                      <CroppedImage settings={fos.image} alt={fos.title} className="w-full h-full" />
                    </div>

                    <h3 className="text-center font-serif text-sm font-bold uppercase text-white break-words [overflow-wrap:anywhere] hyphens-auto line-clamp-2 mb-1 leading-snug">
                      {fos.title || "Spécimen de Fossil"}
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
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playDinoSound();
                            onOpenEditForm(fos);
                          }}
                          className="p-1.5 bg-yellow-950 border border-yellow-700/30 text-yellow-500 rounded hover:bg-yellow-905"
                          title="Modifier le fossile"
                        >
                          🔧
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => {
                playDinoSound();
                if (carouselTrackRef.current) {
                  carouselTrackRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-950/85 hover:bg-yellow-600/35 border border-yellow-750/50 text-yellow-500 rounded-full p-2 transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer hidden sm:flex"
              title="Suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* FULL DETAILED PRESENTATION "FICHE TYPE" OF ACTIVE FOSSIL */}
      {activeFossil && (
        <FossilDetailSheet
          fossil={activeFossil}
          isAdmin={isAdmin}
          scrollMode="intoView"
          onClose={() => setSelectedFossilId(null)}
          onEdit={(f) => {
            setSelectedFossilId(null);
            onOpenEditForm(f);
          }}
          onDelete={(id) => {
            setSelectedFossilId(null);
            onDeleteFossil(id);
          }}
          onSaveTraceability={onModifyFossil}
        />
      )}
    </div>
  );
}
