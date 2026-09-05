import React, { useState } from 'react';
import { getSafeEmbedUrl } from '../utils/data/videoEmbed';
import { ExternalLink, Video as VideoIcon, AlertCircle, Play } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

interface UniversalVideoPlayerProps {
  url?: string;
  className?: string;
  aspectRatioClass?: string;
  emptyLabel?: string;
}

export default function UniversalVideoPlayer({
  url = '',
  className = '',
  aspectRatioClass = 'aspect-video',
  emptyLabel = 'Aucune vidéo configurée',
}: UniversalVideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);
  const embedInfo = getSafeEmbedUrl(url);

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
