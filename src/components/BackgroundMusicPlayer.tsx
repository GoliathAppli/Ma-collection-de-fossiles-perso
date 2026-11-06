import React, { useState, useEffect, useRef, useCallback } from "react";
import { Music, VolumeX, Volume2 } from "lucide-react";

interface BackgroundMusicPlayerProps {
  currentView: string;
}

export default function BackgroundMusicPlayer({ currentView }: BackgroundMusicPlayerProps) {
  const isSecondHome = currentView === "secondHome";
  const isGallery = currentView === "gallery";
  const hasActiveMusic = isSecondHome || isGallery;

  // Référence pour savoir si l'utilisateur a explicitement coupé le son
  const isUserMutedRef = useRef<boolean>(false);

  // État réel de lecture (mis à jour directement par les événements natifs de l'élément audio)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const openingAudioRef = useRef<HTMLAudioElement | null>(null);
  const galleryAudioRef = useRef<HTMLAudioElement | null>(null);

  // Récupère l'élément audio actif selon la vue en cours
  const getActiveAudio = useCallback(() => {
    if (isSecondHome) return openingAudioRef.current;
    if (isGallery) return galleryAudioRef.current;
    return null;
  }, [isSecondHome, isGallery]);

  // Synchronisation lors des changements de page
  useEffect(() => {
    const openingAudio = openingAudioRef.current;
    const galleryAudio = galleryAudioRef.current;

    if (!openingAudio || !galleryAudio) return;

    if (isSecondHome) {
      // Arrête la musique de la galerie si elle tournait
      galleryAudio.pause();
      galleryAudio.currentTime = 0;

      // Lance Opening Titles une seule fois si l'utilisateur n'a pas coupé le son
      if (!isUserMutedRef.current) {
        openingAudio.currentTime = 0;
        openingAudio.play().catch(() => {
          // Si le navigateur bloque l'autoplay, le premier clic/tap le déclenchera
        });
      }
    } else if (isGallery) {
      // Arrête la musique d'accueil si elle tournait
      openingAudio.pause();
      openingAudio.currentTime = 0;

      // Lance le thème de la galerie en boucle
      if (!isUserMutedRef.current) {
        galleryAudio.play().catch(() => {
          // Autoplay bloqué, attendra l'interaction
        });
      }
    } else {
      // N'importe quelle autre page : couper les deux musiques
      openingAudio.pause();
      openingAudio.currentTime = 0;
      galleryAudio.pause();
      galleryAudio.currentTime = 0;
    }
  }, [currentView, isSecondHome, isGallery]);

  // Déblocage automatique de l'audio dès la première interaction utilisateur sur l'écran
  useEffect(() => {
    if (!hasActiveMusic) return;

    const handleFirstUserGesture = () => {
      const activeAudio = getActiveAudio();
      if (activeAudio && activeAudio.paused && !isUserMutedRef.current) {
        activeAudio.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", handleFirstUserGesture, { passive: true });
    window.addEventListener("touchstart", handleFirstUserGesture, { passive: true });
    window.addEventListener("click", handleFirstUserGesture, { passive: true });
    window.addEventListener("keydown", handleFirstUserGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstUserGesture);
      window.removeEventListener("touchstart", handleFirstUserGesture);
      window.removeEventListener("click", handleFirstUserGesture);
      window.removeEventListener("keydown", handleFirstUserGesture);
    };
  }, [hasActiveMusic, getActiveAudio]);

  // Clic direct sur le bouton : action garantie sans conflit
  const toggleMusic = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const activeAudio = getActiveAudio();
    if (!activeAudio) return;

    if (!activeAudio.paused) {
      // L'audio est en cours de lecture : on le met en pause
      isUserMutedRef.current = true;
      activeAudio.pause();
      setIsPlaying(false);
    } else {
      // L'audio est en pause : on le relance (le clic utilisateur autorise la lecture à 100%)
      isUserMutedRef.current = false;
      if (activeAudio.ended) {
        activeAudio.currentTime = 0;
      }
      activeAudio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Échec de la lecture audio :", err);
        });
    }
  };

  // N'afficher le bouton que sur les deux pages concernées (secondHome ou gallery)
  if (!hasActiveMusic) {
    return (
      <>
        <audio
          ref={openingAudioRef}
          src="/assets/opening-titles.mp3"
          preload="auto"
          onPlay={() => isSecondHome && setIsPlaying(true)}
          onPause={() => isSecondHome && setIsPlaying(false)}
          onEnded={() => isSecondHome && setIsPlaying(false)}
        />
        <audio
          ref={galleryAudioRef}
          src="/assets/gallery-theme.mp3"
          preload="auto"
          loop
          onPlay={() => isGallery && setIsPlaying(true)}
          onPause={() => isGallery && setIsPlaying(false)}
        />
      </>
    );
  }

  return (
    <>
      {/* Éléments audio natifs fiables */}
      <audio
        ref={openingAudioRef}
        src="/assets/opening-titles.mp3"
        preload="auto"
        onPlay={() => isSecondHome && setIsPlaying(true)}
        onPause={() => isSecondHome && setIsPlaying(false)}
        onEnded={() => isSecondHome && setIsPlaying(false)}
      />
      <audio
        ref={galleryAudioRef}
        src="/assets/gallery-theme.mp3"
        preload="auto"
        loop
        onPlay={() => isGallery && setIsPlaying(true)}
        onPause={() => isGallery && setIsPlaying(false)}
      />

      {/* Bouton de contrôle du son TOUT EN HAUT DE L'ÉCRAN À GAUCHE */}
      <button
        type="button"
        onClick={toggleMusic}
        title={isPlaying ? "Couper la musique" : "Activer la musique"}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-yellow-500/60 text-yellow-400 hover:text-yellow-300 transition-all shadow-2xl backdrop-blur-md cursor-pointer active:scale-95 group"
        aria-label={isPlaying ? "Couper la musique" : "Activer la musique"}
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5 text-yellow-400 animate-pulse" />
        ) : (
          <VolumeX className="w-5 h-5 text-slate-400" />
        )}
        <span className="text-xs font-mono font-semibold hidden sm:inline text-slate-200 group-hover:text-yellow-300">
          {isPlaying ? "Couper le son" : "Activer le son"}
        </span>
      </button>
    </>
  );
}
