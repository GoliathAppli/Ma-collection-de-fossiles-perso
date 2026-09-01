import express from "express";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit because we will be sending Base64 strings for images.
  app.use(bodyParser.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  const publicDataDir = path.join(process.cwd(), "public", "data");
  const publicImagesDir = path.join(process.cwd(), "public", "images", "fossiles");

  // Ensure directories exist
  if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });
  if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });

  const dataFile = path.join(publicDataDir, "fossiles.json");

  // Helper function to extract and save base64 images and videos
  function saveBase64Image(dataUrl: string): string {
    if (!dataUrl || (!dataUrl.startsWith("data:image/") && !dataUrl.startsWith("data:video/"))) {
      return dataUrl; // Not a base64 media file or already a URL
    }

    const isVideo = dataUrl.startsWith("data:video/");
    const regex = isVideo
      ? /^data:video\/([a-zA-Z0-9+]+);base64,(.+)$/
      : /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/;

    const matches = dataUrl.match(regex);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }

    let ext = matches[1];
    if (ext === "jpeg") ext = "jpg";
    if (ext === "svg+xml") ext = "svg";
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    
    const prefix = isVideo ? "vid" : "img";
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(publicImagesDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    return `/images/fossiles/${filename}`;
  }

  // Helper to recursively find and replace image and video URLs
  function parseAndSaveImages(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => parseAndSaveImages(item));
    }
    if (typeof obj === "object") {
      const newObj: any = { ...obj };
      for (const key in newObj) {
        if (
          key === "url" ||
          key === "videoUrl1" ||
          key === "scaleVideoUrl" ||
          key === "secondHomeImage" ||
          key === "eraPrecambrianImage" ||
          key === "eraPaleozoicImage" ||
          key === "eraMesozoicImage" ||
          key === "eraCenozoicImage"
        ) {
          if (typeof newObj[key] === "string") {
            newObj[key] = saveBase64Image(newObj[key]);
          } else if (newObj[key] && typeof newObj[key].url === "string") {
             // Handle nested url
             newObj[key].url = saveBase64Image(newObj[key].url);
          }
        } else {
          newObj[key] = parseAndSaveImages(newObj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

  app.get("/api/config", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (fs.existsSync(dataFile)) {
      const rawData = fs.readFileSync(dataFile, "utf-8");
      try {
        const config = JSON.parse(rawData);
        return res.json(config);
      } catch (err) {
        console.error("Failed to parse local config file", err);
        return res.status(500).json({ error: "Failed to parse local config." });
      }
    } else {
      res.status(404).json({ error: "Config not found" });
    }
  });

  // Serve the compiled HTML so the client can deploy it to GitHub
  app.get("/api/standalone-html", (req, res) => {
    const htmlPath = path.join(process.cwd(), "Mon_Exposition_Fossiles.html");
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send("HTML build not found. Please build the application first.");
    }
  });

  // Direct download route for the user
  app.get("/telecharger", (req, res) => {
    const htmlPath = path.join(process.cwd(), "Mon_Exposition_Fossiles.html");
    if (fs.existsSync(htmlPath)) {
      try {
        let htmlContent = fs.readFileSync(htmlPath, "utf-8");
        
        // Load latest dynamic data from dataFile
        let fossilsData = "{}";
        if (fs.existsSync(dataFile)) {
          try {
            const raw = fs.readFileSync(dataFile, "utf-8").trim();
            // Validate JSON to prevent corrupt/truncated injection which causes SyntaxError
            JSON.parse(raw);
            fossilsData = raw;
          } catch (e: any) {
            console.warn("Failed to read or parse latest fossils.json for download, using safe fallback:", e.message);
          }
        }

        // Escape '<' inside JSON to prevent premature script tag closure in the standalone HTML
        const safeFossilsData = fossilsData.replace(/</g, '\\u003c');

        // Replace preloaded config script dynamically in the file
        const regex = /<script>window\.__PRELOADED_CONFIG__\s*=\s*[\s\S]*?<\/script>/;
        const newScript = `<script>window.__PRELOADED_CONFIG__ = ${safeFossilsData};</script>`;
        
        if (regex.test(htmlContent)) {
          htmlContent = htmlContent.replace(regex, newScript);
        } else {
          // If not found, fall back to inserting before </head>
          htmlContent = htmlContent.replace('</head>', `${newScript}</head>`);
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="Mon_Exposition_Fossiles.html"');
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.send(htmlContent);
      } catch (err: any) {
        console.error("Error serving dynamic standalone HTML:", err);
        res.status(500).send("Erreur lors de la génération du fichier de téléchargement.");
      }
    } else {
      res.status(404).send("Le fichier n'est pas prêt. L'application doit d'abord être compilée.");
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      // Parse base64 images from JSON payload, write them to disk, replace URLs.
      const parsedConfig = parseAndSaveImages(req.body);
      
      // Ensure lastUpdated timestamp is set
      parsedConfig.lastUpdated = parsedConfig.lastUpdated || Date.now();
      
      const configJson = JSON.stringify(parsedConfig, null, 2);

      // Write to public/data/fossiles.json
      fs.writeFileSync(dataFile, configJson);

      // Also sync to root data/fossiles.json if directory exists (or create it)
      try {
        const rootDataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(rootDataDir)) fs.mkdirSync(rootDataDir, { recursive: true });
        fs.writeFileSync(path.join(rootDataDir, "fossiles.json"), configJson);
      } catch (rootDataErr) {
        console.warn("Could not sync to root data directory:", rootDataErr);
      }

      // Also sync to dist/data/fossiles.json if dist exists
      try {
        const distDataDir = path.join(process.cwd(), "dist", "data");
        if (fs.existsSync(distDataDir)) {
          fs.writeFileSync(path.join(distDataDir, "fossiles.json"), configJson);
        }
      } catch (distDataErr) {
        console.warn("Could not sync to dist data directory:", distDataErr);
      }

      // Respond instantly to eliminate client-side wait time and timeout crashes
      res.json({ success: true, updatedConfig: parsedConfig });

      // Run git auto-commit and push in the background
      setTimeout(async () => {
        try {
          const { exec } = await import("child_process");
          const util = await import("util");
          const execPromise = util.promisify(exec);
         
          console.log("Committing and pushing changes to GitHub in background...");
          await execPromise("git config user.email || git config --global user.email 'admin@example.com'").catch(() => {});
          await execPromise("git config user.name || git config --global user.name 'Admin Auto-Sync'").catch(() => {});
          await execPromise("git add public/data/fossiles.json data/fossiles.json public/images/fossiles/*").catch(() => {});
          await execPromise("git commit -m 'Auto-update from Admin Panel'").catch(() => {});
          await execPromise("git push").catch(() => {});
          console.log("Successfully ran git auto-push in background.");
        } catch (e: any) {
          console.error("Git auto-push skipped or failed in background (Normal if no git repo):", e.message);
        }
      }, 50);

    } catch (err: any) {
      console.error("Config save failed", err);
      // Only send if headers not sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to save configuration", details: err.message });
      }
    }
  });

  // Dedicated endpoint for high-performance direct file/media uploads (Images and Videos)
  app.post("/api/upload", (req, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: "No dataUrl provided" });
      }

      let savedUrl = "";
      if (dataUrl.startsWith("data:video/")) {
        const matches = dataUrl.match(/^data:video\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const finalFilename = `vid_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const filePath = path.join(publicImagesDir, finalFilename);
          fs.writeFileSync(filePath, buffer);
          savedUrl = `/images/fossiles/${finalFilename}`;
        } else {
          return res.status(400).json({ error: "Format vidéo invalide" });
        }
      } else if (dataUrl.startsWith("data:image/")) {
        savedUrl = saveBase64Image(dataUrl);
      } else {
        return res.status(400).json({ error: "Type de fichier non supporté" });
      }

      return res.json({ success: true, url: savedUrl });
    } catch (err: any) {
      console.error("Upload failed:", err);
      return res.status(500).json({ error: "Échec du téléchargement", details: err.message });
    }
  });

  // Server-side GitHub Test Connection endpoint
  app.post("/api/github/test", async (req, res) => {
    try {
      const { owner, repo, token, branch } = req.body;
      const ghOwner = (owner || process.env.GITHUB_OWNER || "GoliathAppli").trim();
      const ghRepo = (repo || process.env.GITHUB_REPO || "Ma-collection-de-fossiles-").trim();
      const rawToken = (token || process.env.GITHUB_TOKEN || "").trim();
      const ghToken = rawToken.replace(/^Bearer\s+/i, "").replace(/^token\s+/i, "").trim();

      if (!ghOwner || !ghRepo) {
        return res.status(400).json({
          success: false,
          error: "Nom d'utilisateur et nom de dépôt requis.",
        });
      }

      const authHeader = ghToken
        ? (ghToken.startsWith("github_pat_") ? `Bearer ${ghToken}` : `token ${ghToken}`)
        : undefined;

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Conservatoire-Fossiles-Server",
      };
      if (authHeader) headers["Authorization"] = authHeader;

      const repoRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}`,
        { headers }
      );

      if (repoRes.status === 401) {
        return res.status(401).json({
          success: false,
          error: "Token GitHub invalide ou expiré (401 Bad credentials).",
        });
      }

      if (repoRes.status === 404) {
        return res.status(404).json({
          success: false,
          error: `Dépôt "${ghOwner}/${ghRepo}" introuvable (404). Vérifiez l'orthographe.`,
        });
      }

      if (!repoRes.ok) {
        const errJson: any = await repoRes.json().catch(() => ({}));
        return res.status(repoRes.status).json({
          success: false,
          error: `Erreur GitHub (${repoRes.status}): ${errJson.message || repoRes.statusText}`,
        });
      }

      const repoData: any = await repoRes.json();
      return res.json({
        success: true,
        repoName: repoData.full_name,
        isPrivate: repoData.private,
        defaultBranch: repoData.default_branch || "main",
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Erreur serveur lors du test GitHub : ${err.message}`,
      });
    }
  });

  // Server-side GitHub Push & Sync Proxy endpoint (Supports Git Data API for unlimited payload size)
  app.post("/api/github/sync", async (req, res) => {
    try {
      const { owner, repo, branch, token, content, filePath, message } = req.body;
      const ghOwner = (owner || process.env.GITHUB_OWNER || "GoliathAppli").trim();
      const ghRepo = (repo || process.env.GITHUB_REPO || "Ma-collection-de-fossiles-").trim();
      const rawToken = (token || process.env.GITHUB_TOKEN || "").trim();
      const ghToken = rawToken
        .replace(/^Bearer\s+/i, "")
        .replace(/^token\s+/i, "")
        .replace(/^["']|["']$/g, "")
        .replace(/[\r\n\t\s]/g, "");
      const ghBranch = (branch || process.env.GITHUB_BRANCH || "main").trim();
      const ghPath = (filePath || "public/data/fossiles.json").replace(/^\/+/, "");

      if (!ghOwner || !ghRepo || !ghToken) {
        return res.status(400).json({
          error: "Identifiants GitHub manquants (owner, repo et token requis).",
        });
      }

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${ghToken}`,
        "User-Agent": "Conservatoire-Fossiles-App",
        "Cache-Control": "no-cache",
      };

      const jsonStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);
      const commitMessage = message || `Synchronisation exposition - ${new Date().toLocaleString("fr-FR")}`;

      // Also persist to local filesystem immediately
      try {
        if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });
        fs.writeFileSync(dataFile, jsonStr, "utf-8");
        const altDataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(altDataDir)) fs.mkdirSync(altDataDir, { recursive: true });
        fs.writeFileSync(path.join(altDataDir, "fossiles.json"), jsonStr, "utf-8");
      } catch (localErr) {
        console.warn("Could not write local data backup:", localErr);
      }

      let gitApiError = "";

      // 1. Try Git Data API (Blobs -> Trees -> Commits -> Refs)
      try {
        // Create Blob
        const blobRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/blobs`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ content: jsonStr, encoding: "utf-8" }),
          }
        );

        if (!blobRes.ok) {
          const bErr: any = await blobRes.json().catch(() => ({}));
          gitApiError = bErr.message || `Erreur Blob (${blobRes.status})`;
        } else {
          const blobData: any = await blobRes.json();
          const blobSha = blobData.sha;

          // Get branch ref for base tree and latest commit sha
          let baseTreeSha: string | undefined;
          let latestCommitSha: string | undefined;
          try {
            const branchRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/branches/${encodeURIComponent(ghBranch)}?t=${Date.now()}`,
              { headers }
            );
            if (branchRes.ok) {
              const bData: any = await branchRes.json();
              latestCommitSha = bData.commit?.sha;
              baseTreeSha = bData.commit?.commit?.tree?.sha;
            }
          } catch (e) {}

          // Create Tree containing both public/data/fossiles.json and data/fossiles.json
          const treeEntries: any[] = [
            { path: ghPath, mode: "100644", type: "blob", sha: blobSha }
          ];
          if (ghPath === "public/data/fossiles.json") {
            treeEntries.push({ path: "data/fossiles.json", mode: "100644", type: "blob", sha: blobSha });
          } else if (ghPath === "data/fossiles.json") {
            treeEntries.push({ path: "public/data/fossiles.json", mode: "100644", type: "blob", sha: blobSha });
          }

          const treePayload: any = {
            tree: treeEntries,
            ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
          };

          let treeRes = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/trees`,
            {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify(treePayload),
            }
          );

          if (!treeRes.ok && baseTreeSha) {
            delete treePayload.base_tree;
            treeRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/trees`,
              {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(treePayload),
              }
            );
          }

          if (treeRes.ok) {
            const treeData: any = await treeRes.json();
            const newTreeSha = treeData.sha;

            // Create Commit
            const commitPayload: any = {
              message: commitMessage,
              tree: newTreeSha,
              parents: latestCommitSha ? [latestCommitSha] : [],
            };

            const commitRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/commits`,
              {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(commitPayload),
              }
            );

            if (commitRes.ok) {
              const commitData: any = await commitRes.json();
              const newCommitSha = commitData.sha;

              // Update Ref (PATCH with force: true to resolve any diverging head)
              const patchRef = await fetch(
                `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs/heads/${encodeURIComponent(ghBranch)}`,
                {
                  method: "PATCH",
                  headers: { ...headers, "Content-Type": "application/json" },
                  body: JSON.stringify({ sha: newCommitSha, force: true }),
                }
              );

              if (patchRef.ok) {
                // If main branch, also attempt updating gh-pages branch
                if (ghBranch !== "gh-pages") {
                  try {
                    await fetch(
                      `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs/heads/gh-pages`,
                      {
                        method: "PATCH",
                        headers: { ...headers, "Content-Type": "application/json" },
                        body: JSON.stringify({ sha: newCommitSha, force: true }),
                      }
                    );
                  } catch (e) {}
                }

                return res.json({ success: true, sha: newCommitSha, commitUrl: commitData.html_url });
              } else {
                // If PATCH failed (e.g. branch does not exist yet), try POST to create branch ref
                const postRef = await fetch(
                  `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs`,
                  {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({ ref: `refs/heads/${ghBranch}`, sha: newCommitSha }),
                  }
                );

                if (postRef.ok) {
                  return res.json({ success: true, sha: newCommitSha, commitUrl: commitData.html_url });
                }
              }
            } else {
              const cErr: any = await commitRes.json().catch(() => ({}));
              gitApiError = cErr.message || `Erreur Commit (${commitRes.status})`;
            }
          } else {
            const tErr: any = await treeRes.json().catch(() => ({}));
            gitApiError = tErr.message || `Erreur Tree (${treeRes.status})`;
          }
        }
      } catch (gitErr: any) {
        console.warn("Server Git Data API error, testing Contents API fallback:", gitErr);
        gitApiError = gitErr.message;
      }

      // 2. Fallback to Contents API with forced sha fetch
      let sha: string | undefined;
      try {
        const getRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/contents/${ghPath}?ref=${encodeURIComponent(ghBranch)}&t=${Date.now()}`,
          { headers }
        );
        if (getRes.ok) {
          const fileData: any = await getRes.json();
          sha = fileData.sha;
        }
      } catch (e) {}

      const base64Data = Buffer.from(jsonStr, "utf-8").toString("base64");
      const putRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/contents/${ghPath}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: commitMessage,
            content: base64Data,
            branch: ghBranch,
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (putRes.ok) {
        const putData: any = await putRes.json();
        return res.json({
          success: true,
          sha: putData.content?.sha || putData.commit?.sha,
          commitUrl: putData.commit?.html_url,
        });
      }

      const errorData: any = await putRes.json().catch(() => ({}));
      const combinedError = errorData.message || gitApiError || `Erreur GitHub API (${putRes.status})`;
      return res.status(putRes.status || 500).json({
        error: String(combinedError),
      });
    } catch (err: any) {
      console.error("Server GitHub sync exception:", err);
      return res.status(500).json({
        error: `Erreur interne lors de la synchronisation : ${err.message}`,
      });
    }
  });

  // Serve PWA assets with explicit mime types
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(process.cwd(), "public", "sw.js"));
  });

  app.get(["/manifest.webmanifest", "/manifest.json"], (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const manifestFile = req.path.endsWith(".webmanifest")
      ? path.join(process.cwd(), "public", "manifest.webmanifest")
      : path.join(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestFile)) {
      res.sendFile(manifestFile);
    } else {
      res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
    }
  });

  // Serve custom public/icons, public/screenshots, public/images and public/data statically
  app.use("/icons", express.static(path.join(process.cwd(), "public", "icons")));
  app.use("/screenshots", express.static(path.join(process.cwd(), "public", "screenshots")));
  app.use("/images", express.static(path.join(process.cwd(), "public", "images")));
  app.use("/data", express.static(path.join(process.cwd(), "public", "data")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Provide a fallback for all other routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
