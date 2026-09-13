import React, { useState } from 'react';
import { Fossil } from '../types';
import { useFossilSpeech } from '../utils/useFossilSpeech';
import { playDinoSound } from '../utils/data/audio';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  BookOpen,
  Utensils,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FossilAudioGuideProps {
  fossil: Fossil;
  className?: string;
}

export default function FossilAudioGuide({ fossil, className = '' }: FossilAudioGuideProps) {
  const {
    isSupported,
    isPlaying,
    isPaused,
    currentSectionIndex,
    sections,
    rate,
    voices,
    currentVoice,
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    setRate,
    setVoice,
  } = useFossilSpeech(fossil);

  // Collapsible / Dépliant state: folded by default for discretion
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);

  // If the browser does not support SpeechSynthesis
  if (!isSupported) {
    return (
      <div className={`bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-500 font-mono ${className}`}>
        <VolumeX className="w-4 h-4 inline-block mr-1.5 text-slate-500" />
        La synthèse vocale Web Speech n'est pas disponible sur ce navigateur.
      </div>
    );
  }

  // If fossil has no readable text sections
  if (sections.length === 0) {
    return null;
  }

  const speedOptions = [
    { label: '0.85x', value: 0.85 },
    { label: '1.0x', value: 1.0 },
    { label: '1.15x', value: 1.15 },
  ];

  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'intro':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'description':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'diet':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'fossile':
        return <Info className="w-3.5 h-3.5" />;
      case 'saviezVous':
        return <HelpCircle className="w-3.5 h-3.5" />;
      default:
        return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  const handleToggleExpand = () => {
    playDinoSound();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`bg-slate-900/40 hover:bg-slate-900/60 border transition-all duration-200 rounded-xl overflow-hidden shadow-sm ${
        isPlaying || isExpanded
          ? 'border-yellow-600/40 shadow-yellow-950/20'
          : 'border-slate-800/80 hover:border-yellow-600/30'
      } ${className}`}
    >
      {/* 1. DÉPLIANT TRIGGER BAR (Compact, discreet header & mini-player) */}
      <div
        onClick={handleToggleExpand}
        className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors hover:bg-yellow-500/5"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleExpand();
          }
        }}
      >
        {/* Left: Discreet Icon + Title + live status */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isPlaying
                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 shadow-sm'
                : isPaused
                ? 'bg-amber-600/20 border border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border border-slate-700/60 text-yellow-500/90'
            }`}
          >
            <Headphones className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>

          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold font-serif uppercase tracking-wider text-slate-200">
              Guide Audio
            </span>

            {/* Status indicators */}
            {isPlaying && currentSectionIndex >= 0 ? (
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-mono bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 px-2 py-0.5 rounded-full font-medium truncate max-w-[180px] sm:max-w-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span className="truncate">{sections[currentSectionIndex]?.label}</span>
                <span className="text-yellow-500/70 text-[9px]">({currentSectionIndex + 1}/{sections.length})</span>
              </span>
            ) : isPaused && currentSectionIndex >= 0 ? (
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-mono bg-amber-950/50 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                <span>Pause :</span>
                <span className="truncate font-medium">{sections[currentSectionIndex]?.label}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/50 border border-slate-800/80 px-2 py-0.5 rounded-full">
                {sections.length} chapitres vocaux
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick-action mini player & dépliant toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mini Play / Pause button accessible without unfolding */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playDinoSound();
              togglePlayPause(currentSectionIndex >= 0 ? currentSectionIndex : 0);
            }}
            className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                : isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/40 hover:border-yellow-400'
            }`}
            title={isPlaying ? 'Mettre en pause' : isPaused ? "Reprendre l'écoute" : 'Écouter'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span className="hidden sm:inline">Reprendre</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Écouter</span>
              </>
            )}
          </button>

          {/* Mini Stop Button if active */}
          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playDinoSound();
                stop();
              }}
              className="p-1 sm:px-2 sm:py-1 rounded-lg font-mono text-xs text-rose-400 hover:text-rose-300 bg-slate-950/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 transition cursor-pointer"
              title="Arrêter la lecture"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}

          {/* Dépliant Toggle Badge (Chevron + label) */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10.5px] font-mono transition-all ${
              isExpanded
                ? 'bg-yellow-950/30 border-yellow-600/30 text-yellow-400'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">{isExpanded ? 'Replier' : 'Déplier'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-yellow-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* 2. DÉPLIANT CONTENT (Animated collapse / expand with all features & chapter navigation) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-800/80 bg-slate-950/50"
          >
            <div className="p-3.5 sm:p-4 space-y-3.5">
              {/* Sub-header with offline badge & Speed selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif uppercase tracking-wider text-slate-300 font-bold">
                    Options vocales
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                    100% Hors-ligne
                  </span>
                </div>

                {/* Speed toggle pills */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 px-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-yellow-500" /> Vitesse :
                  </span>
                  {speedOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        playDinoSound();
                        setRate(opt.value);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                        rate === opt.value
                          ? 'bg-yellow-600 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main playback control row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Primary Play / Pause button */}
                  <button
                    type="button"
                    onClick={() => {
                      playDinoSound();
                      togglePlayPause(currentSectionIndex >= 0 ? currentSectionIndex : 0);
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all shadow cursor-pointer select-none active:scale-95 ${
                      isPlaying
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/30'
                        : isPaused
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/30'
                        : 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 shadow-yellow-950/30'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Mettre en pause</span>
                      </>
                    ) : isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Reprendre</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Écouter toute la fiche</span>
                      </>
                    )}
                  </button>

                  {/* Stop button */}
                  {(isPlaying || isPaused) && (
                    <button
                      type="button"
                      onClick={() => {
                        playDinoSound();
                        stop();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 transition cursor-pointer"
                      title="Arrêter la lecture"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Arrêter</span>
                    </button>
                  )}

                  {/* Soundwave animation */}
                  {isPlaying && (
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-yellow-950/30 border border-yellow-600/25 text-yellow-400">
                      <span className="w-1 h-2.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                    </div>
                  )}
                </div>

                {/* Status text */}
                <div className="text-left sm:text-right w-full sm:w-auto">
                  {isPlaying && currentSectionIndex >= 0 ? (
                    <div className="text-xs text-yellow-400 font-mono">
                      <span className="text-slate-400">En cours : </span>
                      <strong className="text-white">{sections[currentSectionIndex]?.label}</strong>
                      <span className="text-slate-500 text-[10px] ml-2">
                        ({currentSectionIndex + 1}/{sections.length})
                      </span>
                    </div>
                  ) : isPaused && currentSectionIndex >= 0 ? (
                    <div className="text-xs text-amber-400 font-mono">
                      <span className="text-slate-400">En pause sur : </span>
                      <strong className="text-white">{sections[currentSectionIndex]?.label}</strong>
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      {sections.length} rubriques disponibles
                    </div>
                  )}
                </div>
              </div>

              {/* Section chapters & Voice options */}
              <div className="pt-2.5 border-t border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Accès direct par chapitre :
                  </span>
                  {voices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceSelect(!showVoiceSelect)}
                      className="text-[10px] font-mono text-yellow-500/80 hover:text-yellow-400 transition cursor-pointer"
                    >
                      {currentVoice ? `Voix : ${currentVoice.name.slice(0, 20)}...` : 'Changer de voix'}
                    </button>
                  )}
                </div>

                {/* Voice selector dropdown */}
                {showVoiceSelect && voices.length > 0 && (
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <label className="text-[9.5px] font-mono text-slate-400 block mb-1">
                      Sélectionner la voix de synthèse vocale :
                    </label>
                    <select
                      value={currentVoice?.voiceURI || ''}
                      onChange={(e) => {
                        const selected = voices.find((v) => v.voiceURI === e.target.value);
                        if (selected) setVoice(selected);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded p-1.5 focus:outline-none focus:border-yellow-500"
                    >
                      {voices
                        .filter((v) => v.lang.toLowerCase().startsWith('fr') || v.default)
                        .map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang}){v.localService ? ' [Local/Hors-ligne]' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Chapter buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {sections.map((sec, idx) => {
                    const isThisPlaying = isPlaying && currentSectionIndex === idx;
                    const isThisPaused = isPaused && currentSectionIndex === idx;

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                          playDinoSound();
                          if (isThisPlaying) {
                            pause();
                          } else if (isThisPaused) {
                            resume();
                          } else {
                            play(idx);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer select-none active:scale-95 ${
                          isThisPlaying
                            ? 'bg-yellow-500 text-slate-950 font-bold shadow-sm ring-1 ring-yellow-400'
                            : isThisPaused
                            ? 'bg-amber-900/50 border border-amber-500/50 text-amber-200 font-medium'
                            : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-yellow-700/40 text-slate-300 hover:text-white'
                        }`}
                        title={`Écouter : ${sec.label}`}
                      >
                        {getSectionIcon(sec.id)}
                        <span>{sec.label}</span>
                        {isThisPlaying && <Volume2 className="w-3 h-3 text-slate-950 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom fold button */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleToggleExpand}
                  className="text-[10px] font-mono text-slate-500 hover:text-yellow-400 flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                  <span>Replier le guide</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
