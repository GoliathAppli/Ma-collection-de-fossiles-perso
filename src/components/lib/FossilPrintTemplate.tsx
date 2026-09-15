import React from 'react';
import { createPortal } from 'react-dom';
import { Fossil, ImageSettings, TechnicalSheetRow } from '../../types';
import { resolveImageUrl } from '../../utils/imageUrl';

interface FossilPrintTemplateProps {
  fossil: Fossil;
  sheet?: TechnicalSheetRow;
}

// Dedicated printable image renderer that honors exact scale, position offsets and pure white background for transparent PNGs
function PrintImage({
  settings,
  alt,
  className = '',
  imgClassName = '',
}: {
  settings?: ImageSettings;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  if (!settings || !settings.url) return null;

  const resolved = resolveImageUrl(settings.url);
  const scale = settings.scale || 1;
  const posX = settings.posX || 0;
  const posY = settings.posY || 0;

  return (
    <div className={`relative overflow-hidden rounded bg-white flex items-center justify-center ${className}`}>
      <img
        src={resolved}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="sync"
        className={`absolute z-10 transition-none ${imgClassName}`}
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
    </div>
  );
}

export default function FossilPrintTemplate({ fossil, sheet }: FossilPrintTemplateProps) {
  if (!fossil) return null;

  const eraLabels: Record<string, string> = {
    precambrian: 'Ère Précambrien',
    paleozoic: 'Ère Paléozoïque',
    mesozoic: 'Ère Mésozoïque',
    cenozoic: 'Ère Cénozoïque',
  };

  const eraColors: Record<string, { badgeBg: string; text: string }> = {
    precambrian: { badgeBg: 'bg-emerald-950 text-emerald-100', text: 'text-emerald-900' },
    paleozoic: { badgeBg: 'bg-amber-950 text-amber-100', text: 'text-amber-900' },
    mesozoic: { badgeBg: 'bg-orange-950 text-orange-100', text: 'text-orange-900' },
    cenozoic: { badgeBg: 'bg-sky-950 text-sky-100', text: 'text-sky-900' },
  };

  const currentEra = eraLabels[fossil.era] || 'Ère Paléontologique';
  const eraColor = eraColors[fossil.era] || { badgeBg: 'bg-slate-900 text-white', text: 'text-slate-900' };

  // Technical sheet fields with bidirectional fallback
  const effectivePrixAchat = (fossil.prixAchat || sheet?.prixAchat || '').trim();
  const effectiveDateLieuAchat = (fossil.dateLieuAchat || sheet?.dateLieuAchat || '').trim();
  const effectiveProvenance =
    (fossil.provenanceDate || sheet?.provenanceDate || fossil.provenanceName || '').trim() ||
    'Gisement & Collection Spécialisée';
  const effectivePeriod =
    (fossil.periodeDatation || sheet?.periodeDatation || '').trim() ||
    (fossil.lifespanPeriodStart
      ? fossil.lifespanPeriodEnd
        ? `${fossil.lifespanPeriodStart} - ${fossil.lifespanPeriodEnd}`
        : fossil.lifespanPeriodStart
      : 'Ère géologique documentée');

  const effectiveCertImage =
    (fossil.certificatImage?.url
      ? fossil.certificatImage
      : sheet?.certificatImage?.url
      ? sheet.certificatImage
      : null);

  const formattedPrice = effectivePrixAchat
    ? effectivePrixAchat.includes('€') || effectivePrixAchat.includes('$') || effectivePrixAchat.includes('CHF')
      ? effectivePrixAchat
      : `${effectivePrixAchat} €`
    : 'Non renseigné (Coll. Privée)';

  // Calculate density to adjust font sizes and image heights to perfectly fill standard A4 without overflowing
  const totalLength =
    (fossil.description || '').length +
    (fossil.dietText || '').length +
    (fossil.leFossileText || '').length +
    (fossil.saviezVousText || '').length;

  const isDense = totalLength > 1600;
  const isMedium = totalLength > 1100 && !isDense;

  const textSize = isDense
    ? 'text-[7.8px] leading-[1.24]'
    : isMedium
    ? 'text-[8.5px] leading-[1.28]'
    : 'text-[9.2px] leading-[1.34]';

  const cardPadding = isDense ? 'p-1.5' : isMedium ? 'p-1.5' : 'p-2';
  const mainImageHeight = isDense ? 'h-[3.2cm]' : isMedium ? 'h-[3.6cm]' : 'h-[4.0cm]';
  const morphoImageHeight = isDense ? 'h-[2.0cm]' : isMedium ? 'h-[2.3cm]' : 'h-[2.6cm]';
  const obsSpecimenImageHeight = isDense ? 'h-[2.0cm]' : isMedium ? 'h-[2.3cm]' : 'h-[2.6cm]';
  const contextImageHeight = isDense ? 'h-[1.05cm]' : isMedium ? 'h-[1.2cm]' : 'h-[1.35cm]';

  const validDescImages = (fossil.descImages || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
  );
  const validDietImages = (fossil.dietImages || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
  );

  return createPortal(
    <div id="fossil-print-root">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media screen {
          #fossil-print-root {
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
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: hidden !important;
          }

          body > *:not(#fossil-print-root) {
            display: none !important;
            visibility: hidden !important;
          }

          #fossil-print-root {
            display: flex !important;
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: #ffffff !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
        }
      `}</style>

      {/* Outer Museum Double Frame (Fills full A4) */}
      <div className="w-full h-full border-[2px] border-slate-900 outline outline-1 outline-slate-800 outline-offset-1 p-[3.5mm] flex flex-col justify-between relative bg-white box-border font-serif select-none">
        {/* Corner Ornaments */}
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-900 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-900 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-900 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-900 pointer-events-none" />

        {/* 1. TOP HEADER FRAME */}
        <div className="border border-slate-900 p-2 text-center bg-slate-50/80 relative shrink-0">
          <div className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-slate-300 pointer-events-none" />
          
          <div className="flex justify-between items-center px-2 mb-0.5">
            <span className="text-[7.5px] font-sans font-bold uppercase tracking-[0.25em] text-slate-500">
              Conservatoire Paléontologique
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                Archive #{fossil.reference || 'REF-PALEO-001'}
              </span>
              <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Fiche d'Authenticité A4
              </span>
            </div>
          </div>

          <h1 className="text-xl font-serif font-black uppercase tracking-wider text-slate-950 leading-tight break-words [overflow-wrap:anywhere]">
            {fossil.title || 'Fiche Spécimen'}
          </h1>

          {/* Subheader Banner Strip */}
          <div className="grid grid-cols-4 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-300 text-[8.5px] font-sans">
            <div className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-center">
              <span className="block text-[6.5px] uppercase font-bold text-slate-500 tracking-wider">Ère Géologique</span>
              <span className="font-bold text-slate-900 truncate block font-serif">{currentEra}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-center">
              <span className="block text-[6.5px] uppercase font-bold text-slate-500 tracking-wider">Chronologie / Âge</span>
              <span className="font-bold text-slate-900 truncate block">{effectivePeriod}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-center">
              <span className="block text-[6.5px] uppercase font-bold text-slate-500 tracking-wider">Gisement / Découverte</span>
              <span className="font-bold text-slate-900 truncate block">{effectiveProvenance}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-center">
              <span className="block text-[6.5px] uppercase font-bold text-slate-500 tracking-wider">Référence Archive</span>
              <span className="font-bold text-slate-900 font-mono text-[9px] truncate block">{fossil.reference || 'REF-PALEO-001'}</span>
            </div>
          </div>
        </div>

        {/* 2. DEDICATED TECHNICAL SHEET & ACQUISITION REGISTER BANNER */}
        <div className="border border-slate-900 bg-amber-50/40 p-1.5 rounded-sm relative shrink-0 text-slate-900 font-sans mt-1.5 mb-1">
          <div className="flex justify-between items-center mb-1 pb-0.5 border-b border-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="bg-slate-900 text-amber-300 px-1.5 py-0.5 text-[7px] font-mono font-bold uppercase tracking-wider rounded-sm">
                📋 Fiche Technique de Suivi
              </span>
              <span className="text-[7.5px] font-serif font-bold uppercase tracking-wider text-slate-800">
                Registre d'Acquisition & Traçabilité Officielle
              </span>
            </div>
            <span className="text-[7px] font-mono text-slate-500">
              Inventaire #{fossil.reference || fossil.id?.slice(0, 8) || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-1.5 items-center">
            {/* Prix d'Achat (3 cols) */}
            <div className="col-span-3 bg-white border border-amber-300/80 p-1 rounded text-center shadow-xs">
              <span className="block text-[6.5px] uppercase font-bold tracking-wider text-amber-900/80">
                Prix d'Achat Spécimen
              </span>
              <span className="font-mono font-black text-slate-950 text-[11px] block text-amber-950 truncate">
                {effectivePrixAchat ? (
                  formattedPrice
                ) : (
                  <span className="text-slate-400 font-normal italic text-[8px]">Non renseigné</span>
                )}
              </span>
            </div>

            {/* Date & Lieu d'Acquisition (4 cols) */}
            <div className="col-span-4 bg-white border border-slate-200 p-1 rounded shadow-xs">
              <span className="block text-[6.5px] uppercase font-bold tracking-wider text-slate-500">
                Date & Lieu d'Acquisition
              </span>
              <span className="font-semibold text-slate-900 text-[8px] block truncate" title={effectiveDateLieuAchat}>
                {effectiveDateLieuAchat || <span className="text-slate-400 italic">Acquisition certifiée au Conservatoire</span>}
              </span>
            </div>

            {/* Gisement & Découverte (3 cols) */}
            <div className="col-span-3 bg-white border border-slate-200 p-1 rounded shadow-xs">
              <span className="block text-[6.5px] uppercase font-bold tracking-wider text-slate-500">
                Gisement & Découverte
              </span>
              <span className="font-semibold text-slate-900 text-[8px] block truncate" title={effectiveProvenance}>
                {effectiveProvenance}
              </span>
            </div>

            {/* Certificat d'Authenticité (2 cols) */}
            <div className="col-span-2 bg-white border border-slate-200 p-1 rounded flex items-center justify-between gap-1 shadow-xs h-full">
              {effectiveCertImage?.url ? (
                <>
                  <div className="w-7 h-7 border border-slate-300 rounded overflow-hidden bg-slate-50 shrink-0">
                    <PrintImage settings={effectiveCertImage} alt="Certificat" className="w-full h-full" />
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <span className="text-[6.5px] font-bold text-emerald-700 uppercase block leading-tight">
                      ✓ Certifié
                    </span>
                    <span className="text-[6px] text-slate-500 block leading-tight truncate">
                      Doc joint
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-0.5">
                  <span className="text-[6.5px] font-bold text-slate-700 uppercase block leading-tight">
                    Traçabilité
                  </span>
                  <span className="text-[6px] text-slate-400 block leading-tight">
                    Validée
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. CORE CONTENT LAYOUT GRID - 2 COLUMNS (Expands vertically to fill available space) */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 items-stretch my-1">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col gap-2 justify-between h-full min-h-0">
            
            {/* Card A: Spécimen de Collection & Fiche Technique Spécimen */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-xs">
              <div className="bg-slate-900 text-white px-2 py-0.5 font-sans text-[8px] font-black uppercase tracking-wider border-b border-slate-800 flex justify-between items-center shrink-0">
                <span>📷 Spécimen de la Collection</span>
                <span className="text-[7px] font-mono text-amber-300">Archive #{fossil.reference || 'N/A'}</span>
              </div>
              
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-1.5 min-h-0`}>
                {/* Images container (Main fossil + optional certificate preview) */}
                <div className="flex gap-1.5 items-stretch min-h-0">
                  <div className={`border border-slate-300 relative bg-white p-0.5 flex-1 flex items-center justify-center rounded overflow-hidden min-h-0 ${mainImageHeight}`}>
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-slate-300 pointer-events-none" />
                    <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-slate-300 pointer-events-none" />
                    {fossil.image?.url ? (
                      <PrintImage settings={fossil.image} alt={fossil.title} className="w-full h-full" />
                    ) : (
                      <div className="border border-dashed border-slate-300 p-2 text-center text-slate-400 text-[8px] flex-1 flex items-center justify-center">
                        Photographie archivée au conservatoire
                      </div>
                    )}
                  </div>

                  {effectiveCertImage?.url && (
                    <div className={`w-[32%] border border-slate-300 relative bg-slate-50 p-1 flex flex-col items-center justify-between rounded overflow-hidden min-h-0 ${mainImageHeight}`}>
                      <div className="w-full text-center border-b border-slate-200 pb-0.5 shrink-0">
                        <span className="text-[6px] font-bold uppercase tracking-wider text-slate-700 block">Certificat</span>
                      </div>
                      <div className="w-full flex-1 relative overflow-hidden my-0.5">
                        <PrintImage settings={effectiveCertImage} alt="Certificat d'Authenticité" className="w-full h-full" />
                      </div>
                      <span className="text-[5.5px] font-mono font-bold text-emerald-800 uppercase block shrink-0">✓ AUTHENTIFIÉ</span>
                    </div>
                  )}
                </div>

                {/* Technical sheet recap inside Card A */}
                <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50/90 p-1 rounded border border-slate-200 shrink-0 font-sans">
                  <div>
                    <span className="block text-[6.5px] uppercase tracking-wider text-slate-500 font-bold">Gisement</span>
                    <span className="font-semibold text-slate-900 block truncate">{effectiveProvenance}</span>
                  </div>
                  <div>
                    <span className="block text-[6.5px] uppercase tracking-wider text-slate-500 font-bold">Datation</span>
                    <span className="font-semibold text-slate-900 block truncate">{effectivePeriod}</span>
                  </div>
                  <div>
                    <span className="block text-[6.5px] uppercase tracking-wider text-amber-900/80 font-bold">Prix d'Achat</span>
                    <span className="font-mono font-bold text-slate-950 block truncate">{formattedPrice}</span>
                  </div>
                  <div>
                    <span className="block text-[6.5px] uppercase tracking-wider text-slate-500 font-bold">Lieu / Date d'Achat</span>
                    <span className="font-semibold text-slate-900 block truncate" title={effectiveDateLieuAchat}>
                      {effectiveDateLieuAchat || 'Certifié conforme'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Description Morphologique & Scientifique */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-xs">
              <div className="bg-slate-900 text-white px-2 py-0.5 font-sans text-[8px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0 flex justify-between items-center">
                <span>🔍 Caractéristiques Scientifiques & Anatomie</span>
                <span className="text-[7px] text-slate-300 uppercase tracking-widest">Morphologie</span>
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-1.5 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.description || 'Description anatomique et morphologique certifiée par les archives paléontologiques.'}
                </p>
                {validDescImages.length > 0 && (
                  <div className="flex gap-1.5 justify-center pt-1 border-t border-slate-200 shrink-0">
                    {validDescImages.slice(0, 3).map((img, i) => {
                      const count = Math.min(validDescImages.length, 3);
                      const widthClass = count === 1 ? 'w-full max-w-[85%]' : count === 2 ? 'w-1/2 max-w-[49%]' : 'flex-1 max-w-[32%]';
                      return (
                        <div key={i} className={`border border-slate-300 p-0.5 bg-white rounded flex items-center justify-center ${widthClass} ${morphoImageHeight}`}>
                          <PrintImage settings={img} alt={`Morpho ${i + 1}`} className="w-full h-full" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col gap-2 justify-between h-full min-h-0">
            
            {/* Card C: Paléoécologie & Mode de Vie */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-xs">
              <div className="bg-slate-900 text-white px-2 py-0.5 font-sans text-[8px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0">
                🌿 Paléoécologie & Mode de Vie
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-1.5 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.dietText || 'Données paléoécologiques, comportementales et trophiques documentées.'}
                </p>
                {validDietImages.length > 0 && (
                  <div className="flex gap-1.5 justify-center pt-1 border-t border-slate-100 shrink-0">
                    {validDietImages.slice(0, 3).map((img, i) => (
                      <div key={i} className={`border border-slate-300 p-0.5 bg-white rounded flex items-center justify-center flex-1 max-w-[32%] ${contextImageHeight}`}>
                        <PrintImage settings={img} alt={`Régime ${i + 1}`} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card D: Observations Particulières du Spécimen */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-xs">
              <div className="bg-slate-900 text-white px-2 py-0.5 font-sans text-[8px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0 flex justify-between items-center">
                <span>🔬 Observations du Spécimen de Collection</span>
                <span className="text-[7px] text-amber-300 uppercase tracking-widest">Spécimen Réel</span>
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-1.5 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.leFossileText || 'Spécimen authentique présentant une fossilisation minérale intacte et une préservation remarquable.'}
                </p>
                {fossil.leFossileImage?.url && (
                  <div className={`border border-slate-300 p-0.5 bg-white rounded mx-auto w-full max-w-[95%] flex items-center justify-center shrink-0 ${obsSpecimenImageHeight}`}>
                    <PrintImage settings={fossil.leFossileImage} alt="Observation Spécimen" className="w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Card E: Faits Remarquables / Le Saviez-Vous ? */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-xs">
              <div className="bg-slate-900 text-white px-2 py-0.5 font-sans text-[8px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0">
                💡 Faits Remarquables & Histoire
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-1.5 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap italic flex-1 overflow-hidden`}>
                  {fossil.saviezVousText || 'Spécimen remarquable témoignant de l’histoire biologique et géologique de notre planète.'}
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* 4. BOTTOM FOOTER FRAME */}
        <div className="border-t-2 border-slate-900 pt-1 mt-1 flex justify-between items-center text-[7.5px] font-sans text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-widest text-slate-900">Conservatoire Paléontologique</span>
            <span className="text-slate-400">•</span>
            <span>Fiche Technique & d'Authenticité A4</span>
          </div>
          <div className="text-center font-mono text-[7px] uppercase text-slate-500">
            Édition Officielle — © {new Date().getFullYear()}
          </div>
          <div className="font-mono text-[7px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold">
            ARCHIVE & TRAÇABILITÉ VALIDÉES
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

