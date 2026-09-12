import React, { useRef, useState } from 'react';
import { ImageSettings } from '../../types';
import { resolveImageUrl } from '../imageUrl';

interface ImageAdjusterProps {
  key?: React.Key;
  label: string;
  settings: ImageSettings;
  onChange: (updated: ImageSettings) => void;
}

export function compressImage(dataUrl: string, maxDimension = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Check if PNG has alpha channel or if WebP/JPEG can be used safely
        const isPng = dataUrl.startsWith("data:image/png");
        let mimeType = "image/jpeg";
        let outQuality: number | undefined = quality;

        if (isPng) {
          // If PNG, try WebP or keep PNG at reasonable size
          mimeType = "image/webp";
          outQuality = 0.85;
        }

        let compressedDataUrl = canvas.toDataURL(mimeType, outQuality);
        // Fallback to jpeg if browser doesn't support webp
        if (!compressedDataUrl.startsWith("data:image/webp") && isPng) {
          compressedDataUrl = canvas.toDataURL("image/png");
        }

        if (compressedDataUrl && compressedDataUrl.length < dataUrl.length) {
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        console.error("Failed to compress image:", err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

export default function ImageAdjuster({ label, settings, onChange }: ImageAdjusterProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const safeSettings = {
    url: settings?.url || '',
    scale: settings?.scale ?? 1,
    posX: settings?.posX ?? 0,
    posY: settings?.posY ?? 0
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploading(false);
        return;
      }

      try {
        // Compresser l'image de manière asynchrone pour éviter les fichiers trop volumineux
        const compressedUrl = await compressImage(dataUrl);
        
        // Fast bypass if standalone mode or server is known to be offline
        if ((window as any).__IS_STANDALONE__ || (window as any).__SERVER_UPLOAD_OFFLINE__) {
          onChange({ ...safeSettings, url: compressedUrl });
          setIsUploading(false);
          return;
        }

        const controller = new AbortController();
        // Give 30 seconds to upload over slower internet networks
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ dataUrl: compressedUrl }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.url) {
              onChange({ ...safeSettings, url: data.url });
            } else {
              onChange({ ...safeSettings, url: compressedUrl });
            }
          } else {
            if (res.status === 404 || res.status === 502 || res.status === 503) {
              (window as any).__SERVER_UPLOAD_OFFLINE__ = true;
            }
            onChange({ ...safeSettings, url: compressedUrl });
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if ((fetchErr as Error).name !== "AbortError") {
            (window as any).__SERVER_UPLOAD_OFFLINE__ = true;
          }
          onChange({ ...safeSettings, url: compressedUrl });
        }
      } catch (err) {
        console.error("Direct image upload failed, falling back to base64:", err);
        onChange({ ...safeSettings, url: dataUrl });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = (err) => {
      console.error("FileReader failed", err);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...safeSettings, scale: parseFloat(e.target.value) });
  };

  const handlePosXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...safeSettings, posX: parseInt(e.target.value, 10) });
  };

  const handlePosYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...safeSettings, posY: parseInt(e.target.value, 10) });
  };

  return (
    <div className="bg-slate-900/40 p-3 rounded-lg border border-yellow-700/20 text-xs space-y-2 mb-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-yellow-600/90 tracking-wide uppercase">{label}</span>
        {safeSettings.url && (
          <button
            type="button"
            onClick={() => {
              onChange({ url: '', scale: 1, posX: 0, posY: 0 });
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-[10px] text-red-400/80 hover:text-red-300 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div>
        <label className="block text-[10px] text-slate-400 mb-1">Sélectionner une image (Galerie)</label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          disabled={isUploading}
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded px-2 py-1 text-xs focus:outline-none focus:border-yellow-600/60 disabled:opacity-50"
          onChange={handleFileChange}
          id={"image-input-" + label.replace(/[^a-zA-Z0-9]/g, '-')}
        />
        {isUploading && (
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-mono animate-pulse mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping inline-block" />
            Synchronisation de l'image en cours...
          </div>
        )}
      </div>

      {safeSettings.url && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <label className="block text-[10px] text-slate-400">Échelle ({Math.round(safeSettings.scale * 100)}%)</label>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              className="w-full accent-yellow-600"
              value={safeSettings.scale}
              onChange={handleScaleChange}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400">Position X ({safeSettings.posX}%)</label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              className="w-full accent-yellow-600"
              value={safeSettings.posX}
              onChange={handlePosXChange}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400">Position Y ({safeSettings.posY}%)</label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              className="w-full accent-yellow-600"
              value={safeSettings.posY}
              onChange={handlePosYChange}
            />
          </div>
        </div>
      )}

      {/* Mini preview corner */}
      {safeSettings.url && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-12 h-12 bg-transparent border border-slate-800 rounded overflow-hidden flex items-center justify-center relative">
            <img
              src={resolveImageUrl(safeSettings.url)}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="max-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${safeSettings.scale}) translate(${safeSettings.posX}%, ${safeSettings.posY}%)`,
                transition: 'transform 0.1s ease-out'
              }}
              onError={(e) => {
                // fallback on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-[10px] text-green-500/80">Image validée</span>
        </div>
      )}
    </div>
  );
}
