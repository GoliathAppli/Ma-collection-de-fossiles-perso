import React from 'react';
import { motion } from 'motion/react';
import { AmmoniteIcon, TrilobiteIcon, MammothIcon, MicrobeIcon } from '../utils/data/PeriodIcons';
import { Sparkles, Video, Compass } from 'lucide-react';

interface DinosaurLoadingScreenProps {
  message?: string;
  submessage?: string;
}

export default function DinosaurLoadingScreen({
  message = "Fouilles paléontologiques en cours...",
  submessage = "Synchronisation de la collection, des fiches et des documentaires vidéo..."
}: DinosaurLoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 overflow-hidden select-none"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-amber-950/20 via-slate-950/60 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-7">
        
        {/* Animated Central Prehistoric Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing outer halo */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-8 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 blur-2xl pointer-events-none"
          />

          {/* Rotating celestial ring with dashes */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-5 rounded-full border border-dashed border-yellow-500/30 pointer-events-none"
          />

          {/* Counter-rotating subtle ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-2.5 rounded-full border border-yellow-600/40 pointer-events-none"
          />

          {/* Central Ammonite Orb */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/80 border-2 border-yellow-500/70 text-yellow-400 flex items-center justify-center shadow-[0_0_35px_rgba(234,179,8,0.25)]">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <AmmoniteIcon className="w-16 h-16 sm:w-18 sm:h-18 drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]" />
            </motion.div>
          </div>
        </div>

        {/* Title and Branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-500/60" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.25em] text-yellow-500/90 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              Conservatoire Paléontologique
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-500/60" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-wider bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
            {message}
          </h2>

          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-sans">
            {submessage}
          </p>
        </div>

        {/* 4 Geological Period Icons Pulse Indicator */}
        <div className="flex items-center justify-center gap-4 py-1">
          {[
            { Icon: MicrobeIcon, label: "Précambrien", color: "text-amber-400" },
            { Icon: TrilobiteIcon, label: "Paléozoïque", color: "text-sky-400" },
            { Icon: AmmoniteIcon, label: "Mésozoïque", color: "text-emerald-400" },
            { Icon: MammothIcon, label: "Cénozoïque", color: "text-purple-400" },
          ].map((era, idx) => (
            <motion.div
              key={era.label}
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: idx * 0.35,
                ease: "easeInOut",
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${era.color} shadow-sm`}>
                <era.Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                {era.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Golden Progress Bar */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-500/80 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synchronisation des archives en temps réel...</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
