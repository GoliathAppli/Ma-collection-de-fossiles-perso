import React from 'react';
import { createPortal } from 'react-dom';
import { TechnicalSheetRow, Fossil, ImageSettings } from '../../types';
import { resolveImageUrl } from '../../utils/imageUrl';

export interface TechnicalSheetsPrintOptions {
  orientation: 'landscape' | 'portrait';
  showPrices: boolean;
  showFossilImages: boolean;
  showCertificates: boolean;
  title?: string;
  notes?: string;
}

interface TechnicalSheetsPrintTemplateProps {
  sheets: TechnicalSheetRow[];
  fossils?: Fossil[];
  options: TechnicalSheetsPrintOptions;
  isPrinting?: boolean;
}

// Mini print image that honors scale, offsets and pure white background
function PrintThumb({
  settings,
  alt,
  size = 54,
}: {
  settings?: ImageSettings;
  alt: string;
  size?: number;
}) {
  if (!settings || !settings.url) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 border border-dashed border-slate-300 rounded text-[9px] text-slate-400 italic"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        Sans photo
      </div>
    );
  }

  const resolved = resolveImageUrl(settings.url);
  const scale = settings.scale || 1;
  const posX = settings.posX || 0;
  const posY = settings.posY || 0;

  return (
    <div
      className="relative overflow-hidden rounded border border-slate-300 bg-white flex items-center justify-center shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#ffffff',
      }}
    >
      <img
        src={resolved}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="sync"
        className="absolute z-10"
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

export default function TechnicalSheetsPrintTemplate({
  sheets,
  fossils = [],
  options,
  isPrinting = false,
}: TechnicalSheetsPrintTemplateProps) {
  const {
    orientation = 'landscape',
    showPrices = true,
    showFossilImages = true,
    showCertificates = true,
    title = "REGISTRE & TABLEAU DES FICHES TECHNIQUES DE SUIVI",
    notes = "",
  } = options;

  const totalPrix = sheets.reduce((acc, row) => {
    const val = parseFloat(String(row.prixAchat || '').replace(/[^0-9.]/g, ''));
    return !isNaN(val) ? acc + val : acc;
  }, 0);

  const certificatesCount = sheets.filter(
    (s) => s.certificatImage?.url && s.certificatImage.url.trim() !== ''
  ).length;

  const currentDateStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const isLandscape = orientation === 'landscape';

  const eraNames: Record<string, string> = {
    precambrian: 'Précambrien',
    paleozoic: 'Paléozoïque',
    mesozoic: 'Mésozoïque',
    cenozoic: 'Cénozoïque',
  };

  return createPortal(
    <div id="technical-sheets-print-root">
      <style>{`
        @page {
          size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
          margin: ${isLandscape ? '8mm 10mm 10mm 10mm' : '10mm 10mm 10mm 10mm'};
        }

        @media screen {
          #technical-sheets-print-root {
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

          body > *:not(#technical-sheets-print-root) {
            display: none !important;
            visibility: hidden !important;
          }

          #technical-sheets-print-root {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
          }

          table.tech-sheets-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }

          table.tech-sheets-print-table thead {
            display: table-header-group !important;
          }

          table.tech-sheets-print-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          table.tech-sheets-print-table th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            border: 1px solid #0f172a !important;
            padding: 6px 8px !important;
          }

          table.tech-sheets-print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            vertical-align: middle !important;
          }

          .print-badge {
            display: inline-block !important;
            padding: 1px 6px !important;
            border-radius: 4px !important;
            font-size: 9px !important;
            font-weight: 600 !important;
          }

          .print-badge-amber {
            background-color: #fef3c7 !important;
            color: #92400e !important;
            border: 1px solid #fde68a !important;
          }

          .print-badge-emerald {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border: 1px solid #a7f3d0 !important;
          }

          .print-badge-slate {
            background-color: #f1f5f9 !important;
            color: #475569 !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* DOCUMENT PRINT CONTAINER */}
      <div className="w-full bg-white text-slate-900 p-2">
        {/* HEADER SECTION */}
        <header className="border-b-2 border-amber-600 pb-3 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-700 font-mono">
                CONSERVATOIRE DE FOSSILES • INVENTAIRE PATRIMONIAL OFFICIEL
              </div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 mt-0.5">
                {title}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Registre officiel de traçabilité, datation géologique, acquisition et certificats d'authenticité
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-800">
                Date d'édition : <span className="font-mono text-slate-900">{currentDateStr}</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Total inventorié : <strong className="text-slate-900">{sheets.length}</strong> spécimen{sheets.length > 1 ? 's' : ''}
              </div>
              {showPrices && (
                <div className="text-xs font-bold text-amber-800 mt-0.5">
                  Valeur totale déclarée : <span className="font-mono">{totalPrix.toLocaleString('fr-FR')} €</span>
                </div>
              )}
            </div>
          </div>

          {notes && (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 italic">
              <strong>Note de l'administrateur :</strong> {notes}
            </div>
          )}
        </header>

        {/* RECAP STRIP */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded mb-3 text-[11px]">
          <div className="flex items-center gap-4">
            <span>
              <strong>Fiches enregistrées :</strong> {sheets.length}
            </span>
            <span>
              <strong>Certificats conformes :</strong> {certificatesCount} / {sheets.length}
            </span>
            {showPrices && (
              <span>
                <strong>Montant total :</strong> {totalPrix.toLocaleString('fr-FR')} €
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Document de référence • Collection privée
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <table className="tech-sheets-print-table">
          <thead>
            <tr>
              <th style={{ width: '4%' }} className="text-center">N°</th>
              <th style={{ width: showFossilImages ? '23%' : '20%' }}>Spécimen & Visuel</th>
              <th style={{ width: '20%' }}>Provenance & Découverte</th>
              <th style={{ width: '18%' }}>Période & Datation</th>
              <th style={{ width: '18%' }}>Acquisition (Date & Lieu)</th>
              {showPrices && <th style={{ width: '9%' }} className="text-right">Prix Achat</th>}
              {showCertificates && <th style={{ width: '12%' }} className="text-center">Certificat</th>}
            </tr>
          </thead>
          <tbody>
            {sheets.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + (showPrices ? 1 : 0) + (showCertificates ? 1 : 0)}
                  className="text-center py-8 text-slate-500 italic"
                >
                  Aucune fiche technique répertoriée.
                </td>
              </tr>
            ) : (
              sheets.map((row, index) => {
                const matchedFossil = fossils.find((f) => f.id === row.id);
                const eraLabel = matchedFossil?.era ? eraNames[matchedFossil.era] : null;
                const reference = matchedFossil?.reference;

                return (
                  <tr
                    key={row.id || index}
                    className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                  >
                    {/* 1. N° */}
                    <td className="text-center font-mono font-bold text-slate-600 text-[10px]">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* 2. SPECIMEN & VISUAL */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        {showFossilImages && (
                          <PrintThumb
                            settings={row.fossilImage}
                            alt={row.fossilName || 'Fossile'}
                            size={isLandscape ? 48 : 42}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold uppercase text-slate-900 text-xs">
                            {row.fossilName || 'Spécimen non nommé'}
                          </div>
                          {reference && (
                            <div className="text-[9px] font-mono text-slate-500">
                              Réf. {reference}
                            </div>
                          )}
                          {eraLabel && (
                            <span className="print-badge print-badge-amber text-[8px] mt-0.5">
                              Ère {eraLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. PROVENANCE */}
                    <td>
                      <div className="text-slate-800 text-[11px] leading-tight">
                        {row.provenanceDate ? (
                          <span className="whitespace-pre-line">{row.provenanceDate}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Non renseignée</span>
                        )}
                      </div>
                    </td>

                    {/* 4. PERIODE (DATATION) */}
                    <td>
                      <div className="text-slate-800 text-[11px]">
                        {row.periodeDatation ? (
                          <span className="font-medium">{row.periodeDatation}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Non renseignée</span>
                        )}
                      </div>
                    </td>

                    {/* 5. ACQUISITION */}
                    <td>
                      <div className="text-slate-800 text-[11px]">
                        {row.dateLieuAchat ? (
                          <span>{row.dateLieuAchat}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Non renseigné</span>
                        )}
                      </div>
                    </td>

                    {/* 6. PRIX D'ACHAT */}
                    {showPrices && (
                      <td className="text-right font-mono font-bold text-slate-900 text-[11px]">
                        {row.prixAchat && row.prixAchat.trim() ? (
                          <span>{row.prixAchat}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[10px]">—</span>
                        )}
                      </td>
                    )}

                    {/* 7. CERTIFICAT */}
                    {showCertificates && (
                      <td className="text-center">
                        {row.certificatImage?.url ? (
                          <div className="flex flex-col items-center gap-1">
                            <PrintThumb
                              settings={row.certificatImage}
                              alt="Certificat"
                              size={isLandscape ? 38 : 34}
                            />
                            <span className="print-badge print-badge-emerald text-[8px]">
                              ✓ Conforme
                            </span>
                          </div>
                        ) : (
                          <span className="print-badge print-badge-slate text-[8px]">
                            Non fourni
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* FOOTER & OFFICIAL CERTIFICATION */}
        <footer className="mt-4 pt-3 border-t-2 border-slate-300">
          <div className="flex items-start justify-between gap-6 text-[10px] text-slate-600">
            <div className="max-w-md">
              <p className="font-bold text-slate-800 uppercase text-[10px]">
                Mention de registre patrimonial :
              </p>
              <p className="mt-0.5 leading-snug">
                Ce document constitue l'inventaire exhaustif et authentifié des fiches de suivi technique des spécimens paléontologiques répertoriés. Tout élément référencé fait foi d'appartenance et de traçabilité.
              </p>
            </div>

            <div className="text-right border border-slate-300 rounded p-2.5 min-w-[240px] bg-slate-50">
              <div className="font-bold text-slate-900 uppercase text-[10px]">
                Visa & Cachet du Conservateur
              </div>
              <div className="text-[9px] text-slate-500 mt-1">
                Fait le {currentDateStr}
              </div>
              <div className="h-9 border-b border-dashed border-slate-400 mt-2"></div>
              <div className="text-[8px] text-slate-400 mt-1 italic">
                Signature autorisée
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
