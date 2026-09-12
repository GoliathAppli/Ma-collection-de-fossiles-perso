export interface EmbedVideoInfo {
  url: string;
  originalUrl: string;
  type: 'video' | 'iframe';
  provider?: 'youtube' | 'vimeo' | 'dailymotion' | 'gdrive' | 'direct' | 'local' | 'other';
}

export const getSafeEmbedUrl = (urlStr: string): EmbedVideoInfo => {
  if (!urlStr || typeof urlStr !== 'string') {
    return { url: '', originalUrl: '', type: 'iframe', provider: 'other' };
  }

  const rawUrl = urlStr.trim();
  if (!rawUrl) {
    return { url: '', originalUrl: '', type: 'iframe', provider: 'other' };
  }

  // 1. Base64 Data Videos
  if (rawUrl.startsWith('data:video/')) {
    return { url: rawUrl, originalUrl: rawUrl, type: 'video', provider: 'local' };
  }

  // 2. Blob Videos
  if (rawUrl.startsWith('blob:')) {
    return { url: rawUrl, originalUrl: rawUrl, type: 'video', provider: 'local' };
  }

  // 3. Local Server Path (e.g., /images/fossiles/vid_123.mp4 or ./images/...)
  if (rawUrl.startsWith('/') || rawUrl.startsWith('./') || rawUrl.startsWith('images/') || rawUrl.startsWith('public/')) {
    return { url: rawUrl, originalUrl: rawUrl, type: 'video', provider: 'local' };
  }

  // Ensure absolute protocol for external URLs
  let safeUrl = rawUrl;
  if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
    safeUrl = 'https://' + safeUrl;
  }

  try {
    // 4. YouTube (Supports watch?v=, youtu.be, embed, shorts, live, parameters, etc.)
    const ytMatch = safeUrl.match(
      /(?:(?:www\.|m\.)?(?:youtube\.com|youtube-nocookie\.com)\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return {
        url: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&modestbranding=1`,
        originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'iframe',
        provider: 'youtube',
      };
    }

    // 5. Vimeo
    const vimeoMatch = safeUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}?playsinline=1`,
        originalUrl: safeUrl,
        type: 'iframe',
        provider: 'vimeo',
      };
    }

    // 6. Dailymotion
    const dailyMatch = safeUrl.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
    if (dailyMatch && dailyMatch[1]) {
      return {
        url: `https://www.dailymotion.com/embed/video/${dailyMatch[1]}`,
        originalUrl: safeUrl,
        type: 'iframe',
        provider: 'dailymotion',
      };
    }

    // 7. Google Drive
    const driveMatch = safeUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return {
        url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
        originalUrl: safeUrl,
        type: 'iframe',
        provider: 'gdrive',
      };
    }

    // 8. Direct Video Files (mp4, webm, ogg, mov, m4v, ogv) - Stripping query strings
    const urlWithoutQuery = safeUrl.split('?')[0].split('#')[0];
    if (urlWithoutQuery.match(/\.(mp4|webm|ogg|mov|m4v|ogv)$/i)) {
      return {
        url: safeUrl,
        originalUrl: safeUrl,
        type: 'video',
        provider: 'direct',
      };
    }
  } catch (e) {
    console.warn('Error parsing video URL format:', e);
  }

  // Default fallback
  return { url: safeUrl, originalUrl: safeUrl, type: 'iframe', provider: 'other' };
};
