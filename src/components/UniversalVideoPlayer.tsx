import React, { useState } from 'react';
import { getSafeEmbedUrl } from '../utils/data/videoEmbed';
import { ExternalLink, Video as VideoIcon, AlertCircle, Play, Film, Sparkles, Loader2 } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { AmmoniteIcon } from '../utils/data/PeriodIcons';

interface UniversalVideoPlayerProps {
  url?: string;
  className?: string;
  aspectRatioClass?: string;
  emptyLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
}

export default function UniversalVideoPlayer({
  url = '',
  className = '',
  aspectRatioClass = 'aspect-video',
  emptyLabel = 'Aucune vidéo configurée',
  isLoading = false,
  loadingLabel = "Synchronisation du reportage vidéo en cours, veuillez patienter un instant...",
}: UniversalVideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);
  const embedInfo = getSafeEmbedUrl(url);

  // Themed fossil/dinosaur waiting state
  if (isLoading) {
    return (
      <div
        className={`${aspectRatioClass} w-full bg-slate-900/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-yellow-500/30 relative overflow-hidden shadow-xl ${className}`}
      >
        {/* Pulsing ambient amber glow */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-yellow-950/20 to-transparent animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-3 max-w-md">
          {/* Animated Fossil Ammonite with golden aura */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-900 to-amber-950/90 border border-yellow-500/50 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)] animate-pulse">
              <AmmoniteIcon className="w-8 h-8 drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-yellow-500/50 rounded-full p-1 text-yellow-400">
              <Film className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs font-serif font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chargement du Documentaire</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {loadingLabel}
            </p>
          </div>

          {/* Shimmer pulse progress bar */}
          <div className="w-48 h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!url || !embedInfo.url) {
    return (
      <div
        className={`${aspectRatioClass} w-full bg-slate-900/40 rounded-xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800 ${className}`}
      >
        <VideoIcon className="w-10 h-10 text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 font-mono">{emptyLabel}</p>
      </div>
    );
  }

  // Resolve local paths if needed (e.g. /images/fossiles/...)
  const resolvedVideoSrc = embedInfo.type === 'video' ? resolveImageUrl(embedInfo.url) : embedInfo.url;

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <div className={`relative ${aspectRatioClass} w-full rounded-xl overflow-hidden border border-slate-850 bg-black shadow-lg group`}>
        {embedInfo.type === 'video' ? (
          videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <p className="text-xs text-slate-300">
                Impossible de lire ce format vidéo directement dans le navigateur.
              </p>
              <a
                href={resolvedVideoSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-700/80 hover:bg-yellow-600 border border-yellow-500/30 text-white font-mono text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ouvrir ou Télécharger la vidéo
              </a>
            </div>
          ) : (
            <video
              src={resolvedVideoSrc}
              controls
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-contain bg-black"
              controlsList="nodownload"
              onError={() => setVideoError(true)}
            >
              <source src={resolvedVideoSrc} />
              Votre navigateur ne prend pas en charge la lecture de cette vidéo.
            </video>
          )
        ) : (
          <>
            <iframe
              src={embedInfo.url}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              title="Lecteur Vidéo"
              loading="lazy"
            />
          </>
        )}
      </div>
    </div>
  );
}
