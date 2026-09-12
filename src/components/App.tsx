import React, { useState, useEffect, useRef } from "react";
import { getSafeEmbedUrl } from "../utils/data/videoEmbed";
import UniversalVideoPlayer from "./UniversalVideoPlayer";
import { AnimatePresence, motion } from "motion/react";
import { AppConfig, Fossil, TechnicalSheetRow, ImageSettings } from "../types";
import { loadAppConfig, saveAppConfig, DEFAULT_CONFIG } from "../persistence";
import { optimizeAllConfigImages } from "../utils/data/imageOptimizer";
import { playDinoSound } from "../utils/data/audio";
import { sortFossilsChronologically } from "../utils/chronology";
import { safeLocalStorage, safeSessionStorage } from "../utils/safeStorage";
import AdminPanel from "./AdminPanel";
import AdminPageView from "./AdminPageView";
import CroppedImage from "./CroppedImage";
import ImageAdjuster from "../utils/data/ImageAdjuster";
import GeologicTimelineView from "./GeologicTimelineView";
import TechnicalSheetsView from "../utils/TechnicalSheetsView";
import FossilDetailForm from "./FossilDetailForm";
import FossilSelectorAndCarousel from "./FossilSelectorAndCarousel";
import {
  TrilobiteIcon,
  AmmoniteIcon,
  MammothIcon,
  MicrobeIcon,
} from "../utils/data/PeriodIcons";
import {
  Lock,
  ShieldCheck,
  Video,
  RefreshCw,
  Home,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Download,
  Smartphone,
  Search,
  LayoutGrid,
  Grid,
  Tag,
  Layers,
} from "lucide-react";
import { usePWAInstall } from "../utils/pwa";
import CompleteGalleryView from "./CompleteGalleryView";

// Initialize global standalone mode detector to separate local file preview from active server context
if (typeof window !== "undefined") {
  const proto = window.location.protocol;
  (window as any).__IS_STANDALONE__ = proto === "file:";
}

export default function App() {
  const { isInstalled, install } = usePWAInstall();
  const [isSheetsUnlocked, setIsSheetsUnlocked] = useState(() => {
    return safeSessionStorage.getItem("sheets_unlocked") === "true";
  });
  const [sheetsPassword, setSheetsPassword] = useState("");
  const [sheetsAuthError, setSheetsAuthError] = useState(false);

  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homeVideoInput, setHomeVideoInput] = useState("");
  const [secondHomeTitleInput, setSecondHomeTitleInput] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const latestConfigRef = useRef<AppConfig | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);

  // Auto cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  const [view, setView] = useState<
    | "welcome"
    | "secondHome"
    | "era_precambrian"
    | "era_paleozoic"
    | "era_mesozoic"
    | "era_cenozoic"
    | "timeline"
    | "sheets"
    | "admin"
    | "gallery"
  >("welcome");
  const [editingFossil, setEditingFossil] = useState<Fossil | null>(null);
  const [gallerySearch, setGallerySearch] = useState<string>("");
  const [galleryFossilId, setGalleryFossilId] = useState<string | null>(null);
  const [quickRefInput, setQuickRefInput] = useState<string>("");

  const openGalleryWithSearch = (search: string = "", fossilId: string | null = null) => {
    playDinoSound();
    setGallerySearch(search);
    setGalleryFossilId(fossilId);
    setView("gallery");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHomeReferenceSearch = (refText: string) => {
    const clean = refText.trim();
    if (!clean) {
      openGalleryWithSearch();
      return;
    }
    const exactMatch = config.fossils.find(
      (f) => (f.reference || "").trim().toLowerCase() === clean.toLowerCase()
    );
    if (exactMatch) {
      openGalleryWithSearch(clean, exactMatch.id);
    } else {
      openGalleryWithSearch(clean, null);
    }
  };

  // Load configuration from local storage on mount
  useEffect(() => {
    loadAppConfig().then((loaded) => {
      if (loaded) {
        const sanitized: AppConfig = {
          ...loaded,
          fossils: (loaded.fossils || []).map((f) => {
            const mainImg = f.image ? { ...f.image } : { url: "", scale: 1, posX: 0, posY: 0 };
            return {
              ...f,
              image: mainImg,
              thumbnailImage: { ...mainImg },
              saviezVousImage: { url: "", scale: 1, posX: 0, posY: 0 },
            };
          }),
        };
        setConfig(sanitized);
        latestConfigRef.current = sanitized;
        if (loaded.videoUrl1) {
          setHomeVideoInput(loaded.videoUrl1);
        }
        if (loaded.secondHomeTitle) {
          setSecondHomeTitleInput(loaded.secondHomeTitle);
        }
      }
    });
  }, []);

  // Update homeVideoInput when config.videoUrl1 changes (e.g. on import or edit)
  useEffect(() => {
    if (config.videoUrl1) {
      setHomeVideoInput(config.videoUrl1);
    }
  }, [config.videoUrl1]);

  // Update secondHomeTitleInput when config.secondHomeTitle changes
  useEffect(() => {
    if (config.secondHomeTitle !== undefined) {
      setSecondHomeTitleInput(config.secondHomeTitle || "");
    }
  }, [config.secondHomeTitle]);

  const handleSheetsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctAdminPass = config.adminPassword?.trim() || "250993";
    if (sheetsPassword.trim() === "250993" || sheetsPassword.trim() === correctAdminPass) {
      safeSessionStorage.setItem("sheets_unlocked", "true");
      setIsSheetsUnlocked(true);
      setSheetsAuthError(false);
      setSheetsPassword("");
      try {
        playDinoSound();
      } catch (err) {
        console.warn("Audio play blocked", err);
      }
    } else {
      setSheetsAuthError(true);
    }
  };

  // Helper to ensure absolute bi-directional synchronization between fossils and technicalSheets
  const syncConfigData = (currentConfig: AppConfig): AppConfig => {
    if (!currentConfig) return DEFAULT_CONFIG;
    
    let fossils = Array.isArray(currentConfig.fossils) ? [...currentConfig.fossils] : [];
    let sheets = Array.isArray(currentConfig.technicalSheets) ? [...currentConfig.technicalSheets] : [];
    let changed = false;

    // Helper functions for optimized comparisons (no slow JSON.stringify on base64 images)
    const normalizeImg = (img: any): ImageSettings => {
      if (!img) return { url: "", scale: 1, posX: 0, posY: 0 };
      if (typeof img === "string") return { url: img, scale: 1, posX: 0, posY: 0 };
      return {
        url: img.url || "",
        scale: img.scale ?? 1,
        posX: img.posX ?? 0,
        posY: img.posY ?? 0
      };
    };

    const isImgEqual = (a: any, b: any): boolean => {
      const nA = normalizeImg(a);
      const nB = normalizeImg(b);
      return nA.url === nB.url && nA.scale === nB.scale && nA.posX === nB.posX && nA.posY === nB.posY;
    };

    // 1. Every fossil must have a sheet. If missing, create one.
    // Also, if present, ensure key matching data fields are in absolute sync.
    for (let i = 0; i < fossils.length; i++) {
      const f = fossils[i];
      if (!f || !f.id) continue;
      
      const sheetIndex = sheets.findIndex((s) => s && s.id === f.id);
      
      const currentSheet = sheetIndex !== -1 ? sheets[sheetIndex] : null;
      
      const expectedImage = f.leFossileImage?.url 
        ? f.leFossileImage 
        : (currentSheet?.fossilImage?.url 
            ? currentSheet.fossilImage 
            : (f.thumbnailImage?.url ? f.thumbnailImage : f.image));

      const expectedPeriod = f.periodeDatation || 
        (f.lifespanPeriodStart ? 
          (f.lifespanPeriodEnd ? `${f.lifespanPeriodStart} - ${f.lifespanPeriodEnd}` : f.lifespanPeriodStart) 
          : (currentSheet?.periodeDatation || ""));

      const expectedProvenance = f.provenanceDate || (currentSheet?.provenanceDate || "");
      const expectedDateLieuAchat = f.dateLieuAchat || (currentSheet?.dateLieuAchat || "");
      const expectedPrixAchat = f.prixAchat || (currentSheet?.prixAchat || "");
      const expectedCertificat = f.certificatImage?.url 
        ? f.certificatImage 
        : (currentSheet?.certificatImage?.url ? currentSheet.certificatImage : f.certificatImage);

      const expectedSheetData: TechnicalSheetRow = {
        id: f.id,
        fossilName: f.title || "Fossile sans nom",
        fossilImage: normalizeImg(expectedImage),
        provenanceDate: expectedProvenance,
        periodeDatation: expectedPeriod,
        dateLieuAchat: expectedDateLieuAchat,
        prixAchat: expectedPrixAchat,
        certificatImage: normalizeImg(expectedCertificat)
      };

      if (sheetIndex === -1) {
        sheets.push(expectedSheetData);
        changed = true;
      } else {
        const s = sheets[sheetIndex];
        if (!s) continue;
        
        if (
          (s.fossilName || "") !== expectedSheetData.fossilName ||
          (s.provenanceDate || "") !== expectedSheetData.provenanceDate ||
          (s.periodeDatation || "") !== expectedSheetData.periodeDatation ||
          (s.dateLieuAchat || "") !== expectedSheetData.dateLieuAchat ||
          (s.prixAchat || "") !== expectedSheetData.prixAchat ||
          !isImgEqual(s.fossilImage, expectedSheetData.fossilImage) ||
          !isImgEqual(s.certificatImage, expectedSheetData.certificatImage)
        ) {
          sheets[sheetIndex] = {
            ...s,
            fossilName: expectedSheetData.fossilName,
            provenanceDate: expectedSheetData.provenanceDate,
            periodeDatation: expectedSheetData.periodeDatation,
            dateLieuAchat: expectedSheetData.dateLieuAchat,
            prixAchat: expectedSheetData.prixAchat,
            fossilImage: expectedSheetData.fossilImage,
            certificatImage: expectedSheetData.certificatImage
          };
          changed = true;
        }
      }
    }

    // 2. Only sync sheet data back to the matching fossil if a matching fossil exists
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      if (!s || !s.id) continue;
      
      const fossilIndex = fossils.findIndex((f) => f && f.id === s.id);
      if (fossilIndex !== -1) {
        const f = fossils[fossilIndex];
        if (!f) continue;

        if (
          (f.title || "") !== s.fossilName ||
          (f.provenanceDate || "") !== s.provenanceDate ||
          (f.periodeDatation || "") !== s.periodeDatation ||
          (f.dateLieuAchat || "") !== s.dateLieuAchat ||
          (f.prixAchat || "") !== s.prixAchat ||
          !isImgEqual(f.leFossileImage, s.fossilImage) ||
          !isImgEqual(f.certificatImage, s.certificatImage)
        ) {
          fossils[fossilIndex] = {
            ...f,
            title: s.fossilName || f.title,
            provenanceDate: s.provenanceDate || f.provenanceDate,
            periodeDatation: s.periodeDatation || f.periodeDatation,
            dateLieuAchat: s.dateLieuAchat || f.dateLieuAchat,
            prixAchat: s.prixAchat || f.prixAchat,
            leFossileImage: normalizeImg(s.fossilImage),
            certificatImage: normalizeImg(s.certificatImage)
          };
          changed = true;
        }
      }
    }

    if (changed || !Array.isArray(currentConfig.fossils) || !Array.isArray(currentConfig.technicalSheets)) {
      return {
        ...currentConfig,
        fossils,
        technicalSheets: sheets
      };
    }
    return currentConfig;
  };

  // Update local state instantly and debounce save to persistent storage (IndexedDB, linked file handle, and server)
  // This completely eliminates lags and character deletion while typing!
  const updateConfig = (newConfig: AppConfig) => {
    // 1. Update the local UI state instantly (NO redundant keypress/slider syncConfigData call!)
    setConfig(newConfig);
    latestConfigRef.current = newConfig;

    // 2. Cancel any pending save timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 3. Queue auto-save to execute 1.5 seconds after the last modification
    saveTimeoutRef.current = setTimeout(async () => {
      const executeSave = async () => {
        if (isSavingRef.current) {
          // If a save operation is already active, flag that we have a pending update and defer
          pendingSaveRef.current = true;
          return;
        }

        const configToSave = latestConfigRef.current;
        if (!configToSave) return;

        isSavingRef.current = true;
        pendingSaveRef.current = false;

        try {
          const saved = await saveAppConfig(configToSave);
          // Only update state if no newer updates have been queued in the meantime
          if (saved && latestConfigRef.current === configToSave) {
            setConfig(saved);
            latestConfigRef.current = saved;
          }
        } catch (err) {
          console.warn("Failed to auto-save configuration:", err);
        } finally {
          isSavingRef.current = false;
          // If another save was queued while we were executing, trigger it shortly
          if (pendingSaveRef.current) {
            setTimeout(executeSave, 100);
          }
        }
      };

      executeSave();
    }, 1500);
  };

  // Instant save version to write directly upon button clicks (Fossil save, delete, etc.)
  const updateConfigInstant = async (newConfig: AppConfig) => {
    // 1. Update state instantly
    setConfig(newConfig);
    latestConfigRef.current = newConfig;

    // 2. Cancel any pending save timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const executeInstantSave = async () => {
      if (isSavingRef.current) {
        // If a save is already in progress, retry shortly
        setTimeout(executeInstantSave, 100);
        return;
      }

      isSavingRef.current = true;
      try {
        const saved = await saveAppConfig(newConfig);
        if (saved && latestConfigRef.current === newConfig) {
          setConfig(saved);
          latestConfigRef.current = saved;
        }
      } catch (err) {
        console.warn("Failed to save configuration immediately:", err);
      } finally {
        isSavingRef.current = false;
      }
    };

    executeInstantSave();
  };

  const handleImportConfig = async (newConfig: AppConfig) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    try {
      // Asynchronously compress and optimize all heavy base64 images from the imported configuration
      const optimized = await optimizeAllConfigImages(newConfig);
      
      const synced = syncConfigData(optimized);
      setConfig(synced);
      latestConfigRef.current = synced;

      const saved = await saveAppConfig(synced);
      if (saved) {
        const syncedSaved = syncConfigData(saved);
        setConfig(syncedSaved);
        latestConfigRef.current = syncedSaved;
      }
    } catch (err) {
      console.error("Failed to save or optimize imported config:", err);
      // Fail-safe fallback: import without optimization if there's any runtime error
      const synced = syncConfigData(newConfig);
      setConfig(synced);
      latestConfigRef.current = synced;
      saveAppConfig(synced).catch(() => {});
    }
  };



  // Sound triggering navigation helper
  const navigateTo = (targetView: typeof view) => {
    playDinoSound();
    setView(targetView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fossil editing handlers
  const handleSaveFossil = async (fossil: Fossil) => {
    const cleanFossil: Fossil = {
      ...fossil,
      thumbnailImage: fossil.image ? { ...fossil.image } : { url: '', scale: 1, posX: 0, posY: 0 },
      saviezVousImage: { url: '', scale: 1, posX: 0, posY: 0 }
    };
    const exists = config.fossils.some((f) => f.id === cleanFossil.id);
    let updatedList: Fossil[];
    if (exists) {
      updatedList = config.fossils.map((f) =>
        f.id === cleanFossil.id ? cleanFossil : f,
      );
    } else {
      updatedList = [...config.fossils, cleanFossil];
    }
    updatedList = sortFossilsChronologically(updatedList);

    // Mirror to Technical Sheets
    const hasTechSheet = config.technicalSheets.some((s) => s.id === fossil.id);
    const techSheetData = {
      id: fossil.id,
      fossilName: fossil.title,
      fossilImage: (fossil.leFossileImage?.url) ? fossil.leFossileImage : (fossil.thumbnailImage?.url ? fossil.thumbnailImage : fossil.image),
      provenanceDate: fossil.provenanceDate || "",
      periodeDatation: fossil.periodeDatation || 
        (fossil.lifespanPeriodStart ? 
          (fossil.lifespanPeriodEnd ? `${fossil.lifespanPeriodStart} - ${fossil.lifespanPeriodEnd}` : fossil.lifespanPeriodStart) 
          : ""),
      dateLieuAchat: fossil.dateLieuAchat || "",
      prixAchat: fossil.prixAchat || "",
      certificatImage: fossil.certificatImage || { url: '', scale: 1, posX: 0, posY: 0 }
    };
    
    let updatedSheets = [...config.technicalSheets];
    if (hasTechSheet) {
      updatedSheets = updatedSheets.map((s) => s.id === fossil.id ? techSheetData : s);
    } else {
      updatedSheets = [...updatedSheets, techSheetData];
    }

    const newConfig = {
      ...config,
      fossils: updatedList,
      technicalSheets: updatedSheets,
    };
    
    setEditingFossil(null);
    await updateConfigInstant(newConfig);
    alert(
      "Fossile sauvegardé localement sur cet appareil !",
    );
  };

  const handleDeleteFossil = async (id: string) => {
    const newConfig = {
      ...config,
      fossils: config.fossils.filter((f) => f.id !== id),
      technicalSheets: config.technicalSheets.filter((s) => s.id !== id),
    };
    
    setEditingFossil(null);
    await updateConfigInstant(newConfig);
    alert("Fossile supprimé avec succès de cet appareil !");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-yellow-600 selection:text-slate-950">
      {/* BACKGROUND DECORATIVE PNG CANVASES / GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-radial from-yellow-900/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-radial from-emerald-900/10 to-transparent pointer-events-none -z-10" />

      {/* ADMIN STATE TOGGLE & FLOATING PANEL */}
      {view !== "admin" && (
        <AdminPanel
          isAdmin={isAdmin}
          onToggleAdmin={setIsAdmin}
          onOpenAdminPage={() => {
            playDinoSound();
            setView("admin");
          }}
          config={config}
          onImportConfig={handleImportConfig}
        />
      )}

      {/* PRIMARY TRANSITIONAL VIEWPORT */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {/* ==================== PAGE 1: WELCOME SCREEN ==================== */}
          {view === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 py-10"
            >
              {/* No Title at top on general Page 1 header per guidelines */}

              {/* VIDEO ZONE FOR WELCOME PAGE - ONLY EDITABLE BY ADMIN */}
              <div className="w-full max-w-3xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-600/90 font-mono text-xs uppercase tracking-wider">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>DOCUMENTAIRE DE BIENVENUE</span>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] bg-yellow-950/40 text-yellow-500 border border-yellow-700/30 rounded px-2 py-0.5 uppercase tracking-widest font-bold">
                      Gestion Vidéo Admin
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-yellow-600/20 space-y-3">
                    <div className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider">
                      Source Vidéo (Accueil)
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* URL input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateConfigInstant({ ...config, videoUrl1: homeVideoInput.trim() });
                          alert("✅ Source vidéo enregistrée et synchronisée !");
                        }}
                        className="flex-1 space-y-1"
                      >
                        <label className="block text-[10px] text-slate-400 font-medium">
                          Option A : Lien Internet (YouTube, Drive, MP4...)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-yellow-600/60"
                            placeholder="Collez l'URL de la vidéo (YouTube, etc.)...."
                            value={homeVideoInput?.startsWith('data:') ? '' : homeVideoInput}
                            onChange={(e) => setHomeVideoInput(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 px-4 py-1.5 rounded text-xs font-semibold text-white uppercase tracking-wider"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </form>

                      {/* Local File input button */}
                      <div className="space-y-1 sm:w-64">
                        <label className="block text-[10px] text-slate-400 font-medium">
                          Option B : Charger depuis la Galerie (Hors-ligne)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="video/*"
                            id="home-video-upload"
                            className="hidden"
                            disabled={isUploadingVideo}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              // Check size
                              const sizeInMB = file.size / (1024 * 1024);
                              if (sizeInMB > 30) {
                                if (!window.confirm(`⚠️ Cette vidéo est volumineuse (${sizeInMB.toFixed(1)} Mo). \nL'intégrer directement dans la mémoire peut ralentir l'appareil. Nous vous conseillons de choisir une vidéo plus courte ou compressée (< 15 Mo).\n\nVoulez-vous quand même continuer ?`)) {
                                  e.target.value = '';
                                  return;
                                }
                              }
                              
                              try {
                                playDinoSound();
                              } catch(err) {}

                              setIsUploadingVideo(true);
                              
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json"
                                      },
                                      body: JSON.stringify({ dataUrl })
                                    });

                                    if (res.ok) {
                                      const data = await res.json();
                                      if (data.success && data.url) {
                                        updateConfig({ ...config, videoUrl1: data.url });
                                        alert("✅ Vidéo de la galerie synchronisée avec succès sur le serveur !");
                                      } else {
                                        updateConfig({ ...config, videoUrl1: dataUrl });
                                        alert("✅ Vidéo chargée localement (Base64).");
                                      }
                                    } else {
                                      updateConfig({ ...config, videoUrl1: dataUrl });
                                      alert("✅ Vidéo chargée localement (Base64).");
                                    }
                                  } catch (err) {
                                    console.error("Video upload failed:", err);
                                    updateConfig({ ...config, videoUrl1: dataUrl });
                                    alert("✅ Vidéo chargée localement en secours (Base64).");
                                  } finally {
                                    setIsUploadingVideo(false);
                                  }
                                } else {
                                  setIsUploadingVideo(false);
                                }
                              };
                              reader.onerror = () => {
                                setIsUploadingVideo(false);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <label
                            htmlFor="home-video-upload"
                            className={`w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded px-3 py-2 text-xs font-semibold cursor-pointer transition-all active:scale-95 text-center ${isUploadingVideo ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                          >
                            <Upload className={`w-3.5 h-3.5 text-yellow-500 ${isUploadingVideo ? 'animate-bounce' : ''}`} />
                            {isUploadingVideo ? 'Téléchargement...' : (config.videoUrl1?.startsWith('data:') || config.videoUrl1?.startsWith('/images/') ? 'Remplacer la vidéo' : 'Choisir de la Galerie')}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Status of current video */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Type actuel :</span>
                      {config.videoUrl1?.startsWith('data:') || config.videoUrl1?.startsWith('/images/') ? (
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {config.videoUrl1?.startsWith('/images/') ? 'Fichier Serveur (Optimisé)' : 'Fichier Local (Lecture Hors-ligne)'}
                        </span>
                      ) : (
                        <span className="font-bold text-sky-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          Lien Externe (Nécessite Internet)
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                <UniversalVideoPlayer
                  url={config.videoUrl1 || ""}
                  emptyLabel="Aucun reportage vidéo configuré (Modifiable par l'administrateur)"
                />
              </div>

              {/* AMMONITE ANIMATED BUTTON */}
              <div className="flex flex-col items-center space-y-4">
                <motion.button
                  onClick={() => navigateTo("secondHome")}
                  className="relative p-6 rounded-full bg-slate-900 border border-yellow-500/40 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400 cursor-pointer shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-center group overflow-hidden"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(234,179,8,0.1)",
                      "0 0 40px rgba(234,179,8,0.3)",
                      "0 0 15px rgba(234,179,8,0.1)",
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  id="welcome-ammonite-button"
                >
                  {/* Subtle spinning rays behind */}
                  <div className="absolute inset-0 bg-transparent rounded-full group-hover:rotate-45 transition-transform duration-1000 ease-out pointer-events-none" />

                  <AmmoniteIcon className="w-20 h-20 relative z-10 transition-all duration-300 drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]" />
                </motion.button>

                <span className="text-center font-mono text-[10px] text-yellow-600/80 tracking-widest uppercase animate-pulse">
                  Cliquez sur l'ammonite pour entrer de plain-pied dans
                  l'exposition
                </span>
              </div>
            </motion.div>
          )}

          {/* ==================== PAGE 2: SECOND HOME PAGE ==================== */}
          {view === "secondHome" && (
            <motion.div
              key="secondHome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-10 py-4 max-w-4xl mx-auto"
            >
              {/* IMAGE ZONE (EDITABLE BY ADMIN) */}
              <div className="space-y-4">
                <div className="relative h-64 md:h-80 w-full max-w-3xl mx-auto rounded-2xl overflow-hidden bg-transparent flex items-center justify-center">
                  <CroppedImage
                    settings={config.secondHomeImage}
                    alt="Exposition principale"
                    className="w-full h-full"
                  />
                </div>

                {isAdmin && (
                  <div className="max-w-3xl mx-auto bg-slate-900/50 p-4 border border-yellow-700/10 rounded-xl">
                    <ImageAdjuster
                      label="Grande image de présentation du deuxième écran"
                      settings={config.secondHomeImage}
                      onChange={(updated) =>
                        updateConfig({ ...config, secondHomeImage: updated })
                      }
                    />
                  </div>
                )}
              </div>

              {/* CENTRAL LUMINOUS CIRCULAR "GALERIE" BUTTON */}
              <div className="flex flex-col items-center justify-center py-6 sm:py-10">
                <div className="relative flex items-center justify-center">
                  {/* Outer animated ambient glows */}
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -inset-6 sm:-inset-8 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 blur-2xl pointer-events-none"
                  />

                  {/* Pulsing halo ring */}
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-tr from-yellow-600/40 via-amber-400/60 to-yellow-500/40 blur-[2px] pointer-events-none"
                  />

                  {/* Secondary dashed counter-rotating cosmic ring */}
                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 35,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -inset-4 sm:-inset-5 rounded-full border border-dashed border-yellow-500/25 pointer-events-none"
                  />

                  {/* The Main Circular Button */}
                  <motion.button
                    onClick={() => openGalleryWithSearch()}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.94 }}
                    animate={{
                      boxShadow: [
                        "0 0 25px rgba(234, 179, 8, 0.3), inset 0 0 20px rgba(234, 179, 8, 0.15)",
                        "0 0 55px rgba(234, 179, 8, 0.6), inset 0 0 35px rgba(234, 179, 8, 0.3)",
                        "0 0 25px rgba(234, 179, 8, 0.3), inset 0 0 20px rgba(234, 179, 8, 0.15)",
                      ],
                    }}
                    transition={{
                      boxShadow: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 border-2 border-yellow-500/70 hover:border-yellow-400 text-yellow-400 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xl group transition-all duration-300 z-10 p-4 select-none"
                    id="home-circular-gallery-btn"
                    title="Accéder à la Galerie Complète des 4 Périodes"
                  >
                    {/* Inner decorative rings */}
                    <div className="absolute inset-3 rounded-full border border-yellow-500/30 group-hover:border-yellow-400/50 transition-colors pointer-events-none" />
                    <div className="absolute inset-6 rounded-full border border-yellow-600/15 pointer-events-none" />

                    {/* Central Icon */}
                    <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-yellow-950/60 border border-yellow-500/40 flex items-center justify-center text-yellow-400 group-hover:text-yellow-300 group-hover:scale-110 group-hover:border-yellow-400 transition-all duration-300 shadow-inner">
                      <AmmoniteIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]" />
                    </div>

                    {/* Main Label */}
                    <span className="relative z-10 font-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.25em] text-yellow-400 group-hover:text-yellow-300 drop-shadow-[0_2px_12px_rgba(234,179,8,0.6)] pl-1">
                      GALERIE
                    </span>

                    {/* Specimen count pill */}
                    <span className="relative z-10 text-[10px] font-mono text-yellow-400 bg-yellow-950/80 px-2.5 py-0.5 rounded-full border border-yellow-700/50 group-hover:border-yellow-500/70 transition-all">
                      {config.fossils.length} spécimen{config.fossils.length > 1 ? "s" : ""}
                    </span>
                  </motion.button>
                </div>

                <p className="text-center font-mono text-[11px] text-yellow-600/90 tracking-widest uppercase mt-4 animate-pulse">
                  cliquez pour voir les fossiles
                </p>
              </div>

              {/* BOTTOM NAVIGATION ZONE SECONDARY BUTTONS */}
              <div className="pt-6 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center max-w-2xl mx-auto">
                {/* GEOLOGIC TIMELINE PAGE BUTTON */}
                <button
                  onClick={() => navigateTo("timeline")}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-yellow-600/40 py-3.5 px-5 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 group"
                >
                  <span className="text-xs font-mono text-yellow-600 uppercase font-bold tracking-wider group-hover:text-yellow-500">
                    Échelle des temps géologiques
                  </span>
                  <span className="text-[10px] text-slate-500 text-center">
                    Défilement interactif & Vidéos
                  </span>
                </button>

                {/* TECHNICAL SHEETS BUTTON */}
                <button
                  onClick={() => navigateTo("sheets")}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-yellow-600/40 py-3.5 px-5 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 group"
                >
                  <span className="text-xs font-mono text-yellow-600 uppercase font-bold tracking-wider group-hover:text-yellow-500">
                    Fiches techniques de suivi
                  </span>
                  <span className="text-[10px] text-slate-500 text-center">
                    Certificats d'authenticité & Traçabilité
                  </span>
                </button>
              </div>

              {/* NAVIGATION BACK TO WELCOME SCREEN & ADMIN SHORTCUT */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigateTo("welcome")}
                  className="flex items-center gap-1.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white px-4 py-2 rounded-lg text-xs transition-all font-mono cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" /> Revenir à l'accueil initial
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      playDinoSound();
                      setView("admin");
                    }}
                    className="flex items-center gap-1.5 border border-yellow-600/40 bg-yellow-950/30 hover:bg-yellow-900/50 text-yellow-400 hover:text-yellow-300 px-4 py-2 rounded-lg text-xs transition-all font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Espace Administrateur
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== PAGES: GEOLOGICAL SELECTED ERA ==================== */}
          {(view === "era_precambrian" ||
            view === "era_paleozoic" ||
            view === "era_mesozoic" ||
            view === "era_cenozoic") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* No top title according to requirements: "Attention sur la page d'accueil et les page principale des 3 periodes geologique du site aucun titre ne doit apparaître en haut des pages" */}

              {/* If admin is editing a fossil, show the nested edit form view */}
              {editingFossil ? (
                <FossilDetailForm
                  fossil={editingFossil}
                  onSave={handleSaveFossil}
                  onDelete={
                    editingFossil.title
                      ? () => handleDeleteFossil(editingFossil.id)
                      : undefined
                  }
                  onCancel={() => {
                    playDinoSound();
                    setEditingFossil(null);
                  }}
                />
              ) : (
                <FossilSelectorAndCarousel
                  isAdmin={isAdmin}
                  era={
                    view === "era_precambrian"
                      ? "precambrian"
                      : view === "era_paleozoic"
                      ? "paleozoic"
                      : view === "era_mesozoic"
                        ? "mesozoic"
                        : "cenozoic"
                  }
                  eraImage={
                    view === "era_precambrian"
                      ? config.eraPrecambrianImage
                      : view === "era_paleozoic"
                      ? config.eraPaleozoicImage
                      : view === "era_mesozoic"
                        ? config.eraMesozoicImage
                        : config.eraCenozoicImage
                  }
                  fossils={config.fossils}
                  onAddFossil={(newFos) =>
                    updateConfig({
                      ...config,
                      fossils: sortFossilsChronologically([...config.fossils, newFos]),
                    })
                  }
                  onModifyFossil={handleSaveFossil}
                  onDeleteFossil={handleDeleteFossil}
                  onOpenEditForm={setEditingFossil}
                  onUpdateEraImage={(img) => {
                    const eraKey =
                      view === "era_precambrian"
                        ? "eraPrecambrianImage"
                        : view === "era_paleozoic"
                        ? "eraPaleozoicImage"
                        : view === "era_mesozoic"
                          ? "eraMesozoicImage"
                          : "eraCenozoicImage";
                    updateConfig({ ...config, [eraKey]: img });
                  }}
                />
              )}

              {/* FLOATING AND BACK NAV COMPENSATIONS */}
              {!editingFossil && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8 border-t border-slate-900 max-w-sm mx-auto">
                  <button
                    onClick={() => navigateTo("secondHome")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Liste des périodes
                  </button>
                  <button
                    onClick={() => navigateTo("welcome")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" /> Accueil initial
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== PAGE: GEOLOGIC TIMELINE (ÉCHELLE DES TEMPS DETAILED VIEW) ==================== */}
          {view === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
                  CHRONOLOGIE DE LA TERRE
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white font-serif uppercase text-center">
                  ÉCHELLE DES TEMPS GÉOLOGIQUES
                </h1>
              </div>

              <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-6">
                <GeologicTimelineView
                  readOnly={false}
                  showVideoSection={true}
                  isAdmin={isAdmin}
                  videoUrl={config.scaleVideoUrl}
                  onSaveVideo={(url) =>
                    updateConfig({ ...config, scaleVideoUrl: url })
                  }
                />
              </div>

              {/* Return links */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8 border-t border-slate-900 max-w-sm mx-auto">
                <button
                  onClick={() => navigateTo("secondHome")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Catalogue Principal
                </button>
                <button
                  onClick={() => navigateTo("welcome")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                >
                  <Home className="w-3.5 h-3.5" /> Accueil initial
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== PAGE: TECHNICAL SPECIFICATION SHEETS ==================== */}
          {view === "sheets" && (
            <motion.div
              key="sheets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
                  SUIVI TECHNIQUE & INVENTAIRE
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white font-serif uppercase text-center">
                  FICHES TECHNIQUES & AUTHENTICITÉ
                </h1>
              </div>

              {!isAdmin && !isSheetsUnlocked ? (
                /* ACCÈS SÉCURISÉ PAR MOT DE PASSE */
                <div className="max-w-md mx-auto bg-slate-900/90 border border-yellow-700/30 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
                  <div className="w-14 h-14 rounded-full bg-yellow-950/60 border border-yellow-500/40 mx-auto flex items-center justify-center text-yellow-400 shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider">
                      Accès Protégé par Mot de Passe
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      L'accès à la rubrique des fiches techniques de suivi (données de traçabilité, valeurs d'achat et certificats d'authenticité) est sécurisé. Veuillez renseigner le mot de passe administrateur pour continuer.
                    </p>
                  </div>

                  <form onSubmit={handleSheetsLogin} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                        Mot de passe administrateur
                      </label>
                      <input
                        type="password"
                        autoFocus
                        value={sheetsPassword}
                        onChange={(e) => {
                          setSheetsPassword(e.target.value);
                          if (sheetsAuthError) setSheetsAuthError(false);
                        }}
                        placeholder="Saisissez le mot de passe..."
                        className={`w-full bg-slate-950 border ${
                          sheetsAuthError ? "border-rose-500 text-rose-300" : "border-slate-700 text-white"
                        } rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500`}
                      />
                      {sheetsAuthError && (
                        <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-mono">
                          ⚠️ Mot de passe incorrect. Veuillez réessayer.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-yellow-950/30 active:scale-95"
                    >
                      Déverrouiller la rubrique
                    </button>
                  </form>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => navigateTo("secondHome")}
                      className="text-xs text-slate-400 hover:text-white transition font-mono flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" /> Revenir au Catalogue Principal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* UNLOCKED BAR WITH LOCK OPTION */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">Rubrique déverrouillée</span>
                      <span className="text-slate-500 hidden sm:inline">• Données techniques & certificats d'authenticité synchronisés</span>
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => {
                          safeSessionStorage.removeItem("sheets_unlocked");
                          setIsSheetsUnlocked(false);
                          playDinoSound();
                        }}
                        className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer"
                        title="Verrouiller à nouveau cette rubrique"
                      >
                        <Lock className="w-3 h-3 text-yellow-500" /> Verrouiller la session
                      </button>
                    )}
                  </div>

                  <TechnicalSheetsView
                    isAdmin={isAdmin || isSheetsUnlocked}
                    sheets={config.technicalSheets}
                    onSaveSheets={(updatedSheets) => {
                      const updatedFossils = config.fossils.map((f) => {
                        const matchedSheet = updatedSheets.find((s) => s.id === f.id);
                        if (matchedSheet) {
                          return {
                            ...f,
                            title: matchedSheet.fossilName,
                            thumbnailImage: f.thumbnailImage,
                            image: f.image,
                            leFossileImage: matchedSheet.fossilImage,
                            provenanceDate: matchedSheet.provenanceDate,
                            periodeDatation: matchedSheet.periodeDatation,
                            dateLieuAchat: matchedSheet.dateLieuAchat,
                            prixAchat: matchedSheet.prixAchat,
                            certificatImage: matchedSheet.certificatImage,
                          };
                        }
                        return f;
                      });
                      updateConfig({
                        ...config,
                        technicalSheets: updatedSheets,
                        fossils: updatedFossils,
                      });
                    }}
                  />
                </div>
              )}

              {/* Return links */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8 border-t border-slate-900 max-w-sm mx-auto">
                <button
                  onClick={() => navigateTo("secondHome")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Catalogue Principal
                </button>
                <button
                  onClick={() => navigateTo("welcome")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                >
                  <Home className="w-3.5 h-3.5" /> Accueil initial
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== PAGE: COMPLETE GALLERY (ALL 4 ERAS) ==================== */}
          {view === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {editingFossil ? (
                <FossilDetailForm
                  fossil={editingFossil}
                  onSave={handleSaveFossil}
                  onDelete={
                    editingFossil.title
                      ? () => handleDeleteFossil(editingFossil.id)
                      : undefined
                  }
                  onCancel={() => {
                    playDinoSound();
                    setEditingFossil(null);
                  }}
                />
              ) : (
                <CompleteGalleryView
                  fossils={config.fossils}
                  isAdmin={isAdmin}
                  initialSearch={gallerySearch}
                  initialFossilId={galleryFossilId}
                  onBackToHome={() => navigateTo("secondHome")}
                  onOpenEditForm={setEditingFossil}
                  onModifyFossil={handleSaveFossil}
                  onDeleteFossil={handleDeleteFossil}
                  onNavigateToEra={(eraKey) => navigateTo(eraKey as any)}
                />
              )}

              {/* Bottom return links */}
              {!editingFossil && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8 border-t border-slate-900 max-w-sm mx-auto">
                  <button
                    onClick={() => navigateTo("secondHome")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Catalogue Principal
                  </button>
                  <button
                    onClick={() => navigateTo("welcome")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-2.5 px-4 rounded-xl text-xs text-slate-300 hover:text-white font-mono transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" /> Accueil initial
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== PAGE: DEDICATED ADMIN MENU ==================== */}
          {view === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="-mx-4 -my-8"
            >
              <AdminPageView
                config={config}
                onUpdateConfig={updateConfigInstant}
                onImportConfig={handleImportConfig}
                onExitAdmin={() => {
                  setIsAdmin(false);
                  setView("secondHome");
                }}
                onNavigateToMuseum={() => {
                  setView("secondHome");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="absolute bottom-0 left-0 w-full py-4 text-center border-t border-slate-900/50 bg-slate-950/80 pointer-events-none">
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
          Conservatoire Personnel de Spécimens Fossiles © 2026
        </span>
      </footer>
    </div>
  );
}
