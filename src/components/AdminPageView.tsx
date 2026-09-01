import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Download, 
  Upload, 
  Database, 
  RefreshCw,
  Cloud,
  CloudUpload,
  CloudDownload,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  Video,
  FileCode,
  Layers,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  Loader2,
  Smartphone,
  Share2,
  HelpCircle,
  Info,
  Printer
} from 'lucide-react';
import { AppConfig, Fossil, GitHubSyncConfig, GitHubSyncStatus } from '../types';
import { playDinoSound } from '../utils/data/audio';
import { optimizeAllConfigImages } from '../utils/data/imageOptimizer';
import { optimizeAppConfigImages } from '../utils/imageCompressor';
import { readAndParseJsonFile } from '../utils/jsonImporter';
import { usePWAInstall } from '../utils/pwa';
import PwaInstallModal from './PwaInstallModal';
import FossilPrintTemplate from './lib/FossilPrintTemplate';
import {
  getGitHubConfig,
  saveGitHubConfig,
  isGitHubConfigured,
  cleanGitHubToken,
  testGitHubConnection,
  fetchFromGitHub,
  pushToGitHub,
  DEFAULT_GITHUB_CONFIG,
  SyncStepId,
  SyncStepStatus
} from '../utils/githubSync';
import FossilDetailForm from './FossilDetailForm';
import CroppedImage from './CroppedImage';

interface AdminPageViewProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => Promise<void>;
  onImportConfig: (newConfig: AppConfig) => Promise<void>;
  onExitAdmin: () => void;
  onNavigateToMuseum: () => void;
}

export default function AdminPageView({
  config,
  onUpdateConfig,
  onImportConfig,
  onExitAdmin,
  onNavigateToMuseum
}: AdminPageViewProps) {
  const [activeTab, setActiveTab] = useState<'fossils' | 'github' | 'media' | 'tools'>('fossils');

  // Fossil Management State
  const [fossilSearch, setFossilSearch] = useState('');
  const [fossilEraFilter, setFossilEraFilter] = useState<'all' | 'precambrian' | 'paleozoic' | 'mesozoic' | 'cenozoic'>('all');
  const [editingFossil, setEditingFossil] = useState<Fossil | null>(null);

  // GitHub Sync State
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(DEFAULT_GITHUB_CONFIG);
  const [githubStatus, setGithubStatus] = useState<GitHubSyncStatus>({ state: 'idle', message: '' });
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // 5-step detailed progress for GitHub Push
  const [syncSteps, setSyncSteps] = useState<Record<SyncStepId, { status: SyncStepStatus; label: string; error?: string }>>({
    1: { status: 'pending', label: '1. Vérification des données et identifiants' },
    2: { status: 'pending', label: '2. Encodage et calcul d\'intégrité du fichier' },
    3: { status: 'pending', label: '3. Connexion et authentification GitHub' },
    4: { status: 'pending', label: '4. Téléversement et enregistrement du commit' },
    5: { status: 'pending', label: '5. Validation en ligne & mise à jour locale' }
  });
  const [syncPercent, setSyncPercent] = useState<number>(0);
  const [syncOverallStatus, setSyncOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Media Management State
  const [videoUrl1Input, setVideoUrl1Input] = useState(config.videoUrl1 || '');
  const [secondHomeTitleInput, setSecondHomeTitleInput] = useState(config.secondHomeTitle || '');
  const [scaleVideoUrlInput, setScaleVideoUrlInput] = useState(config.scaleVideoUrl || '');
  const [mediaSaveNotice, setMediaSaveNotice] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Sync inputs with config changes
  useEffect(() => {
    setVideoUrl1Input(config.videoUrl1 || '');
    setSecondHomeTitleInput(config.secondHomeTitle || '');
    setScaleVideoUrlInput(config.scaleVideoUrl || '');
  }, [config.videoUrl1, config.secondHomeTitle, config.scaleVideoUrl]);

  // Tools & Maintenance State
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);
  const [isRestoringTransparency, setIsRestoringTransparency] = useState(false);
  const [toolNotice, setToolNotice] = useState<string | null>(null);
  const [isDownloadingApp, setIsDownloadingApp] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [importProgressText, setImportProgressText] = useState<string>('');
  const [importProgressPercent, setImportProgressPercent] = useState<number>(0);
  const [isExportingJson, setIsExportingJson] = useState(false);

  // PWA Hook and State
  const { isInstallable, isInstalled, isIOS, install: triggerPwaInstallHook } = usePWAInstall();
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [pwaQuickNotice, setPwaQuickNotice] = useState<string | null>(null);

  // Print Fossil State
  const [fossilToPrint, setFossilToPrint] = useState<Fossil | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load GitHub config on mount
  useEffect(() => {
    getGitHubConfig().then(saved => {
      setGithubConfig(saved);
      if (isGitHubConfigured(saved)) {
        setGithubStatus({
          state: 'idle',
          message: saved.lastSyncTime
            ? `Dernière synchronisation le ${new Date(saved.lastSyncTime).toLocaleDateString('fr-FR')} à ${new Date(saved.lastSyncTime).toLocaleTimeString('fr-FR')}`
            : 'Prêt pour la synchronisation'
        });
      }
    });
  }, []);

  // Filter fossils
  const filteredFossils = (config.fossils || []).filter(f => {
    if (!f) return false;
    const matchesSearch = 
      (f.title || '').toLowerCase().includes(fossilSearch.toLowerCase()) ||
      (f.reference || '').toLowerCase().includes(fossilSearch.toLowerCase()) ||
      (f.provenanceName || '').toLowerCase().includes(fossilSearch.toLowerCase()) ||
      (f.periodeDatation || '').toLowerCase().includes(fossilSearch.toLowerCase());
    
    if (fossilEraFilter === 'all') return matchesSearch;
    return matchesSearch && f.era === fossilEraFilter;
  });

  // Era counts
  const eraCounts = {
    total: config.fossils?.length || 0,
    precambrian: config.fossils?.filter(f => f.era === 'precambrian').length || 0,
    paleozoic: config.fossils?.filter(f => f.era === 'paleozoic').length || 0,
    mesozoic: config.fossils?.filter(f => f.era === 'mesozoic').length || 0,
    cenozoic: config.fossils?.filter(f => f.era === 'cenozoic').length || 0,
  };

  // Fossil CRUD Handlers
  const handleCreateNewFossil = () => {
    playDinoSound();
    const newFossil: Fossil = {
      id: `fossil_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: 'Nouveau Spécimen',
      era: fossilEraFilter === 'all' ? 'paleozoic' : fossilEraFilter,
      reference: '',
      description: '',
      descImages: [],
      dietText: '',
      dietImages: [],
      leFossileText: '',
      leFossileImage: { url: '', scale: 1, posX: 0, posY: 0 },
      saviezVousText: '',
      saviezVousImage: { url: '', scale: 1, posX: 0, posY: 0 },
      image: { url: '', scale: 1, posX: 0, posY: 0 },
      thumbnailImage: { url: '', scale: 1, posX: 0, posY: 0 },
      certificatImage: { url: '', scale: 1, posX: 0, posY: 0 },
      provenanceName: '',
      provenanceDate: '',
      periodeDatation: '',
      dateLieuAchat: '',
      prixAchat: '',
      lifespanPeriodStart: '',
      lifespanPeriodEnd: '',
      provenanceCoords: { lat: 46.2276, lng: 2.2137 }
    };
    setEditingFossil(newFossil);
  };

  const handleSaveFossil = async (saved: Fossil) => {
    const exists = config.fossils.some(f => f.id === saved.id);
    let updatedList = exists 
      ? config.fossils.map(f => f.id === saved.id ? saved : f)
      : [...config.fossils, saved];

    // Mirror to technical sheets
    const hasTechSheet = config.technicalSheets.some(s => s.id === saved.id);
    const techSheetData = {
      id: saved.id,
      fossilName: saved.title,
      fossilImage: saved.leFossileImage?.url ? saved.leFossileImage : (saved.thumbnailImage?.url ? saved.thumbnailImage : saved.image),
      provenanceDate: saved.provenanceDate || "",
      periodeDatation: saved.periodeDatation || "",
      dateLieuAchat: saved.dateLieuAchat || "",
      prixAchat: saved.prixAchat || "",
      certificatImage: saved.certificatImage || { url: '', scale: 1, posX: 0, posY: 0 }
    };

    let updatedSheets = hasTechSheet
      ? config.technicalSheets.map(s => s.id === saved.id ? techSheetData : s)
      : [...config.technicalSheets, techSheetData];

    await onUpdateConfig({
      ...config,
      fossils: updatedList,
      technicalSheets: updatedSheets
    });

    setEditingFossil(null);
    alert("✅ Spécimen enregistré avec succès !");
  };

  const handleDeleteFossil = async (fossilId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce spécimen ?")) {
      return;
    }
    const updatedFossils = config.fossils.filter(f => f.id !== fossilId);
    const updatedSheets = config.technicalSheets.filter(s => s.id !== fossilId);
    await onUpdateConfig({
      ...config,
      fossils: updatedFossils,
      technicalSheets: updatedSheets
    });
    setEditingFossil(null);
    alert("🗑️ Spécimen supprimé.");
  };

  const handleDuplicateFossil = async (f: Fossil) => {
    playDinoSound();
    const duplicated: Fossil = {
      ...f,
      id: `fossil_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: `${f.title} (Copie)`,
    };
    const updatedFossils = [...config.fossils, duplicated];
    const techSheetData = {
      id: duplicated.id,
      fossilName: duplicated.title,
      fossilImage: duplicated.leFossileImage || duplicated.thumbnailImage || duplicated.image,
      provenanceDate: duplicated.provenanceDate || "",
      periodeDatation: duplicated.periodeDatation || "",
      dateLieuAchat: duplicated.dateLieuAchat || "",
      prixAchat: duplicated.prixAchat || "",
      certificatImage: duplicated.certificatImage || { url: '', scale: 1, posX: 0, posY: 0 }
    };
    await onUpdateConfig({
      ...config,
      fossils: updatedFossils,
      technicalSheets: [...config.technicalSheets, techSheetData]
    });
    alert("📋 Spécimen dupliqué avec succès !");
  };

  // Test GitHub Connection
  const handleTestGitHub = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGitHubConnection(githubConfig);
      setTestResult({
        success: res.success,
        message: res.message,
        details: res.authenticatedUser ? `Connecté sous @${res.authenticatedUser}` : undefined
      });
      if (res.success) {
        playDinoSound();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erreur de communication : ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save GitHub Config
  const handleSaveGitHubConfig = async () => {
    const cleaned = {
      ...githubConfig,
      token: cleanGitHubToken(githubConfig.token || ''),
      owner: githubConfig.owner.trim(),
      repo: githubConfig.repo.trim(),
      branch: (githubConfig.branch || 'main').trim()
    };
    await saveGitHubConfig(cleaned);
    setGithubConfig(cleaned);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Push to GitHub with full live progress
  const handlePushToGitHub = async () => {
    if (!githubConfig.owner?.trim() || !githubConfig.repo?.trim()) {
      alert("Veuillez d'abord renseigner le compte GitHub et le nom du dépôt.");
      return;
    }
    if (!githubConfig.token?.trim()) {
      alert("Veuillez renseigner votre Token GitHub (PAT) pour pouvoir enregistrer en ligne.");
      return;
    }

    setIsPushing(true);
    setSyncOverallStatus('running');
    setSyncPercent(5);
    setSyncMessage('Démarrage de la synchronisation...');
    
    // Reset steps to pending
    setSyncSteps({
      1: { status: 'running', label: '1. Vérification des données et identifiants' },
      2: { status: 'pending', label: '2. Encodage et calcul d\'intégrité du fichier' },
      3: { status: 'pending', label: '3. Connexion et authentification GitHub' },
      4: { status: 'pending', label: '4. Téléversement et enregistrement du commit' },
      5: { status: 'pending', label: '5. Validation en ligne & mise à jour locale' }
    });

    try {
      const result = await pushToGitHub(
        config,
        githubConfig,
        undefined,
        (stepId, status, percent, label, errorDetail) => {
          setSyncPercent(percent);
          const safeLabel = typeof label === 'string' ? label : String(label || '');
          const safeError = errorDetail
            ? (typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail))
            : undefined;

          setSyncSteps(prev => ({
            ...prev,
            [stepId]: {
              status,
              label: `${stepId}. ${safeLabel}`,
              error: safeError
            }
          }));
          if (status === 'error') {
            setSyncMessage(safeError || safeLabel || 'Erreur lors de l\'étape');
          } else {
            setSyncMessage(safeLabel);
          }
        }
      );

      if (result.success) {
        setSyncOverallStatus('success');
        setSyncPercent(100);
        setSyncMessage('🎉 Synchronisation terminée avec succès sur GitHub !');
        playDinoSound();
        // Update local status timestamp
        const updated = {
          ...githubConfig,
          lastSyncTime: Date.now(),
          lastCommitSha: result.sha
        };
        await saveGitHubConfig(updated);
        setGithubConfig(updated);
        setGithubStatus({
          state: 'success',
          message: `Synchronisé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`
        });
      } else {
        setSyncOverallStatus('error');
        const errText = typeof result.error === 'string' ? result.error : (result.error ? JSON.stringify(result.error) : 'Erreur lors de la synchronisation.');
        setSyncMessage(errText);
      }
    } catch (err: any) {
      setSyncOverallStatus('error');
      setSyncMessage(String(err?.message || 'Échec de la connexion à GitHub.'));
    } finally {
      setIsPushing(false);
    }
  };

  // Pull from GitHub
  const handlePullFromGitHub = async () => {
    if (!window.confirm("Voulez-vous charger les données depuis GitHub ? Cela remplacera la collection actuellement chargée sur cet écran.")) {
      return;
    }
    setIsPulling(true);
    try {
      const res = await fetchFromGitHub(githubConfig);
      if (res.success && res.config) {
        await onImportConfig(res.config);
        playDinoSound();
        alert("✅ Collection mise à jour avec succès depuis GitHub !");
      } else {
        alert(`❌ Impossible de récupérer les données : ${res.error || 'Erreur inconnue'}`);
      }
    } catch (err: any) {
      alert(`❌ Erreur : ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  // Export JSON file (automatically compressed and optimized)
  const handleExportJSON = async () => {
    setIsExportingJson(true);
    try {
      playDinoSound();
      // Compress and optimize images before generating the file
      const optimized = await optimizeAppConfigImages(config);
      const dataStr = JSON.stringify(optimized, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fossiles_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.warn("Export optimization error, falling back to direct export:", err);
      const dataStr = JSON.stringify(config, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fossiles_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingJson(false);
    }
  };

  // Import JSON file with resilient parser, memory guard, and auto-repair
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingJson(true);
    setImportProgressText('Initialisation de la lecture du fichier...');
    setImportProgressPercent(5);

    try {
      const result = await readAndParseJsonFile(file, (percent, statusText) => {
        setImportProgressPercent(percent);
        setImportProgressText(statusText);
      });

      if (result.success && result.config) {
        await onImportConfig(result.config);
        playDinoSound();
        const msg = result.isRepaired
          ? `✅ Fichier volumineux récupéré et réparé avec succès !\n${result.recoveredCount || 0} fossiles restaurés et optimisés.`
          : `✅ Sauvegarde importée avec succès (${result.recoveredCount || 0} fossiles) !`;
        alert(msg);
      } else {
        alert(`❌ Erreur d'importation : ${result.error || 'Fichier invalide.'}`);
      }
    } catch (err: any) {
      alert(`❌ Erreur lors du traitement du fichier : ${err.message}`);
    } finally {
      setIsImportingJson(false);
      setImportProgressText('');
      setImportProgressPercent(0);
      e.target.value = '';
    }
  };

  // Download Standalone App
  const handleDownloadStandalone = async () => {
    setIsDownloadingApp(true);
    try {
      playDinoSound();
      window.location.href = "/telecharger";
    } catch (err: any) {
      alert(`Erreur lors du téléchargement : ${err.message}`);
    } finally {
      setIsDownloadingApp(false);
    }
  };

  // Optimize Images
  const handleOptimizeImages = async () => {
    setIsOptimizingImages(true);
    setToolNotice(null);
    try {
      playDinoSound();
      const optimized = await optimizeAllConfigImages(config);
      await onUpdateConfig(optimized);
      setToolNotice("✅ Toutes les photos ont été compressées et optimisées avec succès !");
    } catch (err: any) {
      setToolNotice(`❌ Erreur lors de l'optimisation : ${err.message}`);
    } finally {
      setIsOptimizingImages(false);
    }
  };

  // Handle PWA Installation trigger
  const handlePwaInstallAction = async () => {
    playDinoSound();
    const result = await triggerPwaInstallHook();
    if (result === 'accepted') {
      setPwaQuickNotice("✅ Application PWA installée avec succès sur votre appareil !");
    } else if (result === 'manual_ios') {
      setShowPwaModal(true);
    } else if (result === 'unsupported' || result === 'dismissed') {
      setShowPwaModal(true);
    }
  };

  // Handle printing a fossil sheet in Admin mode
  const handlePrintFossil = (fossil: Fossil) => {
    playDinoSound();
    setFossilToPrint(fossil);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // If currently editing a fossil, show the full edit form
  if (editingFossil) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <button
              onClick={() => {
                playDinoSound();
                setEditingFossil(null);
              }}
              className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la liste des fossiles
            </button>
            <span className="text-xs font-mono text-yellow-500 uppercase tracking-wider font-bold">
              Édition : {editingFossil.title || 'Nouveau spécimen'}
            </span>
          </div>

          <FossilDetailForm
            fossil={editingFossil}
            onSave={handleSaveFossil}
            onDelete={editingFossil.title ? () => handleDeleteFossil(editingFossil.id) : undefined}
            onCancel={() => {
              playDinoSound();
              setEditingFossil(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-yellow-600 selection:text-slate-950 font-sans pb-24">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Espace d'Administration
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-semibold">
                  Mode Éditeur Actif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conservatoire des Spécimens Fossiles • {eraCounts.total} spécimens enregistrés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* PWA INSTALL QUICK BUTTON */}
            <button
              onClick={handlePwaInstallAction}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer"
              title="Installer l'application sur smartphone (Android / iOS) ou ordinateur (PWA)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">{isInstalled ? "App Installée (PWA)" : "Installer l'App (PWA)"}</span>
              <span className="sm:hidden">PWA</span>
            </button>

            <button
              onClick={() => {
                playDinoSound();
                onNavigateToMuseum();
              }}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-600/20 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Revenir à l'Exposition
            </button>

            <button
              onClick={() => {
                playDinoSound();
                onExitAdmin();
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
              title="Verrouiller et quitter l'administration"
            >
              <Lock className="w-3.5 h-3.5" /> Quitter
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 border-t border-slate-800/60 pt-2 pb-2">
          <button
            onClick={() => { playDinoSound(); setActiveTab('fossils'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'fossils'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Layers className="w-4 h-4 text-yellow-500" />
            1. Collection des Fossiles ({eraCounts.total})
          </button>

          <button
            onClick={() => { playDinoSound(); setActiveTab('github'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            2. Sauvegarde & GitHub
            {githubConfig.owner && githubConfig.repo ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : null}
          </button>

          <button
            onClick={() => { playDinoSound(); setActiveTab('media'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'media'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Video className="w-4 h-4 text-rose-400" />
            3. Documentaires & Titres
          </button>

          <button
            onClick={() => { playDinoSound(); setActiveTab('tools'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            4. Maintenance & Outils
          </button>
        </div>
      </header>

      {/* HIDDEN JSON FILE INPUT FOR RESTORATION */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ========================================================= */}
        {/* TAB 1: GESTION DES FOSSILES */}
        {/* ========================================================= */}
        {activeTab === 'fossils' && (
          <div className="space-y-6">
            {/* TOP BAR: STATS & ADD BUTTON */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Total Spécimens</span>
                <span className="text-2xl font-bold text-white">{eraCounts.total}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-mono text-teal-400 uppercase">Précambrien</span>
                <span className="text-2xl font-bold text-teal-300">{eraCounts.precambrian}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-mono text-emerald-400 uppercase">Paléozoïque</span>
                <span className="text-2xl font-bold text-emerald-300">{eraCounts.paleozoic}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-mono text-amber-400 uppercase">Mésozoïque</span>
                <span className="text-2xl font-bold text-amber-300">{eraCounts.mesozoic}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase">Cénozoïque</span>
                <span className="text-2xl font-bold text-cyan-300">{eraCounts.cenozoic}</span>
              </div>
            </div>

            {/* CONTROLS BAR: SEARCH, ERA FILTER & ADD */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fossilSearch}
                    onChange={(e) => setFossilSearch(e.target.value)}
                    placeholder="Rechercher par nom, époque, lieu de provenance..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600"
                  />
                  {fossilSearch && (
                    <button
                      onClick={() => setFossilSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto">
                  {(['all', 'precambrian', 'paleozoic', 'mesozoic', 'cenozoic'] as const).map(era => (
                    <button
                      key={era}
                      onClick={() => setFossilEraFilter(era)}
                      className={`px-3 py-1.5 rounded-lg font-medium capitalize transition whitespace-nowrap cursor-pointer ${
                        fossilEraFilter === era
                          ? 'bg-yellow-600 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {era === 'all' ? 'Toutes les ères' : era}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateNewFossil}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Ajouter un Spécimen
              </button>
            </div>

            {/* FOSSILS LIST / TABLE */}
            {filteredFossils.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <Layers className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">Aucun spécimen trouvé</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Aucun fossile ne correspond à vos filtres actuels. Essayez de réinitialiser la recherche ou créez un nouveau spécimen.
                </p>
                <button
                  onClick={handleCreateNewFossil}
                  className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" /> Créer un spécimen maintenant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFossils.map((fossil) => {
                  const displayImg = fossil.thumbnailImage?.url ? fossil.thumbnailImage : (fossil.leFossileImage?.url ? fossil.leFossileImage : fossil.image);
                  
                  return (
                    <div
                      key={fossil.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* HEADER: ERA BADGE & TITLE */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                              fossil.era === 'precambrian' ? 'bg-teal-950 text-teal-400 border border-teal-800' :
                              fossil.era === 'paleozoic' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              fossil.era === 'mesozoic' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            }`}>
                              {fossil.era}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1 leading-tight line-clamp-1">
                              {fossil.title || 'Sans titre'}
                            </h3>
                            {fossil.reference && (
                              <p className="text-xs text-slate-400 font-mono line-clamp-1">
                                {fossil.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* IMAGE PREVIEW */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative">
                          {displayImg?.url ? (
                            <CroppedImage
                              settings={displayImg}
                              alt={fossil.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-slate-600 text-xs flex flex-col items-center gap-1">
                              <ImageIcon className="w-6 h-6" />
                              <span>Aucune photo</span>
                            </div>
                          )}
                        </div>

                        {/* METADATA */}
                        <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Période :</span>
                            <span className="font-medium text-slate-300 line-clamp-1">
                              {fossil.periodeDatation || fossil.lifespanPeriodStart || 'Non renseignée'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Provenance :</span>
                            <span className="font-medium text-slate-300 line-clamp-1">
                              {fossil.provenanceName || 'Non renseignée'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            playDinoSound();
                            setEditingFossil(fossil);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Modifier
                        </button>

                        <button
                          onClick={() => handlePrintFossil(fossil)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 border border-slate-700 hover:border-yellow-600/50 rounded-xl text-xs transition cursor-pointer"
                          title="Imprimer la fiche de ce fossile (A4 / PDF)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateFossil(fossil)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
                          title="Dupliquer ce fossile"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteFossil(fossil.id)}
                          className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/50 rounded-xl text-xs transition cursor-pointer"
                          title="Supprimer ce fossile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SAUVEGARDE & GITHUB */}
        {/* ========================================================= */}
        {activeTab === 'github' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            
            {/* SECTION 1: SYNCHRONISATION GITHUB EN 1 CLIC */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
                    <Cloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Enregistrement en Ligne (GitHub)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sauvegarde automatique et permanente de toute votre exposition sur votre dépôt GitHub.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {githubConfig.lastSyncTime ? (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full inline-block">
                      Dernière synchro : {new Date(githubConfig.lastSyncTime).toLocaleDateString('fr-FR')} à {new Date(githubConfig.lastSyncTime).toLocaleTimeString('fr-FR')}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-full inline-block">
                      Pas encore synchronisé
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION BUTTON: PUSH TO GITHUB */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePushToGitHub}
                  disabled={isPushing}
                  className={`flex-1 flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-600/20 active:scale-98 cursor-pointer ${
                    isPushing ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  {isPushing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Synchronisation en cours... ({syncPercent}%)
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-5 h-5" />
                      Enregistrer tout sur GitHub maintenant
                    </>
                  )}
                </button>

                <button
                  onClick={handlePullFromGitHub}
                  disabled={isPulling || isPushing}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
                >
                  {isPulling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4 text-sky-400" />
                  )}
                  Charger depuis GitHub
                </button>
              </div>

              {/* LIVE STEP BY STEP VALIDATION DISPLAY */}
              {(syncOverallStatus !== 'idle' || isPushing) && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      {syncOverallStatus === 'running' && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
                      {syncOverallStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {syncOverallStatus === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                      Progression de l'Enregistrement ({syncPercent}%)
                    </span>
                    <span className="text-xs font-mono text-slate-400">{syncMessage}</span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        syncOverallStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${syncPercent}%` }}
                    />
                  </div>

                  {/* 5 DETAILED STEPS */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                    {([1, 2, 3, 4, 5] as SyncStepId[]).map((stepId) => {
                      const step = syncSteps?.[stepId] || { status: 'pending', label: `Étape ${stepId}` };
                      const status = step.status || 'pending';
                      const label = typeof step.label === 'string' ? step.label : String(step.label || '');
                      const error = step.error ? (typeof step.error === 'string' ? step.error : JSON.stringify(step.error)) : undefined;

                      return (
                        <div
                          key={stepId}
                          className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                            status === 'success'
                              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                              : status === 'running'
                              ? 'bg-sky-950/50 border-sky-600/70 text-sky-200 animate-pulse'
                              : status === 'error'
                              ? 'bg-rose-950/50 border-rose-700/70 text-rose-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Étape {stepId}</span>
                            {status === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            {status === 'running' && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                            {status === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                          <p className="text-[11px] leading-tight opacity-90 break-words">
                            {label || `Étape ${stepId}`}
                          </p>
                          {error && (
                            <p className="text-[10px] text-rose-400 font-mono mt-1 break-words">
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONFIGURATION FORM */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-yellow-500" />
                    Paramètres de Connexion GitHub
                  </h3>
                  {saveSuccessNotice && (
                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                      ✅ Paramètres enregistrés !
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom d'utilisateur GitHub (Owner) :
                    </label>
                    <input
                      type="text"
                      value={githubConfig.owner}
                      onChange={(e) => setGithubConfig({ ...githubConfig, owner: e.target.value })}
                      placeholder="ex: VotreNomUtilisateur"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom du Dépôt (Repository) :
                    </label>
                    <input
                      type="text"
                      value={githubConfig.repo}
                      onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                      placeholder="ex: conservatoire-de-fossiles"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Token GitHub (Personal Access Token) :
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?description=Conservatoire%20Fossiles&scopes=repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-yellow-500 hover:underline flex items-center gap-1"
                      >
                        Créer un token en 1 clic <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={githubConfig.token}
                        onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                        placeholder="ghp_... ou github_pat_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Branche cible (Défaut : main) :
                    </label>
                    <input
                      type="text"
                      value={githubConfig.branch || 'main'}
                      onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })}
                      placeholder="main"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-600 font-mono"
                    />
                  </div>
                </div>

                {/* TEST RESULT MESSAGE */}
                {testResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.details && <p className="text-[11px] opacity-80 mt-0.5">{testResult.details}</p>}
                    </div>
                  </div>
                )}

                {/* BUTTONS: TEST & SAVE */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={handleTestGitHub}
                    disabled={isTesting}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-sky-400" />}
                    Tester la connexion maintenant
                  </button>

                  <button
                    onClick={handleSaveGitHubConfig}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Enregistrer les paramètres
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: SAUVEGARDE LOCALE (FICHIERS JSON & APPLICATION AUTONOME) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-500">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Sauvegardes et Fichiers Locaux
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Téléchargez ou restaurez vos fiches sous forme de fichier sur votre ordinateur.
                  </p>
                </div>
              </div>

              {/* IMPORT/EXPORT REAL-TIME PROGRESS BANNER */}
              {(isImportingJson || isExportingJson) && (
                <div className="p-4 bg-sky-950/60 border border-sky-600/70 rounded-xl space-y-2 text-sky-200 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      {isImportingJson ? 'Importation & Décompression en cours...' : 'Optimisation & Téléchargement du JSON...'}
                    </span>
                    {isImportingJson && importProgressPercent > 0 && (
                      <span className="font-mono">{importProgressPercent}%</span>
                    )}
                  </div>
                  {isImportingJson && importProgressText && (
                    <p className="text-[11px] text-sky-300 opacity-90">{importProgressText}</p>
                  )}
                  {isImportingJson && importProgressPercent > 0 && (
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-400 h-full transition-all duration-300"
                        style={{ width: `${importProgressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleExportJSON}
                  disabled={isExportingJson || isImportingJson}
                  className="flex flex-col items-center text-center gap-3 bg-slate-950 border border-slate-800 hover:border-yellow-500/50 p-5 rounded-2xl transition group cursor-pointer disabled:opacity-50"
                >
                  {isExportingJson ? (
                    <Loader2 className="w-7 h-7 text-yellow-500 animate-spin" />
                  ) : (
                    <Download className="w-7 h-7 text-yellow-500 group-hover:scale-110 transition" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isExportingJson ? 'Optimisation...' : 'Télécharger Sauvegarde'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Export optimisé et léger de toutes les fiches (.json)</p>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExportingJson || isImportingJson}
                  className="flex flex-col items-center text-center gap-3 bg-slate-950 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl transition group cursor-pointer disabled:opacity-50"
                >
                  {isImportingJson ? (
                    <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7 text-sky-400 group-hover:scale-110 transition" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isImportingJson ? 'Importation en cours...' : 'Restaurer Sauvegarde'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Importer et réparer un fichier .json depuis votre appareil</p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadStandalone}
                  disabled={isDownloadingApp || isExportingJson || isImportingJson}
                  className="flex flex-col items-center text-center gap-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition group cursor-pointer disabled:opacity-50"
                >
                  <FileCode className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Application Autonome (HTML)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Fichier unique tout-en-un pour consultation hors-ligne</p>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION 3: APPLICATION MOBILE & PROGRESSIVE WEB APP (PWA) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">
                        Application Mobile & PWA (Installation Directe)
                      </h2>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-semibold">
                        Hors-Ligne 100%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Installez l'application sur smartphone (Android / iPhone) ou ordinateur. Elle se range dans vos applications mobiles et fonctionne sans internet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                    {isInstalled ? "Statut : Application Installée" : "Statut : Prête à l'installation"}
                  </span>
                </div>
              </div>

              {pwaQuickNotice && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-600/70 rounded-xl text-emerald-200 text-xs font-semibold flex items-center justify-between">
                  <span>{pwaQuickNotice}</span>
                  <button 
                    onClick={() => setPwaQuickNotice(null)}
                    className="text-slate-400 hover:text-white text-[11px] underline ml-2 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}

              {/* FEATURES HIGHLIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    Véritable Application Mobile
                  </div>
                  <p className="text-[11px] text-slate-300">
                    S'installe sur votre écran d'accueil et dans votre tiroir d'applications avec son icône dorée officielle.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Plein Écran & Hors-Ligne
                  </div>
                  <p className="text-[11px] text-slate-300">
                    S'ouvre sans barre d'adresse de navigateur et reste 100% utilisable même dans les zones sans réseau ni Wi-Fi.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4" />
                    Synchronisation Automatique
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Les modifications et sauvegardes GitHub se synchronisent automatiquement lors du retour d'une connexion.
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    playDinoSound();
                    setShowPwaModal(true);
                  }}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold p-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Installer l'Application Mobile</span>
                </button>

                <button
                  onClick={() => {
                    playDinoSound();
                    window.open(window.location.origin, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-3 bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-amber-500/60 text-slate-200 font-bold p-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  <ExternalLink className="w-5 h-5 text-amber-400" />
                  <span>Ouvrir dans Chrome / Safari (Plein Écran)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MÉDIAS & ACCUEIL */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {mediaSaveNotice && (
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{mediaSaveNotice}</span>
                </div>
                <button
                  onClick={() => setMediaSaveNotice(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* WELCOME VIDEO ZONE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Video className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Documentaire d'Accueil (Page 1)</h3>
                  <p className="text-xs text-slate-400">Vidéo présentée en page de bienvenue pour les visiteurs.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Lien de la vidéo (YouTube, MP4, etc.) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl1Input}
                    onChange={(e) => setVideoUrl1Input(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-600"
                  />
                  <button
                    onClick={async () => {
                      playDinoSound();
                      await onUpdateConfig({ ...config, videoUrl1: videoUrl1Input.trim() });
                      setMediaSaveNotice("✅ Vidéo d'accueil enregistrée et synchronisée avec le serveur et tous vos appareils !");
                      setTimeout(() => setMediaSaveNotice(null), 5000);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>

            {/* SECOND HOME TITLE ZONE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Edit3 className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Titre de la Page de Sélection (Page 2)</h3>
                  <p className="text-xs text-slate-400">Personnalisez le grand titre qui apparaît sur la page des ères.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Titre personnalisé :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secondHomeTitleInput}
                    onChange={(e) => setSecondHomeTitleInput(e.target.value)}
                    placeholder="Ma Collection de Fossiles"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-600"
                  />
                  <button
                    onClick={async () => {
                      playDinoSound();
                      await onUpdateConfig({ ...config, secondHomeTitle: secondHomeTitleInput.trim() });
                      setMediaSaveNotice("✅ Titre personnalisé mis à jour et synchronisé !");
                      setTimeout(() => setMediaSaveNotice(null), 5000);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>

            {/* TIMELINE VIDEO ZONE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Video className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Vidéo de la Frise Chronologique</h3>
                  <p className="text-xs text-slate-400">Documentaire sur l'échelle des temps géologiques.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Lien de la vidéo frise (YouTube, MP4, etc.) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scaleVideoUrlInput}
                    onChange={(e) => setScaleVideoUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-600"
                  />
                  <button
                    onClick={async () => {
                      playDinoSound();
                      await onUpdateConfig({ ...config, scaleVideoUrl: scaleVideoUrlInput.trim() });
                      setMediaSaveNotice("✅ Vidéo de la frise mise à jour et synchronisée avec le serveur et tous vos appareils !");
                      setTimeout(() => setMediaSaveNotice(null), 5000);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MAINTENANCE & OUTILS */}
        {/* ========================================================= */}
        {activeTab === 'tools' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Outils & Optimisation des Données
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Maintenez votre conservatoire rapide, léger et fluide.
                  </p>
                </div>
              </div>

              {toolNotice && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
                  {toolNotice}
                </div>
              )}

              <div className="space-y-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Compression & Optimisation des Photos</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Compresse automatiquement les images en haute définition pour réduire le poids de la sauvegarde et accélérer les chargements.
                    </p>
                  </div>
                  <button
                    onClick={handleOptimizeImages}
                    disabled={isOptimizingImages}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition whitespace-nowrap cursor-pointer"
                  >
                    {isOptimizingImages ? 'Optimisation en cours...' : 'Optimiser les photos'}
                  </button>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Réinitialisation des Données</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Remet à zéro la collection locale si vous souhaitez repartir sur une base vierge.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("⚠️ Attention : Voulez-vous vraiment effacer tous les fossiles et repartir de zéro ? Pensez à exporter une sauvegarde avant !")) {
                        await onUpdateConfig({
                          ...config,
                          fossils: [],
                          technicalSheets: []
                        });
                        alert("Base réinitialisée.");
                      }
                    }}
                    className="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition whitespace-nowrap cursor-pointer"
                  >
                    Vider la collection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PWA INSTALLATION GUIDE MODAL */}
      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />

      {/* PRINT TEMPLATE FOR ADMIN */}
      {fossilToPrint && (
        <FossilPrintTemplate fossil={fossilToPrint} />
      )}
    </div>
  );
}
