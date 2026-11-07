import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import nedry1Img from "../assets/nedry-1.png";
import nedry2Img from "../assets/nedry-2.png";
import jurassicAudioSrc from "../assets/jurassic-magic-word.mp3";

interface SecretLockCharacterProps {
  className?: string;
}

export default function SecretLockCharacter({ className = "" }: SecretLockCharacterProps) {
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

  // Déblocage automatique au premier geste utilisateur si le navigateur avait bloqué l'autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.85;

    // Tentative immédiate
    audio.play().catch(() => {
      // Autoplay bloqué avant interaction
    });

    const handleFirstGesture = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", handleFirstGesture, { passive: true });
    window.addEventListener("click", handleFirstGesture, { passive: true });
    window.addEventListener("touchstart", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const toggleAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Lecture audio bloquée :", err));
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Élément audio natif intégré avec loop */}
      <audio
        ref={audioRef}
        src={jurassicAudioSrc}
        preload="auto"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Frame 1 (Bras en position basse / doigt pointé) */}
        <img
          src={nedry1Img}
          alt="Animation contrôle d'accès - image 1"
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{ display: currentFrame === 0 ? "block" : "none" }}
          loading="eager"
        />

        {/* Frame 2 (Bras en position haute / doigt levé) */}
        <img
          src={nedry2Img}
          alt="Animation contrôle d'accès - image 2"
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{ display: currentFrame === 1 ? "block" : "none" }}
          loading="eager"
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
