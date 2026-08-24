import { get, set, del } from "idb-keyval";
import { AppConfig } from "../types";

const HANDLE_KEY = "fossil_file_handle";

// Verify if the API is supported (mainly Chromium browsers, PC/Mac/Android)
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

// Get the stored file handle from IndexedDB
export async function getStoredFileHandle(): Promise<any | null> {
  try {
    const handle = await get(HANDLE_KEY);
    if (handle) {
      return handle;
    }
  } catch (err) {
    console.warn("Failed to get stored file handle from IndexedDB:", err);
  }
  return null;
}

// Request or verify permission for a handle
export async function verifyPermission(fileHandle: any, readWrite: boolean): Promise<boolean> {
  try {
    const options: any = {};
    if (readWrite) {
      options.mode = "readwrite";
    }
    
    const currentPermission = await fileHandle.queryPermission(options);
    if (currentPermission === "granted") {
      return true;
    }
    
    const requestResult = await fileHandle.requestPermission(options);
    return requestResult === "granted";
  } catch (err) {
    console.warn("Error during permission request:", err);
    return false;
  }
}

// Select an existing JSON file on the device
export async function selectExistingFile(): Promise<{ handle: any; config: AppConfig; name: string }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("L'API File System Access n'est pas supportée par votre navigateur ou appareil.");
  }
  
  const [handle] = await (window as any).showOpenFilePicker({
    types: [
      {
        description: "Fichier de sauvegarde JSON",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
    multiple: false,
  });
  
  const file = await handle.getFile();
  const text = await file.text();
  let config: AppConfig;
  try {
    config = tryRecoverJSON(text);
  } catch (parseErr) {
    throw new Error("Le fichier sélectionné n'est pas un fichier JSON valide.");
  }
  
  // Basic structural check
  if (!config || typeof config !== "object" || (!Array.isArray(config.fossils) && !Array.isArray(config.technicalSheets))) {
    throw new Error("Le fichier JSON ne semble pas être une sauvegarde valide de l'application de fossiles.");
  }
  
  // Store the handle in IndexedDB for subsequent sessions
  await set(HANDLE_KEY, handle);
  
  return { handle, config, name: file.name };
}

export function tryRecoverJSON(text: string): any {
  if (!text || typeof text !== "string") {
    throw new Error("Le fichier est vide ou invalide.");
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.includes("<html") || trimmed.includes("<script")) {
    throw new Error("Le fichier sélectionné est le fichier de l'application autonome (.html) au lieu de votre fichier de données de sauvegarde (.json).\n\nPour corriger cela :\n1. Cliquez sur le bouton rouge 'DÉCONNECTER LE FICHIER LIÉ'\n2. Liez votre vrai fichier de données '.json' ou créez-en un nouveau.");
  }

  // 1. Try standard JSON.parse first
  try {
    const parsed = JSON.parse(text);
    if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
      return parsed;
    }
  } catch (err: any) {
    // 2. Extract position from V8/Chrome error message
    // Format: "Unexpected non-whitespace character after JSON at position 126287529 (line 219 column 2)"
    // or "Unexpected token ... in JSON at position 126287529"
    const errMsg = err.message || "";
    const match = errMsg.match(/position\s+(\d+)/i) || errMsg.match(/at\s+(\d+)/i);
    if (match) {
      const pos = parseInt(match[1], 10);
      if (pos > 0 && pos < text.length) {
        try {
          const sliced = text.substring(0, pos);
          const parsed = JSON.parse(sliced);
          if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
            console.log("Successfully recovered JSON via error message position:", pos);
            return parsed;
          }
        } catch (sliceErr) {
          // ignore and fall through
        }
      }
    }
  }

  console.log("Standard JSON.parse failed. Initiating high-performance native backward scan...");

  // 3. Fast backward scan using native lastIndexOf("}") with attempt limits (max 100)
  // This is extremely fast because it runs natively in C++ inside the engine
  let lastBrace = text.lastIndexOf("}");
  let attempts = 0;
  while (lastBrace !== -1 && attempts < 100) {
    attempts++;
    try {
      const candidate = text.substring(0, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
        console.log("Successfully recovered JSON by backward scanning braces in", attempts, "attempts");
        return parsed;
      }
    } catch (e) {
      // ignore and try previous
    }
    lastBrace = text.lastIndexOf("}", lastBrace - 1);
  }

  // 4. Try from the first '{' to the last '}'
  const firstBrace = text.indexOf("{");
  const finalBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && finalBrace > firstBrace) {
    try {
      const candidate = text.substring(firstBrace, finalBrace + 1);
      const parsed = JSON.parse(candidate);
      if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
        return parsed;
      }
    } catch (err) {
      // ignore
    }
  }

  // 5. MASTERPIECE ULTRA-ROBUST DEEP RECOVERY
  // If the entire container file is truncated or corrupted (e.g. missing outer arrays, brackets, etc.),
  // we scan for individual Fossil or TechnicalSheetRow objects, parse them, and reconstruct a valid state.
  console.log("Performing deep object harvesting recovery scan...");
  try {
    const foundFossilsMap = new Map<string, { fossil: any; length: number }>();
    const foundSheetsMap = new Map<string, { sheet: any; length: number }>();

    // Extract scalar top-level attributes if possible
    let videoUrl1 = "https://www.youtube.com/watch?v=y61D0TbHZks";
    const videoMatch = text.match(/"videoUrl1"\s*:\s*"([^"]+)"/);
    if (videoMatch) videoUrl1 = videoMatch[1];

    let secondHomeTitle = "Ma Collection de Fossiles";
    const titleMatch = text.match(/"secondHomeTitle"\s*:\s*"([^"]+)"/);
    if (titleMatch) secondHomeTitle = titleMatch[1];

    let scaleVideoUrl = "https://www.youtube.com/watch?v=c_fA-Q9XJ_s";
    const scaleVidMatch = text.match(/"scaleVideoUrl"\s*:\s*"([^"]+)"/);
    if (scaleVidMatch) scaleVideoUrl = scaleVidMatch[1];

    // Helper to safely extract nested object blocks (like images) if the top-level outer structure is broken
    const extractImageSettings = (key: string): any => {
      const keyIdx = text.indexOf(`"${key}"`);
      if (keyIdx === -1) return undefined;
      
      const braceIdx = text.indexOf("{", keyIdx);
      if (braceIdx === -1) return undefined;
      
      let depth = 0;
      let inString = false;
      let escape = false;
      let endIdx = -1;
      for (let i = braceIdx; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === "\\") { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
          if (char === "{") depth++;
          else if (char === "}") {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
        }
      }
      
      if (endIdx !== -1) {
        try {
          const parsed = JSON.parse(text.substring(braceIdx, endIdx + 1));
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        } catch (e) {}
      }
      return undefined;
    };

    const secondHomeImage = extractImageSettings("secondHomeImage") || { url: "", scale: 1, posX: 0, posY: 0 };
    const eraPrecambrianImage = extractImageSettings("eraPrecambrianImage");
    const eraPaleozoicImage = extractImageSettings("eraPaleozoicImage");
    const eraMesozoicImage = extractImageSettings("eraMesozoicImage");
    const eraCenozoicImage = extractImageSettings("eraCenozoicImage");

    // Find all opening braces '{' in the text
    let idx = text.indexOf("{");
    while (idx !== -1) {
      // Fast candidate filtering check: avoid running brace-matching over base64 strings by inspecting the first 350 chars
      const fragment = text.substring(idx, idx + 350);
      const isFossilCandidate = fragment.includes('"id"') && (fragment.includes('"title"') || fragment.includes('"era"'));
      const isSheetCandidate = fragment.includes('"id"') && (fragment.includes('"fossilName"') || fragment.includes('"periodeDatation"'));

      if (isFossilCandidate || isSheetCandidate) {
        // Fast bracket/brace matching forward scan
        let depth = 0;
        let inString = false;
        let escape = false;
        let endIdx = -1;

        for (let i = idx; i < text.length; i++) {
          const char = text[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === "\\") {
            escape = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            continue;
          }
          if (!inString) {
            if (char === "{") {
              depth++;
            } else if (char === "}") {
              depth--;
              if (depth === 0) {
                endIdx = i;
                break;
              }
            }
          }
        }

        if (endIdx !== -1) {
          const candidateStr = text.substring(idx, endIdx + 1);
          try {
            const parsed = JSON.parse(candidateStr);
            if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
              // Deduplicate by keeping the longest stringified candidate (guarantees keeping the version containing base64 images!)
              if (typeof parsed.title === "string" && (typeof parsed.era === "string" || typeof parsed.description === "string")) {
                const existing = foundFossilsMap.get(parsed.id);
                if (!existing || candidateStr.length > existing.length) {
                  foundFossilsMap.set(parsed.id, { fossil: parsed, length: candidateStr.length });
                }
              } else if (typeof parsed.fossilName === "string" && typeof parsed.provenanceDate === "string") {
                const existing = foundSheetsMap.get(parsed.id);
                if (!existing || candidateStr.length > existing.length) {
                  foundSheetsMap.set(parsed.id, { sheet: parsed, length: candidateStr.length });
                }
              }
            }
          } catch (e) {
            // Not a valid JSON block, skip
          }
        }
      }

      idx = text.indexOf("{", idx + 1);
    }

    const fossils = Array.from(foundFossilsMap.values()).map(v => v.fossil);
    const technicalSheets = Array.from(foundSheetsMap.values()).map(v => v.sheet);

    if (fossils.length > 0 || technicalSheets.length > 0) {
      console.log(`Deep recovery succeeded! Harvested ${fossils.length} fossils and ${technicalSheets.length} sheets.`);
      return {
        videoUrl1,
        secondHomeTitle,
        secondHomeImage,
        eraPrecambrianImage,
        eraPaleozoicImage,
        eraMesozoicImage,
        eraCenozoicImage,
        scaleVideoUrl,
        fossils,
        technicalSheets,
      };
    }
  } catch (deepErr) {
    console.error("Deep recovery scan failed:", deepErr);
  }

  throw new Error("Impossible de lire ou de réparer le fichier de sauvegarde sélectionné. Il ne semble pas contenir de données de collection valides.");
}

// Create a new JSON file on the device
export async function createNewFile(initialData: AppConfig): Promise<{ handle: any; name: string }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("L'API File System Access n'est pas supportée par votre navigateur ou appareil.");
  }
  
  const handle = await (window as any).showSaveFilePicker({
    suggestedName: "exposition_fossiles_sauvegarde.json",
    types: [
      {
        description: "Fichier de sauvegarde JSON",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
  });
  
  const writable = await handle.createWritable();
  const content = JSON.stringify(initialData, null, 2);
  await writable.write(content);
  try {
    await writable.truncate(content.length);
  } catch (err) {
    console.warn("Failed to truncate writable file stream:", err);
  }
  await writable.close();
  
  // Store the handle in IndexedDB for subsequent sessions
  await set(HANDLE_KEY, handle);
  
  return { handle, name: handle.name };
}

// Write data to the active handle
export async function writeToFileHandle(handle: any, config: AppConfig): Promise<void> {
  const writable = await handle.createWritable({ keepExistingData: false });
  const content = JSON.stringify(config, null, 2);
  await writable.write(content);
  try {
    await writable.truncate(content.length);
  } catch (err) {
    console.warn("Failed to truncate writable file stream:", err);
  }
  await writable.close();
}

// Disconnect/unlink the current file
export async function disconnectFileHandle(): Promise<void> {
  await del(HANDLE_KEY);
}
