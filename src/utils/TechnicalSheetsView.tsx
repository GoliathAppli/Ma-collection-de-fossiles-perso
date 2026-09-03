import React, { useState } from 'react';
import { TechnicalSheetRow, ImageSettings } from '../types';
import { playDinoSound } from './data/audio';
import { Plus, Trash2, Maximize2, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import CroppedImage from '../components/CroppedImage';
import ImageAdjuster from './data/ImageAdjuster';
import { resolveImageUrl } from './imageUrl';

interface TechnicalSheetsViewProps {
  isAdmin: boolean;
  sheets: TechnicalSheetRow[];
  onSaveSheets: (updated: TechnicalSheetRow[]) => void;
}

interface TechnicalSheetRowComponentProps {
  row: TechnicalSheetRow;
  isAdmin: boolean;
  onUpdateRow: (id: string, updatedFields: Partial<TechnicalSheetRow>) => void;
  onRemoveRow: (id: string) => void;
  activeAdustImage: { rowId: string; field: 'fossilImage' | 'certificatImage' } | null;
  setActiveAdjustImage: (val: { rowId: string; field: 'fossilImage' | 'certificatImage' } | null) => void;
  setExpandedCertUrl: (val: ImageSettings | null) => void;
}

function TechnicalSheetRowComponent({
  row,
  isAdmin,
  onUpdateRow,
  onRemoveRow,
  activeAdustImage,
  setActiveAdjustImage,
  setExpandedCertUrl,
}: TechnicalSheetRowComponentProps) {
  const [fossilName, setFossilName] = useState(row.fossilName || '');
  const [provenanceDate, setProvenanceDate] = useState(row.provenanceDate || '');
  const [periodeDatation, setPeriodeDatation] = useState(row.periodeDatation || '');
  const [dateLieuAchat, setDateLieuAchat] = useState(row.dateLieuAchat || '');
  const [prixAchat, setPrixAchat] = useState(row.prixAchat || '');

  // Sync local states when parent props change (e.g. from file loads, image adjusters, or resets)
  React.useEffect(() => {
    setFossilName(row.fossilName || '');
  }, [row.fossilName]);

  React.useEffect(() => {
    setProvenanceDate(row.provenanceDate || '');
  }, [row.provenanceDate]);

  React.useEffect(() => {
    setPeriodeDatation(row.periodeDatation || '');
  }, [row.periodeDatation]);

  React.useEffect(() => {
    setDateLieuAchat(row.dateLieuAchat || '');
  }, [row.dateLieuAchat]);

  React.useEffect(() => {
    setPrixAchat(row.prixAchat || '');
  }, [row.prixAchat]);

  const handleCommit = (field: keyof TechnicalSheetRow, value: string) => {
    if (row[field] !== value) {
      onUpdateRow(row.id, { [field]: value });
    }
  };

  return (
    <tr className="hover:bg-slate-900/30 transition-colors">
      {/* FOSSIL NAME & PHOTO COLS */}
      <td className="p-3.5 pl-6 space-y-2">
        {isAdmin ? (
          <div className="relative">
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white uppercase font-serif"
              placeholder="Nom du Fossile..."
              value={fossilName}
              onChange={(e) => setFossilName(e.target.value)}
              onBlur={() => handleCommit('fossilName', fossilName)}
            />
            <button
              onClick={() => {
                playDinoSound();
                setActiveAdjustImage(
                  activeAdustImage?.rowId === row.id && activeAdustImage?.field === 'fossilImage'
                    ? null
                    : { rowId: row.id, field: 'fossilImage' }
                );
              }}
              className="mt-1 text-[9px] text-yellow-600/90 flex items-center gap-1 hover:text-yellow-500 border-none bg-transparent cursor-pointer"
            >
              Configurer Photo des fossiles ✓
            </button>
          </div>
        ) : (
          <span className="font-bold font-serif text-white uppercase tracking-wider block text-sm">
            {fossilName || "Fossile non nommé"}
          </span>
        )}

        <div className="w-16 h-16 rounded overflow-hidden bg-transparent relative">
          <CroppedImage settings={row.fossilImage} alt={fossilName} className="w-full h-full" />
        </div>
      </td>

      {/* PROVENANCE AND DISCOVERY DATE */}
      <td className="p-3.5 font-sans">
        {isAdmin ? (
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-300 resize-none h-14"
            placeholder="Ex: Alnif, Maroc - Mars 2018"
            value={provenanceDate}
            onChange={(e) => setProvenanceDate(e.target.value)}
            onBlur={() => handleCommit('provenanceDate', provenanceDate)}
          />
        ) : (
          <p className="whitespace-pre-line text-slate-300">{provenanceDate || "—"}</p>
        )}
      </td>

      {/* PERIOD DATATION */}
      <td className="p-3.5 font-mono text-xs">
        {isAdmin ? (
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-yellow-600"
            placeholder="Ex: Dévonien moyen (~390 Ma)"
            value={periodeDatation}
            onChange={(e) => setPeriodeDatation(e.target.value)}
            onBlur={() => handleCommit('periodeDatation', periodeDatation)}
          />
        ) : (
          <span className="text-yellow-600 font-bold">{periodeDatation || "—"}</span>
        )}
      </td>

      {/* BUYING DATE & LOCATION */}
      <td className="p-3.5 font-sans">
        {isAdmin ? (
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-300 resize-none h-14"
            placeholder="Ex: Acheté le 12/05/2019 à la Galerie d'Erfoud"
            value={dateLieuAchat}
            onChange={(e) => setDateLieuAchat(e.target.value)}
            onBlur={() => handleCommit('dateLieuAchat', dateLieuAchat)}
          />
        ) : (
          <p className="whitespace-pre-line text-slate-300">{dateLieuAchat || "—"}</p>
        )}
      </td>

      {/* PRIX ACHAT */}
      <td className="p-3.5 font-mono text-xs">
        {isAdmin ? (
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-yellow-500"
            placeholder="Ex: 1500"
            value={prixAchat}
            onChange={(e) => setPrixAchat(e.target.value)}
            onBlur={() => handleCommit('prixAchat', prixAchat)}
          />
        ) : (
          <span className="text-yellow-500 font-bold">{prixAchat ? `${prixAchat} €` : "—"}</span>
        )}
      </td>

      {/* QUALITY CERTIFICATE IMAGE CELL */}
      <td className="p-3.5 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-16 h-16 rounded overflow-hidden bg-transparent relative group">
            <CroppedImage settings={row.certificatImage} alt="Certificat" className="w-full h-full" />
            
            {row.certificatImage?.url && (
              <button
                onClick={() => {
                  playDinoSound();
                  setExpandedCertUrl(row.certificatImage);
                }}
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity border-none cursor-pointer"
                title="Agrandir le certificat"
              >
                <Maximize2 className="w-4 h-4 text-yellow-500" />
              </button>
            )}
          </div>
          
          {isAdmin ? (
            <button
              onClick={() => {
                playDinoSound();
                setActiveAdjustImage(
                  activeAdustImage?.rowId === row.id && activeAdustImage?.field === 'certificatImage'
                    ? null
                    : { rowId: row.id, field: 'certificatImage' }
                );
              }}
              className="text-[9px] text-yellow-600/95 font-medium hover:text-yellow-500 flex items-center gap-1 border-none bg-transparent cursor-pointer"
            >
              Configurer Certificat ✓
            </button>
          ) : (
            row.certificatImage?.url && (
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Certifié Conforme
              </span>
            )
          )}
        </div>
      </td>

      {/* ACTIONS ADMIN DELETE */}
      {isAdmin && (
        <td className="p-3.5 text-center">
          <button
            onClick={() => onRemoveRow(row.id)}
            className="p-2 text-red-400/80 hover:text-red-400 hover:bg-red-950/20 rounded-full transition-all border-none bg-transparent cursor-pointer"
            title="Supprimer la ligne"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}

export default function TechnicalSheetsView({ isAdmin, sheets, onSaveSheets }: TechnicalSheetsViewProps) {
  const safeSheets = Array.isArray(sheets) ? sheets : [];

  const [activeAdustImage, setActiveAdjustImage] = useState<{
    rowId: string;
    field: 'fossilImage' | 'certificatImage';
  } | null>(null);

  const [expandedCertUrl, setExpandedCertUrl] = useState<ImageSettings | null>(null);

  const handleAddRow = () => {
    playDinoSound();
    const newRow: TechnicalSheetRow = {
      id: Math.random().toString(),
      fossilName: '',
      fossilImage: { url: '', scale: 1, posX: 0, posY: 0 },
      provenanceDate: '',
      periodeDatation: '',
      dateLieuAchat: '',
      certificatImage: { url: '', scale: 1, posX: 0, posY: 0 },
    };
    onSaveSheets([...safeSheets, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    playDinoSound();
    onSaveSheets(safeSheets.filter(s => s.id !== id));
    if (activeAdustImage?.rowId === id) {
      setActiveAdjustImage(null);
    }
  };

  const handleUpdateRow = (id: string, updatedFields: Partial<TechnicalSheetRow>) => {
    onSaveSheets(
      safeSheets.map(s => (s.id === id ? { ...s, ...updatedFields } : s))
    );
  };

  const totalPrix = safeSheets.reduce((acc, row) => {
    const val = parseFloat(String(row.prixAchat || "").replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) {
      return acc + val;
    }
    return acc;
  }, 0);

  return (
    <div className="w-full bg-slate-900/40 p-4 border border-yellow-700/10 rounded-2xl space-y-6">
      {isAdmin && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-300 text-xs shadow-md select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">Statut de Synchronisation :</span>
            <span className="font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Toutes les fiches sont synchronisées avec le tableau
            </span>
          </div>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all tracking-wider uppercase shadow-lg shadow-yellow-950/20"
          >
            <Plus className="w-4 h-4" /> Ajouter une Ligne de Suivi
          </button>
        </div>
      )}

      {/* Table responsive view */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/85">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-yellow-600 font-mono text-[10px] tracking-widest border-b border-slate-800 uppercase">
              <th className="p-3.5 pl-6">Nom du Fossile & Photo</th>
              <th className="p-3.5">Provenance & Date de Découverte</th>
              <th className="p-3.5">Période (Datation)</th>
              <th className="p-3.5">Date & Lieu d'Achat</th>
              <th className="p-3.5">Prix d'Achat</th>
              <th className="p-3.5 text-center">Certificat d'Authenticité</th>
              {isAdmin && <th className="p-3.5 text-center w-16">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {safeSheets.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="p-10 text-center text-slate-500 font-mono text-[11px]">
                  Aucun fossile répertorié dans les fiches de suivi technique.
                  {isAdmin && <p className="text-yellow-600/80 mt-1">Utilisez le bouton ci-dessus pour ajouter des fossiles.</p>}
                </td>
              </tr>
            ) : (
              safeSheets.map((row) => (
                <TechnicalSheetRowComponent
                  key={row.id}
                  row={row}
                  isAdmin={isAdmin}
                  onUpdateRow={handleUpdateRow}
                  onRemoveRow={handleRemoveRow}
                  activeAdustImage={activeAdustImage}
                  setActiveAdjustImage={setActiveAdjustImage}
                  setExpandedCertUrl={setExpandedCertUrl}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-4">
        <div className="bg-slate-900 border border-yellow-700/30 px-6 py-3 rounded-xl shadow-lg flex items-center justify-between gap-8 min-w-[300px]">
          <span className="text-sm font-serif uppercase tracking-wider text-slate-300">Valeur Totale Collection :</span>
          <span className="text-xl font-bold font-mono text-yellow-500">{totalPrix.toLocaleString('fr-FR')} €</span>
        </div>
      </div>

      {/* RENDER INLINE ADJUSTER UNDER EDIT SELECTION */}
      {activeAdustImage && (
        <div className="bg-slate-950/90 border border-yellow-700/40 rounded-xl p-4 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs text-yellow-500 font-mono uppercase tracking-wider">
              Ajuster l'Image pour "{safeSheets.find(s => s.id === activeAdustImage.rowId)?.fossilName || 'Sélection'}"
            </h4>
            <button
              onClick={() => {
                playDinoSound();
                setActiveAdjustImage(null);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </div>

          {safeSheets.map(row => {
            if (row.id !== activeAdustImage.rowId) return null;
            const field = activeAdustImage.field;
            return (
              <ImageAdjuster
                key={row.id + field}
                label={field === 'fossilImage' ? 'Photo du Fossile' : 'Certificat d\'Authenticité'}
                settings={row[field] as ImageSettings}
                onChange={(updated) => handleUpdateRow(row.id, { [field]: updated })}
              />
            );
          })}
        </div>
      )}

      {/* FULLSCREEN ZOOM POPUP */}
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
  );
}
