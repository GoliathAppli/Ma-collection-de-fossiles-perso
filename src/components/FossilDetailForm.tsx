import React, { useState } from 'react';
import { Fossil, ImageSettings } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { Save, Trash2, Globe, Calendar, HelpCircle, Edit3, Image, Info, FileText, Award, Printer } from 'lucide-react';
import ImageAdjuster from '../utils/data/ImageAdjuster';
import InteractiveMap from './InteractiveMap';
import GeologicTimelineView from './GeologicTimelineView';
import FossilPrintTemplate from './lib/FossilPrintTemplate';

interface FossilDetailFormProps {
  fossil: Fossil;
  onSave: (updated: Fossil) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const emptyImage = (): ImageSettings => ({ url: '', scale: 1, posX: 0, posY: 0 });

export default function FossilDetailForm({ fossil, onSave, onDelete, onCancel }: FossilDetailFormProps) {
  const [edited, setEdited] = useState<Fossil>({
    ...fossil,
    image: fossil.image || emptyImage(),
    thumbnailImage: fossil.thumbnailImage || emptyImage(),
    descImages: fossil.descImages || [],
    dietText: fossil.dietText || '',
    dietImages: fossil.dietImages || [],
    leFossileImage: fossil.leFossileImage || emptyImage(),
    saviezVousImage: fossil.saviezVousImage || emptyImage(),
    provenanceCoords: fossil.provenanceCoords || { lat: 40, lng: 50 },
    provenanceName: fossil.provenanceName || '',
    provenanceDate: fossil.provenanceDate || '',
    periodeDatation: fossil.periodeDatation || '',
    dateLieuAchat: fossil.dateLieuAchat || '',
    prixAchat: fossil.prixAchat || '',
    certificatImage: fossil.certificatImage || emptyImage()
  });

  const [activeImageTab, setActiveImageTab] = useState<string>('main');

  const handleFieldChange = (key: keyof Fossil, value: any) => {
    setEdited(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (field: 'image' | 'thumbnailImage' | 'leFossileImage' | 'saviezVousImage', updated: ImageSettings) => {
    setEdited(prev => ({ ...prev, [field]: updated }));
  };

  // Up to 6 horizontal images management
  const handleDescImageChange = (index: number, updated: ImageSettings) => {
    const list = [...edited.descImages];
    list[index] = updated;
    setEdited(prev => ({ ...prev, descImages: list }));
  };

  const handleAddDescImageSlot = () => {
    playDinoSound();
    if (edited.descImages.length < 6) {
      setEdited(prev => ({
        ...prev,
        descImages: [...prev.descImages, emptyImage()]
      }));
    }
  };

  const handleRemoveDescImageSlot = (idx: number) => {
    playDinoSound();
    setEdited(prev => ({
      ...prev,
      descImages: prev.descImages.filter((_, i) => i !== idx)
    }));
  };

  // Up to 6 horizontal images for Diet
  const handleDietImageChange = (index: number, updated: ImageSettings) => {
    const list = [...edited.dietImages];
    list[index] = updated;
    setEdited(prev => ({ ...prev, dietImages: list }));
  };

  const handleAddDietImageSlot = () => {
    playDinoSound();
    if (edited.dietImages.length < 6) {
      setEdited(prev => ({
        ...prev,
        dietImages: [...prev.dietImages, emptyImage()]
      }));
    }
  };

  const handleRemoveDietImageSlot = (idx: number) => {
    playDinoSound();
    setEdited(prev => ({
      ...prev,
      dietImages: prev.dietImages.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playDinoSound();
    onSave(edited);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-yellow-700/40 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100 max-w-4xl mx-auto relative">
      {/* Printable Sheet Template for Admin */}
      <FossilPrintTemplate fossil={edited} />

      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xl font-serif text-white font-bold tracking-tight uppercase text-left">
          Fiche de Création / Modification de Fossile
        </h3>
        <div className="flex items-center gap-2">
          {edited.title && (
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                window.print();
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-600/50 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition font-mono cursor-pointer"
              title="Imprimer cette fiche de spécimen"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-500" />
              <span>Imprimer la fiche</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 p-2 rounded-full transition-all cursor-pointer"
              title="Supprimer ce fossile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TITRE EN GRAND */}
      <div className="space-y-1">
        <label className="block text-xs font-mono uppercase tracking-wider text-yellow-500 text-center">Titre du fossile (En Grand)</label>
        <input
          type="text"
          required
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-serif text-2xl text-center rounded-xl p-3 focus:outline-none focus:border-yellow-600/50 uppercase tracking-widest placeholder-slate-700"
          placeholder="Ex: AMMONITE DACTYLIOCERAS"
          value={edited.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
        />
      </div>

      {/* ZONE D'AJOUT D'IMAGE ACCUEIL & PRINCIPALE */}
      <div className="space-y-6 border-t border-slate-800/40 pt-4">
        <ImageAdjuster
          label="Photo d'accueil (vignette cliquable dans la galerie) - Si vide, utilise la photo principale"
          settings={edited.thumbnailImage || emptyImage()}
          onChange={(val) => handleImageChange('thumbnailImage', val)}
        />
        
        <ImageAdjuster
          label="Photo principale du fossile (affichée quand on clique dessus - zone transparente PNG idéale)"
          settings={edited.image}
          onChange={(val) => handleImageChange('image', val)}
        />
      </div>

      {/* CADRE PETIT POUR AJOUTER REFERENCE */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
        <label className="block text-xs font-mono uppercase tracking-wider text-yellow-500/80">Référence de Collection unique</label>
        <input
          type="text"
          className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center rounded px-3 py-1.5 focus:outline-none focus:border-yellow-600/50"
          placeholder="Ex: FOS-2026-042"
          value={edited.reference}
          onChange={(e) => handleFieldChange('reference', e.target.value)}
        />
      </div>

      {/* RUBRIQUE DESCRIPTION + ZONE TEXTE + JUSQU'À 6 IMAGES SUR UNE SEULE LIGNE */}
      <div className="border border-slate-850 p-4 rounded-xl space-y-4 bg-slate-950/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Edit3 className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-semibold tracking-wide uppercase font-serif">Rubrique Description</h4>
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Texte de Description</label>
          <textarea
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
            placeholder="Introduction historique, contexte scientifique, caractéristiques générales de l'échantillon..."
            value={edited.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />
        </div>

        {/* 6 HORIZONTAL IMAGES */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Ligne de Photos Complémentaires (Max 6)</span>
            {edited.descImages.length < 6 && (
              <button
                type="button"
                onClick={handleAddDescImageSlot}
                className="text-[10px] bg-yellow-950/40 border border-yellow-700/30 hover:bg-yellow-900/60 text-yellow-500 rounded px-2.5 py-1 transition-colors"
              >
                + Ajouter une Photo
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-start py-2">
            {edited.descImages.map((imgUrl, i) => (
              <div key={i} className="flex-none w-56 bg-slate-900/80 p-2 border border-slate-800 rounded-lg space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">Photo complémentaires #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDescImageSlot(i)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
                <ImageAdjuster
                  label={`Image #${i + 1}`}
                  settings={imgUrl}
                  onChange={(val) => handleDescImageChange(i, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* RUBRIQUE ALIMENTATION + ZONE TEXTE + JUSQU'À 6 IMAGES SUR UNE SEULE LIGNE */}
      <div className="border border-slate-850 p-4 rounded-xl space-y-4 bg-slate-950/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Info className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-semibold tracking-wide uppercase font-serif">Rubrique Alimentation</h4>
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Texte d'Alimentation</label>
          <textarea
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
            placeholder="Que mangeait ce fossile ? Décrivez son alimentation..."
            value={edited.dietText}
            onChange={(e) => handleFieldChange('dietText', e.target.value)}
          />
        </div>

        {/* 6 HORIZONTAL IMAGES FOR DIET */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Ligne de Photos d'Alimentation (Max 6)</span>
            {edited.dietImages.length < 6 && (
              <button
                type="button"
                onClick={handleAddDietImageSlot}
                className="text-[10px] bg-yellow-950/40 border border-yellow-700/30 hover:bg-yellow-900/60 text-yellow-500 rounded px-2.5 py-1 transition-colors"
              >
                + Ajouter une Photo
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-start py-2">
            {edited.dietImages.map((imgUrl, i) => (
              <div key={i} className="flex-none w-56 bg-slate-900/80 p-2 border border-slate-800 rounded-lg space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">Photo d'alimentation #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDietImageSlot(i)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
                <ImageAdjuster
                  label={`Image #${i + 1}`}
                  settings={imgUrl}
                  onChange={(val) => handleDietImageChange(i, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RUBRIQUE: LE FOSSILE */}
      <div className="border border-slate-850 p-4 rounded-xl space-y-4 bg-slate-950/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Info className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-semibold tracking-wide uppercase font-serif">Rubrique: Le Fossile</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs text-slate-400">Description Technique/Détails de fossile</label>
              <textarea
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
                placeholder="Spécifiez la cristallisation, l'état de conservation de la coquille, la nacre, la structure des loges..."
                value={edited.leFossileText}
                onChange={(e) => handleFieldChange('leFossileText', e.target.value)}
              />
            </div>

            <ImageAdjuster
              label="Photo descriptive"
              settings={edited.leFossileImage}
              onChange={(val) => handleImageChange('leFossileImage', val)}
            />
          </div>

          <div className="space-y-3">
            {/* Interactive geographical marker provenance map */}
            <InteractiveMap
              coords={edited.provenanceCoords}
              locationName={edited.provenanceName}
              onChange={(coords, locName) => {
                setEdited(prev => ({
                  ...prev,
                  provenanceCoords: coords,
                  provenanceName: locName
                }));
              }}
            />
          </div>
        </div>

        {/* ECHELLE DES TEMPS GEOLOGIQUE POUR DETERMINER LA PERIODE DU FOSSILE */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 mt-4 space-y-3">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-mono border-b border-slate-850 pb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sélectionner la Longévité / Période de Vie de l'Espèce</span>
          </div>
          
          <div className="text-[10px] text-slate-400 italic">
            Faites défiler l'échelle horizontale ci-dessous et cliquez sur les périodes pour définir la période géologique (période de début et fin).
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono">Période Début :</label>
              <div className="text-yellow-600 font-bold py-1 bg-slate-900/60 border border-slate-800 rounded text-center mt-1">
                {edited.lifespanPeriodStart || 'Non sélectionnée'}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono">Période Fin (Optionnelle) :</label>
              <div className="text-yellow-600 font-bold py-1 bg-slate-900/60 border border-slate-800 rounded text-center mt-1">
                {edited.lifespanPeriodEnd || 'Même période'}
              </div>
            </div>
          </div>

          <GeologicTimelineView
            readOnly={false}
            highlightedStart={edited.lifespanPeriodStart}
            highlightedEnd={edited.lifespanPeriodEnd}
            onSelectRange={(start, end) => {
              setEdited(prev => ({
                ...prev,
                lifespanPeriodStart: start,
                lifespanPeriodEnd: end
              }));
            }}
          />
        </div>
      </div>

      {/* RUBRIQUE: FICHE TECHNIQUE D'AUTHENTICITÉ ET DE TRAÇABILITÉ */}
      <div className="border border-slate-850 p-4 rounded-xl space-y-4 bg-slate-950/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-semibold tracking-wide uppercase font-serif text-emerald-500">
            Fiche Technique d'Authenticité & Traçabilité (Suivi)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium">Provenance & Date de Découverte</label>
              <textarea
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
                placeholder="Ex: Alnif, Maroc - Mars 2018"
                value={edited.provenanceDate}
                onChange={(e) => handleFieldChange('provenanceDate', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium">Période (Datation) - Par défaut, utilise les périodes ci-dessus</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
                placeholder="Ex: Dévonien moyen (~390 Ma)"
                value={edited.periodeDatation}
                onChange={(e) => handleFieldChange('periodeDatation', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium">Date & Lieu d'Achat</label>
              <textarea
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
                placeholder="Ex: Acheté le 12/05/2019 à la Galerie d'Erfoud"
                value={edited.dateLieuAchat}
                onChange={(e) => handleFieldChange('dateLieuAchat', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium">Prix d'Achat (€) - Doit être un nombre ou texte</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
                placeholder="Ex: 1500"
                value={edited.prixAchat}
                onChange={(e) => handleFieldChange('prixAchat', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-500 uppercase pb-1 border-b border-slate-850">
              <Award className="w-3.5 h-3.5" />
              <span>Certificat d'Authenticité</span>
            </div>
            
            <ImageAdjuster
              label="Image du Certificat d'Authenticité"
              settings={edited.certificatImage || emptyImage()}
              onChange={(val) => handleFieldChange('certificatImage', val)}
            />
          </div>
        </div>
      </div>

      {/* RUBRIQUE: LE SAVIEZ-VOUS? */}
      <div className="border border-slate-850 p-4 rounded-xl space-y-4 bg-slate-950/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <HelpCircle className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-semibold tracking-wide uppercase font-serif">Rubrique : Le saviez-vous ?</h4>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Zone de texte Anecdote ou Fait insolite</label>
            <textarea
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-xs rounded focus:outline-none focus:border-yellow-600/50"
              placeholder="Saviez-vous que certaines ammonites géantes faisaient jusqu'à 2 mètres de diamètre ?..."
              value={edited.saviezVousText}
              onChange={(e) => handleFieldChange('saviezVousText', e.target.value)}
            />
          </div>

          <ImageAdjuster
            label="Photo de l'anecdote"
            settings={edited.saviezVousImage}
            onChange={(val) => handleImageChange('saviezVousImage', val)}
          />
        </div>
      </div>

      {/* SUBMISSION ACTION BUTTONS */}
      <div className="flex gap-4 justify-end border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => {
            playDinoSound();
            onCancel();
          }}
          className="border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-mono text-xs px-5 py-2.5 rounded-lg transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="bg-blue-600/90 hover:bg-blue-500 border border-blue-400/30 text-white font-bold font-mono text-xs px-6 py-2.5 rounded-lg shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wider"
        >
          <Save className="w-4 h-4" /> Enregistrer & Publier
        </button>
      </div>
    </form>
  );
}
