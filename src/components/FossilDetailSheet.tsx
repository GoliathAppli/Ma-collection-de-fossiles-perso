import { useState, useEffect, useRef } from 'react';
import { Fossil, ImageSettings } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { resolveImageUrl } from '../utils/imageUrl';
import CroppedImage from './CroppedImage';
import InteractiveMap from './InteractiveMap';
import GeologicTimelineView from './GeologicTimelineView';
import FossilPrintTemplate from './lib/FossilPrintTemplate';
import ImageAdjuster from '../utils/data/ImageAdjuster';
import { getAdaptiveTitleClasses } from '../utils/titleUtils';
import FossilAudioGuide from './FossilAudioGuide';
import { DietBadges } from './DietIcons';
import BurntPaperPhoto from './BurntPaperPhoto';
import FossilSectionDivider from './FossilSectionDivider';
import {
  Printer,
  Sparkles,
  Compass,
  Calendar,
  Tag,
  Maximize2,
  CheckCircle2,
  FileText,
  X,
  Edit3,
  Trash2,
  Lock,
  ShieldCheck,
  Save,
  Upload,
  Image as ImageIcon,
  Ruler,
  ChevronDown,
  Globe,
  BookOpen,
  Drumstick,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface FossilDetailSheetProps {
  fossil: Fossil;
  isAdmin: boolean;
  onClose: () => void;
  onEdit?: (fossil: Fossil) => void;
  onDelete?: (id: string) => void;
  onSaveTraceability?: (fossil: Fossil) => Promise<void> | void;
  scrollMode?: 'windowTop' | 'intoView';
}

export default function FossilDetailSheet({
  fossil,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onSaveTraceability,
  scrollMode = 'windowTop',
}: FossilDetailSheetProps) {
  const [expandedCertUrl, setExpandedCertUrl] = useState<ImageSettings | null>(null);
  const [showGeologicTimeline, setShowGeologicTimeline] = useState(false);
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  // Traceability editing state for Administrator
  const [isEditingTraceability, setIsEditingTraceability] = useState(false);
  const [traceData, setTraceData] = useState({
    provenanceDate: fossil.provenanceDate || '',
    periodeDatation: fossil.periodeDatation || '',
    dateLieuAchat: fossil.dateLieuAchat || '',
    prixAchat: fossil.prixAchat || '',
    certificatImage: fossil.certificatImage || { url: '', scale: 1, posX: 0, posY: 0 },
  });
  const [isSavingTrace, setIsSavingTrace] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showCertAdjuster, setShowCertAdjuster] = useState(false);

  useEffect(() => {
    setTraceData({
      provenanceDate: fossil.provenanceDate || '',
      periodeDatation: fossil.periodeDatation || '',
      dateLieuAchat: fossil.dateLieuAchat || '',
      prixAchat: fossil.prixAchat || '',
      certificatImage: fossil.certificatImage || { url: '', scale: 1, posX: 0, posY: 0 },
    });
    setIsEditingTraceability(false);
    setShowCertAdjuster(false);
    setSaveSuccessMsg(null);
  }, [fossil.id, fossil.provenanceDate, fossil.periodeDatation, fossil.dateLieuAchat, fossil.prixAchat, fossil.certificatImage?.url]);

  const handleSaveTrace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playDinoSound();
    setIsSavingTrace(true);
    const updated: Fossil = {
      ...fossil,
      provenanceDate: traceData.provenanceDate,
      periodeDatation: traceData.periodeDatation,
      dateLieuAchat: traceData.dateLieuAchat,
      prixAchat: traceData.prixAchat,
      certificatImage: traceData.certificatImage,
    };
    try {
      if (onSaveTraceability) {
        await onSaveTraceability(updated);
      }
      setIsEditingTraceability(false);
      setShowCertAdjuster(false);
      setSaveSuccessMsg("Données de traçabilité enregistrées et synchronisées avec les fiches techniques !");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Erreur de sauvegarde de la traçabilité:", err);
    } finally {
      setIsSavingTrace(false);
    }
  };

  const handleCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setTraceData(prev => ({
          ...prev,
          certificatImage: {
            url: result,
            scale: 1,
            posX: 0,
            posY: 0,
          }
        }));
        setShowCertAdjuster(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automatically scroll to the top of the sheet / window when opened or switched
  useEffect(() => {
    if (scrollMode === 'intoView') {
      const timer = setTimeout(() => {
        sheetContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
      return () => clearTimeout(timer);
    } else {
      // Immediate scroll to top
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      
      // Secondary animation frame to catch mobile browser rendering reflows
      const raf = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });

      // Defensive timeout for mobile devices (e.g. Chrome Android) adjusting viewport
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 60);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [fossil.id, scrollMode]);

  const validDescImages = (fossil.descImages || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
  );
  const validDietImages = (fossil.dietImages || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
  );

  return (
    <div
      ref={sheetContainerRef}
      className="max-w-4xl mx-auto bg-slate-950/95 border border-yellow-700/20 p-5 sm:p-8 md:p-10 rounded-3xl shadow-2xl space-y-10 sm:space-y-16 animate-fade-in relative text-slate-100"
    >
      {/* Printable sheet template - only rendered for administrator */}
      {isAdmin && (
        <FossilPrintTemplate
          fossil={{
            ...fossil,
            prixAchat: traceData.prixAchat || fossil.prixAchat,
            dateLieuAchat: traceData.dateLieuAchat || fossil.dateLieuAchat,
            provenanceDate: traceData.provenanceDate || fossil.provenanceDate,
            periodeDatation: traceData.periodeDatation || fossil.periodeDatation,
            certificatImage: traceData.certificatImage?.url ? traceData.certificatImage : fossil.certificatImage,
          }}
        />
      )}

      {/* TOP RIGHT ACTION BUTTONS */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {/* Admin Edit */}
        {isAdmin && onEdit && (
          <button
            onClick={() => {
              playDinoSound();
              onEdit(fossil);
            }}
            className="bg-slate-900 border border-slate-850 px-3 py-1 rounded text-xs text-yellow-500 hover:text-yellow-400 transition-all font-mono uppercase font-bold flex items-center gap-1 hover:border-yellow-700/40 hover:bg-slate-800 cursor-pointer"
            title="Modifier ce fossile"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modifier</span>
          </button>
        )}

        {/* Admin Delete */}
        {isAdmin && onDelete && (
          <button
            onClick={() => {
              playDinoSound();
              if (window.confirm(`Supprimer définitivement le fossile "${fossil.title}" ?`)) {
                onDelete(fossil.id);
              }
            }}
            className="bg-slate-900 border border-slate-850 px-3 py-1 rounded text-xs text-rose-400 hover:text-rose-300 transition-all font-mono uppercase font-bold flex items-center gap-1 hover:border-rose-800/40 hover:bg-slate-800 cursor-pointer"
            title="Supprimer ce fossile"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supprimer</span>
          </button>
        )}

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
            <span className="hidden sm:inline">Imprimer / PDF</span>
          </button>
        )}

        {/* HEADER CLOSE BUTTON */}
        <button
          onClick={() => {
            playDinoSound();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {
                console.warn(e);
              }
            }
            onClose();
          }}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-850 py-1 px-3.5 rounded-full text-xs text-slate-400 hover:text-white transition-all font-mono cursor-pointer shadow-md"
          title="Fermer la fiche"
        >
          Fermer X
        </button>
      </div>

      {/* 1. ZONE TITRE PRINCIPAL EN VALEUR (CARTOUCHE FAÇON MUSÉUM) */}
      <div className="text-center pt-8 sm:pt-4 pb-2 px-3 max-w-3xl mx-auto space-y-2.5">
        {/* Ornement supérieur subtil */}
        <div className="flex items-center justify-center gap-2.5 opacity-90 select-none">
          <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-yellow-600/40 to-yellow-500/70" />
          <span className="text-[10px] sm:text-xs font-serif font-bold uppercase tracking-[0.25em] text-yellow-500/90 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
            Spécimen de Collection
            <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
          </span>
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent via-yellow-600/40 to-yellow-500/70" />
        </div>

        {/* Titre principal magnifié avec dégradé doré ambré et ombre subtile */}
        <h1 className={`${getAdaptiveTitleClasses(fossil.title || '')} font-extrabold tracking-tight font-serif uppercase text-center break-words [overflow-wrap:anywhere] hyphens-auto leading-tight bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(234,179,8,0.35)]`}>
          {fossil.title || 'Spécimen sans nom'}
        </h1>

        {/* Filet ornemental inférieur raffiné */}
        <div className="flex items-center justify-center gap-2.5 pt-0.5 select-none">
          <div className="h-[1.5px] w-14 sm:w-24 bg-gradient-to-r from-transparent via-yellow-500/60 to-yellow-400" />
          <div className="w-2 h-2 rotate-45 border border-yellow-400/80 bg-yellow-500/50 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
          <div className="h-[1.5px] w-14 sm:w-24 bg-gradient-to-l from-transparent via-yellow-500/60 to-yellow-400" />
        </div>
      </div>

      {/* 2. ZONE D'IMAGE PRINCIPALE TRÈS GRAND (TRANSPARENTE PNG) */}
      <div className="relative h-96 max-w-xl mx-auto rounded-xl flex items-center justify-center bg-transparent overflow-hidden">
        <div className="absolute inset-0 bg-transparent" />
        <CroppedImage settings={fossil.image} alt={fossil.title} className="w-full h-full relative z-10" />
      </div>

      {/* 3. CADRE CIRCULAIRE : SCEAU & RÉFÉRENCE DE COLLECTION */}
      {fossil.reference ? (
        <div className="flex justify-center my-3 select-none">
          {/* Halo d'ambiance et bague extérieure du médaillon */}
          <div className="relative group p-1.5 rounded-full bg-gradient-to-b from-yellow-600/35 via-yellow-700/15 to-transparent shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_22px_rgba(202,138,4,0.18)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.85),0_0_30px_rgba(250,204,21,0.3)] transition-all duration-300">
            {/* Filet intérieur en pointillés dorés ciselés */}
            <div className="p-1 rounded-full border border-dashed border-yellow-500/50 group-hover:border-yellow-400/80 transition-colors">
              {/* Corps circulaire principal du médaillon */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-950 border-2 border-yellow-600/70 group-hover:border-yellow-400/90 shadow-[inset_0_0_18px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(250,204,21,0.35)] flex flex-col items-center justify-center p-2 text-center relative overflow-hidden transition-all duration-300">
                
                {/* Filigrane d'ammonite / spirale en arrière-plan */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full text-yellow-500/10 pointer-events-none p-3 rotate-12 transition-transform duration-700 group-hover:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M50 50 m0 -40 a40 40 0 1 1 -35 60 a30 30 0 1 1 30 -50 a20 20 0 1 1 -20 35 a12 12 0 1 1 14 -22 a6 6 0 1 1 -8 11" />
                </svg>

                {/* En-tête : Référence */}
                <div className="flex items-center justify-center gap-1 z-10">
                  <span className="w-1 h-1 rounded-full bg-yellow-400/80" />
                  <span className="text-[8.5px] sm:text-[9.5px] font-serif font-bold uppercase tracking-[0.2em] text-yellow-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    RÉFÉRENCE
                  </span>
                  <span className="w-1 h-1 rounded-full bg-yellow-400/80" />
                </div>

                {/* Filet séparateur supérieur */}
                <div className="w-9 sm:w-11 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent my-1 z-10" />

                {/* Numéro de référence mis en valeur */}
                <div className="z-10 px-1 max-w-[100px] sm:max-w-[115px]">
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-200 group-hover:text-yellow-100 tracking-wider break-all leading-tight block drop-shadow-[0_2px_8px_rgba(234,179,8,0.45)]">
                    {fossil.reference}
                  </span>
                </div>

                {/* Filet séparateur inférieur */}
                <div className="w-9 sm:w-11 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent my-1 z-10" />

                {/* Bas de médaillon : Collection */}
                <span className="text-[7.5px] sm:text-[8.5px] font-mono tracking-[0.24em] text-slate-400 group-hover:text-slate-300 uppercase z-10">
                  COLLECTION
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (isAdmin && onEdit) ? (
        <div className="flex justify-center my-3 select-none">
          <button
            type="button"
            onClick={() => {
              playDinoSound();
              onEdit(fossil);
            }}
            className="group p-1 rounded-full border border-dashed border-slate-700 hover:border-yellow-500/60 transition-all cursor-pointer"
            title="Ajouter une référence de collection"
          >
            <div className="w-24 h-24 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-yellow-600/40 flex flex-col items-center justify-center p-2 text-center text-slate-500 hover:text-yellow-400 transition-colors">
              <span className="text-[9px] font-mono tracking-wider uppercase">+ Réf.</span>
              <span className="text-[7.5px] font-serif uppercase tracking-widest text-slate-600 group-hover:text-slate-400">Collection</span>
            </div>
          </button>
        </div>
      ) : null}

      {/* GUIDE AUDIO VOCAL (WEB SPEECH API NATIVE, 100% HORS-LIGNE) */}
      <div className="pb-3 sm:pb-6">
        <FossilAudioGuide fossil={fossil} />
      </div>

      {/* ============================================================== */}
      {/* PARTIE 1 : CÔTÉ ESPÈCE (PALÉOBIOLOGIE & DESCRIPTION)           */}
      {/* ============================================================== */}
      {(fossil.description || validDescImages.length > 0 || fossil.tailleEspece || (isAdmin && onEdit)) && (
        <div className="space-y-10 sm:space-y-14 pt-4 sm:pt-8">
          {/* GRAND TITRE SÉPARATION MAJEUR CÔTÉ ESPÈCE */}
          <FossilSectionDivider type="ammonite" size="lg" label="Description de l'espèce" />

          {/* 1. TEXTE DE LA DESCRIPTION DANS SON PROPRE ENCADRÉ */}
          {fossil.description && (
            <div className="bg-slate-900/40 border border-slate-800/90 p-5 sm:p-7 rounded-2xl shadow-xl max-w-3xl mx-auto w-full">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans text-center whitespace-pre-wrap">
                {fossil.description}
              </p>
            </div>
          )}

          {/* SÉPARATION AVEC TITRE INTÉGRÉ : TAILLE DE L'ESPÈCE */}
          {(fossil.tailleEspece || validDescImages.length > 0 || (isAdmin && onEdit)) && (
            <div className="space-y-4 pt-2 sm:pt-4">
              <FossilSectionDivider type="leaf" size="md" label="Taille de l'espèce" />

              {/* MÊME CADRE POUR LA TAILLE DE L'ESPÈCE ET LA PHOTO */}
              <div className="bg-slate-900/40 border border-slate-800/90 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl max-w-3xl mx-auto w-full">
                {/* CASE TAILLE DE L'ESPÈCE (SANS TITRE REDONDANT DANS LE CADRE) */}
                {fossil.tailleEspece ? (
                  <div className="flex items-center justify-center gap-2.5 bg-slate-950/70 border border-slate-850 px-5 py-3 rounded-xl text-slate-200 text-center max-w-md mx-auto shadow-md">
                    <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
                      <Ruler className="w-4 h-4" />
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-yellow-400 font-mono tracking-wide">
                      {fossil.tailleEspece}
                    </span>
                  </div>
                ) : (isAdmin && onEdit) ? (
                  <div className="flex items-center justify-center gap-3 bg-slate-950/40 border border-dashed border-slate-850 px-5 py-3 rounded-xl text-slate-400 text-xs max-w-md mx-auto text-center">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-slate-500" />
                      <span className="italic text-slate-500">Taille non renseignée</span>
                    </div>
                    <button
                      onClick={() => {
                        playDinoSound();
                        onEdit(fossil);
                      }}
                      className="text-[11px] font-mono text-yellow-500 hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      + Ajouter la taille
                    </button>
                  </div>
                ) : null}

                {/* PHOTOS D'ILLUSTRATION DANS LE MÊME CADRE (SANS SÉPARATION SUPPLÉMENTAIRE) */}
                {validDescImages.length > 0 && (
                  <div className="pt-1">
                    {validDescImages.length === 1 ? (
                      <div className="flex justify-center">
                        <div className="w-full max-w-2xl h-64 sm:h-80 md:h-96 flex items-center justify-center relative">
                          <BurntPaperPhoto
                            settings={validDescImages[0]}
                            alt="Photo description scientifique"
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    ) : validDescImages.length === 2 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {validDescImages.map((img, i) => (
                          <div key={i} className="w-full h-56 sm:h-72 flex items-center justify-center relative">
                            <BurntPaperPhoto
                              settings={img}
                              alt={`Description photo ${i + 1}`}
                              className="w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {validDescImages.map((img, i) => (
                          <div key={i} className="w-full h-48 sm:h-60 flex items-center justify-center relative">
                            <BurntPaperPhoto
                              settings={img}
                              alt={`Description photo ${i + 1}`}
                              className="w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SÉPARATION & ENCADRÉ : PÉRIODE DE VIE */}
      {(fossil.lifespanPeriodStart || fossil.lifespanPeriodEnd || (isAdmin && onEdit)) && (
        <div className="space-y-4 pt-3 sm:pt-6">
          <FossilSectionDivider type="gem" size="md" label="Période de vie" />
          {(fossil.lifespanPeriodStart || fossil.lifespanPeriodEnd) ? (
            <div className="border border-slate-800/90 bg-slate-900/40 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 max-w-2xl mx-auto text-center w-full">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="text-base sm:text-lg font-bold font-serif text-yellow-400 tracking-wide text-center">
                  {fossil.lifespanPeriodStart}
                  {fossil.lifespanPeriodEnd && fossil.lifespanPeriodEnd !== fossil.lifespanPeriodStart
                    ? ` — ${fossil.lifespanPeriodEnd}`
                    : ''}
                </div>

                {/* BOUTON DÉPLIANT DISCRET POUR L'ÉCHELLE GÉOLOGIQUE */}
                <button
                  type="button"
                  onClick={() => {
                    playDinoSound();
                    setShowGeologicTimeline(prev => !prev);
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 text-xs font-mono text-slate-300 hover:text-yellow-400 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-yellow-600/50 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-sm mx-auto"
                >
                  <Compass className="w-3.5 h-3.5 text-yellow-500" />
                  <span>{showGeologicTimeline ? "Masquer l'échelle chronologique" : "Échelle des temps géologiques"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-yellow-500 transition-transform duration-200 ${showGeologicTimeline ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* CONTENU DÉPLIANT */}
              {showGeologicTimeline && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <p className="text-[11px] text-slate-400 font-sans italic text-center">
                    Repère chronostratigraphique détaillé de l'ère et des périodes géologiques :
                  </p>
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-850">
                    <GeologicTimelineView
                      readOnly={true}
                      highlightedStart={fossil.lifespanPeriodStart}
                      highlightedEnd={fossil.lifespanPeriodEnd}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (isAdmin && onEdit) ? (
            <div className="flex items-center justify-center gap-3 bg-slate-950/40 border border-dashed border-slate-850 px-5 py-3 rounded-xl text-slate-400 text-xs max-w-md mx-auto text-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-slate-400">Période de vie :</span>
                <span className="italic text-slate-500">Non renseignée</span>
              </div>
              <button
                onClick={() => {
                  playDinoSound();
                  onEdit(fossil);
                }}
                className="text-[11px] font-mono text-yellow-500 hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                + Définir la période de vie
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* SÉPARATION & ENCADRÉ : ALIMENTATION */}
      {(fossil.dietText || (fossil.dietTypes && fossil.dietTypes.length > 0) || (isAdmin && onEdit)) && (
        <div className="space-y-4 pt-3 sm:pt-6">
          <FossilSectionDivider type="leaf" size="md" label="Alimentation" />
          <div className="border border-slate-800/90 rounded-2xl p-6 sm:p-7 bg-slate-900/40 space-y-4 shadow-xl max-w-3xl mx-auto w-full">
            {/* AFFICHAGE DES ICÔNES DE RÉGIME SÉLECTIONNÉES UNIQUEMENT */}
            {fossil.dietTypes && fossil.dietTypes.length > 0 && (
              <div className="pt-1">
                <DietBadges dietTypes={fossil.dietTypes} />
              </div>
            )}

            {fossil.dietText ? (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans text-center whitespace-pre-wrap max-w-2xl mx-auto">
                {fossil.dietText}
              </p>
            ) : (!fossil.dietTypes || fossil.dietTypes.length === 0) && (isAdmin && onEdit) ? (
              <div className="flex items-center justify-center gap-3 text-xs text-slate-500 italic py-1 text-center">
                <span>Régime alimentaire non renseigné</span>
                <button
                  onClick={() => {
                    playDinoSound();
                    onEdit(fossil);
                  }}
                  className="not-italic text-[11px] font-mono text-yellow-500 hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  + Renseigner l'alimentation
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PARTIE 2 : CÔTÉ FOSSILE (LE SPÉCIMEN AUTHENTIQUE DE COLLECTION) */}
      {/* ============================================================== */}
      <div className="space-y-8 sm:space-y-10 pt-10 sm:pt-16">
        {/* GRAND TITRE SÉPARATION MAJEUR CÔTÉ FOSSILE */}
        <FossilSectionDivider type="trilobite" size="lg" label="Le Spécimen" />

        {/* 1. ENCADRÉ : TEXTE ET PHOTO DU FOSSILE (DIRECTEMENT SOUS "LE SPÉCIMEN") */}
        {(fossil.leFossileText || fossil.leFossileImage?.url || (isAdmin && onEdit)) && (
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 sm:p-8 rounded-2xl shadow-xl max-w-3xl mx-auto w-full">
            {fossil.leFossileImage?.url ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Photo du fossile */}
                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-950/70 border border-slate-800 shadow-md flex items-center justify-center relative group hover:border-yellow-500/40 transition-colors">
                  <CroppedImage settings={fossil.leFossileImage} alt="Photographie du spécimen" className="w-full h-full object-cover" />
                </div>

                {/* Description du fossile */}
                <div className="flex flex-col justify-center">
                  {fossil.leFossileText ? (
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {fossil.leFossileText}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Spécimen fossile préservé dans sa matrice d'origine.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Sans photo : Description du fossile seule */
              <div className="max-w-2xl mx-auto">
                {fossil.leFossileText ? (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap text-center">
                    {fossil.leFossileText}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center">
                    Aucune description détaillée renseignée pour ce spécimen.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. SÉPARATION & ENCADRÉ : DIMENSION ET DATATION */}
        {(fossil.dimensions || fossil.periodeDatation || (isAdmin && onEdit)) && (
          <div className="space-y-4 pt-3 sm:pt-6">
            <FossilSectionDivider type="ammonite" size="md" label="Dimension et datation" />
            <div className="bg-slate-900/40 border border-slate-800/90 p-5 sm:p-7 rounded-2xl shadow-xl max-w-3xl mx-auto w-full">
              <div className={`grid grid-cols-1 ${(fossil.dimensions || (isAdmin && onEdit)) && (fossil.periodeDatation || (isAdmin && onEdit)) ? 'sm:grid-cols-2' : 'max-w-md mx-auto'} gap-4`}>
                {/* LIGNE DIMENSIONS (TAILLE DU FOSSILE - SANS TITRE REDONDANT DANS LE CADRE) */}
                {fossil.dimensions ? (
                  <div className="flex items-center justify-center gap-2.5 bg-slate-950/70 border border-slate-800/80 px-4 py-3 rounded-xl text-slate-200 text-center shadow-md">
                    <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
                      <Ruler className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-yellow-400 font-mono">{fossil.dimensions}</span>
                  </div>
                ) : (isAdmin && onEdit) ? (
                  <div className="flex items-center justify-center gap-3 bg-slate-950/40 border border-dashed border-slate-800 px-4 py-2.5 rounded-xl text-slate-400 text-xs text-center">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-slate-500" />
                      <span className="italic text-slate-500">Dimensions non renseignées</span>
                    </div>
                    <button
                      onClick={() => {
                        playDinoSound();
                        onEdit(fossil);
                      }}
                      className="text-[11px] font-mono text-yellow-500 hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      + Ajouter la taille
                    </button>
                  </div>
                ) : null}

                {/* LIGNE DATATION DU FOSSILE (SANS TITRE REDONDANT DANS LE CADRE) */}
                {fossil.periodeDatation ? (
                  <div className="flex items-center justify-center gap-2.5 bg-slate-950/70 border border-slate-800/80 px-4 py-3 rounded-xl text-slate-200 text-center shadow-md">
                    <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-yellow-400 font-mono">{fossil.periodeDatation}</span>
                  </div>
                ) : (isAdmin && onEdit) ? (
                  <div className="flex items-center justify-center gap-3 bg-slate-950/40 border border-dashed border-slate-800 px-4 py-2.5 rounded-xl text-slate-400 text-xs text-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="italic text-slate-500">Datation non renseignée</span>
                    </div>
                    <button
                      onClick={() => {
                        playDinoSound();
                        onEdit(fossil);
                      }}
                      className="text-[11px] font-mono text-yellow-500 hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      + Ajouter la datation
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* 3. SÉPARATION & ENCADRÉ : PROVENANCE GÉOGRAPHIQUE */}
        <div className="space-y-4 pt-3 sm:pt-6">
          <FossilSectionDivider type="gem" size="md" label="Provenance géographique" />
          <div className="bg-slate-900/40 border border-slate-800/90 p-5 sm:p-6 rounded-2xl shadow-xl max-w-3xl mx-auto w-full">
            <InteractiveMap
              key={fossil.id}
              coords={fossil.provenanceCoords}
              locationName={[fossil.provenanceFormation, fossil.provenanceVille, fossil.provenancePays].filter(Boolean).join(' • ') || fossil.provenanceName || fossil.provenanceDate || "Inconnue"}
              provenanceFormation={fossil.provenanceFormation}
              provenanceVille={fossil.provenanceVille}
              provenancePays={fossil.provenancePays}
              readOnly={true}
            />
          </div>
        </div>
      </div>

      {/* 6. RUBRIQUE : FICHE TECHNIQUE D'AUTHENTICITÉ ET DE TRAÇABILITÉ (ADMIN UNIQUEMENT - INVISIBLE VISITEURS) */}
      {isAdmin && (
        <div className="space-y-4 pt-4 sm:pt-8">
          <FossilSectionDivider type="gem" label="Traçabilité" />
          <div className="bg-slate-900/40 border border-yellow-700/30 p-6 sm:p-8 md:p-9 rounded-2xl space-y-7 sm:space-y-9 shadow-xl">
            <div className="flex flex-col items-center justify-center text-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center justify-center gap-2.5 text-center">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold font-serif uppercase tracking-wider text-white">
                  Fiche Technique d'Authenticité & Traçabilité
                </h3>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-yellow-400" /> Réservé Administrateur — Invisible pour les visiteurs
              </span>

              <button
                onClick={() => {
                  playDinoSound();
                  setIsEditingTraceability(!isEditingTraceability);
                }}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-yellow-700/40 hover:border-yellow-500/60 px-3.5 py-1.5 rounded-xl font-mono flex items-center gap-1.5 transition cursor-pointer mx-auto mt-1"
              >
                {isEditingTraceability ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Fermer l'édition
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" /> Remplir / Modifier la fiche
                  </>
                )}
              </button>
            </div>

          {/* Success message banner */}
          {saveSuccessMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2 font-mono shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* EDIT FORM (DIRECT EDITING IN SHEET SYNCHRONIZED WITH TECHNICAL SHEETS) */}
          {isEditingTraceability ? (
            <form onSubmit={handleSaveTrace} className="space-y-4 pt-1">
              <p className="text-xs text-slate-400 font-mono">
                Renseignez ici les données de traçabilité. Elles seront instantanément synchronisées avec le tableau récapitulatif des fiches techniques.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provenance & Découverte */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-400" />
                    Découverte & Provenance
                  </label>
                  <textarea
                    rows={2}
                    value={traceData.provenanceDate}
                    onChange={(e) => setTraceData({ ...traceData, provenanceDate: e.target.value })}
                    placeholder="Ex: Alnif, Maroc - Mars 2018"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                {/* Datation */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Chronologie (Datation)
                  </label>
                  <input
                    type="text"
                    value={traceData.periodeDatation}
                    onChange={(e) => setTraceData({ ...traceData, periodeDatation: e.target.value })}
                    placeholder="Ex: Dévonien moyen (~390 Ma)"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                {/* Date et lieu d'achat */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-400" />
                    Date & Lieu d'Achat
                  </label>
                  <textarea
                    rows={2}
                    value={traceData.dateLieuAchat}
                    onChange={(e) => setTraceData({ ...traceData, dateLieuAchat: e.target.value })}
                    placeholder="Ex: Acheté le 12/05/2019 à la Galerie d'Erfoud"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                {/* Prix d'achat */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Valeur ou Prix d'Achat (€)
                  </label>
                  <input
                    type="text"
                    value={traceData.prixAchat}
                    onChange={(e) => setTraceData({ ...traceData, prixAchat: e.target.value })}
                    placeholder="Ex: 450"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>

              {/* Certificat d'authenticité */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Certificat d'Authenticité Numérisé
                  </span>
                  {traceData.certificatImage?.url && (
                    <button
                      type="button"
                      onClick={() => setTraceData({ ...traceData, certificatImage: { url: '', scale: 1, posX: 0, posY: 0 } })}
                      className="text-[10px] font-mono text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Retirer le certificat
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">
                      URL de l'image du certificat
                    </label>
                    <input
                      type="text"
                      value={traceData.certificatImage?.url || ''}
                      onChange={(e) =>
                        setTraceData({
                          ...traceData,
                          certificatImage: {
                            url: e.target.value,
                            scale: traceData.certificatImage?.scale || 1,
                            posX: traceData.certificatImage?.posX || 0,
                            posY: traceData.certificatImage?.posY || 0,
                          },
                        })
                      }
                      placeholder="https://... ou téléversez ci-contre"
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">
                      Ou téléverser depuis votre appareil
                    </label>
                    <label className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Sélectionner une photo...</span>
                      <input type="file" accept="image/*" onChange={handleCertFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {traceData.certificatImage?.url && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 relative shrink-0">
                      <CroppedImage settings={traceData.certificatImage} alt="Certificat" className="w-full h-full" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <button
                        type="button"
                        onClick={() => setShowCertAdjuster(!showCertAdjuster)}
                        className="text-xs bg-slate-900 hover:bg-slate-850 text-yellow-400 border border-yellow-700/40 px-3 py-1.5 rounded-lg font-mono flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {showCertAdjuster ? "Masquer le recadrage" : "Ajuster le cadrage & zoom"}
                      </button>
                      {showCertAdjuster && (
                        <div className="bg-slate-900/90 border border-slate-750 p-3 rounded-xl mt-2">
                          <ImageAdjuster
                            label="Certificat d'Authenticité"
                            settings={traceData.certificatImage}
                            onChange={(newSettings) => setTraceData({ ...traceData, certificatImage: newSettings })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTrace}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-yellow-950/40"
                >
                  <Save className="w-4 h-4" />
                  {isSavingTrace ? "Enregistrement..." : "Enregistrer et Synchroniser la Traçabilité"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playDinoSound();
                    setIsEditingTraceability(false);
                    setShowCertAdjuster(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            /* READ-ONLY DISPLAY FOR ADMIN */
            <div>
              {fossil.provenanceDate || fossil.periodeDatation || fossil.dateLieuAchat || fossil.prixAchat || fossil.certificatImage?.url ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Provenance date */}
                    {fossil.provenanceDate && (
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                          <Compass className="w-3.5 h-3.5 text-slate-500" />
                          <span>Découverte & Provenance</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-line font-sans leading-relaxed">
                          {fossil.provenanceDate}
                        </p>
                      </div>
                    )}

                    {/* Datation */}
                    {fossil.periodeDatation ? (
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chronologie (Datation)</span>
                        </div>
                        <p className="text-xs font-bold text-yellow-500 font-serif">
                          {fossil.periodeDatation}
                        </p>
                      </div>
                    ) : (fossil.lifespanPeriodStart && (
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chronologie (Datation)</span>
                        </div>
                        <p className="text-xs font-bold text-yellow-500 font-serif">
                          {fossil.lifespanPeriodStart} {fossil.lifespanPeriodEnd ? `— ${fossil.lifespanPeriodEnd}` : ''}
                        </p>
                      </div>
                    ))}

                    {/* Date lieu d'achat */}
                    {fossil.dateLieuAchat && (
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                          <Compass className="w-3.5 h-3.5 text-slate-500" />
                          <span>Acquisition / Traçabilité</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-line font-sans leading-relaxed">
                          {fossil.dateLieuAchat}
                        </p>
                      </div>
                    )}

                    {/* Prix d'achat */}
                    {fossil.prixAchat && (
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase">
                          <Tag className="w-3.5 h-3.5 text-slate-500" />
                          <span>Valeur ou Prix d'Achat</span>
                        </div>
                        <p className="text-sm font-bold font-mono text-yellow-500">
                          {fossil.prixAchat} €
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Certificat d'authenticité picture */}
                  {fossil.certificatImage?.url ? (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-3 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block text-center">
                        Certificat d'Authenticité
                      </span>
                      <div
                        onClick={() => {
                          playDinoSound();
                          setExpandedCertUrl(fossil.certificatImage || null);
                        }}
                        className="w-36 h-44 sm:w-40 sm:h-48 rounded-xl overflow-hidden bg-slate-900/90 border border-yellow-700/30 relative group cursor-pointer shadow-lg hover:border-yellow-500/50 transition-all flex items-center justify-center p-1"
                      >
                        <CroppedImage
                          settings={fossil.certificatImage}
                          alt="Certificat d'Authenticité"
                          className="w-full h-full"
                          onClick={() => {
                            playDinoSound();
                            setExpandedCertUrl(fossil.certificatImage || null);
                          }}
                        />
                        <div
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white transition-opacity p-2 text-center pointer-events-none"
                          title="Agrandir le certificat d'authenticité"
                        >
                          <Maximize2 className="w-6 h-6 text-yellow-500" />
                          <span className="text-[10px] font-mono text-yellow-400">Agrandir</span>
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
              ) : (
                <div className="bg-slate-950/30 border border-dashed border-slate-800 p-6 rounded-xl text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    Aucune information de traçabilité n'est encore renseignée pour ce spécimen. Cette rubrique est protégée et n'est pas visible pour les visiteurs.
                  </p>
                  <button
                    onClick={() => {
                      playDinoSound();
                      setIsEditingTraceability(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Remplir la fiche de traçabilité
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* 7. RUBRIQUE : LE SAVIEZ-VOUS ? */}
      {fossil.saviezVousText && (
        <div className="space-y-4 pt-4 sm:pt-8">
          <FossilSectionDivider type="ammonite" />
          <div className="bg-gradient-to-r from-yellow-950/20 to-slate-900/10 border-2 border-yellow-700/20 p-6 sm:p-8 md:p-9 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 font-serif text-9xl text-yellow-500 pointer-events-none italic select-none">
              ?
            </div>

            <div className="flex items-center justify-center border-b border-yellow-700/20 pb-3 mb-5 text-center">
              <h3 className="inline-flex items-center justify-center gap-2 text-base sm:text-lg font-bold font-serif uppercase tracking-wider text-yellow-500 text-center">
                <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Le Saviez-Vous ?</span>
              </h3>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic whitespace-pre-wrap text-center max-w-3xl mx-auto">
                "{fossil.saviezVousText}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOUTON RETOUR À LA SÉLECTION (VISUEL MUSÉUM / CABINET DE CURIOSITÉS) */}
      <div className="flex justify-center pt-6 pb-2">
        <button
          onClick={() => {
            playDinoSound();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {
                console.warn(e);
              }
            }
            onClose();
          }}
          className="group relative inline-flex items-center gap-3.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-2 border-yellow-600/50 hover:border-yellow-400 text-yellow-300 hover:text-white shadow-[0_8px_25px_rgba(0,0,0,0.7),0_0_18px_rgba(202,138,4,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.85),0_0_28px_rgba(250,204,21,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer overflow-hidden"
        >
          {/* Lueur d'ambiance dorée au survol */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/15 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Pastille ornée avec flèche */}
          <span className="p-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-200 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </span>

          {/* Intitulé élégant avec typographie de collection */}
          <span className="font-serif font-bold text-xs sm:text-sm tracking-[0.2em] uppercase text-yellow-200 group-hover:text-yellow-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            Retour à la sélection
          </span>

          {/* Losange ambré précieux à droite */}
          <span className="w-1.5 h-1.5 rotate-45 bg-yellow-400/80 border border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.8)] opacity-70 group-hover:opacity-100 group-hover:scale-125 transition-all duration-200" />
        </button>
      </div>

      {/* EXPANDED CERTIFICATE MODAL */}
      {expandedCertUrl && (
        <div
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 cursor-zoom-out"
          onClick={() => {
            playDinoSound();
            setExpandedCertUrl(null);
          }}
        >
          <div
            className="max-w-4xl max-h-[82vh] relative border-2 border-yellow-700/30 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center p-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                playDinoSound();
                setExpandedCertUrl(null);
              }}
              className="absolute top-3 right-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-full transition-colors z-20"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={resolveImageUrl(expandedCertUrl.url)}
              alt="Certificat d'Authenticité"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[72vh] object-contain rounded select-none"
            />
          </div>
          <div className="text-center mt-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-slate-400">Certificat d'Authenticité Officiel de la Collection</p>
            <button
              onClick={() => {
                playDinoSound();
                setExpandedCertUrl(null);
              }}
              className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 py-2 px-6 rounded-full text-xs font-bold text-white uppercase tracking-wider transition-all mt-2 cursor-pointer"
            >
              Fermer le Visualiseur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
