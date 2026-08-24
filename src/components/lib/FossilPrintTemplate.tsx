import React from 'react';
import { createPortal } from 'react-dom';
import { Fossil } from '../../types';
import { resolveImageUrl } from '../../utils/imageUrl';

export default function FossilPrintTemplate({ fossil }: { fossil: Fossil }) {
  if (!fossil) return null;

  const eraMap = {
    precambrian: "Ère Précambrien",
    paleozoic: "Ère Paléozoïque",
    mesozoic: "Ère Mésozoïque",
    cenozoic: "Ère Cénozoïque"
  };

  // Determine total character count to dynamically optimize font and element sizing
  const totalLength = 
    (fossil.description || "").length + 
    (fossil.dietText || "").length + 
    (fossil.leFossileText || "").length + 
    (fossil.saviezVousText || "").length;

  // Sizing systems
  const textSizeClass = totalLength > 1200 ? 'text-[9.5px] leading-snug' : totalLength > 700 ? 'text-[10.5px] leading-relaxed' : 'text-[11.5px] leading-relaxed';
  const mainImgHeight = totalLength > 1200 ? 'h-[3.8cm]' : totalLength > 700 ? 'h-[5cm]' : 'h-[6.5cm]';
  const secondaryImgHeight = totalLength > 1200 ? 'h-[1.4cm]' : totalLength > 700 ? 'h-[1.8cm]' : 'h-[2.2cm]';
  const paddingClass = totalLength > 1200 ? 'p-2' : 'p-3';
  const gridGapClass = totalLength > 1200 ? 'gap-3' : 'gap-4';

  return createPortal(
    <div className="hidden print:flex bg-white text-black font-serif fixed top-0 left-0 w-[210mm] min-h-[297mm] z-[9999px] justify-center" style={{ margin: 0, padding: 0 }}>
      <style>{"@media print { body, html { margin: 0 !important; padding: 0 !important; background: white !important; } body * { visibility: hidden; } .print-section, .print-section * { visibility: visible; } .print-section { position: absolute; left: 0; top: 0; width: 100%; background: white !important; } .print-image-container img { mix-blend-mode: multiply; filter: grayscale(100%) contrast(1.15); } @page { size: A4; margin: 0; } }"}</style>
      
      <div className="print-section bg-white m-0 box-border w-[210mm] h-[297mm] p-[10mm] flex flex-col justify-between">
        {/* Outer Museum Double Frame */}
        <div className="border-[3px] border-slate-900 p-[6mm] outline outline-1 outline-slate-600 outline-offset-4 flex-1 flex flex-col relative h-full justify-between bg-white">
          
          {/* Corner Ornaments */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-slate-900"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-slate-900"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-slate-900"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-slate-900"></div>

          {/* Section 1: Top Header Frame */}
          <div className="border-2 border-slate-800 p-2.5 text-center mb-4 bg-slate-50 relative">
            <div className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-slate-300 pointer-events-none"></div>
            <h1 className="text-3xl font-serif font-black uppercase tracking-widest text-slate-900">
              {fossil.title || 'Fiche Spécimen'}
            </h1>
            <div className="flex justify-center items-center gap-4 mt-1">
              <span className="w-16 h-[1px] bg-slate-400"></span>
              <p className="text-xs font-serif font-bold uppercase tracking-[0.25em] text-slate-700">
                {eraMap[fossil.era] || 'Ère inconnue'}
              </p>
              <span className="w-16 h-[1px] bg-slate-400"></span>
            </div>
          </div>

          {/* Core Content Layout Grid - 2 Columns */}
          <div className={`grid grid-cols-2 ${gridGapClass} flex-1 items-stretch`}>
            
            {/* Column 1 */}
            <div className={`flex flex-col ${gridGapClass} justify-between`}>
              
              {/* Card A: Fiche d'Identité & Photo Principale */}
              <div className="border border-slate-800 flex flex-col justify-between bg-white h-full relative">
                <div className="bg-slate-900 text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                  📂 Identité du Spécimen
                </div>
                <div className={`${paddingClass} flex-1 flex flex-col justify-between gap-3`}>
                  {fossil.image?.url && (
                    <div className={`border border-slate-200 ${paddingClass} print-image-container relative bg-slate-50 flex items-center justify-center`}>
                      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-slate-400"></div>
                      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-slate-400"></div>
                      <img 
                        src={resolveImageUrl(fossil.image.url)} 
                        alt={fossil.title} 
                        className={`w-full ${mainImgHeight} object-contain`} 
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-bold font-sans">Référence d'Archive</span>
                      <span className="font-bold text-slate-800 font-mono text-xs">{fossil.reference || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-bold font-sans">Chronologie</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {fossil.periodeDatation || (fossil.lifespanPeriodStart ? (fossil.lifespanPeriodEnd ? `${fossil.lifespanPeriodStart} - ${fossil.lifespanPeriodEnd}` : fossil.lifespanPeriodStart) : 'Inconnue')}
                      </span>
                    </div>
                    {fossil.provenanceName && (
                      <div className="col-span-2 border-t border-slate-200 pt-1 mt-0.5">
                        <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-bold font-sans">Origine du Gisement</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{fossil.provenanceName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card B: Description Morphologique */}
              {fossil.description && (
                <div className="border border-slate-800 flex flex-col justify-between bg-white h-full relative">
                  <div className="bg-slate-900 text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                    🔍 Caractéristiques Morphologiques
                  </div>
                  <div className={`${paddingClass} flex-1 flex flex-col justify-between gap-2`}>
                    <p className={`${textSizeClass} text-slate-800 text-justify whitespace-pre-wrap`}>
                      {fossil.description}
                    </p>
                    {fossil.descImages && fossil.descImages.length > 0 && (
                      <div className="flex gap-2 justify-center mt-1 print-image-container">
                        {fossil.descImages.slice(0, 2).map((img, i) => (
                          <div key={i} className="border border-slate-200 p-1 bg-slate-50">
                            <img src={resolveImageUrl(img.url)} className={`${secondaryImgHeight} object-contain`} alt={`Morpho ${i}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Column 2 */}
            <div className={`flex flex-col ${gridGapClass} justify-between`}>
              
              {/* Card C: Paléoécologie */}
              {(fossil.dietText || (fossil.dietImages && fossil.dietImages.length > 0)) && (
                <div className="border border-slate-800 flex flex-col bg-white h-full relative">
                  <div className="bg-slate-900 text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                    🌿 Paléoécologie & Mode de Vie
                  </div>
                  <div className={`${paddingClass} flex-1 flex flex-col justify-between gap-2`}>
                    <p className={`${textSizeClass} text-slate-800 text-justify whitespace-pre-wrap`}>
                      {fossil.dietText || 'Données paléoécologiques non documentées.'}
                    </p>
                    {fossil.dietImages && fossil.dietImages.length > 0 && (
                      <div className="flex gap-2 justify-center mt-1 print-image-container">
                        {fossil.dietImages.slice(0, 2).map((img, i) => (
                          <div key={i} className="border border-slate-200 p-1 bg-slate-50">
                            <img src={resolveImageUrl(img.url)} className={`${secondaryImgHeight} object-contain`} alt={`Alimentation ${i}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card D: Observations Annexes */}
              {(fossil.leFossileText || fossil.leFossileImage?.url) && (
                <div className="border border-slate-800 flex flex-col bg-white h-full relative">
                  <div className="bg-slate-900 text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                    🔬 Observations du Spécimen de Collection
                  </div>
                  <div className={`${paddingClass} flex-1 flex flex-col justify-between gap-2`}>
                    <p className={`${textSizeClass} text-slate-800 text-justify whitespace-pre-wrap`}>
                      {fossil.leFossileText || 'Aucune observation supplémentaire enregistrée.'}
                    </p>
                    {fossil.leFossileImage?.url && (
                      <div className="border border-slate-200 p-1.5 bg-slate-50 flex items-center justify-center max-w-[80%] mx-auto print-image-container">
                        <img src={resolveImageUrl(fossil.leFossileImage.url)} alt="Le fossile" className={`${secondaryImgHeight} object-contain`} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card E: Curiosités & Anecdotes */}
              {(fossil.saviezVousText || fossil.saviezVousImage?.url) && (
                <div className="border border-slate-800 flex flex-col bg-white h-full relative">
                  <div className="bg-slate-900 text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                    💡 Curiosités & Faits Fascinants
                  </div>
                  <div className={`${paddingClass} flex-1 flex flex-col justify-between gap-2`}>
                    <p className={`${textSizeClass} text-slate-800 text-justify whitespace-pre-wrap italic`}>
                      {fossil.saviezVousText || 'Aucune anecdote répertoriée pour ce spécimen.'}
                    </p>
                    {fossil.saviezVousImage?.url && (
                      <div className="border border-slate-200 p-1.5 bg-slate-50 flex items-center justify-center max-w-[80%] mx-auto print-image-container">
                        <img src={resolveImageUrl(fossil.saviezVousImage.url)} alt="Le saviez-vous" className={`${secondaryImgHeight} object-contain`} />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Footer Card Info */}
          <div className="mt-4 text-center pt-2 border-t border-slate-300">
            <p className="text-[8px] text-slate-500 font-sans tracking-[0.25em] uppercase">
              Document des Archives Paléontologiques & Muséographiques — © Conservatoire Personnel {new Date().getFullYear()}
            </p>
          </div>
          
        </div>
      </div>
    </div>,
    document.body
  );
}
