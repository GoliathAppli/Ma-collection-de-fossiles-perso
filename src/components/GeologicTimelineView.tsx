import React, { useState, useRef, useEffect } from 'react';
import { getSafeEmbedUrl } from '../utils/data/videoEmbed';
import UniversalVideoPlayer from './UniversalVideoPlayer';
import { GEOLOGIC_PERIODS } from './geologicPeriods';
import { playDinoSound } from '../utils/data/audio';
import { ArrowLeft, ArrowRight, Eye, Video, Upload } from 'lucide-react';
import { GeologicPeriodInfo } from '../types';

interface GeologicTimelineViewProps {
  isAdmin?: boolean;
  videoUrl?: string;
  onSaveVideo?: (url: string) => void;
  // If highlightedRange is passed, it acts as a viewer highlighting a span of periods
  highlightedStart?: string;
  highlightedEnd?: string;
  onSelectRange?: (start: string, end: string) => void;
  readOnly?: boolean;
  showVideoSection?: boolean;
}

export default function GeologicTimelineView({
  isAdmin = false,
  videoUrl = '',
  onSaveVideo,
  highlightedStart,
  highlightedEnd,
  onSelectRange,
  readOnly = false,
  showVideoSection = false
}: GeologicTimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<GeologicPeriodInfo | null>(null);
  const [videoInput, setVideoInput] = useState(videoUrl);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    setVideoInput(videoUrl);
  }, [videoUrl]);

  // Determine span of highlights if it's used as a selector or indicator
  const startIndex = highlightedStart ? GEOLOGIC_PERIODS.findIndex(p => p.name === highlightedStart) : -1;
  const endIndex = highlightedEnd ? GEOLOGIC_PERIODS.findIndex(p => p.name === highlightedEnd) : -1;

  const isHighlighted = (name: string, index: number) => {
    if (!highlightedStart && !highlightedEnd) return false;
    
    // If only start is selected
    if (startIndex !== -1 && endIndex === -1) {
      return GEOLOGIC_PERIODS[index].name === highlightedStart;
    }
    // If only end is selected
    if (startIndex === -1 && endIndex !== -1) {
      return GEOLOGIC_PERIODS[index].name === highlightedEnd;
    }
    // If both are selected range
    if (startIndex !== -1 && endIndex !== -1) {
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      return index >= min && index <= max;
    }
    return false;
  };

  const handlePeriodClick = (p: GeologicPeriodInfo, index: number) => {
    playDinoSound();
    
    if (!readOnly && onSelectRange) {
      // Logic for choosing a range
      if (!highlightedStart || (highlightedStart && highlightedEnd)) {
        onSelectRange(p.name, '');
      } else {
        onSelectRange(highlightedStart, p.name);
      }
    } else {
      // Default: Open pop-up detail info
      setSelectedPeriod(p);
    }
  };

  const scrollRight = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playDinoSound();
    if (onSaveVideo) {
      onSaveVideo(videoInput);
    }
  };



  return (
    <div className="space-y-6 w-full py-4 text-slate-100">
      {/* Horizontal Scroll Controls */}
      <div className="flex justify-between items-center px-4">
        <div className="text-xs text-slate-400 font-mono">
          {readOnly ? (
            <span className="text-yellow-500/95 font-semibold uppercase">Période de vie estimée de l'espèce</span>
          ) : (
            <span>Faites glisser de gauche à droite ↔️ {onSelectRange ? '(Cliquez sur 2 périodes pour définir l\'intervalle)' : '(Cliquez pour en savoir plus)'}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            type="button"
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-yellow-600/40 text-slate-300 hover:text-yellow-500 transition-all"
            title="Naviguer à gauche"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            type="button"
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-yellow-600/40 text-slate-300 hover:text-yellow-500 transition-all"
            title="Naviguer à droite"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SWIPEABLE SEGMENTS CONTAINER */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto py-4 px-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {GEOLOGIC_PERIODS.map((p, idx) => {
          const highlighted = isHighlighted(p.name, idx);
          const isStart = p.name === highlightedStart;
          const isEnd = p.name === highlightedEnd;

          return (
            <div
              key={p.name}
              onClick={() => handlePeriodClick(p, idx)}
              className={`flex-none w-64 snap-start p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none relative overflow-hidden group
                ${highlighted 
                  ? 'bg-gradient-to-br from-yellow-950/70 to-amber-900/40 border-yellow-500 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-2 ring-yellow-600/30' 
                  : 'bg-slate-950/90 hover:bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
            >
              {/* background design line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-40" />

              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase py-0.5 px-2 bg-slate-900/80 border border-slate-800/60 rounded text-slate-400 group-hover:text-slate-200 transition-colors">
                  {p.era}
                </span>
                <span className="text-xs font-bold text-yellow-600 font-mono tracking-tighter">
                  {p.duration}
                </span>
              </div>

              <h4 className="text-xl font-bold tracking-tight mb-2 text-center text-white font-serif">
                {p.name}
              </h4>

              <p className="text-xs text-slate-400 font-sans leading-relaxed text-center line-clamp-3">
                {p.description}
              </p>

              {/* Status badges for range select */}
              {isStart && (
                <div className="absolute bottom-2 left-2 bg-yellow-500 text-slate-950 font-mono text-[8px] font-bold uppercase px-1 rounded shadow">
                  Début
                </div>
              )}
              {isEnd && (
                <div className="absolute bottom-2 right-2 bg-yellow-500 text-slate-950 font-mono text-[8px] font-bold uppercase px-1 rounded shadow">
                  Fin
                </div>
              )}

              {/* Arrow Indicator for interactive info */}
              {!readOnly && !onSelectRange && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* POPUP FOR DETAILED INFO */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-yellow-700/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-600 block mb-1">
                  Période du {selectedPeriod.era}
                </span>
                <h3 className="text-3xl font-bold tracking-tight text-white font-serif">{selectedPeriod.name}</h3>
              </div>
              <span className="text-sm font-semibold text-yellow-500 font-mono py-1 px-3.5 rounded bg-slate-950 border border-slate-800">{selectedPeriod.duration}</span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans italic border-l-2 border-yellow-700/60 pl-3">
              "{selectedPeriod.description}"
            </p>

            <div className="text-xs text-slate-400 font-sans leading-relaxed space-y-2">
              <strong className="text-slate-100 block font-serif text-sm">Caractéristiques majeures :</strong>
              <p>{selectedPeriod.details}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  playDinoSound();
                  setSelectedPeriod(null);
                }}
                className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white text-xs px-5 py-2 rounded-lg font-bold transition-all uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO INSERTION FOR ENTIRE SITE TIMELINE PAGE */}
      {showVideoSection && (
        <div className="bg-slate-950/65 border border-slate-800/60 rounded-xl p-5 mt-6 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-yellow-500 font-medium">
            <Video className="w-4 h-4" />
            <h4 className="text-sm font-semibold tracking-wide uppercase font-serif">Vidéo Thématique de l'Échelle des Temps</h4>
          </div>

          {isAdmin && onSaveVideo ? (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-yellow-600/20 space-y-3">
              <div className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider">
                Source Vidéo (Échelle des Temps)
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* URL input */}
                <form onSubmit={handleVideoSubmit} className="flex-1 space-y-1">
                  <label className="block text-[10px] text-slate-400 font-medium">
                    Option A : Lien Internet (YouTube, Drive, MP4...)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-yellow-600/60"
                      placeholder="Ex: https://www.youtube.com/watch?v=..."
                      value={videoInput?.startsWith('data:') ? '' : videoInput}
                      onChange={(e) => setVideoInput(e.target.value)}
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
                      id="timeline-video-upload"
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
                                  if (onSaveVideo) onSaveVideo(data.url);
                                  setVideoInput(data.url);
                                  alert("✅ Vidéo de la galerie synchronisée avec succès sur le serveur !");
                                } else {
                                  if (onSaveVideo) onSaveVideo(dataUrl);
                                  setVideoInput(dataUrl);
                                  alert("✅ Vidéo chargée localement (Base64).");
                                }
                              } else {
                                if (onSaveVideo) onSaveVideo(dataUrl);
                                setVideoInput(dataUrl);
                                alert("✅ Vidéo chargée localement (Base64).");
                              }
                            } catch (err) {
                              console.error("Direct video upload failed:", err);
                              if (onSaveVideo) onSaveVideo(dataUrl);
                              setVideoInput(dataUrl);
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
                      htmlFor="timeline-video-upload"
                      className={`w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded px-3 py-2 text-xs font-semibold cursor-pointer transition-all active:scale-95 text-center ${isUploadingVideo ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <Upload className={`w-3.5 h-3.5 text-yellow-500 ${isUploadingVideo ? 'animate-bounce' : ''}`} />
                      {isUploadingVideo ? 'Téléchargement...' : (videoUrl?.startsWith('data:') || videoUrl?.startsWith('/images/') ? 'Remplacer la vidéo' : 'Choisir de la Galerie')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Status of current video */}
              <div className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Type actuel :</span>
                {videoUrl?.startsWith('data:') || videoUrl?.startsWith('/images/') ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {videoUrl?.startsWith('/images/') ? 'Fichier Serveur (Optimisé)' : 'Fichier Local (Lecture Hors-ligne)'}
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

          {/* Video display player */}
          <UniversalVideoPlayer
            url={videoUrl || "https://www.youtube.com/watch?v=2SRU_56Y-WQ"}
            emptyLabel="Aucun lecteur vidéo configuré par l'administrateur"
          />
        </div>
      )}
    </div>
  );
}
