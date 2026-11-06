import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AmmoniteIcon } from '../utils/data/PeriodIcons';

interface DinosaurLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export default function DinosaurLoadingScreen({
  isReady = false,
  onFinish,
}: DinosaurLoadingScreenProps) {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isReady) {
      // Progressively advance from left to right as the app loads
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + Math.random() * 6 + 3;
          if (prev < 65) return prev + Math.random() * 4 + 2;
          if (prev < 88) return prev + Math.random() * 2 + 1;
          if (prev < 94) return prev + 0.4;
          return prev;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      // When configuration and assets are ready, complete smoothly to 100%
      setProgress(100);
      timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 overflow-hidden select-none"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-amber-950/20 via-slate-950/60 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-7">
        
        {/* Animated Central Prehistoric Ammonite Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing outer halo */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-6 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 blur-2xl pointer-events-none"
          />

          {/* Rotating celestial ring with dashes */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-4 rounded-full border border-dashed border-yellow-500/30 pointer-events-none"
          />

          {/* Central Ammonite Orb */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950 border-2 border-yellow-500/70 text-yellow-400 flex items-center justify-center shadow-[0_0_35px_rgba(234,179,8,0.25)]">
            <AmmoniteIcon className="w-16 h-16 sm:w-18 sm:h-18 drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]" />
          </div>
        </div>

        {/* The single, pure evocative title */}
        <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-wider bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(234,179,8,0.35)]">
          Retour vers le passé en cours...
        </h2>

        {/* Progressive Progress Bar with Rolling Ammonite Cursor */}
        <div className="w-full space-y-2 px-1">
          <div className="relative w-full h-3.5 bg-slate-900/95 rounded-full border border-yellow-500/40 p-0.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
            
            {/* Interior glowing background track */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 pointer-events-none" />

            {/* Filled progress bar advancing behind the cursor */}
            <div
              style={{ width: `${clampedProgress}%` }}
              className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.6)] transition-all duration-150 ease-out"
            />

            {/* Ammonite Cursor advancing progressively from 0% to 100% */}
            <div
              style={{
                left: `${clampedProgress}%`,
                transform: `translate(-50%, -50%) rotate(${clampedProgress * 3.6}deg)`,
              }}
              className="absolute top-1/2 z-20 pointer-events-none transition-all duration-150 ease-out"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950 border-2 border-yellow-400 text-yellow-300 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.85)]">
                <AmmoniteIcon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_6px_rgba(234,179,8,0.9)]" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,1)]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
