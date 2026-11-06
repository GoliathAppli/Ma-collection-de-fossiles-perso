import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SecretLockCharacterProps {
  className?: string;
  audioSrc?: string;
}

export default function SecretLockCharacter({
  className = "",
  audioSrc = "/assets/jurassic-magic-word.mp3",
}: SecretLockCharacterProps) {
  const [currentFrame, setCurrentFrame] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Alterne exactement toutes les 500 millisecondes (1 demie seconde)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev === 0 ? 1 : 0));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Gestion du son en boucle tant que le mot de passe n'est pas rentré
  useEffect(() => {
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.85;
    audioRef.current = audio;

    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    const startPlayback = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    };

    // Tente de jouer dès le chargement
    startPlayback();

    // Déclencheur sur la première interaction utilisateur sur la page
    const handleUserGesture = () => {
      if (audioRef.current && audioRef.current.paused) {
        startPlayback();
      }
    };

    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("click", handleUserGesture, { passive: true });
    window.addEventListener("keydown", handleUserGesture, { passive: true });
    window.addEventListener("touchstart", handleUserGesture, { passive: true });

    // Nettoyage impératif : coupe le son dès que le mot de passe est validé ou qu'on quitte la vue
    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [audioSrc]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Lecture audio bloquée :", err));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Frame 1 (Bras en position basse / doigt pointé) */}
        <img
          src="/assets/nedry-1.png"
          alt="Animation contrôle d'accès - image 1"
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{ display: currentFrame === 0 ? "block" : "none" }}
          loading="eager"
          decoding="sync"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/aistudio/Screenshot_20261106_201958_Photo_Editor_8cd30553.png";
          }}
        />

        {/* Frame 2 (Bras en position haute / doigt levé) */}
        <img
          src="/assets/nedry-2.png"
          alt="Animation contrôle d'accès - image 2"
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{ display: currentFrame === 1 ? "block" : "none" }}
          loading="eager"
          decoding="sync"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/aistudio/Screenshot_20261106_201952_Photo_Editor_f1122495.png";
          }}
        />

      </div>

      {/* Bouton de coupure / activation du son TOUT EN HAUT DE L'ÉCRAN À GAUCHE */}
      <button
        type="button"
        onClick={toggleAudio}
        title={isPlaying ? "Couper le son" : "Activer le son"}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-yellow-500/60 text-yellow-400 hover:text-yellow-300 transition-all shadow-2xl backdrop-blur-md cursor-pointer active:scale-95 group"
        aria-label={isPlaying ? "Couper le son" : "Activer le son"}
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
    </div>
  );
}
