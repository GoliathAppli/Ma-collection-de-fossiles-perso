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
import {
  Printer,
  BookOpen,
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
  Image as ImageIcon
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

  return (
    <div
      ref={sheetContainerRef}
      className="max-w-4xl mx-auto bg-slate-950/95 border border-yellow-700/20 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 sm:space-y-8 animate-fade-in relative text-slate-100"
    >
      {/* Printable sheet template - only rendered for administrator */}
      {isAdmin && <FossilPrintTemplate fossil={fossil} />}

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

      {/* 1. UNE ZONE TITRE EN GRAND */}
      <div className="text-center space-y-1.5 pt-6 sm:pt-2 px-2 max-w-full">
        <span className="text-[10px] font-mono text-yellow-500 tracking-wider block">SPÉCIMEN AUTHENTIQUE</span>
        <h1 className={`${getAdaptiveTitleClasses(fossil.title || '')} font-extrabold tracking-tight text-white font-serif uppercase text-center break-words [overflow-wrap:anywhere] hyphens-auto leading-tight`}>
          {fossil.title || 'Spécimen sans nom'}
        </h1>
      </div>

      {/* 2. ZONE D'IMAGE PRINCIPALE TRÈS GRAND (TRANSPARENTE PNG) */}
      <div className="relative h-96 max-w-xl mx-auto rounded-xl flex items-center justify-center bg-transparent overflow-hidden">
        <div className="absolute inset-0 bg-transparent" />
        <CroppedImage settings={fossil.image} alt={fossil.title} className="w-full h-full relative z-10" />
      </div>

      {/* 3. PETIT CADRE POUR AJOUTER UNE REFERENCE */}
      {fossil.reference && (
        <div className="flex justify-center">
          <div className="bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-lg text-center max-w-xs">
            <span className="text-[10.5px] font-mono tracking-widest text-slate-400 uppercase block mb-0.5">RÉFÉRENCE DE COLLECTION</span>
            <span className="text-sm font-mono text-yellow-500 font-bold">{fossil.reference}</span>
          </div>
        </div>
      )}

      {/* GUIDE AUDIO VOCAL (WEB SPEECH API NATIVE, 100% HORS-LIGNE) */}
      <FossilAudioGuide fossil={fossil} />

      {/* 4. RUBRIQUE DESCRIPTION : TEXTE + JUSQU'À 6 IMAGES LES UNES À CÔTÉ DES AUTRES SUR LA MÊME LIGNE */}
      {(fossil.description || (fossil.descImages && fossil.descImages.length > 0)) && (
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center gap-2 border-b border-slate-850 pb-2 text-center">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Description Scientifique</h3>
          </div>

          {fossil.description && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
              {fossil.description}
            </p>
          )}

          {/* 6 images horizontally next to each other on a line */}
          {fossil.descImages && fossil.descImages.length > 0 && (
            <div className="overflow-x-auto py-2 scrollbar-none">
              <div className="flex gap-3 justify-center min-w-max md:justify-start">
                {fossil.descImages.map((img, i) => (
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
      {(fossil.dietText || (fossil.dietImages && fossil.dietImages.length > 0)) && (
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center gap-2 border-b border-slate-850 pb-2 text-center">
            <span className="text-lg">🍖</span>
            <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Alimentation</h3>
          </div>

          {fossil.dietText && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
              {fossil.dietText}
            </p>
          )}

          {fossil.dietImages && fossil.dietImages.length > 0 && (
            <div className="overflow-x-auto py-2 scrollbar-none">
              <div className="flex gap-3 justify-center min-w-max md:justify-start">
                {fossil.dietImages.map((img, i) => (
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
        <div className="flex items-center justify-center gap-2 border-b border-slate-850 pb-2 text-center">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">Le Fossile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            {fossil.leFossileText && (
              <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {fossil.leFossileText}
              </p>
            )}

            {fossil.leFossileImage?.url && (
              <div className="h-48 rounded-xl overflow-hidden bg-transparent flex items-center justify-center">
                <CroppedImage settings={fossil.leFossileImage} alt="Details fossile" className="w-full h-full" />
              </div>
            )}
          </div>

          {/* Geographical Provenance and interactive indicator */}
          <div className="space-y-4">
            <InteractiveMap
              key={fossil.id}
              coords={fossil.provenanceCoords}
              locationName={fossil.provenanceName || fossil.provenanceDate || "Inconnue"}
              readOnly={true}
            />
          </div>
        </div>

        {/* ECHELLE DES TEMPS HIGHLIGHTED TIMELINE (INDICATES SPECIES EXISTENCE SPAN) */}
        {(fossil.lifespanPeriodStart || fossil.lifespanPeriodEnd) && (
          <div className="border border-slate-850 rounded-xl p-4 mt-4 bg-slate-950/40">
            <GeologicTimelineView
              readOnly={true}
              highlightedStart={fossil.lifespanPeriodStart}
              highlightedEnd={fossil.lifespanPeriodEnd}
            />
          </div>
        )}
      </div>

      {/* 6. RUBRIQUE : FICHE TECHNIQUE D'AUTHENTICITÉ ET DE TRAÇABILITÉ (ADMIN UNIQUEMENT - INVISIBLE VISITEURS) */}
      {isAdmin && (
        <div className="bg-slate-900/40 border border-yellow-700/30 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
                  Fiche Technique d'Authenticité & Traçabilité
                </h3>
                <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3 text-yellow-400" /> Réservé Administrateur — Invisible pour les visiteurs
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                playDinoSound();
                setIsEditingTraceability(!isEditingTraceability);
              }}
              className="self-start sm:self-auto text-xs bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-yellow-700/40 hover:border-yellow-500/60 px-3.5 py-1.5 rounded-xl font-mono flex items-center gap-1.5 transition cursor-pointer"
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
      )}

      {/* 7. RUBRIQUE : LE SAVIEZ-VOUS ? */}
      {fossil.saviezVousText && (
        <div className="bg-gradient-to-r from-yellow-950/20 to-slate-900/10 border-2 border-yellow-700/10 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-serif text-9xl text-yellow-500 pointer-events-none italic select-none">
            ?
          </div>

          <div className="flex items-center justify-center gap-2 border-b border-yellow-700/10 pb-2 mb-4 text-center">
            <span className="text-lg">💡</span>
            <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-yellow-500">Le Saviez-Vous ?</h3>
          </div>

          <div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic whitespace-pre-wrap">
              "{fossil.saviezVousText}"
            </p>
          </div>
        </div>
      )}

      {/* Navigation helpers close */}
      <div className="flex justify-center pt-2">
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
          className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-bold text-xs uppercase px-7 py-3 rounded-full transition-all tracking-wider cursor-pointer"
        >
          Retour à la sélection
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
