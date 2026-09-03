import { useState, useRef } from 'react';
import { Fossil, ImageSettings } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { resolveImageUrl } from '../utils/imageUrl';
import { Plus, ChevronLeft, ChevronRight, Compass, Calendar, Sparkles, BookOpen, AlertCircle, Printer, FileText, Award, Tag, Maximize2, CheckCircle2 } from 'lucide-react';
import CroppedImage from './CroppedImage';
import ImageAdjuster from '../utils/data/ImageAdjuster';
import InteractiveMap from './InteractiveMap';
import GeologicTimelineView from './GeologicTimelineView';
import FossilPrintTemplate from './lib/FossilPrintTemplate';
import { getAdaptiveTitleClasses } from '../utils/titleUtils';

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
  const [expandedCertUrl, setExpandedCertUrl] = useState<ImageSettings | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Filter fossils belonging to current active era, being defensive about manual JSON edits in French
  const normalizedTargetEra = era.toLowerCase().replace('é', 'e').replace('a', 'e'); // allow precambrian -> precambrien
  
  const eraFossils = fossils.filter(f => {
    if (!f.era) return false;
    const fEra = f.era.toLowerCase().replace('é', 'e');
    if (era === 'precambrian' && (fEra === 'precambrien' || fEra === 'precambrian')) return true;
    if (era === 'paleozoic' && (fEra === 'paleozoic' || fEra === 'paleozoique')) return true;
    if (era === 'mesozoic' && (fEra === 'mesozoic' || fEra === 'mesozoique')) return true;
    if (era === 'cenozoic' && (fEra === 'cenozoic' || fEra === 'cenozoique')) return true;
    return f.era === era;
  });

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
          <div className="flex justify-between items-center px-4 max-w-4xl mx-auto text-xs text-slate-400 font-mono">
            <span>Défilez vers la gauche/droite ou utilisez les flèches ↔ 🔍</span>
          </div>

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
                      <CroppedImage settings={fos.thumbnailImage?.url ? fos.thumbnailImage : fos.image} alt={fos.title} className="w-full h-full" />
                    </div>

                    <h3 className="text-center font-serif text-sm font-bold uppercase text-white break-words [overflow-wrap:anywhere] hyphens-auto line-clamp-2 mb-1 leading-snug">
                      {fos.title || "Spécimen de Fossil"}
                    </h3>

                    {fos.reference && (
                      <div className="text-center">
                        <span className="text-[10px] font-mono text-slate-500 py-0.5 px-2 bg-slate-900/60 border border-slate-800 rounded inline-block text-center">
                          Ref: {fos.reference}
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
        <div className="max-w-4xl mx-auto bg-slate-950/95 border border-yellow-700/20 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 sm:space-y-8 animate-fade-in relative">
          
          {/* Printable sheet template - only rendered for administrator */}
          {isAdmin && <FossilPrintTemplate fossil={activeFossil} />}

          <div className="absolute top-4 right-4 flex gap-2 z-20">
            {/* PRINT BUTTON: ONLY VISIBLE IN ADMIN MODE */}
            {isAdmin && (
              <button
                onClick={() => {
                  playDinoSound();
                  window.print();
                }}
                className="bg-slate-900 border border-slate-850 px-3 py-1 rounded text-xs text-slate-400 hover:text-white transition-all font-mono uppercase font-bold flex items-center gap-1 hover:border-slate-700 hover:bg-slate-800 cursor-pointer"
                title="Imprimer la fiche (Mode Administrateur uniquement)"
              >
                <Printer className="w-3.5 h-3.5 text-yellow-500" />
                Imprimer / PDF
              </button>
            )}
            {/* HEADER CLOSE BUTTON */}
            <button
              onClick={() => {
                playDinoSound();
                setSelectedFossilId(null);
              }}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-850 py-1 px-3.5 rounded-full text-xs text-slate-400 hover:text-white transition-all font-mono cursor-pointer shadow-md"
            >
              Fermer X
            </button>
          </div>

          {/* 1. UNE ZONE TITRE EN GRAND */}
          <div className="text-center space-y-1.5 pt-6 sm:pt-2 px-2 max-w-full">
            <span className="text-[10px] font-mono text-yellow-500 tracking-wider block">SPÉCIMEN AUTHENTIQUE</span>
            <h1 className={`${getAdaptiveTitleClasses(activeFossil.title || '')} font-extrabold tracking-tight text-white font-serif uppercase text-center break-words [overflow-wrap:anywhere] hyphens-auto leading-tight`}>
              {activeFossil.title || 'Spécimen sans nom'}
            </h1>
          </div>

          {/* 2. ZONE D'IMAGE PRINCIPALE TRÈS GRAND (TRANSPARENTE PNG) */}
          <div className="relative h-96 max-w-xl mx-auto rounded-xl flex items-center justify-center bg-transparent overflow-hidden">
            <div className="absolute inset-0 bg-transparent" />
            <CroppedImage settings={activeFossil.image} alt={activeFossil.title} className="w-full h-full relative z-10" />
          </div>

          {/* 3. PETIT CADRE POUR AJOUTER UNE REFERENCE */}
          {activeFossil.reference && (
            <div className="flex justify-center">
              <div className="bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-lg text-center max-w-xs">
                <span className="text-[10.5px] font-mono tracking-widest text-slate-400 uppercase block mb-0.5">RÉFÉRENCE DE COLLECTION</span>
                <span className="text-sm font-mono text-yellow-500 font-bold">{activeFossil.reference}</span>
              </div>
            </div>
          )}

          {/* 4. RUBRIQUE DESCRIPTION : TEXTE + JUSQU'À 6 IMAGES LES UNES À CÔTÉ DES AUTRES SUR LA MÊME LIGNE */}
          {(activeFossil.description || (activeFossil.descImages && activeFossil.descImages.length > 0)) && (
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <BookOpen className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Description Scientifique</h3>
              </div>

              {activeFossil.description && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
                  {activeFossil.description}
                </p>
              )}

              {/* 6 images horizontally next to each other on a line */}
              {activeFossil.descImages && activeFossil.descImages.length > 0 && (
                <div className="overflow-x-auto py-2 scrollbar-none">
                  <div className="flex gap-3 justify-center min-w-max md:justify-start">
                    {activeFossil.descImages.map((img, i) => (
                      <div key={i} className="w-32 h-32 rounded-lg bg-transparent overflow-hidden relative flex-none">
                        <CroppedImage settings={img} alt={`Description photo ${i + 1}`} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4.5. RUBRIQUE ALIMENTATION : TEXTE + JUSQU'À 6 IMAGES CAROUSEL */}
          {(activeFossil.dietText || (activeFossil.dietImages && activeFossil.dietImages.length > 0)) && (
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <span className="text-lg">🍖</span>
                <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Alimentation</h3>
              </div>

              {activeFossil.dietText && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
                  {activeFossil.dietText}
                </p>
              )}

              {activeFossil.dietImages && activeFossil.dietImages.length > 0 && (
                <div className="overflow-x-auto py-2 scrollbar-none">
                  <div className="flex gap-3 justify-center min-w-max md:justify-start">
                    {activeFossil.dietImages.map((img, i) => (
                      <div key={i} className="w-32 h-32 rounded-lg bg-transparent overflow-hidden relative flex-none">
                        <CroppedImage settings={img} alt={`Alimentation photo ${i + 1}`} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. RUBRIQUE : LE FOSSILE */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Le Fossile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                {activeFossil.leFossileText && (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeFossil.leFossileText}
                  </p>
                )}

                {activeFossil.leFossileImage?.url && (
                  <div className="h-48 rounded-xl overflow-hidden bg-transparent flex items-center justify-center">
                    <CroppedImage settings={activeFossil.leFossileImage} alt="Details fossile" className="w-full h-full" />
                  </div>
                )}
              </div>

              {/* Geographical Provenance and interactive indicator */}
              <div className="space-y-4">
                <InteractiveMap
                  coords={activeFossil.provenanceCoords}
                  locationName={activeFossil.provenanceName}
                  readOnly={true}
                />
              </div>
            </div>

            {/* ECHELLE DES TEMPS HIGHLIGHTED TIMELINE (INDICATES SPECIES EXISTENCE SPAN) */}
            {(activeFossil.lifespanPeriodStart || activeFossil.lifespanPeriodEnd) && (
              <div className="border border-slate-850 rounded-xl p-4 mt-4 bg-slate-950/40">
                <GeologicTimelineView
                  readOnly={true}
                  highlightedStart={activeFossil.lifespanPeriodStart}
                  highlightedEnd={activeFossil.lifespanPeriodEnd}
                />
              </div>
            )}
          </div>

          {/* 6. RUBRIQUE : FICHE TECHNIQUE D'AUTHENTICITÉ ET DE TRAÇABILITÉ */}
          {(activeFossil.provenanceDate || activeFossil.periodeDatation || activeFossil.dateLieuAchat || activeFossil.prixAchat || activeFossil.certificatImage?.url) && (
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
                  Fiche Technique d'Authenticité & Traçabilité
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Provenance date */}
                  {activeFossil.provenanceDate && (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                        <Compass className="w-3.5 h-3.5 text-slate-500" />
                        <span>Découverte & Provenance</span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-line font-sans leading-relaxed">
                        {activeFossil.provenanceDate}
                      </p>
                    </div>
                  )}

                  {/* Datation */}
                  {activeFossil.periodeDatation ? (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chronologie (Datation)</span>
                      </div>
                      <p className="text-xs font-bold text-yellow-500 font-serif">
                        {activeFossil.periodeDatation}
                      </p>
                    </div>
                  ) : (activeFossil.lifespanPeriodStart && (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chronologie (Datation)</span>
                      </div>
                      <p className="text-xs font-bold text-yellow-500 font-serif">
                        {activeFossil.lifespanPeriodStart} {activeFossil.lifespanPeriodEnd ? `— ${activeFossil.lifespanPeriodEnd}` : ''}
                      </p>
                    </div>
                  ))}

                  {/* Date lieu d'achat */}
                  {activeFossil.dateLieuAchat && (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                        <Compass className="w-3.5 h-3.5 text-slate-500" />
                        <span>Acquisition / Traçabilité</span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-line font-sans leading-relaxed">
                        {activeFossil.dateLieuAchat}
                      </p>
                    </div>
                  )}

                  {/* Prix d'achat */}
                  {activeFossil.prixAchat && (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>Valeur ou Prix d'Achat</span>
                      </div>
                      <p className="text-sm font-bold font-mono text-yellow-500">
                        {activeFossil.prixAchat} €
                      </p>
                    </div>
                  )}
                </div>

                {/* Certificat d'authenticité picture */}
                {activeFossil.certificatImage?.url ? (
                  <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block text-center">
                      Certificat d'Authenticité
                    </span>
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-transparent border border-slate-800 relative group cursor-pointer shadow-md">
                      <CroppedImage settings={activeFossil.certificatImage} alt="Certificat d'Authenticité" className="w-full h-full" />
                      <div
                        onClick={() => {
                          playDinoSound();
                          setExpandedCertUrl(activeFossil.certificatImage || null);
                        }}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity border-none"
                        title="Agrandir le certificat d'authenticité"
                      >
                        <Maximize2 className="w-5 h-5 text-yellow-500" />
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 justify-center bg-emerald-950/30 border border-emerald-900/40 py-1 px-2.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Collection Certifiée
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-950/20 border border-dashed border-slate-800 p-4 rounded-xl h-full flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                      Certificat d'Authenticité
                    </span>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      Aucun certificat numérisé pour cet échantillon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. RUBRIQUE : LE SAVIEZ-VOUS ? */}
          {(activeFossil.saviezVousText || activeFossil.saviezVousImage?.url) && (
            <div className="bg-gradient-to-r from-yellow-950/20 to-slate-900/10 border-2 border-yellow-700/10 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 font-serif text-9xl text-yellow-500 pointer-events-none italic select-none">
                ?
              </div>

              <div className="flex items-center gap-2 border-b border-yellow-700/10 pb-2 mb-4">
                <span className="text-lg">💡</span>
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-yellow-500">Le Saviez-Vous ?</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                {activeFossil.saviezVousImage?.url && (
                  <div className="md:col-span-1.5 h-32 rounded-lg bg-transparent relative overflow-hidden">
                    <CroppedImage settings={activeFossil.saviezVousImage} alt="Le saviez vous anecdote" className="w-full h-full" />
                  </div>
                )}

                <div className={activeFossil.saviezVousImage?.url ? 'md:col-span-3.5' : 'md:col-span-5'}>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans italic whitespace-pre-wrap">
                    "{activeFossil.saviezVousText}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation helpers close */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                playDinoSound();
                setSelectedFossilId(null);
              }}
              className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-bold text-xs uppercase px-7 py-3 rounded-full transition-all tracking-wider"
            >
              Retour à la sélection
            </button>
          </div>

          {/* EXPANDED CERTIFICATE MODAL */}
          {expandedCertUrl && (
            <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
              <div className="max-w-4xl max-h-[80vh] relative border-2 border-yellow-700/30 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center p-4">
                <img
                  src={resolveImageUrl(expandedCertUrl.url)}
                  alt="Certificat Agrandit"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  style={{
                    transform: `scale(${expandedCertUrl.scale}) translate(${expandedCertUrl.posX}%, ${expandedCertUrl.posY}%)`
                  }}
                />
              </div>
              <div className="text-center mt-4 space-y-1">
                <p className="text-xs text-slate-400">Certificat d'Authenticité Officiel de la Collection</p>
                <button
                  onClick={() => {
                    playDinoSound();
                    setExpandedCertUrl(null);
                  }}
                  className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 py-2 px-6 rounded-full text-xs font-bold text-white uppercase tracking-wider transition-all mt-2"
                >
                  Fermer le Visualiseur
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
