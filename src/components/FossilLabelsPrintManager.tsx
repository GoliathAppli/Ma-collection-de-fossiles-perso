import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Search,
  CheckSquare,
  Square,
  Plus,
  Minus,
  RotateCcw,
  Tag,
  Sliders,
  Eye,
  FileText,
  Image as ImageIcon,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Fossil, ImageSettings } from '../types';
import { resolveImageUrl } from '../utils/imageUrl';
import { playDinoSound } from '../utils/data/audio';

interface FossilLabelsPrintManagerProps {
  fossils: Fossil[];
  onBackToFossils?: () => void;
}

// Helper to extract clean values without any label prefix
function getDatingDisplay(fossil: Fossil): string {
  if (fossil.periodeDatation && fossil.periodeDatation.trim()) {
    return fossil.periodeDatation.trim();
  }
  if (fossil.lifespanPeriodStart && fossil.lifespanPeriodEnd) {
    if (fossil.lifespanPeriodStart === fossil.lifespanPeriodEnd) {
      return fossil.lifespanPeriodStart.trim();
    }
    return `${fossil.lifespanPeriodStart.trim()} - ${fossil.lifespanPeriodEnd.trim()}`;
  }
  if (fossil.lifespanPeriodStart) {
    return fossil.lifespanPeriodStart.trim();
  }
  if (fossil.lifespanPeriodEnd) {
    return fossil.lifespanPeriodEnd.trim();
  }
  return '';
}

function getProvenanceDisplay(fossil: Fossil): string {
  if (fossil.provenanceName && fossil.provenanceName.trim()) {
    return fossil.provenanceName.trim();
  }
  if (fossil.provenanceDate && fossil.provenanceDate.trim()) {
    return fossil.provenanceDate.replace(/[\r\n]+/g, ' • ').trim();
  }
  return '';
}

function getReferenceDisplay(fossil: Fossil): string {
  return fossil.reference?.trim() || '';
}

// Adapt title font size dynamically based on length & word length to ensure full visibility without truncation
function getTitleTypography(title: string): { fontSize: string; lineHeight: string } {
  const clean = title.trim();
  const len = clean.length;
  const words = clean.split(/[\s-]+/);
  const maxWordLen = Math.max(...words.map((w) => w.length), 0);

  if (len <= 16 && maxWordLen <= 10) {
    return { fontSize: '8.4pt', lineHeight: '1.14' };
  }
  if (len <= 24 && maxWordLen <= 12) {
    return { fontSize: '7.5pt', lineHeight: '1.12' };
  }
  if (len <= 32 || maxWordLen > 13) {
    return { fontSize: '6.7pt', lineHeight: '1.12' };
  }
  if (len <= 42) {
    return { fontSize: '6.0pt', lineHeight: '1.10' };
  }
  return { fontSize: '5.5pt', lineHeight: '1.08' };
}

// Adapt provenance and datation font size dynamically to fit entirely in the 70mm x 30mm frame
function getDetailsTypography(
  provenance: string,
  dating: string,
  titleLen: number
): { fontSize: string; lineHeight: string } {
  const provLen = (provenance ? provenance.length : 0) + 13; // with "Provenance : "
  const datLen = (dating ? dating.length : 0) + 11; // with "Datation : "
  const maxFieldLen = Math.max(provLen, datLen);
  const totalChars = provLen + datLen;

  if (maxFieldLen <= 26 && totalChars <= 50 && titleLen <= 22) {
    return { fontSize: '7.2pt', lineHeight: '1.16' };
  }
  if (maxFieldLen <= 34 && totalChars <= 68 && titleLen <= 28) {
    return { fontSize: '6.6pt', lineHeight: '1.14' };
  }
  if (maxFieldLen <= 42 || totalChars <= 80) {
    return { fontSize: '6.0pt', lineHeight: '1.12' };
  }
  if (maxFieldLen <= 52 || totalChars <= 98) {
    return { fontSize: '5.5pt', lineHeight: '1.10' };
  }
  return { fontSize: '5.0pt', lineHeight: '1.08' };
}

// Prominent reference badge sizing
function getReferenceBadgeStyle(ref: string): { fontSize: string; padding: string } {
  const len = ref.trim().length;
  if (len <= 3) {
    return { fontSize: '10.5pt', padding: '1.5px 5px' };
  }
  if (len <= 5) {
    return { fontSize: '9pt', padding: '1px 4px' };
  }
  return { fontSize: '8pt', padding: '1px 3px' };
}

// Single Printable Label (Strict 70mm x 30mm)
interface SingleLabelProps {
  fossil: Fossil;
  borderStyle: 'dashed' | 'solid' | 'none';
  isPreview?: boolean;
}

function SingleLabelCard({ fossil, borderStyle, isPreview = false }: SingleLabelProps) {
  const imageUrl = fossil.image?.url ? resolveImageUrl(fossil.image.url) : '';
  const scale = fossil.image?.scale || 1;
  const posX = fossil.image?.posX || 0;
  const posY = fossil.image?.posY || 0;

  const title = fossil.title || 'Spécimen sans nom';
  const provenance = getProvenanceDisplay(fossil);
  const dating = getDatingDisplay(fossil);
  const reference = getReferenceDisplay(fossil);

  const titleTypo = getTitleTypography(title);
  const detailsTypo = getDetailsTypography(provenance, dating, title.length);
  const refStyle = getReferenceBadgeStyle(reference);

  const borderClass =
    borderStyle === 'dashed'
      ? 'border border-dashed border-slate-400'
      : borderStyle === 'solid'
      ? 'border border-solid border-slate-300'
      : 'border-0';

  return (
    <div
      className={`fossil-label-item bg-white text-slate-900 ${borderClass} flex flex-row items-stretch box-border select-none relative overflow-hidden`}
      style={{
        width: '70mm',
        height: '30mm',
        maxWidth: '70mm',
        maxHeight: '30mm',
        minWidth: '70mm',
        minHeight: '30mm',
        padding: '2mm',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. PHOTO PRINCIPALE A GAUCHE (CADRE ÉTENDU 25.5mm x 26mm EN TRANSPARENCE SUR FOND BLANC) */}
      <div
        className="shrink-0 bg-white flex items-center justify-center relative overflow-hidden rounded-xs"
        style={{
          width: '25.5mm',
          height: '26mm',
          minWidth: '25.5mm',
          maxWidth: '25.5mm',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="sync"
            className="absolute transition-none max-w-none"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) translate(${posX}%, ${posY}%)`,
              top: 0,
              left: 0,
              backgroundColor: '#ffffff',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 border border-slate-200 rounded">
            <ImageIcon className="w-5 h-5 opacity-40" />
          </div>
        )}
      </div>

      {/* 2. BLOC RENSEIGNEMENTS (TITRE, RÉFÉRENCE, PROVENANCE & DATATION AVEC LIBELLÉS EXPLICITES) */}
      <div
        className="flex-1 flex flex-col justify-between pl-2 h-full min-w-0 overflow-hidden"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Haut : Reference mise en grand + Titre adapte sans coupure */}
        <div className="min-w-0">
          {reference && (
            <span
              className="float-right ml-1.5 mb-0.5 inline-flex items-center justify-center font-mono font-black text-white bg-slate-950 border border-slate-900 rounded shadow-xs text-center leading-none select-all"
              style={{
                fontSize: refStyle.fontSize,
                padding: refStyle.padding,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                letterSpacing: '-0.02em',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
              title={`Référence spécimen : ${reference}`}
            >
              {reference}
            </span>
          )}

          <h4
            className="font-serif font-black uppercase text-slate-950 tracking-tight"
            style={{
              fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: titleTypo.fontSize,
              lineHeight: titleTypo.lineHeight,
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {title}
          </h4>
        </div>

        {/* Séparateur horizontal discret pour structurer et habiller l'espace */}
        <div className="w-full border-t border-slate-300/80 my-auto" />

        {/* Bas : Provenance & Datation avec libellés explicites et taille de police dynamique */}
        <div className="flex flex-col justify-end space-y-0.5 min-w-0">
          <p
            className="font-sans text-slate-800 break-words tracking-tight"
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: detailsTypo.fontSize,
              lineHeight: detailsTypo.lineHeight,
            }}
            title={provenance ? `Provenance : ${provenance}` : 'Provenance : indéterminée'}
          >
            <span className="font-bold text-slate-600">Provenance : </span>
            <span className="font-semibold text-slate-900">
              {provenance || <span className="text-slate-400 italic font-normal">indéterminée</span>}
            </span>
          </p>

          <p
            className="font-sans text-slate-950 break-words tracking-tight"
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: detailsTypo.fontSize,
              lineHeight: detailsTypo.lineHeight,
            }}
            title={dating ? `Datation : ${dating}` : 'Datation : indéterminée'}
          >
            <span className="font-bold text-slate-600">Datation : </span>
            <span className="font-black text-slate-950">
              {dating || <span className="text-slate-400 italic font-normal">indéterminée</span>}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Portal rendering the hidden print sheets for window.print()
function PrintableLabelsPortal({
  labels,
  borderStyle,
  columns,
}: {
  labels: Fossil[];
  borderStyle: 'dashed' | 'solid' | 'none';
  columns: 2 | 3;
}) {
  if (!labels.length) return null;

  const labelsPerPage = columns === 3 ? 27 : 18;
  const pages: Fossil[][] = [];
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  return createPortal(
    <div id="fossil-labels-print-root">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm 4mm;
        }

        @media screen {
          #fossil-labels-print-root {
            display: none !important;
          }
        }

        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }

          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            image-rendering: auto !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }

          body > *:not(#fossil-labels-print-root) {
            display: none !important;
            visibility: hidden !important;
          }

          #fossil-labels-print-root {
            display: block !important;
            visibility: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .fossil-label-page {
            width: 202mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 3mm 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            display: grid !important;
            grid-template-columns: ${columns === 3 ? 'repeat(3, 70mm)' : 'repeat(2, 70mm)'} !important;
            grid-auto-rows: 30mm !important;
            gap: ${columns === 3 ? '1.5mm 1mm' : '2mm 4mm'} !important;
            justify-content: center !important;
            align-content: start !important;
          }

          .fossil-label-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .fossil-label-item {
            width: 70mm !important;
            height: 30mm !important;
            max-width: 70mm !important;
            max-height: 30mm !important;
            min-width: 70mm !important;
            min-height: 30mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {pages.map((pageFossils, pageIndex) => (
        <div key={pageIndex} className="fossil-label-page">
          {pageFossils.map((fossil, itemIndex) => (
            <SingleLabelCard
              key={`${pageIndex}-${itemIndex}-${fossil.id}`}
              fossil={fossil}
              borderStyle={borderStyle}
              isPreview={false}
            />
          ))}
        </div>
      ))}
    </div>,
    document.body
  );
}

export default function FossilLabelsPrintManager({
  fossils,
  onBackToFossils,
}: FossilLabelsPrintManagerProps) {
  // Quantities per fossil ID (default 0 or 1)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    fossils.forEach((f) => {
      initial[f.id] = 1; // Default 1 copy each for fast printing
    });
    return initial;
  });

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [eraFilter, setEraFilter] = useState<'all' | 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic'>('all');

  // Print settings
  const [borderStyle, setBorderStyle] = useState<'dashed' | 'solid' | 'none'>('dashed');
  const [columns, setColumns] = useState<2 | 3>(2);
  const [viewMode, setViewMode] = useState<'selection' | 'preview'>('selection');

  // Filtered fossils for the selector
  const filteredFossils = useMemo(() => {
    return fossils.filter((f) => {
      const matchEra = eraFilter === 'all' || f.era === eraFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (f.title || '').toLowerCase().includes(term) ||
        (f.reference || '').toLowerCase().includes(term) ||
        (f.provenanceName || '').toLowerCase().includes(term) ||
        (f.periodeDatation || '').toLowerCase().includes(term);
      return matchEra && matchSearch;
    });
  }, [fossils, eraFilter, searchTerm]);

  // Flattened array of all labels to print (honoring each fossil's quantity)
  const flatLabelsToPrint = useMemo(() => {
    const list: Fossil[] = [];
    fossils.forEach((f) => {
      const count = quantities[f.id] || 0;
      for (let i = 0; i < count; i++) {
        list.push(f);
      }
    });
    return list;
  }, [fossils, quantities]);

  const totalLabels = flatLabelsToPrint.length;
  const labelsPerPage = columns === 3 ? 27 : 18;
  const totalPages = Math.ceil(totalLabels / labelsPerPage) || 1;

  // Handlers for adjusting count
  const setQuantity = (id: string, qty: number) => {
    const safeQty = Math.max(0, Math.min(50, qty));
    setQuantities((prev) => ({ ...prev, [id]: safeQty }));
  };

  const handleSelectAll = (count: number = 1) => {
    playDinoSound();
    const updated: Record<string, number> = { ...quantities };
    filteredFossils.forEach((f) => {
      updated[f.id] = count;
    });
    setQuantities(updated);
  };

  const handleClearAll = () => {
    playDinoSound();
    const updated: Record<string, number> = { ...quantities };
    filteredFossils.forEach((f) => {
      updated[f.id] = 0;
    });
    setQuantities(updated);
  };

  const handleAddOneToAll = () => {
    playDinoSound();
    const updated: Record<string, number> = { ...quantities };
    filteredFossils.forEach((f) => {
      updated[f.id] = (updated[f.id] || 0) + 1;
    });
    setQuantities(updated);
  };

  const handlePrint = () => {
    if (totalLabels === 0) {
      alert('Veuillez sélectionner au moins une étiquette à imprimer.');
      return;
    }
    playDinoSound();
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER CARD & STATS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide font-serif">
                  Impression d'Étiquettes Spécimens (7 cm × 3 cm)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-yellow-950/60 text-yellow-400 border border-yellow-700/50 font-semibold">
                  Format 70 × 30 mm
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Générez et imprimez des étiquettes cartels professionnelles pour vos vitrines et présentoirs.
                Visualisation uniforme : photo détourée à gauche, titre, provenance, datation, et référence à droite.
                Regroupement économique sur feuille A4 (jusqu'à {labelsPerPage} étiquettes par page).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => {
                  playDinoSound();
                  setViewMode('selection');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  viewMode === 'selection'
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Sélection ({filteredFossils.length})
              </button>

              <button
                onClick={() => {
                  playDinoSound();
                  setViewMode('preview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Aperçu Planche ({totalLabels})
              </button>
            </div>

            {/* PRINT TRIGGER BUTTON */}
            <button
              onClick={handlePrint}
              disabled={totalLabels === 0}
              className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg active:scale-95 cursor-pointer ${
                totalLabels > 0
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-yellow-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              Imprimer la planche ({totalLabels})
            </button>
          </div>
        </div>

        {/* QUICK SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Étiquettes sélectionnées</span>
            <span className="text-xl font-bold text-yellow-400">{totalLabels}</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Feuilles A4 requises</span>
            <span className="text-xl font-bold text-white">
              {totalLabels === 0 ? 0 : totalPages} feuille{totalPages > 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Capacité par page</span>
            <span className="text-xl font-bold text-emerald-400">{labelsPerPage} étiquettes / A4</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Dimension stricte</span>
              <span className="text-sm font-bold text-slate-300">7.0 × 3.0 cm</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/40 px-2 py-0.5 rounded">
              Éco-papier
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRINT OPTIONS & LAYOUT BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Quick selection helpers */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-mono text-slate-400 mr-1">Actions :</span>
          <button
            onClick={() => handleSelectAll(1)}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-yellow-500" />
            Tous (1 ex.)
          </button>
          <button
            onClick={() => handleSelectAll(2)}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-yellow-500" />
            Tous (2 ex.)
          </button>
          <button
            onClick={handleAddOneToAll}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            +1 à tous
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Désélectionner tout
          </button>
        </div>

        {/* Right: Layout & Border settings */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          {/* Border style */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono">Repères de découpe :</span>
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setBorderStyle('dashed')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  borderStyle === 'dashed' ? 'bg-yellow-600/30 text-yellow-400 font-bold' : 'text-slate-400'
                }`}
                title="Pointillés discrets pour faciliter la découpe au massicot ou ciseaux"
              >
                Pointillés
              </button>
              <button
                onClick={() => setBorderStyle('solid')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  borderStyle === 'solid' ? 'bg-yellow-600/30 text-yellow-400 font-bold' : 'text-slate-400'
                }`}
                title="Ligne fine continue"
              >
                Continu
              </button>
              <button
                onClick={() => setBorderStyle('none')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  borderStyle === 'none' ? 'bg-yellow-600/30 text-yellow-400 font-bold' : 'text-slate-400'
                }`}
                title="Aucune bordure (pour papier pré-découpé)"
              >
                Aucun
              </button>
            </div>
          </div>

          {/* Columns layout */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono">Disposition :</span>
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setColumns(2)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  columns === 2 ? 'bg-yellow-600/30 text-yellow-400 font-bold' : 'text-slate-400'
                }`}
                title="2 colonnes : 18 étiquettes/page (Marges sécurisées compatibles toutes imprimantes)"
              >
                2 colonnes (18/page)
              </button>
              <button
                onClick={() => setColumns(3)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  columns === 3 ? 'bg-yellow-600/30 text-yellow-400 font-bold' : 'text-slate-400'
                }`}
                title="3 colonnes : 27 étiquettes/page (Densité maximale, pleine largeur A4)"
              >
                3 colonnes (27/page)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: EITHER SELECTION GRID OR LIVE SHEET PREVIEW */}
      {viewMode === 'selection' ? (
        <div className="space-y-4">
          {/* SEARCH & ERA FILTER */}
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer par nom, référence, provenance..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto w-full md:w-auto">
              {(['all', 'precambrian', 'paleozoic', 'mesozoic', 'cenozoic'] as const).map((era) => (
                <button
                  key={era}
                  onClick={() => setEraFilter(era)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider font-semibold transition whitespace-nowrap cursor-pointer ${
                    eraFilter === era
                      ? 'bg-yellow-600 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {era === 'all'
                    ? 'Tous'
                    : era === 'precambrian'
                    ? 'Précambrien'
                    : era === 'paleozoic'
                    ? 'Paléozoïque'
                    : era === 'mesozoic'
                    ? 'Mésozoïque'
                    : 'Cénozoïque'}
                </button>
              ))}
            </div>
          </div>

          {/* FOSSILS SELECTION LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredFossils.map((fossil) => {
              const count = quantities[fossil.id] || 0;
              const imageUrl = fossil.image?.url ? resolveImageUrl(fossil.image.url) : '';
              const provenance = getProvenanceDisplay(fossil);
              const dating = getDatingDisplay(fossil);

              return (
                <div
                  key={fossil.id}
                  className={`bg-slate-900 border rounded-xl p-3 flex items-center justify-between gap-3 transition ${
                    count > 0 ? 'border-yellow-600/50 bg-slate-900/95 shadow-md shadow-yellow-900/10' : 'border-slate-800 opacity-60'
                  }`}
                >
                  {/* Thumbnail & Metadata */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={fossil.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-serif font-bold text-xs uppercase text-white truncate">
                          {fossil.title || 'Spécimen sans nom'}
                        </h4>
                        {fossil.reference && (
                          <span className="shrink-0 font-mono text-[9px] text-yellow-400 bg-yellow-950/60 border border-yellow-700/40 px-1 rounded">
                            {fossil.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {provenance || 'Provenance indéterminée'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {dating || 'Datation indéterminée'}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => setQuantity(fossil.id, count - 1)}
                      disabled={count === 0}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-200 flex items-center justify-center transition cursor-pointer"
                      title="Diminuer le nombre d'exemplaires"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={count}
                      onChange={(e) => setQuantity(fossil.id, parseInt(e.target.value) || 0)}
                      className="w-9 text-center bg-transparent text-xs font-mono font-bold text-yellow-400 focus:outline-none"
                    />

                    <button
                      onClick={() => setQuantity(fossil.id, count + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition cursor-pointer"
                      title="Augmenter le nombre d'exemplaires"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFossils.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              Aucun fossile ne correspond à votre recherche.
            </div>
          )}
        </div>
      ) : (
        /* LIVE SHEET PREVIEW (VISUALISATEUR PLANCHE A4 RÉELLE) */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-yellow-500" />
              <span>
                Aperçu fidèle de la planche A4 ({totalLabels} étiquette{totalLabels > 1 ? 's' : ''} • {totalPages} page{totalPages > 1 ? 's' : ''})
              </span>
            </div>
            <button
              onClick={handlePrint}
              className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Lancer l'impression
            </button>
          </div>

          {totalLabels === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <p>Aucune étiquette n'a été sélectionnée pour le moment.</p>
              <button
                onClick={() => setViewMode('selection')}
                className="text-yellow-400 hover:underline text-xs"
              >
                Retourner à la sélection des spécimens
              </button>
            </div>
          ) : (
            <div className="space-y-8 flex flex-col items-center">
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const pageLabels = flatLabelsToPrint.slice(
                  pageIdx * labelsPerPage,
                  (pageIdx + 1) * labelsPerPage
                );

                return (
                  <div
                    key={pageIdx}
                    className="bg-slate-200 p-4 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-full overflow-x-auto"
                  >
                    <div className="text-center text-[11px] font-mono text-slate-600 mb-3 uppercase tracking-wider">
                      Page {pageIdx + 1} sur {totalPages} (Format standard A4 • {pageLabels.length} étiquettes)
                    </div>

                    {/* Realistic A4 paper simulation */}
                    <div
                      className="bg-white rounded-lg shadow-xl mx-auto flex flex-col justify-start"
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '6mm 4mm',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: columns === 3 ? 'repeat(3, 70mm)' : 'repeat(2, 70mm)',
                          gridAutoRows: '30mm',
                          gap: columns === 3 ? '1.5mm 1mm' : '2mm 4mm',
                          justifyContent: 'center',
                        }}
                      >
                        {pageLabels.map((fossil, itemIdx) => (
                          <SingleLabelCard
                            key={`preview-${pageIdx}-${itemIdx}`}
                            fossil={fossil}
                            borderStyle={borderStyle}
                            isPreview={true}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. HIDDEN PRINTABLE PORTAL FOR NATIVE BROWSER PRINTING */}
      <PrintableLabelsPortal
        labels={flatLabelsToPrint}
        borderStyle={borderStyle}
        columns={columns}
      />
    </div>
  );
}
