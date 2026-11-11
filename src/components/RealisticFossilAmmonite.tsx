import React from 'react';
import { REAL_AMMONITE_SRC } from '../utils/ammoniteAsset';

interface RealisticFossilAmmoniteProps {
  className?: string;
  size?: number | string;
  glowOnHover?: boolean;
}

/**
 * Dessin d'ammonite gravé dans le style doré muséal
 * - Courbes régulières et harmonieuses
 * - Parfaitement intégré dans le décor sombre et or de l'application
 * - Reconnaissable au premier coup d'œil avec ses côtes spiralées
 */
export default function RealisticFossilAmmonite({
  className = "w-24 h-24",
  size,
  glowOnHover = true,
}: RealisticFossilAmmoniteProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      style={style}
      className={`relative flex items-center justify-center select-none ${className} ${
        glowOnHover ? 'group-hover:scale-108 transition-transform duration-300 ease-out' : ''
      }`}
    >
      {/* Halo ambré doux en arrière-plan qui s'illumine au survol */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500/20 via-amber-400/25 to-yellow-600/10 blur-xl pointer-events-none group-hover:scale-120 group-hover:bg-yellow-400/40 transition-all duration-500" />

      {/* Dessin d'ammonite doré gravé en médaillon */}
      <img
        src={REAL_AMMONITE_SRC}
        alt="Ammonite gravée"
        className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_4px_18px_rgba(234,179,8,0.3)] group-hover:drop-shadow-[0_6px_28px_rgba(250,204,21,0.65)] pointer-events-none transition-all duration-300"
        draggable={false}
      />
    </div>
  );
}
