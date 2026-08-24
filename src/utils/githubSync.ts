import { get, set } from 'idb-keyval';
import { AppConfig, GitHubSyncConfig, GitHubSyncStatus } from '../types';
import { safeLocalStorage } from './safeStorage';
import { optimizeAppConfigImages } from './imageCompressor';

export const GITHUB_CONFIG_STORAGE_KEY = 'github_sync_config_v2';

export const DEFAULT_GITHUB_CONFIG: GitHubSyncConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  filePath: 'public/data/fossiles.json',
  autoSync: true,
};

/**
 * Auto-detects GitHub repository owner and name from current environment
 */
export function autoDetectGitHubInfo(): Partial<GitHubSyncConfig> {
  const detected: Partial<GitHubSyncConfig> = {};

  try {
    // 1. Check Vite environment variables if defined
    if (import.meta.env.VITE_GITHUB_OWNER) detected.owner = import.meta.env.VITE_GITHUB_OWNER;
    if (import.meta.env.VITE_GITHUB_REPO) detected.repo = import.meta.env.VITE_GITHUB_REPO;
    if (import.meta.env.VITE_GITHUB_BRANCH) detected.branch = import.meta.env.VITE_GITHUB_BRANCH;
    if (import.meta.env.VITE_GITHUB_TOKEN) detected.token = import.meta.env.VITE_GITHUB_TOKEN;
    if (import.meta.env.VITE_GITHUB_FILE_PATH) detected.filePath = import.meta.env.VITE_GITHUB_FILE_PATH;

    // 2. Check window.location if deployed to GitHub Pages (e.g. username.github.io/reponame)
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname.endsWith('.github.io')) {
        const ghOwner = hostname.replace('.github.io', '');
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const ghRepo = pathSegments[0] || 'conservatoire-de-fossiles';
        if (!detected.owner) detected.owner = ghOwner;
        if (!detected.repo) detected.repo = ghRepo;
      }
    }
  } catch (err) {
    console.warn('Auto-detect GitHub info warning:', err);
  }

  return detected;
}

/**
 * Retrieves the stored GitHub sync configuration
 */
export async function getGitHubConfig(): Promise<GitHubSyncConfig> {
  const detected = autoDetectGitHubInfo();
  let stored: Partial<GitHubSyncConfig> | null = null;

  try {
    stored = (await get(GITHUB_CONFIG_STORAGE_KEY)) || null;
    if (!stored) {
      const ls = safeLocalStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
      if (ls) {
        stored = JSON.parse(ls);
      }
    }
  } catch (err) {
    console.warn('Failed to read GitHub config from idb/localStorage:', err);
  }

  const merged: GitHubSyncConfig = {
    ...DEFAULT_GITHUB_CONFIG,
    ...detected,
    ...(stored || {}),
  };

  // Ensure default values are populated if empty or from previous test repos
  if (!merged.owner?.trim()) {
    merged.owner = 'GoliathAppli';
  }
  if (
    !merged.repo?.trim() ||
    merged.repo.trim() === 'conservatoire-de-fossiles' ||
    merged.repo.trim() === 'Ma-collection-de-fossiles'
  ) {
    merged.repo = 'Ma-collection-de-fossiles-';
  }
  if (!merged.branch?.trim()) {
    merged.branch = 'main';
  }
  if (!merged.filePath?.trim()) {
    merged.filePath = 'public/data/fossiles.json';
  }

  return merged;
}

/**
 * Saves the GitHub sync configuration
 */
export async function saveGitHubConfig(config: GitHubSyncConfig): Promise<void> {
  try {
    await set(GITHUB_CONFIG_STORAGE_KEY, config);
    safeLocalStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(config));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('github-sync-config-updated', { detail: config }));
    }
  } catch (err) {
    console.error('Failed to save GitHub config:', err);
    safeLocalStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Cleans token from accidental surrounding whitespace, quotes, or line breaks
 */
export function cleanGitHubToken(token: string): string {
  if (!token) return '';
  return token
    .trim()
    .replace(/^["']|["']$/g, '') // remove surrounding quotes
    .replace(/[\r\n\t\s]/g, ''); // remove all whitespace
}

/**
 * Checks if GitHub sync has enough info to perform operations
 */
export function isGitHubConfigured(config: GitHubSyncConfig): boolean {
  return Boolean(config.owner?.trim() && config.repo?.trim());
}

/**
 * Checks if GitHub sync can push (requires token)
 */
export function canPushToGitHub(config: GitHubSyncConfig): boolean {
  const token = cleanGitHubToken(config.token || '');
  return Boolean(config.owner?.trim() && config.repo?.trim() && token.length > 0);
}

/**
 * Tests connection to GitHub API, verifies token validity and repository permissions
 */
export async function testGitHubConnection(config: GitHubSyncConfig): Promise<{
  success: boolean;
  message: string;
  repoData?: any;
  hasWriteAccess?: boolean;
  authenticatedUser?: string;
}> {
  if (!config.owner?.trim() || !config.repo?.trim()) {
    return { success: false, message: "Nom d'utilisateur / Organisation ou Nom du dépôt manquant." };
  }

  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const token = cleanGitHubToken(config.token || '');

  let authenticatedUser: string | undefined;

  // 1. If a token is provided, verify the token itself via /user endpoint
  if (token) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: getGitHubHeaders(token),
      });

      if (userRes.status === 401) {
        return {
          success: false,
          message: "❌ Token GitHub Invalide ou Expiré (Erreur 401: Bad credentials). Le token saisi n'est pas reconnu par GitHub. Veuillez générer un nouveau token (Classic avec la case 'repo' cochée).",
        };
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        authenticatedUser = userData.login;
      }
    } catch (e: any) {
      console.warn('User auth test warning:', e);
    }
  }

  // 2. Test repository access
  const headers = getGitHubHeaders(token);

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (res.status === 404) {
      return { 
        success: false, 
        message: `Dépôt "${config.owner.trim()}/${config.repo.trim()}" introuvable sur GitHub. Vérifiez l'orthographe exacte du nom du dépôt et de l'utilisateur.` 
      };
    }

    if (res.status === 401) {
      return { 
        success: false, 
        message: "❌ Erreur 401 (Bad credentials) : Votre Token GitHub est incorrect ou a été révoqué." 
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: `Erreur GitHub (${res.status}): ${errJson.message || res.statusText}` 
      };
    }

    const repoData = await res.json();
    const hasWrite = Boolean(
      repoData.permissions?.push ||
      repoData.permissions?.admin ||
      (token && (!repoData.permissions || repoData.permissions.push !== false))
    );

    let successMsg = `✅ Connexion réussie au dépôt ${repoData.full_name} (${repoData.private ? 'Privé' : 'Public'}) !`;
    if (authenticatedUser) {
      successMsg += ` Connecté avec le compte @${authenticatedUser}.`;
    }

    return {
      success: true,
      message: successMsg,
      repoData,
      hasWriteAccess: hasWrite,
      authenticatedUser,
    };
  } catch (err: any) {
    // If browser direct call failed (e.g. adblock/CORS), try server-side proxy
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const proxyRes = await fetch('/api/github/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: config.owner,
            repo: config.repo,
            token: token,
            branch: config.branch || 'main',
          }),
        });
        const proxyData = await proxyRes.json();
        if (proxyRes.ok && proxyData.success) {
          return {
            success: true,
            message: `✅ Connexion réussie au dépôt ${proxyData.repoName} (${proxyData.isPrivate ? 'Privé' : 'Public'}) !`,
            repoData: proxyData,
            hasWriteAccess: Boolean(token),
          };
        } else if (proxyData.error) {
          return {
            success: false,
            message: proxyData.error,
          };
        }
      } catch (proxyErr) {
        console.warn('Proxy test failed:', proxyErr);
      }
    }

    return {
      success: false,
      message: `Impossible de joindre l'API GitHub : ${err.message || 'Erreur réseau'}`,
    };
  }
}

/**
 * Safely decodes base64 string handling UTF-8 French characters and emojis
 */
async function decodeBase64Utf8(base64: string): Promise<string> {
  const cleanBase64 = base64.replace(/[\r\n\s]/g, '');
  try {
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    const dataUrl = `data:application/octet-stream;base64,${cleanBase64}`;
    const res = await fetch(dataUrl);
    const buffer = await res.arrayBuffer();
    return new TextDecoder('utf-8').decode(buffer);
  }
}

/**
 * Memory-safe Base64 encoder using native browser Blob to avoid heap limits
 */
async function encodeBase64Safe(str: string): Promise<string> {
  const bytes = new TextEncoder().encode(str);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = () => {
      // Fallback
      try {
        let binary = '';
        const len = bytes.length;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(btoa(binary));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches the latest configuration from GitHub (supports anonymous visitors, large files > 1MB, and multiple branch/path fallbacks)
 */
export async function fetchFromGitHub(config?: GitHubSyncConfig): Promise<{
  success: boolean;
  config?: AppConfig;
  sha?: string;
  error?: string;
}> {
  const ghConfig = config || (await getGitHubConfig());
  
  if (!isGitHubConfigured(ghConfig)) {
    return { success: false, error: 'GitHub non configuré (Owner ou Repo manquant).' };
  }

  const owner = ghConfig.owner.trim();
  const repo = ghConfig.repo.trim();
  const branch = ghConfig.branch?.trim() || 'main';
  const primaryPath = (ghConfig.filePath?.trim() || 'public/data/fossiles.json').replace(/^\/+/, '');

  const headers = getGitHubHeaders(ghConfig.token);

  // Candidate branches and candidate paths to search
  const branchesToTry = Array.from(new Set([branch, 'main', 'gh-pages', 'master']));
  const pathsToTry = Array.from(new Set([primaryPath, 'public/data/fossiles.json', 'data/fossiles.json', 'fossiles.json']));

  // 1. Direct raw github user content fetch (fastest and no rate limits for visitors)
  for (const b of branchesToTry) {
    for (const p of pathsToTry) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(b)}/${p}?t=${Date.now()}`;
        const rawRes = await fetch(rawUrl, {
          headers: ghConfig.token?.trim() ? getGitHubHeaders(ghConfig.token) : {},
        });

        if (rawRes.ok) {
          const rawText = await rawRes.text();
          if (rawText && rawText.trim().startsWith('{')) {
            const parsed = JSON.parse(rawText);
            if (parsed && (Array.isArray(parsed.fossils) || Array.isArray(parsed.technicalSheets))) {
              if ((parsed.fossils?.length || 0) > 0 || (parsed.technicalSheets?.length || 0) > 0) {
                return {
                  success: true,
                  config: parsed,
                };
              }
            }
          }
        }
      } catch (rawErr) {
        // Continue to next combination
      }
    }
  }

  // 2. Try GitHub Contents API
  for (const b of branchesToTry) {
    for (const p of pathsToTry) {
      try {
        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${p}?ref=${encodeURIComponent(b)}&t=${Date.now()}`;
        const res = await fetch(apiUrl, { headers });

        if (res.ok) {
          const data = await res.json();
          if (data && data.content) {
            const jsonText = await decodeBase64Utf8(data.content);
            const parsed = JSON.parse(jsonText);
            return {
              success: true,
              config: parsed,
              sha: data.sha,
            };
          } else if (data && data.download_url) {
            const dlRes = await fetch(data.download_url + (data.download_url.includes('?') ? '&' : '?') + `t=${Date.now()}`);
            if (dlRes.ok) {
              const parsed = await dlRes.json();
              return {
                success: true,
                config: parsed,
                sha: data.sha,
              };
            }
          }
        }
      } catch (apiErr) {
        // Continue
      }
    }
  }

  return {
    success: false,
    error: `Impossible de récupérer les données depuis GitHub (${owner}/${repo}).`,
  };
}

/**
 * Helper to build standard GitHub API headers for browser fetch (CORS safe)
 */
export function getGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  const cleanTok = token ? cleanGitHubToken(token) : '';
  if (cleanTok) {
    headers['Authorization'] = `Bearer ${cleanTok}`;
  }
  return headers;
}

/**
 * Helper to fetch with an abort timeout and CORS safe headers
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 35000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Délai d'attente dépassé (${timeoutMs / 1000}s) lors de la communication avec GitHub. Vérifiez votre connexion internet.`);
    }
    throw err;
  }
}

export type SyncStepId = 1 | 2 | 3 | 4 | 5;
export type SyncStepStatus = 'pending' | 'running' | 'success' | 'error';

export type SyncStepProgressCallback = (
  step: SyncStepId,
  status: SyncStepStatus,
  percent: number,
  label: string,
  errorDetail?: string
) => void;

/**
 * Pushes the current configuration to GitHub using Git Data API (Blobs/Trees/Commits)
 * with robust fallback. Supports datasets of any size with zero heap overflow.
 */
export async function pushToGitHub(
  appConfig: AppConfig,
  config?: GitHubSyncConfig,
  customCommitMsg?: string,
  onStepProgress?: SyncStepProgressCallback
): Promise<{
  success: boolean;
  sha?: string;
  commitUrl?: string;
  error?: string;
}> {
  const ghConfig = config || (await getGitHubConfig());
  const token = cleanGitHubToken(ghConfig.token || '');

  // ==========================================
  // STEP 1: Vérification de la configuration
  // ==========================================
  if (onStepProgress) onStepProgress(1, 'running', 10, 'Vérification de la configuration...');
  await new Promise(r => setTimeout(r, 50));

  if (!ghConfig.owner?.trim() || !ghConfig.repo?.trim()) {
    const errMsg = "Le nom d'utilisateur GitHub et le nom du dépôt sont requis.";
    if (onStepProgress) onStepProgress(1, 'error', 10, errMsg, errMsg);
    return { success: false, error: errMsg };
  }

  if (!token) {
    const errMsg = "Un Token GitHub (PAT) est requis pour enregistrer vos données en ligne.";
    if (onStepProgress) onStepProgress(1, 'error', 10, errMsg, errMsg);
    return { success: false, error: errMsg };
  }

  const fossilCount = appConfig.fossils?.length || 0;
  if (onStepProgress) onStepProgress(1, 'success', 20, `Fiches prêtes (${fossilCount} fossiles)`);
  await new Promise(r => setTimeout(r, 50));

  // ==========================================
  // STEP 2: Encodage & Sérialisation (Avec Compression d'Images)
  // ==========================================
  if (onStepProgress) onStepProgress(2, 'running', 25, 'Compression & optimisation des images...');
  
  let payloadConfig = appConfig;
  try {
    payloadConfig = await optimizeAppConfigImages(appConfig, (pct, label) => {
      if (onStepProgress) {
        onStepProgress(2, 'running', 20 + Math.round(pct * 0.2), label);
      }
    });
  } catch (compErr) {
    console.warn('Image compression warning, continuing with base config:', compErr);
  }

  let jsonString: string;
  try {
    jsonString = JSON.stringify(payloadConfig, null, 2);
  } catch (err: any) {
    const errMsg = `Erreur de sérialisation des données : ${err.message}`;
    if (onStepProgress) onStepProgress(2, 'error', 30, errMsg, errMsg);
    return { success: false, error: errMsg };
  }

  const payloadSizeMB = (new Blob([jsonString]).size / (1024 * 1024)).toFixed(2);
  if (onStepProgress) onStepProgress(2, 'success', 45, `Fichier optimisé (${payloadSizeMB} Mo - ${fossilCount} fossiles)`);
  await new Promise(r => setTimeout(r, 50));

  const owner = encodeURIComponent(ghConfig.owner.trim());
  const repo = encodeURIComponent(ghConfig.repo.trim());
  let targetBranch = (ghConfig.branch || 'main').trim() || 'main';
  const filePath = (ghConfig.filePath?.trim() || 'public/data/fossiles.json').replace(/^\/+/, '');

  // ==========================================
  // STEP 3: Connexion & Authentification GitHub
  // ==========================================
  if (onStepProgress) onStepProgress(3, 'running', 50, `Connexion à GitHub (${ghConfig.owner}/${ghConfig.repo})...`);

  let repoDefaultBranch = 'main';
  let latestCommitSha: string | undefined;
  let baseTreeSha: string | undefined;
  let directConnectFailed = false;

  try {
    const repoRes = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: getGitHubHeaders(token) },
      15000
    );

    if (repoRes.status === 401) {
      const errMsg = "Token GitHub invalide ou expiré (401 Bad credentials). Veuillez vérifier votre token GitHub.";
      if (onStepProgress) onStepProgress(3, 'error', 50, errMsg, errMsg);
      return { success: false, error: errMsg };
    }

    if (repoRes.status === 403) {
      const errMsg = "Droits d'écriture insuffisants (403 Forbidden). Assurez-vous que votre token dispose de la permission 'repo'.";
      if (onStepProgress) onStepProgress(3, 'error', 50, errMsg, errMsg);
      return { success: false, error: errMsg };
    }

    if (repoRes.status === 404) {
      const errMsg = `Dépôt "${ghConfig.owner}/${ghConfig.repo}" introuvable sur GitHub (404). Vérifiez l'orthographe du compte et du dépôt.`;
      if (onStepProgress) onStepProgress(3, 'error', 50, errMsg, errMsg);
      return { success: false, error: errMsg };
    }

    if (repoRes.ok) {
      const repoData = await repoRes.json();
      if (repoData.default_branch) {
        repoDefaultBranch = repoData.default_branch;
      }
    }
  } catch (err: any) {
    console.warn('Direct browser fetch to GitHub failed (CORS/network/adblock), trying server proxy verification...', err);
    directConnectFailed = true;

    // Try testing connection through server proxy
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const proxyCheck = await fetch('/api/github/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: ghConfig.owner,
            repo: ghConfig.repo,
            token: token,
            branch: targetBranch,
          }),
        });
        const proxyJson = await proxyCheck.json();
        if (proxyCheck.ok && proxyJson.success) {
          if (proxyJson.defaultBranch) {
            repoDefaultBranch = proxyJson.defaultBranch;
          }
          directConnectFailed = false;
        } else if (proxyJson.error) {
          const errMsg = proxyJson.error;
          if (onStepProgress) onStepProgress(3, 'error', 50, errMsg, errMsg);
          return { success: false, error: errMsg };
        }
      } catch (proxyE) {
        console.warn('Server proxy test also failed:', proxyE);
      }
    }

    if (directConnectFailed) {
      const errMsg = `Connexion GitHub impossible : ${err.message || 'Erreur réseau/CORS'}`;
      if (onStepProgress) onStepProgress(3, 'error', 50, errMsg, errMsg);
      return { success: false, error: errMsg };
    }
  }

  // Check branch info if direct connection worked
  if (!directConnectFailed) {
    try {
      let branchRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(targetBranch)}?t=${Date.now()}`,
        { headers: getGitHubHeaders(token) },
        15000
      );

      if (branchRes.status === 404 && targetBranch !== repoDefaultBranch) {
        targetBranch = repoDefaultBranch;
        branchRes = await fetchWithTimeout(
          `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(targetBranch)}?t=${Date.now()}`,
          { headers: getGitHubHeaders(token) },
          15000
        );
      }

      if (branchRes.ok) {
        const branchData = await branchRes.json();
        latestCommitSha = branchData.commit?.sha;
        baseTreeSha = branchData.commit?.commit?.tree?.sha;
      }
    } catch (err: any) {
      console.warn('Branch check notice:', err);
    }
  }

  if (onStepProgress) onStepProgress(3, 'success', 65, `Connecté au dépôt (branche: "${targetBranch}")`);
  await new Promise(r => setTimeout(r, 50));

  // ==========================================
  // STEP 4: Téléversement & Commit sur GitHub
  // ==========================================
  if (onStepProgress) onStepProgress(4, 'running', 75, `Envoi et enregistrement sur la branche "${targetBranch}"...`);

  const commitMessage =
    customCommitMsg ||
    `Synchronisation exposition (${fossilCount} fossiles) - ${new Date().toLocaleString('fr-FR')}`;

  let newCommitSha: string | undefined;
  let commitUrl: string | undefined;
  let uploadSuccess = false;
  let uploadErrorMessage = '';

  // METHOD 1: Server Proxy Sync FIRST (Most reliable in web apps, bypasses CORS, handles disk sync)
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const serverRes = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          branch: targetBranch,
          token: token,
          filePath: filePath,
          content: jsonString,
          message: commitMessage,
        }),
      });

      const sData = await serverRes.json().catch(() => ({}));
      if (serverRes.ok && sData.success) {
        newCommitSha = sData.sha;
        commitUrl = sData.commitUrl;
        uploadSuccess = true;
      } else if (sData.error) {
        uploadErrorMessage = sData.error + (sData.details ? ` (${sData.details})` : '');
      }
    } catch (proxyErr: any) {
      console.warn('Server proxy sync attempt notice, falling back to direct browser Git Data API:', proxyErr);
    }
  }

  // METHOD 2: Direct Git Data API (Blobs -> Trees -> Commits -> Refs)
  if (!uploadSuccess) {
    try {
      // 1. Create Blob (Supports fast upload of optimized payload)
      if (onStepProgress) onStepProgress(4, 'running', 75, `Téléversement du fichier (${payloadSizeMB} Mo)...`);
      const blobRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            ...getGitHubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: jsonString,
            encoding: 'utf-8',
          }),
        },
        90000
      );

      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        if (blobRes.status === 401) throw new Error("Token GitHub invalide ou expiré (401 Bad credentials).");
        if (blobRes.status === 403) throw new Error("Droits d'écriture insuffisants (403 Forbidden). Votre token doit avoir la permission 'repo'.");
        if (blobRes.status === 404) throw new Error(`Dépôt "${ghConfig.owner}/${ghConfig.repo}" introuvable (404).`);
        throw new Error(err.message || `Erreur création Blob (${blobRes.status})`);
      }

      const blobData = await blobRes.json();
      const blobSha = blobData.sha;

      // 2. Create Tree (Write to both public/data/fossiles.json and data/fossiles.json so all static hosting setups find it)
      const treeEntries: any[] = [
        {
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobSha,
        },
      ];
      if (filePath === 'public/data/fossiles.json') {
        treeEntries.push({
          path: 'data/fossiles.json',
          mode: '100644',
          type: 'blob',
          sha: blobSha,
        });
      } else if (filePath === 'data/fossiles.json') {
        treeEntries.push({
          path: 'public/data/fossiles.json',
          mode: '100644',
          type: 'blob',
          sha: blobSha,
        });
      }

      const treePayload: any = {
        tree: treeEntries,
      };
      if (baseTreeSha) {
        treePayload.base_tree = baseTreeSha;
      }

      let treeRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
          method: 'POST',
          headers: {
            ...getGitHubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(treePayload),
        },
        35000
      );

      // If tree creation with base_tree failed, retry as root tree
      if (!treeRes.ok && baseTreeSha) {
        delete treePayload.base_tree;
        treeRes = await fetchWithTimeout(
          `https://api.github.com/repos/${owner}/${repo}/git/trees`,
          {
            method: 'POST',
            headers: {
              ...getGitHubHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(treePayload),
          },
          35000
        );
      }

      if (!treeRes.ok) {
        const err = await treeRes.json().catch(() => ({}));
        throw new Error(err.message || `Erreur création arborescence Git (${treeRes.status})`);
      }

      const treeData = await treeRes.json();
      const newTreeSha = treeData.sha;

      // 3. Create Commit
      const commitPayload: any = {
        message: commitMessage,
        tree: newTreeSha,
      };
      if (latestCommitSha) {
        commitPayload.parents = [latestCommitSha];
      } else {
        commitPayload.parents = [];
      }

      const commitRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
          method: 'POST',
          headers: {
            ...getGitHubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commitPayload),
        },
        35000
      );

      if (!commitRes.ok) {
        const err = await commitRes.json().catch(() => ({}));
        throw new Error(err.message || `Erreur création commit (${commitRes.status})`);
      }

      const commitData = await commitRes.json();
      newCommitSha = commitData.sha;
      commitUrl = commitData.html_url;

      // 4. Update branch reference (PATCH first, then POST if branch is new)
      const patchRefRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(targetBranch)}`,
        {
          method: 'PATCH',
          headers: {
            ...getGitHubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sha: newCommitSha,
            force: true,
          }),
        },
        25000
      );

      if (patchRefRes.ok) {
        uploadSuccess = true;
      } else {
        // Branch ref doesn't exist yet, create it with POST
        const postRefRes = await fetchWithTimeout(
          `https://api.github.com/repos/${owner}/${repo}/git/refs`,
          {
            method: 'POST',
            headers: {
              ...getGitHubHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: `refs/heads/${targetBranch}`,
              sha: newCommitSha,
            }),
          },
          25000
        );

        if (postRefRes.ok) {
          uploadSuccess = true;
        } else {
          const err = await postRefRes.json().catch(() => ({}));
          throw new Error(err.message || `Impossible de mettre à jour la branche "${targetBranch}" (${postRefRes.status})`);
        }
      }

      // If we pushed to main and gh-pages branch exists, also try updating gh-pages branch
      if (uploadSuccess && targetBranch !== 'gh-pages') {
        try {
          await fetchWithTimeout(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/gh-pages`,
            {
              method: 'PATCH',
              headers: {
                ...getGitHubHeaders(token),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sha: newCommitSha,
                force: true,
              }),
            },
            15000
          );
        } catch (ghpErr) {
          // gh-pages branch might not exist or might use workflow deployment, ignore
        }
      }
    } catch (gitErr: any) {
      console.warn('Git Data API error, testing contents fallback:', gitErr);
      if (!uploadErrorMessage) {
        uploadErrorMessage = gitErr.message || 'Erreur Git Data API';
      }
    }
  }

  // METHOD 3: Contents API Fallback (for small collections or direct REST)
  if (!uploadSuccess) {
    try {
      const base64Content = await encodeBase64Safe(jsonString);

      // Check existing SHA
      let existingSha: string | undefined;
      try {
        const getFile = await fetchWithTimeout(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(targetBranch)}&t=${Date.now()}`,
          { headers: getGitHubHeaders(token) },
          12000
        );
        if (getFile.ok) {
          const fd = await getFile.json();
          existingSha = fd.sha;
        }
      } catch (e) {}

      const putBody: Record<string, any> = {
        message: commitMessage,
        content: base64Content,
        branch: targetBranch,
      };
      if (existingSha) {
        putBody.sha = existingSha;
      }

      const putRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            ...getGitHubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody),
        },
        60000
      );

      if (putRes.ok) {
        const putData = await putRes.json();
        newCommitSha = putData.content?.sha || putData.commit?.sha;
        commitUrl = putData.commit?.html_url;
        uploadSuccess = true;
      } else {
        const errJson = await putRes.json().catch(() => ({}));
        let friendlyError = errJson.message || putRes.statusText;
        if (putRes.status === 401) {
          friendlyError = "Token GitHub invalide ou expiré (401 Bad credentials).";
        } else if (putRes.status === 403) {
          friendlyError = "Droits d'écriture insuffisants (403 Forbidden). Cochez la case 'repo' pour votre Token GitHub.";
        } else if (putRes.status === 404) {
          friendlyError = `Dépôt "${ghConfig.owner}/${ghConfig.repo}" ou branche "${targetBranch}" introuvable (404).`;
        }
        uploadErrorMessage = `Erreur GitHub (${putRes.status}) : ${friendlyError}`;
      }
    } catch (contentsErr: any) {
      uploadErrorMessage = `Erreur d'envoi vers GitHub : ${contentsErr.message || uploadErrorMessage}`;
    }
  }

  if (!uploadSuccess) {
    const finalErr = uploadErrorMessage || "Échec de l'enregistrement du commit sur GitHub.";
    if (onStepProgress) onStepProgress(4, 'error', 75, finalErr, finalErr);
    return { success: false, error: finalErr };
  }

  if (onStepProgress) onStepProgress(4, 'success', 90, 'Données enregistrées et commitées sur GitHub');
  await new Promise(r => setTimeout(r, 50));

  // ==========================================
  // STEP 5: Finalisation & Mise à jour locale
  // ==========================================
  if (onStepProgress) onStepProgress(5, 'running', 95, 'Finalisation de la synchronisation...');

  try {
    const updatedGhConfig: GitHubSyncConfig = {
      ...ghConfig,
      branch: targetBranch,
      lastSyncTime: Date.now(),
      lastCommitSha: newCommitSha,
    };
    await saveGitHubConfig(updatedGhConfig);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('github-sync-status-changed', {
          detail: {
            state: 'success',
            message: `Synchronisé sur GitHub (${new Date().toLocaleTimeString('fr-FR')})`,
            lastSyncTime: Date.now(),
          } as GitHubSyncStatus,
        })
      );
    }
  } catch (finalErr: any) {
    console.warn('Final state save warning:', finalErr);
  }

  if (onStepProgress) onStepProgress(5, 'success', 100, 'Toutes vos fiches et photos ont été enregistrées avec succès sur GitHub !');

  return {
    success: true,
    sha: newCommitSha,
    commitUrl,
  };
}
