/// <reference types="vite/client" />
import { get, set } from "idb-keyval";
import { AppConfig } from "./types";
import { safeLocalStorage } from "./utils/safeStorage";
import { getStoredFileHandle, writeToFileHandle, tryRecoverJSON } from "./utils/fileSystemAccess";
import { optimizeAllConfigImages } from "./utils/data/imageOptimizer";
import { sortFossilsChronologically } from "./utils/chronology";
import { 
  getGitHubConfig, 
  isGitHubConfigured, 
  canPushToGitHub, 
  fetchFromGitHub, 
  pushToGitHub 
} from "./utils/githubSync";

export const LOCAL_STORAGE_KEY = "fossils_collection_config_v2";

export const DEFAULT_CONFIG: AppConfig = {
  videoUrl1: "",
  secondHomeTitle: "Fossiles de Collection",
  secondHomeImage: { url: "", scale: 1, posX: 0, posY: 0 },
  scaleVideoUrl: "",
  fossils: [],
  technicalSheets: [],
};

export function sanitizeConfig(config: any): AppConfig {
  if (!config) return { ...DEFAULT_CONFIG };
  
  return {
    lastUpdated: typeof config.lastUpdated === "number" ? config.lastUpdated : undefined,
    videoUrl1: typeof config.videoUrl1 === "string" ? config.videoUrl1 : "",
    secondHomeTitle: typeof config.secondHomeTitle === "string" ? config.secondHomeTitle : (DEFAULT_CONFIG.secondHomeTitle || "Fossiles de Collection"),
    secondHomeImage: config.secondHomeImage || DEFAULT_CONFIG.secondHomeImage,
    scaleVideoUrl: typeof config.scaleVideoUrl === "string" ? config.scaleVideoUrl : "",
    eraPrecambrianImage: config.eraPrecambrianImage,
    eraPaleozoicImage: config.eraPaleozoicImage,
    eraMesozoicImage: config.eraMesozoicImage,
    eraCenozoicImage: config.eraCenozoicImage,
    fossils: Array.isArray(config.fossils)
      ? sortFossilsChronologically(
          config.fossils.filter(Boolean).map((f: any) => {
            const mainImg = f.image ? { ...f.image } : { url: "", scale: 1, posX: 0, posY: 0 };
            return {
              ...f,
              image: mainImg,
              thumbnailImage: { ...mainImg },
              dimensions: typeof f.dimensions === "string" ? f.dimensions : "",
              tailleEspece: typeof f.tailleEspece === "string" ? f.tailleEspece : "",
              poidsEspece: typeof f.poidsEspece === "string" ? f.poidsEspece : "",
              lifespanYears: typeof f.lifespanYears === "string" ? f.lifespanYears : "",
              lifespanDescription: typeof f.lifespanDescription === "string" ? f.lifespanDescription : "",
              saviezVousImage: { url: "", scale: 1, posX: 0, posY: 0 },
              descImages: Array.isArray(f.descImages)
                ? f.descImages.filter((img: any) => img && typeof img.url === "string" && img.url.trim() !== "")
                : [],
              dietImages: Array.isArray(f.dietImages)
                ? f.dietImages.filter((img: any) => img && typeof img.url === "string" && img.url.trim() !== "")
                : [],
            };
          })
        )
      : [],
    technicalSheets: Array.isArray(config.technicalSheets) ? config.technicalSheets.filter(Boolean) : [],
  };
}

export async function loadAppConfig(onProgress?: (percent: number) => void): Promise<AppConfig> {
  onProgress?.(15);
  const baseUrl = import.meta.env.BASE_URL || "/";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";

  // We will collect configs from all possible sources
  let serverConfig: AppConfig | null = null;
  let staticConfig: AppConfig | null = null;
  let preloadedConfig: AppConfig | null = null;
  let fileConfig: AppConfig | null = null;
  let idbConfig: AppConfig | null = null;
  let githubConfig: AppConfig | null = null;

  // 1. FAST LOCAL CACHES: Migration and IndexedDB
  try {
    const lsData = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (lsData) {
      console.log("Found fossils config in localStorage. Migrating to IndexedDB...");
      const parsedLS = JSON.parse(lsData);
      if (parsedLS) {
        await set(LOCAL_STORAGE_KEY, parsedLS).catch(() => {});
        safeLocalStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log("Successfully migrated and cleared localStorage fossil config! Reclaimed 5MB space.");
      }
    }
  } catch (migErr) {
    console.warn("Failed or skipped localStorage migration:", migErr);
  }

  // Preloaded config check
  if (typeof window !== "undefined" && (window as any).__PRELOADED_CONFIG__) {
    const preloaded = (window as any).__PRELOADED_CONFIG__;
    if (preloaded && (Array.isArray(preloaded.fossils) || Array.isArray(preloaded.technicalSheets))) {
      preloadedConfig = sanitizeConfig(preloaded);
    }
  }

  // IndexedDB cache
  try {
    const parsed = await get(LOCAL_STORAGE_KEY);
    if (parsed) {
      idbConfig = sanitizeConfig(parsed);
    }
  } catch (err) {
    console.warn("Failed to load cached config from IndexedDB:", err);
  }

  // File system handle
  try {
    const handle = await getStoredFileHandle();
    if (handle) {
      const currentPermission = await handle.queryPermission({ mode: "readwrite" });
      if (currentPermission === "granted") {
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = tryRecoverJSON(text);
        if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
          fileConfig = sanitizeConfig(parsed);
        }
      }
    }
  } catch (err) {}

  onProgress?.(35);

  // 2. REMOTE FETCHES CONCURRENTLY (GitHub, Live Express API, Static JSON)
  const networkTasks: Promise<void>[] = [];

  // Task A: Fetch from GitHub
  networkTasks.push(
    (async () => {
      try {
        const ghConfig = await getGitHubConfig();
        if (isGitHubConfigured(ghConfig)) {
          const ghRes = await fetchFromGitHub(ghConfig);
          if (ghRes.success && ghRes.config && ((ghRes.config.fossils?.length || 0) > 0 || (ghRes.config.technicalSheets?.length || 0) > 0)) {
            githubConfig = sanitizeConfig(ghRes.config);
          }
        }
      } catch (err) {
        console.warn("GitHub fetch on load skipped or failed:", err);
      }
    })()
  );

  // Task B: Fetch from Server Express API
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    networkTasks.push(
      (async () => {
        try {
          const res = await fetch(`/api/config?t=${Date.now()}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
            },
          });
          if (res.ok) {
            const parsed = await res.json();
            if (parsed && ((parsed.fossils?.length || 0) > 0 || (parsed.technicalSheets?.length || 0) > 0 || parsed.videoUrl1 || parsed.scaleVideoUrl)) {
              serverConfig = sanitizeConfig(parsed);
            }
          }
        } catch (err) {
          console.log("Server API not available on load:", err);
        }
      })()
    );
  }

  // Task C: Fetch from static JSON fallback
  networkTasks.push(
    (async () => {
      const staticPathsToTry = [
        `${cleanBase}data/fossiles.json`,
        `${cleanBase}public/data/fossiles.json`,
        `data/fossiles.json`,
        `public/data/fossiles.json`,
      ];
      for (const sp of staticPathsToTry) {
        try {
          const staticRes = await fetch(`${sp}?t=${Date.now()}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          });
          if (staticRes.ok) {
            const parsed = await staticRes.json();
            if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
              if ((parsed.fossils?.length || 0) > 0 || (parsed.technicalSheets?.length || 0) > 0) {
                staticConfig = sanitizeConfig(parsed);
                break;
              }
            }
          }
        } catch (err) {}
      }
    })()
  );

  // Track completion of parallel network queries smoothly
  let completed = 0;
  const total = networkTasks.length;
  networkTasks.forEach(task => {
    task.then(() => {
      completed++;
      const currentPct = Math.round(35 + (completed / total) * 50); // 35% -> 85%
      onProgress?.(currentPct);
    });
  });

  await Promise.allSettled(networkTasks);
  onProgress?.(92);

  // Determine final winner and config
  let finalConfig: AppConfig;

  // Gather all available sources in order of preference
  const allConfigs = [
    { name: "ServerAPI", config: serverConfig },
    { name: "GitHub", config: githubConfig },
    { name: "StaticJSON", config: staticConfig },
    { name: "IndexedDB", config: idbConfig },
    { name: "FileHandle", config: fileConfig },
    { name: "Preloaded", config: preloadedConfig },
  ].filter(item => item.config !== null) as { name: string; config: AppConfig }[];

  if (allConfigs.length === 0) {
    finalConfig = { ...DEFAULT_CONFIG };
  } else {
    let winner = allConfigs[0];
    for (let i = 1; i < allConfigs.length; i++) {
      const current = allConfigs[i];
      const winConfig = winner.config;
      const curConfig = current.config;

      const curCount = (curConfig.fossils?.length || 0) + (curConfig.technicalSheets?.length || 0);
      const winCount = (winConfig.fossils?.length || 0) + (winConfig.technicalSheets?.length || 0);

      // Priority Rule 1: A source with fossils always beats an empty source
      if (curCount > 0 && winCount === 0) {
        winner = current;
        continue;
      } else if (curCount === 0 && winCount > 0) {
        continue;
      }

      // Priority Rule 2: If winner is ServerAPI or GitHub with valid data, prefer it over local device caches
      // unless local cache is strictly newer with a valid timestamp
      const isWinnerCentralized = winner.name === "ServerAPI" || winner.name === "GitHub";
      const isCurLocalCache = current.name === "IndexedDB" || current.name === "Preloaded";

      if (isWinnerCentralized && isCurLocalCache) {
        // If centralized remote source has timestamp and cur local cache timestamp is older or equal, keep winner
        if (typeof winConfig.lastUpdated === "number" && typeof curConfig.lastUpdated === "number") {
          if (curConfig.lastUpdated > winConfig.lastUpdated + 2000) {
            // Local cache is significantly newer than server
            winner = current;
          }
        }
        continue;
      }

      // Priority Rule 3: Timestamps comparison
      if (typeof curConfig.lastUpdated === "number" && typeof winConfig.lastUpdated === "number") {
        if (curConfig.lastUpdated > winConfig.lastUpdated) {
          winner = current;
        }
      }
      // Priority Rule 4: If current has timestamp but winner does not, prefer current if it has data
      else if (typeof curConfig.lastUpdated === "number" && typeof winConfig.lastUpdated !== "number") {
        if (curCount >= winCount) {
          winner = current;
        }
      }
      // Priority Rule 5: Compare fossil/sheet item count
      else {
        if (curCount > winCount) {
          winner = current;
        }
      }
    }
    console.log(`Config winner selected: ${winner.name}`);
    finalConfig = winner.config;
  }

  // Always keep client's local IndexedDB fully synchronized with our chosen final config
  // so that the local offline cache remains completely up to date.
  try {
    await set(LOCAL_STORAGE_KEY, finalConfig);
  } catch (e) {
    console.warn("Failed to update IndexedDB cache:", e);
  }

  onProgress?.(100);
  return finalConfig;
}

export async function saveAppConfig(config: AppConfig): Promise<AppConfig> {
  const sanitized = sanitizeConfig(config);
  // Update timestamp to ensure this is treated as the latest source of truth across all devices!
  const configWithTimestamp: AppConfig = {
    ...sanitized,
    lastUpdated: Date.now(),
  };

  // Save locally first - exclusively to IndexedDB (unlimited capacity)
  try {
    await set(LOCAL_STORAGE_KEY, configWithTimestamp);
  } catch (err) {
    console.error("Failed to save app config to idb:", err);
  }

  // Save directly to the persistent file handle if it is active and granted
  try {
    const handle = await getStoredFileHandle();
    if (handle) {
      const currentPermission = await handle.queryPermission({ mode: "readwrite" });
      if (currentPermission === "granted") {
        await writeToFileHandle(handle, configWithTimestamp);
        console.log("Successfully auto-saved directly to linked local JSON file!");
      }
    }
  } catch (err) {
    console.warn("Failed to auto-save to linked local JSON file:", err);
  }

  // Double down on ensuring we don't clog localStorage
  try {
    safeLocalStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}

  let finalConfig = configWithTimestamp;

  // Save to backend server API (ensures multi-device synchronization in real-time)
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(configWithTimestamp),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.updatedConfig) {
          finalConfig = {
            ...result.updatedConfig,
            lastUpdated: configWithTimestamp.lastUpdated, // preserve latest timestamp
          };
          try {
            await set(LOCAL_STORAGE_KEY, finalConfig);
          } catch (e) {
            console.error("Failed to save slim config to idb:", e);
          }
        }
      }
    } catch (backendErr) {
      console.warn("Server backend save notification:", backendErr);
    }
  }

  // Save to GitHub in background if configured and auto-sync enabled
  try {
    getGitHubConfig().then((ghConfig) => {
      if (ghConfig.autoSync && canPushToGitHub(ghConfig)) {
        console.log("Initiating automatic GitHub sync in background...");
        pushToGitHub(finalConfig, ghConfig).then((res) => {
          if (res.success) {
            console.log("Successfully synchronized modifications with GitHub repository!");
          } else {
            console.warn("Automatic GitHub sync reported:", res.error);
          }
        }).catch((err) => {
          console.warn("Automatic GitHub sync error:", err);
        });
      }
    }).catch(() => {});
  } catch (ghErr) {
    console.warn("GitHub sync trigger skipped:", ghErr);
  }

  return finalConfig;
}
