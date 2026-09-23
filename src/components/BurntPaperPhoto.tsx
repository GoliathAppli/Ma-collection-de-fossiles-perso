import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageSettings } from '../types';
import CroppedImage from './CroppedImage';
import { resolveImageUrl } from '../utils/imageUrl';
import { X, ZoomIn } from 'lucide-react';

interface BurntPaperPhotoProps {
  settings?: ImageSettings;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export default function BurntPaperPhoto({
  settings,
  alt = 'Photo description scientifique',
  className = '',
  onClick,
}: BurntPaperPhotoProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!settings?.url) return;
    const img = new Image();
    img.src = resolveImageUrl(settings.url);
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    } else {
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [settings?.url]);

  if (!settings || !settings.url) {
    return null;
  }

  const handleOpenFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      setIsFullscreen(true);
    }
  };

  const frameStyle: React.CSSProperties = aspectRatio
    ? {
        aspectRatio: `${aspectRatio}`,
        width: aspectRatio > 1.2 ? '100%' : 'auto',
        height: aspectRatio > 1.2 ? 'auto' : '100%',
        maxWidth: '100%',
        maxHeight: '100%',
      }
    : {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
      };

  return (
    <>
      <div 
        className={`relative flex items-center justify-center bg-transparent select-none cursor-pointer group ${className}`}
        onClick={handleOpenFullscreen}
        role="button"
        tabIndex={0}
        aria-label="Agrandir la photo en plein écran"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOpenFullscreen(e as unknown as React.MouseEvent);
          }
        }}
      >
        {/* Conteneur principal calé sur les proportions de l'image */}
        <div
          className="relative flex items-center justify-center bg-transparent transition-transform duration-200 group-hover:scale-[1.01]"
          style={frameStyle}
        >
          {/* Conteneur de l'image avec adoucissement léger des bords et transparence totale pour les PNG */}
          <div
            className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden rounded-[3px]"
            style={{
              // Légère estompe de 1% sur l'extrême contour pour que la peinture se fonde naturellement
              maskImage: 'radial-gradient(ellipse at center, black 95%, rgba(0, 0, 0, 0.8) 98%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 95%, rgba(0, 0, 0, 0.8) 98%, transparent 100%)',
            }}
          >
            <CroppedImage
              settings={settings}
              alt={alt}
              className="w-full h-full object-contain bg-transparent border-0 shadow-none pointer-events-none"
            />
          </div>

          {/* Délicates touches de peinture / lavis qui débordent subtilement sur les 4 contours sans JAMAIS recouvrir le centre de l'image */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
            {/* Bord supérieur : coup de pinceau estompé */}
            <div 
              className="absolute -top-[2px] left-0 right-0 h-[6px] opacity-75"
              style={{
                background: 'linear-gradient(to bottom, #0b1120 20%, rgba(11, 17, 32, 0.4) 60%, transparent 100%)',
                clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 75% 65%, 50% 95%, 25% 60%, 2% 100%)',
              }}
            />
            {/* Bord inférieur : coup de pinceau estompé */}
            <div 
              className="absolute -bottom-[2px] left-0 right-0 h-[6px] opacity-75"
              style={{
                background: 'linear-gradient(to top, #0b1120 20%, rgba(11, 17, 32, 0.4) 60%, transparent 100%)',
                clipPath: 'polygon(0% 100%, 100% 100%, 98% 0%, 75% 40%, 50% 10%, 25% 45%, 2% 0%)',
              }}
            />
            {/* Bord gauche : coup de pinceau estompé */}
            <div 
              className="absolute top-0 bottom-0 -left-[2px] w-[6px] opacity-75"
              style={{
                background: 'linear-gradient(to right, #0b1120 20%, rgba(11, 17, 32, 0.4) 60%, transparent 100%)',
                clipPath: 'polygon(0% 0%, 0% 100%, 100% 98%, 60% 75%, 95% 50%, 60% 25%, 100% 2%)',
              }}
            />
            {/* Bord droit : coup de pinceau estompé */}
            <div 
              className="absolute top-0 bottom-0 -right-[2px] w-[6px] opacity-75"
              style={{
                background: 'linear-gradient(to left, #0b1120 20%, rgba(11, 17, 32, 0.4) 60%, transparent 100%)',
                clipPath: 'polygon(100% 0%, 100% 100%, 0% 98%, 40% 75%, 10% 50%, 40% 25%, 0% 2%)',
              }}
            />

            {/* Touches d'aquarelle/peinture plus expressives aux 4 angles */}
            <svg 
              className="absolute -top-[3px] -left-[3px] w-6 h-6 text-[#0b1120] opacity-80" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M0,0 L18,0 C12,4 8,8 4,14 C2,10 0,6 0,0 Z" />
            </svg>
            <svg 
              className="absolute -top-[3px] -right-[3px] w-6 h-6 text-[#0b1120] opacity-80 scale-x-[-1]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M0,0 L18,0 C12,4 8,8 4,14 C2,10 0,6 0,0 Z" />
            </svg>
            <svg 
              className="absolute -bottom-[3px] -left-[3px] w-6 h-6 text-[#0b1120] opacity-80 scale-y-[-1]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M0,0 L18,0 C12,4 8,8 4,14 C2,10 0,6 0,0 Z" />
            </svg>
            <svg 
              className="absolute -bottom-[3px] -right-[3px] w-6 h-6 text-[#0b1120] opacity-80 scale-[-1]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M0,0 L18,0 C12,4 8,8 4,14 C2,10 0,6 0,0 Z" />
            </svg>
          </div>

          {/* Indicateur visuel discret invitant à cliquer / agrandir au survol */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-yellow-400 text-xs font-mono tracking-wide border border-yellow-500/30 shadow-lg">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Agrandir</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox plein écran montée au niveau de document.body via un portail (garantit un affichage parfait sur tout appareil) */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full z-50 transition-colors shadow-2xl cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            aria-label="Fermer le plein écran"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="relative max-w-full max-h-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={resolveImageUrl(settings.url)} 
              alt={alt}  
              className="max-w-[92vw] max-h-[88vh] object-contain shadow-2xl rounded select-none cursor-default"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
