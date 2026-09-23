import React from 'react';

export type FossilDividerType = 'ammonite' | 'trilobite' | 'leaf' | 'gem';

interface FossilSectionDividerProps {
  type?: FossilDividerType;
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FossilSectionDivider({
  type = 'ammonite',
  className = '',
  label,
  size = 'md',
}: FossilSectionDividerProps) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const renderIcon = () => {
    const iconSizeClass = isLarge ? 'w-6 h-6 sm:w-7 sm:h-7' : isSmall ? 'w-4 h-4' : 'w-5 h-5';

    switch (type) {
      case 'trilobite':
        return (
          <svg
            viewBox="0 0 32 32"
            className={`${iconSizeClass} text-yellow-400 transition-transform duration-300 group-hover:scale-110 shrink-0`}
            fill="none"
            stroke="currentColor"
            strokeWidth={isLarge ? 1.75 : 1.5}
            aria-hidden="true"
          >
            {/* Céphalon (tête) */}
            <path
              d="M7 11 C7 5.5 11 3 16 3 C21 3 25 5.5 25 11 C25 13.5 22 14.5 16 14.5 C10 14.5 7 13.5 7 11 Z"
              fill="currentColor"
              fillOpacity="0.2"
            />
            {/* Yeux à facettes */}
            <circle cx="10.5" cy="9.5" r="1.2" fill="currentColor" />
            <circle cx="21.5" cy="9.5" r="1.2" fill="currentColor" />
            {/* Glabelle */}
            <path d="M14 4.5 C14.5 7.5 15 10 16 10 C17 10 17.5 7.5 18 4.5" strokeLinecap="round" />
            {/* Segments thoraciques articulés */}
            <path d="M8 17 C12 15.8 20 15.8 24 17" strokeLinecap="round" />
            <path d="M9 20 C12.5 19 19.5 19 23 20" strokeLinecap="round" />
            <path d="M10.5 23 C13 22 19 22 21.5 23" strokeLinecap="round" />
            {/* Pygidium (queue) */}
            <path d="M12 26 C13.5 28.5 18.5 28.5 20 26" strokeLinecap="round" />
            {/* Lobe axial central */}
            <path d="M16 14.5 L16 27" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.7" />
          </svg>
        );

      case 'leaf':
        return (
          <svg
            viewBox="0 0 32 32"
            className={`${iconSizeClass} text-yellow-400 transition-transform duration-300 group-hover:scale-110 shrink-0`}
            fill="none"
            stroke="currentColor"
            strokeWidth={isLarge ? 1.75 : 1.5}
            aria-hidden="true"
          >
            <path d="M6 26 C12 23 18 17 26 6" strokeLinecap="round" />
            <path d="M13 21 C15.5 18.5 19.5 18.5 21 19.5" strokeLinecap="round" />
            <path d="M16 17.5 C14 14.5 15 11 17.5 12" strokeLinecap="round" />
            <path d="M19 14.5 C22 12.5 24.5 13.5 25.5 14.5" strokeLinecap="round" />
            <path d="M21.5 11.5 C20 8.5 21 6 23.5 7" strokeLinecap="round" />
            <path d="M10 23.5 C8 21.5 9 18.5 11 19.5" strokeLinecap="round" />
          </svg>
        );

      case 'gem':
        return (
          <svg
            viewBox="0 0 32 32"
            className={`${iconSizeClass} text-yellow-400 transition-transform duration-300 group-hover:scale-110 shrink-0`}
            fill="none"
            stroke="currentColor"
            strokeWidth={isLarge ? 1.75 : 1.5}
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="12" strokeOpacity="0.35" strokeDasharray="2.5 3" />
            <path
              d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z"
              fill="currentColor"
              fillOpacity="0.2"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="16" r="2.5" fill="currentColor" />
          </svg>
        );

      case 'ammonite':
      default:
        return (
          <svg
            viewBox="0 0 32 32"
            className={`${iconSizeClass} text-yellow-400 transition-transform duration-300 group-hover:scale-110 shrink-0`}
            fill="none"
            stroke="currentColor"
            strokeWidth={isLarge ? 1.75 : 1.5}
            aria-hidden="true"
          >
            {/* Spirale logarithmique d'ammonite */}
            <path
              d="M16 3 C23.5 3 29 8.5 29 16 C29 23.5 23.5 29 16 29 C8.5 29 3 23.5 3 16 C3 10.5 7 5.5 12.5 3.8 C15.8 2.8 19.8 4 21.8 7 C23.8 10 23.5 14.5 20.5 17.5 C17.5 20.2 13 20 10.8 17.8 C8.8 15.5 9 12 11.2 10 C13.2 8.2 16.5 9 17 11.2 C17.5 13.2 15.8 15 14 14.2"
              strokeLinecap="round"
              fill="currentColor"
              fillOpacity="0.12"
            />
            {/* Côtes et septa (cloisons fossilisées) */}
            <path d="M16 3.5 L16 8" strokeLinecap="round" opacity="0.75" />
            <path d="M22.5 6.5 L19 10" strokeLinecap="round" opacity="0.75" />
            <path d="M27.5 12 L22.5 13.5" strokeLinecap="round" opacity="0.75" />
            <path d="M27.5 20 L22.5 18.5" strokeLinecap="round" opacity="0.75" />
            <path d="M22.5 25.5 L19 22" strokeLinecap="round" opacity="0.75" />
            <path d="M16 28.5 L16 24" strokeLinecap="round" opacity="0.75" />
            <path d="M9.5 25.5 L13 22" strokeLinecap="round" opacity="0.75" />
            <path d="M4.5 20 L9.5 18.5" strokeLinecap="round" opacity="0.75" />
            <path d="M4.5 12 L9.5 13.5" strokeLinecap="round" opacity="0.75" />
          </svg>
        );
    }
  };

  const marginClass = isLarge
    ? 'mt-12 sm:mt-20 mb-4 sm:mb-6'
    : isSmall
    ? 'mt-6 sm:mt-8 mb-2.5 sm:mb-3'
    : 'mt-12 sm:mt-18 mb-3.5 sm:mb-5';
  const badgePadClass = isLarge ? 'px-4 sm:px-6 py-2 sm:py-2.5' : isSmall ? 'px-2.5 py-1' : 'px-3.5 py-1.5';
  const dotSize = isLarge ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : isSmall ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const lineThickness = isLarge ? 'h-[2px]' : 'h-[1px]';

  return (
    <div
      className={`w-full flex items-center justify-center gap-2.5 sm:gap-3.5 ${marginClass} select-none group pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Filet gauche effilé dégradé doré */}
      <div className="flex-1 flex items-center justify-end">
        <div className={`w-full max-w-md ${lineThickness} ${isLarge ? 'bg-gradient-to-r from-transparent via-yellow-600/50 to-yellow-400' : 'bg-gradient-to-r from-transparent via-yellow-600/30 to-yellow-500/70'}`} />
        <div className={`${dotSize} rounded-full bg-yellow-400 shrink-0 ml-1.5 shadow-[0_0_8px_rgba(234,179,8,0.7)]`} />
      </div>

      {/* Médaillon central orné du dessin paléontologique */}
      <div
        className={`flex items-center gap-2.5 sm:gap-3 ${badgePadClass} rounded-full shrink-0 ${
          isLarge
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-yellow-500/80 shadow-[0_0_24px_rgba(234,179,8,0.3)] ring-1 ring-yellow-400/20'
            : 'bg-slate-900/90 border border-yellow-600/40 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
        }`}
      >
        {renderIcon()}
        {label && (
          <span
            className={
              isLarge
                ? 'text-xs sm:text-sm md:text-base font-serif font-black tracking-widest sm:tracking-[0.2em] text-yellow-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
                : 'text-[10px] sm:text-xs font-mono tracking-wider sm:tracking-widest text-yellow-400 uppercase font-bold'
            }
          >
            {label}
          </span>
        )}
      </div>

      {/* Filet droit effilé dégradé doré */}
      <div className="flex-1 flex items-center justify-start">
        <div className={`${dotSize} rounded-full bg-yellow-400 shrink-0 mr-1.5 shadow-[0_0_8px_rgba(234,179,8,0.7)]`} />
        <div className={`w-full max-w-md ${lineThickness} ${isLarge ? 'bg-gradient-to-l from-transparent via-yellow-600/50 to-yellow-400' : 'bg-gradient-to-l from-transparent via-yellow-600/30 to-yellow-500/70'}`} />
      </div>
    </div>
  );
}
