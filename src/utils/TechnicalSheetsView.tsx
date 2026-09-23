import React, { useState, useMemo } from 'react';
import { TechnicalSheetRow, ImageSettings, Fossil } from '../types';
import { playDinoSound } from './data/audio';
import {
  Plus,
  Trash2,
  Maximize2,
  CheckCircle2,
  X,
  Pencil,
  Eye,
  Check,
  Printer,
  Search,
  SlidersHorizontal,
  FileText,
  Sparkles,
} from 'lucide-react';
import CroppedImage from '../components/CroppedImage';
import ImageAdjuster from './data/ImageAdjuster';
import { resolveImageUrl } from './imageUrl';
import TechnicalSheetsPrintTemplate, {
  TechnicalSheetsPrintOptions,
} from '../components/lib/TechnicalSheetsPrintTemplate';

interface TechnicalSheetsViewProps {
  isAdmin: boolean;
  sheets: TechnicalSheetRow[];
  fossils?: Fossil[];
  onSaveSheets: (updated: TechnicalSheetRow[]) => void;
}

interface TechnicalSheetRowComponentProps {
  row: TechnicalSheetRow;
  isEditing: boolean;
  onUpdateRow: (id: string, updatedFields: Partial<TechnicalSheetRow>) => void;
  onRemoveRow: (id: string) => void;
  activeAdustImage: { rowId: string; field: 'fossilImage' | 'certificatImage' } | null;
  setActiveAdjustImage: (val: { rowId: string; field: 'fossilImage' | 'certificatImage' } | null) => void;
  setExpandedCertUrl: (val: ImageSettings | null) => void;
}

function TechnicalSheetRowComponent({
  row,
  isEditing,
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
        {isEditing ? (
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

        <div className="w-16 h-16 rounded overflow-hidden bg-transparent relative group">
          <CroppedImage
            settings={row.fossilImage}
            alt={fossilName}
            className="w-full h-full cursor-pointer"
            onClick={() => {
              if (row.fossilImage?.url) {
                playDinoSound();
                setExpandedCertUrl(row.fossilImage);
              }
            }}
          />
          {row.fossilImage?.url && !isEditing && (
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setExpandedCertUrl(row.fossilImage);
              }}
              className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity border-none cursor-pointer"
              title="Agrandir la photo"
            >
              <Maximize2 className="w-4 h-4 text-yellow-500" />
            </button>
          )}
        </div>
      </td>

      {/* PROVENANCE AND DISCOVERY DATE */}
      <td className="p-3.5 font-sans">
        {isEditing ? (
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
        {isEditing ? (
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
        {isEditing ? (
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
        {isEditing ? (
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
          <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-900/90 border border-yellow-700/30 relative group shadow flex items-center justify-center p-0.5">
            {row.certificatImage?.url ? (
              <>
                <CroppedImage
                  settings={row.certificatImage}
                  alt="Certificat"
                  className="w-full h-full cursor-pointer"
                  onClick={() => {
                    playDinoSound();
                    setExpandedCertUrl(row.certificatImage);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    playDinoSound();
                    setExpandedCertUrl(row.certificatImage);
                  }}
                  className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity border-none cursor-pointer"
                  title="Agrandir le certificat"
                >
                  <Maximize2 className="w-4 h-4 text-yellow-500" />
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono italic">Aucun</span>
            )}
          </div>
          
          {isEditing ? (
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

      {/* ACTIONS ADMIN DELETE (ONLY VISIBLE IN EDITING MODE) */}
      {isEditing && (
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

export default function TechnicalSheetsView({
  isAdmin,
  sheets,
  fossils = [],
  onSaveSheets,
}: TechnicalSheetsViewProps) {
  const safeSheets = Array.isArray(sheets) ? sheets : [];

  // Always open in consultation / read-only mode by default!
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'with-cert' | 'without-cert' | 'with-photo'>('all');

  // Print configuration & modal
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printOptions, setPrintOptions] = useState<TechnicalSheetsPrintOptions>({
    orientation: 'landscape',
    showPrices: true,
    showFossilImages: true,
    showCertificates: true,
    title: 'REGISTRE & TABLEAU DES FICHES TECHNIQUES DE SUIVI',
    notes: '',
  });
  const [printScope, setPrintScope] = useState<'all' | 'filtered'>('all');

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

  // Filtered rows
  const filteredSheets = useMemo(() => {
    return safeSheets.filter((sheet) => {
      // Filter mode
      if (filterMode === 'with-cert') {
        if (!sheet.certificatImage?.url || sheet.certificatImage.url.trim() === '') return false;
      } else if (filterMode === 'without-cert') {
        if (sheet.certificatImage?.url && sheet.certificatImage.url.trim() !== '') return false;
      } else if (filterMode === 'with-photo') {
        if (!sheet.fossilImage?.url || sheet.fossilImage.url.trim() === '') return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchedFossil = fossils.find((f) => f.id === sheet.id);

      return (
        (sheet.fossilName && sheet.fossilName.toLowerCase().includes(q)) ||
        (sheet.provenanceDate && sheet.provenanceDate.toLowerCase().includes(q)) ||
        (sheet.periodeDatation && sheet.periodeDatation.toLowerCase().includes(q)) ||
        (sheet.dateLieuAchat && sheet.dateLieuAchat.toLowerCase().includes(q)) ||
        (sheet.prixAchat && sheet.prixAchat.toLowerCase().includes(q)) ||
        (matchedFossil?.reference && matchedFossil.reference.toLowerCase().includes(q)) ||
        (matchedFossil?.era && matchedFossil.era.toLowerCase().includes(q)) ||
        (matchedFossil?.provenanceName && matchedFossil.provenanceName.toLowerCase().includes(q))
      );
    });
  }, [safeSheets, searchQuery, filterMode, fossils]);

  const totalPrix = safeSheets.reduce((acc, row) => {
    const val = parseFloat(String(row.prixAchat || "").replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) {
      return acc + val;
    }
    return acc;
  }, 0);

  const filteredTotalPrix = filteredSheets.reduce((acc, row) => {
    const val = parseFloat(String(row.prixAchat || "").replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) {
      return acc + val;
    }
    return acc;
  }, 0);

  const countWithCert = safeSheets.filter(
    (s) => s.certificatImage?.url && s.certificatImage.url.trim() !== ''
  ).length;

  const countWithPhoto = safeSheets.filter(
    (s) => s.fossilImage?.url && s.fossilImage.url.trim() !== ''
  ).length;

  const canEdit = isAdmin && isEditing;

  // Decide which rows to print
  const sheetsToPrint = useMemo(() => {
    if (printScope === 'filtered' && (searchQuery.trim() !== '' || filterMode !== 'all')) {
      return filteredSheets;
    }
    return safeSheets;
  }, [printScope, searchQuery, filterMode, filteredSheets, safeSheets]);

  const handleTriggerPrint = (overrideOptions?: Partial<TechnicalSheetsPrintOptions>) => {
    playDinoSound();
    if (overrideOptions) {
      setPrintOptions((prev) => ({ ...prev, ...overrideOptions }));
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="w-full bg-slate-900/40 p-4 border border-yellow-700/20 rounded-2xl space-y-6">
      {/* REGISTRE D'INVENTAIRE SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-yellow-700/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-yellow-600/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-extrabold uppercase tracking-wide bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.25)]">
              Registre d'Inventaire & Certificats
            </h2>
            <p className="text-xs sm:text-sm text-amber-300/80 font-mono italic mt-0.5">
              Traçabilité muséale, valeurs d'acquisition et certificats d'authenticité
            </p>
          </div>
        </div>
      </div>

      {/* ALWAYS ACCESSIBLE TOP BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-emerald-300 text-xs shadow-md select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">Statut :</span>
            <span className="font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Synchronisé avec les fiches
            </span>
          </div>

          {/* Visual mode indicator */}
          {canEdit ? (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Mode Édition actif
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-xl text-xs font-mono">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              Mode Consultation (lecture seule)
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* PROMINENT PRINT BUTTON */}
          <button
            onClick={() => {
              playDinoSound();
              setShowPrintModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all tracking-wider uppercase shadow-lg shadow-yellow-950/40 cursor-pointer active:scale-95"
            title="Imprimer ou exporter en PDF le tableau des fiches techniques de suivi"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Imprimer le tableau</span>
          </button>

          {/* DIRECT 1-CLICK QUICK PRINT */}
          <button
            onClick={() => handleTriggerPrint()}
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white font-mono text-xs px-3 py-2 rounded-xl transition cursor-pointer"
            title="Impression directe (A4 Paysage complet)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Impression directe</span>
          </button>

          {isAdmin && (
            <>
              {!canEdit ? (
                <button
                  onClick={() => {
                    playDinoSound();
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all tracking-wider uppercase shadow-lg shadow-yellow-950/30 cursor-pointer active:scale-95"
                  title="Activer la modification directe des données"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier les fiches
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-600/50 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all tracking-wider uppercase cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-yellow-400" /> Ajouter une Ligne
                  </button>
                  <button
                    onClick={() => {
                      playDinoSound();
                      setIsEditing(false);
                      setActiveAdjustImage(null);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all tracking-wider uppercase shadow-lg shadow-emerald-950/30 cursor-pointer active:scale-95"
                    title="Enregistrer et revenir au mode consultation"
                  >
                    <Check className="w-3.5 h-3.5" /> Terminer l'édition
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER STRIP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un fossile, une époque, un lieu..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-yellow-600 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tous ({safeSheets.length})
          </button>
          <button
            onClick={() => setFilterMode('with-cert')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
              filterMode === 'with-cert'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Certifiés ({countWithCert})
          </button>
          <button
            onClick={() => setFilterMode('with-photo')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
              filterMode === 'with-photo'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Avec Photo ({countWithPhoto})
          </button>
        </div>
      </div>

      {/* Table responsive view */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/85 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-yellow-600 font-mono text-[10px] tracking-widest border-b border-slate-800 uppercase">
              <th className="p-3.5 pl-6">Nom du Fossile & Photo</th>
              <th className="p-3.5">Provenance & Date de Découverte</th>
              <th className="p-3.5">Période (Datation)</th>
              <th className="p-3.5">Date & Lieu d'Achat</th>
              <th className="p-3.5">Prix d'Achat</th>
              <th className="p-3.5 text-center">Certificat d'Authenticité</th>
              {canEdit && <th className="p-3.5 text-center w-16">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {filteredSheets.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="p-10 text-center text-slate-500 font-mono text-[11px]">
                  {safeSheets.length === 0 ? (
                    <>
                      Aucun fossile répertorié dans les fiches de suivi technique.
                      {canEdit && <p className="text-yellow-600/80 mt-1">Utilisez le bouton ci-dessus pour ajouter des fossiles.</p>}
                    </>
                  ) : (
                    <>
                      Aucune fiche ne correspond aux critères de recherche actuels.
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterMode('all');
                          }}
                          className="text-yellow-500 hover:underline text-xs"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filteredSheets.map((row) => (
                <TechnicalSheetRowComponent
                  key={row.id}
                  row={row}
                  isEditing={canEdit}
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

      {/* FOOTER BAR WITH SUMMARY AND PRINT SHORTCUT */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        {canEdit ? (
          <button
            onClick={() => {
              playDinoSound();
              setIsEditing(false);
              setActiveAdjustImage(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition font-mono cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Quitter le mode édition
          </button>
        ) : (
          <div className="text-xs text-slate-500 font-mono">
            {filteredSheets.length === safeSheets.length ? (
              <span>{safeSheets.length} fiche{safeSheets.length > 1 ? 's' : ''} de suivi technique répertoriée{safeSheets.length > 1 ? 's' : ''}</span>
            ) : (
              <span>{filteredSheets.length} sur {safeSheets.length} fiches filtrées</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Print Button alongside Total */}
          <button
            onClick={() => {
              playDinoSound();
              setShowPrintModal(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-bold text-xs px-4 py-3 rounded-xl transition shadow cursor-pointer uppercase tracking-wider"
            title="Imprimer le tableau des fiches de suivi"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le tableau</span>
          </button>

          <div className="bg-slate-900 border border-yellow-700/30 px-6 py-3 rounded-xl shadow-lg flex items-center justify-between gap-6 min-w-[280px]">
            <span className="text-xs font-serif uppercase tracking-wider text-slate-400">
              Valeur Totale Collection :
            </span>
            <span className="text-lg font-bold font-mono text-yellow-500">
              {totalPrix.toLocaleString('fr-FR')} €
            </span>
          </div>
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

      {/* ========================================================================= */}
      {/* PRINT CONFIGURATION & PREVIEW MODAL */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="bg-slate-900 border border-amber-600/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-serif">
                    Imprimer le Tableau des Fiches Techniques
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registre officiel de suivi, datation, acquisition et certificats d'authenticité
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* PRINT SETTINGS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ORIENTATION */}
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <label className="block text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
                    1. Orientation du document (A4)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintOptions({ ...printOptions, orientation: 'landscape' })}
                      className={`p-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                        printOptions.orientation === 'landscape'
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/60 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-8 h-5 border-2 border-current rounded-sm"></span>
                      <span>Paysage (Recommandé)</span>
                      <span className="text-[9px] font-normal text-slate-400">Optimal pour 6 colonnes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintOptions({ ...printOptions, orientation: 'portrait' })}
                      className={`p-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                        printOptions.orientation === 'portrait'
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/60 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-5 h-8 border-2 border-current rounded-sm"></span>
                      <span>Portrait</span>
                      <span className="text-[9px] font-normal text-slate-400">Format vertical standard</span>
                    </button>
                  </div>
                </div>

                {/* 2. PRINT SCOPE */}
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <label className="block text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
                    2. Périmètre des fiches à imprimer
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 cursor-pointer hover:bg-slate-900">
                      <input
                        type="radio"
                        name="printScope"
                        checked={printScope === 'all'}
                        onChange={() => setPrintScope('all')}
                        className="accent-amber-500"
                      />
                      <span>
                        Toutes les fiches du conservatoire (<strong>{safeSheets.length}</strong> fiches)
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer ${
                        searchQuery.trim() !== '' || filterMode !== 'all'
                          ? 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-900'
                          : 'bg-slate-900/30 border-slate-850 text-slate-500 opacity-60 pointer-events-none'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printScope"
                        disabled={!searchQuery.trim() && filterMode === 'all'}
                        checked={printScope === 'filtered'}
                        onChange={() => setPrintScope('filtered')}
                        className="accent-amber-500"
                      />
                      <span>
                        Sélection actuellement filtrée (<strong>{filteredSheets.length}</strong> fiches)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. DISPLAY OPTIONS */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
                  3. Colonnes & Éléments visuels à afficher
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={printOptions.showFossilImages}
                      onChange={(e) =>
                        setPrintOptions({ ...printOptions, showFossilImages: e.target.checked })
                      }
                      className="accent-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold block text-white">Photos des Spécimens</span>
                      <span className="text-[10px] text-slate-400">Vignettes avec cadrage et zoom</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={printOptions.showCertificates}
                      onChange={(e) =>
                        setPrintOptions({ ...printOptions, showCertificates: e.target.checked })
                      }
                      className="accent-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold block text-white">Certificats de Conformité</span>
                      <span className="text-[10px] text-slate-400">Miniatures et validation</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={printOptions.showPrices}
                      onChange={(e) =>
                        setPrintOptions({ ...printOptions, showPrices: e.target.checked })
                      }
                      className="accent-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold block text-white">Prix d'Achat</span>
                      <span className="text-[10px] text-slate-400">Décochez pour exposition publique</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. OPTIONAL HEADER NOTE */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
                  4. Titre ou Note personnalisée (facultatif)
                </label>
                <input
                  type="text"
                  value={printOptions.notes || ''}
                  onChange={(e) => setPrintOptions({ ...printOptions, notes: e.target.value })}
                  placeholder="Ex : Inventaire officiel pour assurance, Événement d'exposition 2026..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* LIVE MINI PREVIEW OF PRINT TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Aperçu de la mise en page imprimée ({sheetsToPrint.length} fiches) :</span>
                  <span className="text-amber-400">
                    {printOptions.orientation === 'landscape' ? 'Format A4 Paysage' : 'Format A4 Portrait'}
                  </span>
                </div>

                <div className="bg-white text-slate-900 rounded-lg p-3 text-[10px] border border-slate-300 max-h-48 overflow-y-auto shadow-inner select-none font-sans">
                  <div className="border-b border-amber-600 pb-1.5 mb-2 flex justify-between items-center">
                    <div>
                      <div className="text-[8px] font-bold text-amber-800 font-mono uppercase">
                        CONSERVATOIRE DE FOSSILES
                      </div>
                      <div className="font-extrabold text-[11px] uppercase">
                        {printOptions.title}
                      </div>
                    </div>
                    <div className="text-right text-[8px] text-slate-600">
                      {sheetsToPrint.length} fiches • {printOptions.showPrices ? `${totalPrix.toLocaleString('fr-FR')} €` : 'Prix masqués'}
                    </div>
                  </div>

                  <table className="w-full border-collapse text-[9px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono">
                        <th className="p-1 text-center w-6">N°</th>
                        <th className="p-1 text-left">Spécimen</th>
                        <th className="p-1 text-left">Provenance</th>
                        <th className="p-1 text-left">Datation</th>
                        <th className="p-1 text-left">Acquisition</th>
                        {printOptions.showPrices && <th className="p-1 text-right">Prix</th>}
                        {printOptions.showCertificates && <th className="p-1 text-center">Certificat</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sheetsToPrint.slice(0, 5).map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50">
                          <td className="p-1 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-1 font-bold">{row.fossilName || 'Fossile'}</td>
                          <td className="p-1 text-slate-600 truncate max-w-[120px]">{row.provenanceDate || '—'}</td>
                          <td className="p-1 text-slate-600">{row.periodeDatation || '—'}</td>
                          <td className="p-1 text-slate-600 truncate max-w-[100px]">{row.dateLieuAchat || '—'}</td>
                          {printOptions.showPrices && (
                            <td className="p-1 text-right font-mono font-semibold">{row.prixAchat || '—'}</td>
                          )}
                          {printOptions.showCertificates && (
                            <td className="p-1 text-center text-emerald-600 font-semibold">
                              {row.certificatImage?.url ? '✓ Oui' : '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sheetsToPrint.length > 5 && (
                    <div className="text-center text-[8px] text-slate-400 mt-1 italic">
                      + {sheetsToPrint.length - 5} autres fiches incluses dans l'impression complète
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-slate-800 bg-slate-950/50">
              <div className="text-xs text-slate-400 font-mono">
                Impression prête : <strong className="text-white">{sheetsToPrint.length}</strong> fiches sélectionnées
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono transition cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleTriggerPrint();
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-950/40 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lancer l'impression</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ========================================================================= */}
      {/* HIDDEN PRINT PORTAL FOR BROWSER PRINT (WINDOW.PRINT) */}
      {/* ========================================================================= */}
      <TechnicalSheetsPrintTemplate
        sheets={sheetsToPrint}
        fossils={fossils}
        options={printOptions}
      />
    </div>
  );
}
