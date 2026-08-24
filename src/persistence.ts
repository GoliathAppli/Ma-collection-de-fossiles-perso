/// <reference types="vite/client" />
import { get, set } from "idb-keyval";
import { AppConfig } from "./types";
import { safeLocalStorage } from "./utils/safeStorage";
import { getStoredFileHandle, writeToFileHandle, tryRecoverJSON } from "./utils/fileSystemAccess";
import { optimizeAllConfigImages } from "./utils/data/imageOptimizer";
import { 
  getGitHubConfig, 
  isGitHubConfigured, 
  canPushToGitHub, 
  fetchFromGitHub, 
  pushToGitHub 
} from "./utils/githubSync";

export const LOCAL_STORAGE_KEY = "fossils_collection_config_v2";

export const DEFAULT_CONFIG: AppConfig = {
  videoUrl1: "https://www.youtube.com/watch?v=yrS0nbR_rrU", // C'est pas sorcier - Des Dinosaures sous nos pieds
  secondHomeTitle: "Fossiles de Collection",
  secondHomeImage: { url: "", scale: 1, posX: 0, posY: 0 },
  scaleVideoUrl: "https://www.youtube.com/watch?v=2SRU_56Y-WQ", // L'histoire entière de la Terre ! - C'est pas sorcier
  fossils: [],
  technicalSheets: [],
};

export function sanitizeConfig(config: any): AppConfig {
  if (!config) return { ...DEFAULT_CONFIG };
  
  // Fix obsolete 404 video URLs if previously stored in cache/session
  let videoUrl1 = typeof config.videoUrl1 === "string" ? config.videoUrl1 : DEFAULT_CONFIG.videoUrl1;
  if (!videoUrl1 || videoUrl1.includes("y61D0TbHZks")) {
    videoUrl1 = DEFAULT_CONFIG.videoUrl1;
  }

  let scaleVideoUrl = typeof config.scaleVideoUrl === "string" ? config.scaleVideoUrl : DEFAULT_CONFIG.scaleVideoUrl;
  if (!scaleVideoUrl || scaleVideoUrl.includes("c_fA-Q9XJ_s")) {
    scaleVideoUrl = DEFAULT_CONFIG.scaleVideoUrl;
  }

  return {
    lastUpdated: typeof config.lastUpdated === "number" ? config.lastUpdated : undefined,
    videoUrl1,
    secondHomeTitle: typeof config.secondHomeTitle === "string" ? config.secondHomeTitle : DEFAULT_CONFIG.secondHomeTitle,
    secondHomeImage: config.secondHomeImage || DEFAULT_CONFIG.secondHomeImage,
    scaleVideoUrl,
    eraPrecambrianImage: config.eraPrecambrianImage,
    eraPaleozoicImage: config.eraPaleozoicImage,
    eraMesozoicImage: config.eraMesozoicImage,
    eraCenozoicImage: config.eraCenozoicImage,
    fossils: Array.isArray(config.fossils) ? config.fossils.filter(Boolean) : [],
    technicalSheets: Array.isArray(config.technicalSheets) ? config.technicalSheets.filter(Boolean) : [],
  };
}

export async function loadAppConfig(): Promise<AppConfig> {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";

  // We will collect configs from all possible sources
  let serverConfig: AppConfig | null = null;
  let staticConfig: AppConfig | null = null;
  let preloadedConfig: AppConfig | null = null;
  let fileConfig: AppConfig | null = null;
  let idbConfig: AppConfig | null = null;

  // PRIORITIZED MIGRATION CASE: Move data from localStorage to IndexedDB once to free up the 5MB limit
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

  // 0. Fetch from GitHub if configured (supports anonymous visitors and direct raw CDN)
  let githubConfig: AppConfig | null = null;
  try {
    const ghConfig = await getGitHubConfig();
    const ghRes = await fetchFromGitHub(ghConfig);
    if (ghRes.success && ghRes.config && ((ghRes.config.fossils?.length || 0) > 0 || (ghRes.config.technicalSheets?.length || 0) > 0)) {
      console.log("Fetched fresh config directly from GitHub repository with fossils!");
      githubConfig = sanitizeConfig(ghRes.config);
    }
  } catch (err) {
    console.warn("GitHub fetch on load failed or skipped:", err);
  }

  // 1. Fetch from Server Backend API (Live Express API)
  try {
    const res = await fetch(`/api/config?t=${Date.now()}`);
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && ((parsed.fossils?.length || 0) > 0 || (parsed.technicalSheets?.length || 0) > 0)) {
        console.log("Fetched fresh config directly from live server database!");
        serverConfig = sanitizeConfig(parsed);
      }
    }
  } catch (err) {
    console.log("Live Express Backend API not available or failed on load:", err);
  }

  // 2. Fetch from static JSON file fallback (check both data/ and public/data/)
  const staticPathsToTry = [
    `${cleanBase}data/fossiles.json`,
    `${cleanBase}public/data/fossiles.json`,
    `data/fossiles.json`,
    `public/data/fossiles.json`,
  ];
  for (const sp of staticPathsToTry) {
    if (staticConfig && (staticConfig.fossils?.length || 0) > 0) break;
    try {
      const staticRes = await fetch(`${sp}?t=${Date.now()}`);
      if (staticRes.ok) {
        const parsed = await staticRes.json();
        if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
          if ((parsed.fossils?.length || 0) > 0 || (parsed.technicalSheets?.length || 0) > 0) {
            console.log(`Fetched static ${sp} with real fossil data!`);
            staticConfig = sanitizeConfig(parsed);
            break;
          }
        }
      }
    } catch (err) {
      // Continue to next path
    }
  }

  // 3. Embedded standalone preloaded config
  if (typeof window !== "undefined" && (window as any).__PRELOADED_CONFIG__) {
    const preloaded = (window as any).__PRELOADED_CONFIG__;
    if (preloaded && (Array.isArray(preloaded.fossils) || Array.isArray(preloaded.technicalSheets))) {
      console.log("Found embedded preloaded configuration from standalone HTML.");
      preloadedConfig = sanitizeConfig(preloaded);
    }
  }

  // 4. File system handle config
  try {
    const handle = await getStoredFileHandle();
    if (handle) {
      const currentPermission = await handle.queryPermission({ mode: "readwrite" });
      if (currentPermission === "granted") {
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = tryRecoverJSON(text);
        if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
          console.log("Fetched config from linked file handle!");
          fileConfig = sanitizeConfig(parsed);
        }
      }
    }
  } catch (err) {
    console.warn("Failed to read config from linked file handle on load:", err);
  }

  // 5. IndexedDB local cache
  try {
    const parsed = await get(LOCAL_STORAGE_KEY);
    if (parsed) {
      console.log("Fetched cached config from local IndexedDB.");
      idbConfig = sanitizeConfig(parsed);
    }
  } catch (err) {
    console.warn("Failed to load cached config from IndexedDB:", err);
  }

  // Determine final winner and config
  let finalConfig: AppConfig;

  // Gather all available sources
  const allConfigs = [
    { name: "GitHub", config: githubConfig },
    { name: "ServerAPI", config: serverConfig },
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

      // Rule 1: A source with fossils always beats an empty source
      if (curCount > 0 && winCount === 0) {
        winner = current;
      } else if (curCount === 0 && winCount > 0) {
        // Keep winner with data
      }
      // Rule 2: If both have data, check timestamps
      else if (typeof curConfig.lastUpdated === "number" && typeof winConfig.lastUpdated === "number") {
        if (curConfig.lastUpdated > winConfig.lastUpdated) {
          winner = current;
        }
      }
      // Rule 3: If only one has timestamp, prefer it if it has at least as many fossils
      else if (typeof curConfig.lastUpdated === "number" && typeof winConfig.lastUpdated !== "number") {
        if (curCount >= winCount) {
          winner = current;
        }
      } else if (typeof curConfig.lastUpdated !== "number" && typeof winConfig.lastUpdated === "number") {
        if (curCount > winCount && winCount === 0) {
          winner = current;
        }
      }
      // Rule 4: Compare item count
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

  return finalConfig;
}

export async function saveAppConfig(config: AppConfig): Promise<AppConfig> {
  // Update timestamp to ensure this is treated as the latest source of truth!
  const configWithTimestamp: AppConfig = {
    ...config,
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

  // Save to backend (useful for keeping the AI Studio workspace in sync when editing)
  if (!(window as any).__IS_STANDALONE__ && !(window as any).__SERVER_CONFIG_OFFLINE__) {
    try {
      const controller = new AbortController();
      // Generous 30 seconds to save entire config file over slower networks
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          // Overwrite local memory with the slim version
          try {
            await set(LOCAL_STORAGE_KEY, finalConfig);
          } catch (e) {
            console.error("Failed to save slim config to idb:", e);
          }
        }
      } else {
        if (res.status === 404 || res.status === 502 || res.status === 503) {
          (window as any).__SERVER_CONFIG_OFFLINE__ = true;
        }
      }
    } catch (backendErr) {
      // Fail silently and mark as offline in standalone mode
      if ((backendErr as Error).name !== "AbortError") {
        (window as any).__SERVER_CONFIG_OFFLINE__ = true;
      } else {
        console.warn("Config save request timed out after 30s");
      }
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
