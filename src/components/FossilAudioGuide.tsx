import React, { useState } from 'react';
import { Fossil } from '../types';
import { useFossilSpeech } from '../utils/useFossilSpeech';
import { playDinoSound } from '../utils/data/audio';
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

  // Collapsed / unfolded state (discreet by default)
  const [isOpen, setIsOpen] = useState(false);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);

  // If browser does not support SpeechSynthesis
  if (!isSupported) {
    return (
      <div className={`bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 text-center text-xs text-slate-500 font-mono ${className}`}>
        <VolumeX className="w-3.5 h-3.5 inline-block mr-1.5 text-slate-500" />
        Synthèse vocale Web Speech non supportée sur ce navigateur.
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

  return (
    <div
      className={`bg-gradient-to-r from-yellow-950/20 via-slate-900/90 to-amber-950/15 border border-yellow-600/25 hover:border-yellow-500/40 rounded-2xl shadow-lg transition-all overflow-hidden ${className}`}
    >
      {/* HEADER / COMPACT BAR (Always visible & discreet) */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 select-none">
        {/* Clickable area to toggle unfold */}
        <div
          onClick={() => {
            playDinoSound();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2.5 sm:gap-3 flex-1 cursor-pointer group min-w-0"
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
              isPlaying
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-inner'
                : 'bg-slate-900 text-yellow-500/80 border border-slate-800 group-hover:border-yellow-600/40 group-hover:text-yellow-400'
            }`}
          >
            <Headphones className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold font-serif uppercase tracking-wider text-yellow-400/95 group-hover:text-yellow-300 transition-colors">
                Guide Audio
              </span>
              <span className="hidden sm:inline-block text-[8.5px] font-mono uppercase bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded-full font-semibold">
                Hors-ligne
              </span>
            </div>

            {/* Subtitle or active playing status in collapsed mode */}
            {isPlaying && currentSectionIndex >= 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400">Écoute :</span>
                <span className="truncate">{sections[currentSectionIndex]?.label}</span>
              </div>
            ) : isPaused && currentSectionIndex >= 0 ? (
              <div className="text-[11px] text-amber-400/80 font-mono truncate">
                En pause : {sections[currentSectionIndex]?.label}
              </div>
            ) : (
              <p className="text-[10.5px] text-slate-400 font-sans truncate">
                Visite guidée vocale sans connexion requise
              </p>
            )}
          </div>
        </div>

        {/* Action Controls on the right of the compact bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Play/Pause Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playDinoSound();
              togglePlayPause(currentSectionIndex >= 0 ? currentSectionIndex : 0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all shadow cursor-pointer active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                : isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                : 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 shadow-yellow-950/40'
            }`}
            title={isPlaying ? 'Mettre en pause' : isPaused ? "Reprendre l'écoute" : 'Écouter la fiche'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span className="hidden sm:inline">Reprendre</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Écouter</span>
              </>
            )}
          </button>

          {/* Unfold / Fold Toggle Button */}
          <button
            type="button"
            onClick={() => {
              playDinoSound();
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-yellow-700/50 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer"
            title={isOpen ? 'Replier le guide' : 'Ouvrir les options du guide audio'}
          >
            <span className="hidden md:inline text-[11px]">{isOpen ? 'Replier' : 'Options'}</span>
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-yellow-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* EXPANDABLE ACCORDION BODY (DÉPLIANT) */}
      {isOpen && (
        <div className="border-t border-yellow-700/20 bg-slate-950/70 p-4 sm:p-5 space-y-4 animate-fade-in">
          {/* Controls & Speed row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
            {/* Extended Playback Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  playDinoSound();
                  togglePlayPause(currentSectionIndex >= 0 ? currentSectionIndex : 0);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition shadow cursor-pointer active:scale-95 ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : isPaused
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-slate-950'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Reprendre</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Écouter la fiche</span>
                  </>
                )}
              </button>

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
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Arrêter</span>
                </button>
              )}

              {isPlaying && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-950/40 border border-yellow-600/30 text-yellow-400 ml-1">
                  <span className="w-1 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-3.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                </div>
              )}
            </div>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 self-end sm:self-auto">
              <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1">
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
                  className={`px-2 py-0.5 text-[10.5px] font-mono rounded-lg transition-all cursor-pointer ${
                    rate === opt.value
                      ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Rubriques & Chapitres à écouter :
              </span>
              {voices.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowVoiceSelect(!showVoiceSelect)}
                  className="text-[10px] font-mono text-yellow-500/80 hover:text-yellow-400 transition cursor-pointer"
                >
                  {currentVoice ? `Voix : ${currentVoice.name.slice(0, 18)}...` : 'Changer de voix'}
                </button>
              )}
            </div>

            {/* Voice selector */}
            {showVoiceSelect && voices.length > 0 && (
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] font-mono text-slate-400 block">
                  Voix de synthèse vocale du navigateur :
                </label>
                <select
                  value={currentVoice?.voiceURI || ''}
                  onChange={(e) => {
                    const selected = voices.find((v) => v.voiceURI === e.target.value);
                    if (selected) setVoice(selected);
                  }}
                  className="w-full bg-slate-950 border border-slate-750 text-xs text-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-yellow-500 font-mono"
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
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                      } else {
                        play(idx);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer select-none ${
                      isThisPlaying
                        ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-950/40 ring-2 ring-yellow-400/50'
                        : isThisPaused
                        ? 'bg-amber-900/60 border border-amber-500/60 text-amber-300 font-semibold'
                        : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-700/40 text-slate-300 hover:text-white'
                    }`}
                    title={`Écouter le chapitre : ${sec.label}`}
                  >
                    {getSectionIcon(sec.id)}
                    <span>{sec.label}</span>
                    {isThisPlaying && <Volume2 className="w-3.5 h-3.5 text-slate-950 animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom fold button */}
          <div className="pt-2 border-t border-slate-850/60 flex justify-end">
            <button
              type="button"
              onClick={() => {
                playDinoSound();
                setIsOpen(false);
              }}
              className="text-[10.5px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronUp className="w-3 h-3" />
              <span>Replier le guide audio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
