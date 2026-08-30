import React from 'react';
import { createPortal } from 'react-dom';
import { Fossil, ImageSettings } from '../../types';
import { resolveImageUrl } from '../../utils/imageUrl';

interface FossilPrintTemplateProps {
  fossil: Fossil;
}

// Dedicated printable image renderer that honors exact scale, position offsets and rich black background matching the app
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
    <div className={`relative overflow-hidden rounded bg-black flex items-center justify-center ${className}`}>
      <img
        src={resolved}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`absolute z-10 transition-none ${imgClassName}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `scale(${scale}) translate(${posX}%, ${posY}%)`,
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

export default function FossilPrintTemplate({ fossil }: FossilPrintTemplateProps) {
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

  // Calculate density to adjust font sizes and image heights to perfectly fill standard A4
  const totalLength =
    (fossil.description || '').length +
    (fossil.dietText || '').length +
    (fossil.leFossileText || '').length +
    (fossil.saviezVousText || '').length;

  const isDense = totalLength > 1750;
  const isMedium = totalLength > 1200 && !isDense;

  const textSize = isDense
    ? 'text-[8.5px] leading-[1.28]'
    : isMedium
    ? 'text-[9.2px] leading-[1.34]'
    : 'text-[10px] leading-[1.4]';

  const cardPadding = isDense ? 'p-1.5' : isMedium ? 'p-2' : 'p-2';
  const mainImageHeight = isDense ? 'h-[3.8cm]' : isMedium ? 'h-[4.4cm]' : 'h-[5.0cm]';
  
  // Dedicated larger heights for Scientific Anatomy & Collection Specimen observation
  const morphoImageHeight = isDense ? 'h-[2.7cm]' : isMedium ? 'h-[3.2cm]' : 'h-[3.8cm]';
  const obsSpecimenImageHeight = isDense ? 'h-[2.7cm]' : isMedium ? 'h-[3.2cm]' : 'h-[3.8cm]';
  
  // Secondary heights for other contextual sections (paleoecology & curiosities)
  const contextImageHeight = isDense ? 'h-[1.3cm]' : isMedium ? 'h-[1.5cm]' : 'h-[1.8cm]';

  const datingText =
    fossil.periodeDatation ||
    (fossil.lifespanPeriodStart
      ? fossil.lifespanPeriodEnd
        ? `${fossil.lifespanPeriodStart} - ${fossil.lifespanPeriodEnd}`
        : fossil.lifespanPeriodStart
      : 'Ère géologique documentée');

  const provenanceText = fossil.provenanceName || 'Gisement & Collection Spécialisée';

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
            padding: 6.5mm !important;
            background: #ffffff !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          .bg-black {
            background-color: #000000 !important;
          }
        }
      `}</style>

      {/* Outer Museum Double Frame (Fills full A4) */}
      <div className="w-full h-full border-[2.5px] border-slate-900 outline outline-1 outline-slate-800 outline-offset-2 p-[4.5mm] flex flex-col justify-between relative bg-white box-border font-serif">
        {/* Corner Ornaments */}
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-900 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-900 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-900 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-900 pointer-events-none" />

        {/* 1. TOP HEADER FRAME */}
        <div className="border-2 border-slate-900 p-2.5 text-center bg-slate-50/80 relative shrink-0">
          <div className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-slate-300 pointer-events-none" />
          
          <div className="flex justify-between items-center px-2 mb-1">
            <span className="text-[8px] font-sans font-bold uppercase tracking-[0.25em] text-slate-500">
              Conservatoire Paléontologique
            </span>
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
              Fiche d'Authenticité A4
            </span>
          </div>

          <h1 className="text-2xl font-serif font-black uppercase tracking-wider text-slate-950 leading-tight">
            {fossil.title || 'Fiche Spécimen'}
          </h1>

          {/* Subheader Banner Strip */}
          <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-slate-300 text-[9px] font-sans">
            <div className="bg-white border border-slate-200 px-1.5 py-1 rounded text-center">
              <span className="block text-[7px] uppercase font-bold text-slate-500 tracking-wider">Ère Géologique</span>
              <span className="font-bold text-slate-900 truncate block font-serif">{currentEra}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-1 rounded text-center">
              <span className="block text-[7px] uppercase font-bold text-slate-500 tracking-wider">Chronologie / Âge</span>
              <span className="font-bold text-slate-900 truncate block">{datingText}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-1 rounded text-center">
              <span className="block text-[7px] uppercase font-bold text-slate-500 tracking-wider">Provenance</span>
              <span className="font-bold text-slate-900 truncate block">{provenanceText}</span>
            </div>
            <div className="bg-white border border-slate-200 px-1.5 py-1 rounded text-center">
              <span className="block text-[7px] uppercase font-bold text-slate-500 tracking-wider">Référence Archive</span>
              <span className="font-bold text-slate-900 font-mono text-[9.5px] truncate block">{fossil.reference || 'REF-PALEO-001'}</span>
            </div>
          </div>
        </div>

        {/* 2. CORE CONTENT LAYOUT GRID - 2 COLUMNS (Expands vertically to fill available space) */}
        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-0 items-stretch my-2">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col gap-2.5 justify-between h-full min-h-0">
            
            {/* Card A: Spécimen de Collection & Photographie Principale */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-sm">
              <div className="bg-slate-900 text-white px-2.5 py-1 font-sans text-[8.5px] font-black uppercase tracking-wider border-b border-slate-800 flex justify-between items-center shrink-0">
                <span>📷 Spécimen de la Collection</span>
                <span className="text-[7.5px] font-mono text-amber-300">Archive #{fossil.reference || 'N/A'}</span>
              </div>
              
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-2 min-h-0`}>
                {fossil.image?.url ? (
                  <div className={`border border-slate-800 relative bg-black p-0.5 flex-1 flex items-center justify-center rounded overflow-hidden min-h-0 ${mainImageHeight}`}>
                    <PrintImage settings={fossil.image} alt={fossil.title} className="w-full h-full" />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 p-4 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
                    Photographie archivée au conservatoire
                  </div>
                )}

                {/* Identity Highlights Table */}
                <div className="grid grid-cols-2 gap-1.5 text-[8.5px] bg-slate-50/90 p-1.5 rounded border border-slate-200 shrink-0 font-sans">
                  <div>
                    <span className="block text-[7px] uppercase tracking-wider text-slate-500 font-bold">Gisement</span>
                    <span className="font-semibold text-slate-900 block truncate">{provenanceText}</span>
                  </div>
                  <div>
                    <span className="block text-[7px] uppercase tracking-wider text-slate-500 font-bold">Datation</span>
                    <span className="font-semibold text-slate-900 block truncate">{datingText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Description Morphologique & Scientifique */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-sm">
              <div className="bg-slate-900 text-white px-2.5 py-1 font-sans text-[8.5px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0 flex justify-between items-center">
                <span>🔍 Caractéristiques Scientifiques & Anatomie</span>
                <span className="text-[7px] text-slate-300 uppercase tracking-widest">Morphologie</span>
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-2 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.description || 'Description anatomique et morphologique certifiée par les archives paléontologiques.'}
                </p>
                {fossil.descImages && fossil.descImages.length > 0 && (
                  <div className="flex gap-2 justify-center pt-1 border-t border-slate-200 shrink-0">
                    {fossil.descImages.slice(0, 3).map((img, i) => {
                      const count = Math.min(fossil.descImages!.length, 3);
                      const widthClass = count === 1 ? 'w-full max-w-[85%]' : count === 2 ? 'w-1/2 max-w-[49%]' : 'flex-1 max-w-[32%]';
                      return (
                        <div key={i} className={`border border-slate-800 p-0.5 bg-black rounded ${widthClass} ${morphoImageHeight}`}>
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
          <div className="flex flex-col gap-2.5 justify-between h-full min-h-0">
            
            {/* Card C: Paléoécologie & Mode de Vie */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-sm">
              <div className="bg-slate-900 text-white px-2.5 py-1 font-sans text-[8.5px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0">
                🌿 Paléoécologie & Mode de Vie
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-2 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.dietText || 'Données paléoécologiques, comportementales et trophiques documentées.'}
                </p>
                {fossil.dietImages && fossil.dietImages.length > 0 && (
                  <div className="flex gap-1.5 justify-center pt-1 border-t border-slate-100 shrink-0">
                    {fossil.dietImages.slice(0, 3).map((img, i) => (
                      <div key={i} className={`border border-slate-800 p-0.5 bg-black rounded flex-1 max-w-[32%] ${contextImageHeight}`}>
                        <PrintImage settings={img} alt={`Régime ${i + 1}`} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card D: Observations Particulières du Spécimen */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-sm">
              <div className="bg-slate-900 text-white px-2.5 py-1 font-sans text-[8.5px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0 flex justify-between items-center">
                <span>🔬 Observations du Spécimen de Collection</span>
                <span className="text-[7px] text-amber-300 uppercase tracking-widest">Spécimen Réel</span>
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-2 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap flex-1 overflow-hidden`}>
                  {fossil.leFossileText || 'Spécimen authentique présentant une fossilisation minérale intacte et une préservation remarquable.'}
                </p>
                {fossil.leFossileImage?.url && (
                  <div className={`border border-slate-800 p-0.5 bg-black rounded mx-auto w-full max-w-[95%] shrink-0 ${obsSpecimenImageHeight}`}>
                    <PrintImage settings={fossil.leFossileImage} alt="Observation Spécimen" className="w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Card E: Faits Remarquables / Le Saviez-Vous ? */}
            <div className="border border-slate-800 flex flex-col justify-between bg-white flex-1 min-h-0 relative shadow-sm">
              <div className="bg-slate-900 text-white px-2.5 py-1 font-sans text-[8.5px] font-black uppercase tracking-wider border-b border-slate-800 shrink-0">
                💡 Faits Remarquables & Histoire
              </div>
              <div className={`${cardPadding} flex-1 flex flex-col justify-between gap-2 min-h-0`}>
                <p className={`${textSize} text-slate-900 text-justify whitespace-pre-wrap italic flex-1 overflow-hidden`}>
                  {fossil.saviezVousText || 'Spécimen remarquable témoignant de l’histoire biologique et géologique de notre planète.'}
                </p>
                {fossil.saviezVousImage?.url && (
                  <div className={`border border-slate-800 p-0.5 bg-black rounded mx-auto max-w-[70%] shrink-0 ${contextImageHeight}`}>
                    <PrintImage settings={fossil.saviezVousImage} alt="Curiosité" className="w-full h-full" />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* 3. BOTTOM FOOTER FRAME */}
        <div className="border-t-2 border-slate-900 pt-1.5 mt-1 flex justify-between items-center text-[8px] font-sans text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-widest text-slate-900">Conservatoire de Fossiles</span>
            <span className="text-slate-400">•</span>
            <span>Document de Référence A4</span>
          </div>
          <div className="text-center font-mono text-[7.5px] uppercase text-slate-500">
            Édition Officielle du Conservatoire — © {new Date().getFullYear()}
          </div>
          <div className="font-mono text-[7.5px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold">
            ARCHIVE VALIDÉE
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

