import React, { useState } from 'react';
import { Fossil, ImageSettings } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { resolveImageUrl } from '../utils/imageUrl';
import CroppedImage from './CroppedImage';
import InteractiveMap from './InteractiveMap';
import GeologicTimelineView from './GeologicTimelineView';
import FossilPrintTemplate from './lib/FossilPrintTemplate';
import { getAdaptiveTitleClasses } from '../utils/titleUtils';
import {
  MicrobeIcon,
  TrilobiteIcon,
  AmmoniteIcon,
  MammothIcon
} from '../utils/data/PeriodIcons';
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
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface FossilDetailSheetProps {
  fossil: Fossil;
  isAdmin: boolean;
  onClose: () => void;
  onEdit?: (fossil: Fossil) => void;
  onDelete?: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onNavigateToEra?: (era: string) => void;
}

export default function FossilDetailSheet({
  fossil,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onNavigateToEra
}: FossilDetailSheetProps) {
  const [expandedCertUrl, setExpandedCertUrl] = useState<ImageSettings | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const getEraBadgeInfo = (era: string) => {
    const cleanEra = (era || '').toLowerCase().replace('é', 'e');
    if (cleanEra === 'precambrien' || cleanEra === 'precambrian') {
      return {
        label: 'Précambrien',
        eraKey: 'era_precambrian',
        colorClass: 'bg-amber-950/50 text-amber-400 border-amber-600/40',
        Icon: MicrobeIcon
      };
    }
    if (cleanEra === 'paleozoique' || cleanEra === 'paleozoic') {
      return {
        label: 'Paléozoïque',
        eraKey: 'era_paleozoic',
        colorClass: 'bg-sky-950/50 text-sky-400 border-sky-600/40',
        Icon: TrilobiteIcon
      };
    }
    if (cleanEra === 'mesozoique' || cleanEra === 'mesozoic') {
      return {
        label: 'Mésozoïque',
        eraKey: 'era_mesozoic',
        colorClass: 'bg-emerald-950/50 text-emerald-400 border-emerald-600/40',
        Icon: AmmoniteIcon
      };
    }
    return {
      label: 'Cénozoïque',
      eraKey: 'era_cenozoic',
      colorClass: 'bg-purple-950/50 text-purple-400 border-purple-600/40',
      Icon: MammothIcon
    };
  };

  const eraInfo = getEraBadgeInfo(fossil.era);
  const EraIcon = eraInfo.Icon;

  const handleCopyRef = () => {
    if (!fossil.reference) return;
    try {
      navigator.clipboard.writeText(fossil.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy warning:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-950/95 border border-yellow-700/30 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 sm:space-y-8 animate-fade-in relative text-slate-100">
      {/* Printable sheet template - only rendered for administrator */}
      {isAdmin && <FossilPrintTemplate fossil={fossil} />}

      {/* TOP BAR WITH PREV/NEXT, ACTION BUTTONS AND CLOSE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-4">
        {/* Navigation Prev/Next if available */}
        <div className="flex items-center gap-2">
          {onPrev && (
            <button
              onClick={() => {
                playDinoSound();
                onPrev();
              }}
              disabled={!hasPrev}
              className={`flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                hasPrev ? 'text-slate-300 hover:text-white hover:border-yellow-600/40 cursor-pointer' : 'text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
              title="Spécimen précédent"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Précédent
            </button>
          )}
          {onNext && (
            <button
              onClick={() => {
                playDinoSound();
                onNext();
              }}
              disabled={!hasNext}
              className={`flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                hasNext ? 'text-slate-300 hover:text-white hover:border-yellow-600/40 cursor-pointer' : 'text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
              title="Spécimen suivant"
            >
              Suivant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Era badge */}
          <div
            onClick={() => {
              if (onNavigateToEra) {
                playDinoSound();
                onNavigateToEra(eraInfo.eraKey);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-bold uppercase tracking-wider border ${eraInfo.colorClass} ${
              onNavigateToEra ? 'cursor-pointer hover:scale-105 transition-transform' : ''
            }`}
            title={onNavigateToEra ? `Voir toute la période ${eraInfo.label}` : eraInfo.label}
          >
            <EraIcon className="w-4 h-4" />
            <span>{eraInfo.label}</span>
            {onNavigateToEra && <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />}
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          {/* Admin Edit */}
          {isAdmin && onEdit && (
            <button
              onClick={() => {
                playDinoSound();
                onEdit(fossil);
              }}
              className="bg-yellow-950/60 border border-yellow-700/40 hover:bg-yellow-900/60 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Modifier ce fossile"
            >
              <Edit3 className="w-3.5 h-3.5" /> Modifier
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
              className="bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900/60 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Supprimer ce fossile"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          )}

          {/* Print in Admin */}
          {isAdmin && (
            <button
              onClick={() => {
                playDinoSound();
                window.print();
              }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-all font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer"
              title="Imprimer la fiche (Mode Administrateur)"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-500" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={() => {
              playDinoSound();
              onClose();
            }}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            title="Fermer la fiche (Échap)"
          >
            <span>Fermer</span>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 1. HEADER TITLE ZONE */}
      <div className="text-center space-y-2 px-2 max-w-full">
        <span className="text-[10px] font-mono text-yellow-500 tracking-widest uppercase block">
          FICHE SPÉCIMEN DU CONSERVATOIRE
        </span>
        <h1 className={`${getAdaptiveTitleClasses(fossil.title || '')} font-extrabold tracking-tight text-white font-serif uppercase text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] break-words [overflow-wrap:anywhere] hyphens-auto leading-tight`}>
          {fossil.title || 'Spécimen sans nom'}
        </h1>
        {fossil.lifespanPeriodStart && (
          <p className="text-xs sm:text-sm font-mono text-slate-400 italic">
            Période : {fossil.lifespanPeriodStart} {fossil.lifespanPeriodEnd ? `➔ ${fossil.lifespanPeriodEnd}` : ''}
          </p>
        )}
      </div>

      {/* 2. MAIN SPECIMEN IMAGE (LARGE CROPPED PNG) */}
      <div className="relative h-72 sm:h-96 max-w-xl mx-auto rounded-2xl flex items-center justify-center bg-transparent overflow-hidden">
        <CroppedImage
          settings={fossil.image}
          alt={fossil.title}
          className="w-full h-full relative z-10"
        />
      </div>

      {/* 3. REFERENCE CADRE */}
      {fossil.reference && (
        <div className="flex justify-center">
          <div className="bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-xl text-center max-w-sm flex items-center gap-3 shadow-lg">
            <div className="text-left flex-1">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                RÉFÉRENCE DE LA FICHE
              </span>
              <span className="text-base font-mono text-yellow-400 font-bold tracking-wider">
                {fossil.reference}
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copier la référence"
            >
              {copiedRef ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. SCIENTIFIC DESCRIPTION */}
      {(fossil.description || (fossil.descImages && fossil.descImages.length > 0)) && (
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
              Description Scientifique
            </h3>
          </div>

          {fossil.description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
              {fossil.description}
            </p>
          )}

          {/* Up to 6 horizontal images */}
          {fossil.descImages && fossil.descImages.length > 0 && (
            <div className="overflow-x-auto py-2 scrollbar-none">
              <div className="flex gap-3 justify-center min-w-max md:justify-start">
                {fossil.descImages.map((img, i) => (
                  <div key={i} className="w-32 h-32 rounded-lg bg-transparent overflow-hidden relative flex-none border border-slate-800/60">
                    <CroppedImage settings={img} alt={`Description photo ${i + 1}`} className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4.5. ALIMENTATION */}
      {(fossil.dietText || (fossil.dietImages && fossil.dietImages.length > 0)) && (
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <span className="text-lg">🍖</span>
            <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
              Régime Alimentaire
            </h3>
          </div>

          {fossil.dietText && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans text-center md:text-left whitespace-pre-wrap">
              {fossil.dietText}
            </p>
          )}

          {fossil.dietImages && fossil.dietImages.length > 0 && (
            <div className="overflow-x-auto py-2 scrollbar-none">
              <div className="flex gap-3 justify-center min-w-max md:justify-start">
                {fossil.dietImages.map((img, i) => (
                  <div key={i} className="w-32 h-32 rounded-lg bg-transparent overflow-hidden relative flex-none border border-slate-800/60">
                    <CroppedImage settings={img} alt={`Alimentation photo ${i + 1}`} className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. LE FOSSILE : TEXTE + PHOTO + PROVENANCE CARTE + ECHELLE GÉOLOGIQUE */}
      <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
            Le Spécimen & Géolocalisation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            {fossil.leFossileText && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {fossil.leFossileText}
              </p>
            )}

            {fossil.leFossileImage?.url && (
              <div className="h-48 rounded-xl overflow-hidden bg-transparent flex items-center justify-center border border-slate-800/60">
                <CroppedImage settings={fossil.leFossileImage} alt="Details fossile" className="w-full h-full" />
              </div>
            )}
          </div>

          {/* Map */}
          <div className="space-y-4">
            <InteractiveMap
              coords={fossil.provenanceCoords}
              locationName={fossil.provenanceName}
              readOnly={true}
            />
          </div>
        </div>

        {/* Timeline */}
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

      {/* 6. FICHE TECHNIQUE D'AUTHENTICITÉ ET TRAÇABILITÉ */}
      {(fossil.provenanceDate || fossil.periodeDatation || fossil.dateLieuAchat || fossil.prixAchat || fossil.certificatImage?.url) && (
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold font-serif uppercase tracking-wider text-white">
              Fiche Technique d'Authenticité & Traçabilité
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Certificate thumbnail */}
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
                    title="Agrandir le certificat"
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
        </div>
      )}

      {/* 7. LE SAVIEZ-VOUS ? */}
      {(fossil.saviezVousText || fossil.saviezVousImage?.url) && (
        <div className="bg-gradient-to-r from-yellow-950/20 to-slate-900/10 border-2 border-yellow-700/10 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-serif text-9xl text-yellow-500 pointer-events-none italic select-none">
            ?
          </div>

          <div className="flex items-center gap-2 border-b border-yellow-700/10 pb-2 mb-4">
            <span className="text-lg">💡</span>
            <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-yellow-500">
              Le Saviez-Vous ?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {fossil.saviezVousImage?.url && (
              <div className="md:col-span-1.5 h-32 rounded-lg bg-transparent relative overflow-hidden border border-slate-800/60">
                <CroppedImage settings={fossil.saviezVousImage} alt="Le saviez vous anecdote" className="w-full h-full" />
              </div>
            )}

            <div className={fossil.saviezVousImage?.url ? 'md:col-span-3.5' : 'md:col-span-5'}>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic whitespace-pre-wrap">
                "{fossil.saviezVousText}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER CLOSE BUTTON */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => {
            playDinoSound();
            onClose();
          }}
          className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-bold text-xs uppercase px-8 py-3 rounded-full transition-all tracking-wider shadow-lg shadow-yellow-900/20 cursor-pointer"
        >
          Fermer la Fiche & Revenir à la Galerie
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
