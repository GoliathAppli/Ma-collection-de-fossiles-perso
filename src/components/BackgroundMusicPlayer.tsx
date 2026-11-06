import React, { useState, useEffect, useRef } from "react";
import { Music, VolumeX } from "lucide-react";
import { safeSessionStorage } from "../utils/safeStorage";

interface BackgroundMusicPlayerProps {
  currentView: string;
}

export default function BackgroundMusicPlayer({ currentView }: BackgroundMusicPlayerProps) {
  // Détection de la page active pour la musique
  const isSecondHome = currentView === "secondHome";
  const isGallery = currentView === "gallery";
  const hasActiveMusic = isSecondHome || isGallery;

  // États de coupure mémorisés séparément pour chaque section
  const [isOpeningMuted, setIsOpeningMuted] = useState<boolean>(() => {
    return safeSessionStorage.getItem("opening_music_muted") === "true";
  });
  const [isGalleryMuted, setIsGalleryMuted] = useState<boolean>(() => {
    return safeSessionStorage.getItem("gallery_music_muted") === "true";
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Deux instances Audio distinctes avec leurs configurations respectives
  const openingAudioRef = useRef<HTMLAudioElement | null>(null);
  const galleryAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialisation de la musique de l'accueil de la collection (Opening Titles - 1 seule fois)
  useEffect(() => {
    const audio = new Audio("/assets/opening-titles.mp3");
    audio.loop = false; // Ne boucle pas, se joue une seule fois
    audio.volume = 0.6;
    openingAudioRef.current = audio;

    const onEnded = () => {
      if (currentView === "secondHome") {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      openingAudioRef.current = null;
    };
  }, []);

  // 2. Initialisation de la musique de la Galerie (End Credits - Jurassic Park Theme)
  useEffect(() => {
    const audio = new Audio("/assets/gallery-theme.mp3");
    audio.loop = true; // En boucle pendant toute la navigation dans la galerie
    audio.volume = 0.55;
    galleryAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      galleryAudioRef.current = null;
    };
  }, []);

  // 3. Gestion de la lecture selon la page affichée
  useEffect(() => {
    const openingAudio = openingAudioRef.current;
    const galleryAudio = galleryAudioRef.current;

    // A. Page Accueil Collection (secondHome)
    if (isSecondHome) {
      if (galleryAudio && !galleryAudio.paused) {
        galleryAudio.pause();
        galleryAudio.currentTime = 0;
      }

      if (openingAudio) {
        if (isOpeningMuted) {
          openingAudio.pause();
          setIsPlaying(false);
        } else {
          openingAudio.currentTime = 0;
          openingAudio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    }
    // B. Rubrique Galerie (gallery)
    else if (isGallery) {
      if (openingAudio && !openingAudio.paused) {
        openingAudio.pause();
        openingAudio.currentTime = 0;
      }

      if (galleryAudio) {
        if (isGalleryMuted) {
          galleryAudio.pause();
          setIsPlaying(false);
        } else {
          galleryAudio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    }
    // C. Autres pages (accueil vidéo, ères, fiches, etc.)
    else {
      if (openingAudio && !openingAudio.paused) {
        openingAudio.pause();
        openingAudio.currentTime = 0;
      }
      if (galleryAudio && !galleryAudio.paused) {
        galleryAudio.pause();
        galleryAudio.currentTime = 0;
      }
      setIsPlaying(false);
    }

    // Gestion de la politique d'autoplay navigateur : lancement au premier geste
    const handleGesture = () => {
      if (isSecondHome && openingAudio && openingAudio.paused && !isOpeningMuted) {
        openingAudio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else if (isGallery && galleryAudio && galleryAudio.paused && !isGalleryMuted) {
        galleryAudio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("keydown", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });

    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, [currentView, isSecondHome, isGallery, isOpeningMuted, isGalleryMuted]);

  // Bascule du son pour la section active
  const toggleMusic = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSecondHome && openingAudioRef.current) {
      const audio = openingAudioRef.current;
      if (!audio.paused) {
        audio.pause();
        setIsOpeningMuted(true);
        setIsPlaying(false);
        safeSessionStorage.setItem("opening_music_muted", "true");
      } else {
        setIsOpeningMuted(false);
        safeSessionStorage.setItem("opening_music_muted", "false");
        if (audio.ended) audio.currentTime = 0;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn(err));
      }
    } else if (isGallery && galleryAudioRef.current) {
      const audio = galleryAudioRef.current;
      if (!audio.paused) {
        audio.pause();
        setIsGalleryMuted(true);
        setIsPlaying(false);
        safeSessionStorage.setItem("gallery_music_muted", "true");
      } else {
        setIsGalleryMuted(false);
        safeSessionStorage.setItem("gallery_music_muted", "false");
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn(err));
      }
    }
  };

  // N'affiche le bouton en haut à gauche que si l'on est sur une section avec musique
  if (!hasActiveMusic) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleMusic}
      title={isPlaying ? "Couper la musique" : "Lancer la musique"}
      className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-yellow-500/60 text-yellow-400 hover:text-yellow-300 transition-all shadow-2xl backdrop-blur-md cursor-pointer active:scale-95 group"
      aria-label={isPlaying ? "Couper la musique" : "Lancer la musique"}
    >
      {isPlaying ? (
        <Music className="w-5 h-5 text-yellow-400 animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-400" />
      )}
      <span className="text-xs font-mono font-semibold hidden sm:inline text-slate-200 group-hover:text-yellow-300">
        {isPlaying ? "Couper musique" : "Lancer musique"}
      </span>
    </button>
  );
}
