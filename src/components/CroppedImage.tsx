import React, { useState } from 'react';
import { ImageSettings } from '../types';
import { X, Maximize2 } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

interface CroppedImageProps {
  settings?: ImageSettings;
  alt?: string;
  className?: string; // class applied to wrap container
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function CroppedImage({ settings, alt = 'Fossil Image', className = '', onClick, style }: CroppedImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!settings || !settings.url) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsFullscreen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative overflow-hidden rounded bg-transparent group ${!onClick ? 'cursor-pointer' : onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        style={style}
      >
        {!onClick && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
          </div>
        )}
        <img
          src={resolveImageUrl(settings.url)}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute z-10 transition-transform duration-150 ease-out"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `scale(${settings.scale || 1}) translate(${settings.posX || 0}%, ${settings.posY || 0}%)`,
            top: 0,
            left: 0,
          }}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackTried) {
              // We already tried recovery, show the error placeholder and hide image
              const parent = img.parentElement;
              if (parent && !parent.querySelector('.img-error-placeholder')) {
                const errorPlaceholder = document.createElement('div');
                errorPlaceholder.className = "img-error-placeholder absolute inset-0 flex items-center justify-center bg-red-950/10 text-red-400 text-[10px] font-mono p-2 text-center z-20";
                errorPlaceholder.innerText = "Lien d'image invalide";
                parent.appendChild(errorPlaceholder);
              }
              img.style.display = 'none';
              return;
            }

            img.dataset.fallbackTried = 'true';
            const currentSrc = img.src;
            
            // Auto-recovery for GitHub Pages folder structure mismatch (images/ vs public/images/)
            if (currentSrc.includes("/images/fossiles/") && !currentSrc.includes("/public/images/fossiles/")) {
              const fallbackSrc = currentSrc.replace("/images/fossiles/", "/public/images/fossiles/");
              if (fallbackSrc !== currentSrc) {
                img.src = fallbackSrc;
                return;
              }
            } else if (currentSrc.includes("/public/images/fossiles/")) {
              const fallbackSrc = currentSrc.replace("/public/images/fossiles/", "/images/fossiles/");
              if (fallbackSrc !== currentSrc) {
                img.src = fallbackSrc;
                return;
              }
            }

            const parent = img.parentElement;
            if (parent && !parent.querySelector('.img-error-placeholder')) {
              const errorPlaceholder = document.createElement('div');
              errorPlaceholder.className = "img-error-placeholder absolute inset-0 flex items-center justify-center bg-red-950/10 text-red-400 text-[10px] font-mono p-2 text-center z-20";
              errorPlaceholder.innerText = "Lien d'image invalide";
              parent.appendChild(errorPlaceholder);
            }
            img.style.display = 'none';
          }}
        />
      </div>

      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full z-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={resolveImageUrl(settings.url)} 
            alt={alt}  
            className="max-w-full max-h-full object-contain shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}
