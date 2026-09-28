var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_body_parser = __toESM(require("body-parser"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_body_parser.default.json({ limit: "150mb" }));
  app.use(import_express.default.urlencoded({ limit: "150mb", extended: true }));
  const publicDataDir = import_path.default.join(process.cwd(), "public", "data");
  const publicImagesDir = import_path.default.join(process.cwd(), "public", "images", "fossiles");
  if (!import_fs.default.existsSync(publicDataDir)) import_fs.default.mkdirSync(publicDataDir, { recursive: true });
  if (!import_fs.default.existsSync(publicImagesDir)) import_fs.default.mkdirSync(publicImagesDir, { recursive: true });
  const dataFile = import_path.default.join(publicDataDir, "fossiles.json");
  function saveBase64Image(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith("data:image/") && !dataUrl.startsWith("data:video/")) {
      return dataUrl;
    }
    const isVideo = dataUrl.startsWith("data:video/");
    const regex = isVideo ? /^data:video\/([a-zA-Z0-9+]+);base64,(.+)$/ : /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/;
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
    const filePath = import_path.default.join(publicImagesDir, filename);
    import_fs.default.writeFileSync(filePath, buffer);
    return `/images/fossiles/${filename}`;
  }
  function parseAndSaveImages(obj) {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => parseAndSaveImages(item));
    }
    if (typeof obj === "object") {
      const newObj = { ...obj };
      for (const key in newObj) {
        if (key === "url" || key === "videoUrl1" || key === "scaleVideoUrl" || key === "secondHomeImage" || key === "eraPrecambrianImage" || key === "eraPaleozoicImage" || key === "eraMesozoicImage" || key === "eraCenozoicImage") {
          if (typeof newObj[key] === "string") {
            newObj[key] = saveBase64Image(newObj[key]);
          } else if (newObj[key] && typeof newObj[key].url === "string") {
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
    if (import_fs.default.existsSync(dataFile)) {
      const rawData = import_fs.default.readFileSync(dataFile, "utf-8");
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
  app.get("/api/standalone-html", (req, res) => {
    const htmlPath = import_path.default.join(process.cwd(), "Mon_Exposition_Fossiles.html");
    if (import_fs.default.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send("HTML build not found. Please build the application first.");
    }
  });
  app.get(["/telecharger", "/api/download-app", "/download-app", "/Conservatoire_de_Fossiles.apk"], (req, res) => {
    const htmlPath = import_path.default.join(process.cwd(), "Mon_Exposition_Fossiles.html");
    if (import_fs.default.existsSync(htmlPath)) {
      try {
        let htmlContent = import_fs.default.readFileSync(htmlPath, "utf-8");
        let fossilsData = "{}";
        if (import_fs.default.existsSync(dataFile)) {
          try {
            const raw = import_fs.default.readFileSync(dataFile, "utf-8").trim();
            JSON.parse(raw);
            fossilsData = raw;
          } catch (e) {
            console.warn("Failed to read or parse latest fossils.json for download, using safe fallback:", e.message);
          }
        }
        const safeFossilsData = fossilsData.replace(/</g, "\\u003c");
        const regex = /<script>window\.__PRELOADED_CONFIG__\s*=\s*[\s\S]*?<\/script>/;
        const newScript = `<script>window.__PRELOADED_CONFIG__ = ${safeFossilsData};</script>`;
        if (regex.test(htmlContent)) {
          htmlContent = htmlContent.replace(regex, newScript);
        } else {
          htmlContent = htmlContent.replace("</head>", `${newScript}</head>`);
        }
        const isApkRequest = req.path.includes(".apk");
        const filename = isApkRequest ? "Conservatoire_de_Fossiles.apk" : "Conservatoire_de_Fossiles.html";
        const contentType = isApkRequest ? "application/vnd.android.package-archive" : "text/html; charset=utf-8";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.send(htmlContent);
      } catch (err) {
        console.error("Error serving dynamic standalone HTML:", err);
        res.status(500).send("Erreur lors de la g\xE9n\xE9ration du fichier de t\xE9l\xE9chargement.");
      }
    } else {
      res.status(404).send("Le fichier n'est pas pr\xEAt. L'application doit d'abord \xEAtre compil\xE9e.");
    }
  });
  app.post("/api/config", async (req, res) => {
    try {
      const parsedConfig = parseAndSaveImages(req.body);
      parsedConfig.lastUpdated = parsedConfig.lastUpdated || Date.now();
      const configJson = JSON.stringify(parsedConfig, null, 2);
      import_fs.default.writeFileSync(dataFile, configJson);
      try {
        const rootDataDir = import_path.default.join(process.cwd(), "data");
        if (!import_fs.default.existsSync(rootDataDir)) import_fs.default.mkdirSync(rootDataDir, { recursive: true });
        import_fs.default.writeFileSync(import_path.default.join(rootDataDir, "fossiles.json"), configJson);
      } catch (rootDataErr) {
        console.warn("Could not sync to root data directory:", rootDataErr);
      }
      try {
        const distDataDir = import_path.default.join(process.cwd(), "dist", "data");
        if (import_fs.default.existsSync(distDataDir)) {
          import_fs.default.writeFileSync(import_path.default.join(distDataDir, "fossiles.json"), configJson);
        }
      } catch (distDataErr) {
        console.warn("Could not sync to dist data directory:", distDataErr);
      }
      res.json({ success: true, updatedConfig: parsedConfig });
      setTimeout(async () => {
        try {
          const { exec } = await import("child_process");
          const util = await import("util");
          const execPromise = util.promisify(exec);
          console.log("Committing and pushing changes to GitHub in background...");
          await execPromise("git config user.email || git config --global user.email 'admin@example.com'").catch(() => {
          });
          await execPromise("git config user.name || git config --global user.name 'Admin Auto-Sync'").catch(() => {
          });
          await execPromise("git add public/data/fossiles.json data/fossiles.json public/images/fossiles/*").catch(() => {
          });
          await execPromise("git commit -m 'Auto-update from Admin Panel'").catch(() => {
          });
          await execPromise("git push").catch(() => {
          });
          console.log("Successfully ran git auto-push in background.");
        } catch (e) {
          console.error("Git auto-push skipped or failed in background (Normal if no git repo):", e.message);
        }
      }, 50);
    } catch (err) {
      console.error("Config save failed", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to save configuration", details: err.message });
      }
    }
  });
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
          const filePath = import_path.default.join(publicImagesDir, finalFilename);
          import_fs.default.writeFileSync(filePath, buffer);
          savedUrl = `/images/fossiles/${finalFilename}`;
        } else {
          return res.status(400).json({ error: "Format vid\xE9o invalide" });
        }
      } else if (dataUrl.startsWith("data:image/")) {
        savedUrl = saveBase64Image(dataUrl);
      } else {
        return res.status(400).json({ error: "Type de fichier non support\xE9" });
      }
      return res.json({ success: true, url: savedUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      return res.status(500).json({ error: "\xC9chec du t\xE9l\xE9chargement", details: err.message });
    }
  });
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
          error: "Nom d'utilisateur et nom de d\xE9p\xF4t requis."
        });
      }
      const authHeader = ghToken ? ghToken.startsWith("github_pat_") ? `Bearer ${ghToken}` : `token ${ghToken}` : void 0;
      const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Conservatoire-Fossiles-Server"
      };
      if (authHeader) headers["Authorization"] = authHeader;
      const repoRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}`,
        { headers }
      );
      if (repoRes.status === 401) {
        return res.status(401).json({
          success: false,
          error: "Token GitHub invalide ou expir\xE9 (401 Bad credentials)."
        });
      }
      if (repoRes.status === 404) {
        return res.status(404).json({
          success: false,
          error: `D\xE9p\xF4t "${ghOwner}/${ghRepo}" introuvable (404). V\xE9rifiez l'orthographe.`
        });
      }
      if (!repoRes.ok) {
        const errJson = await repoRes.json().catch(() => ({}));
        return res.status(repoRes.status).json({
          success: false,
          error: `Erreur GitHub (${repoRes.status}): ${errJson.message || repoRes.statusText}`
        });
      }
      const repoData = await repoRes.json();
      return res.json({
        success: true,
        repoName: repoData.full_name,
        isPrivate: repoData.private,
        defaultBranch: repoData.default_branch || "main"
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: `Erreur serveur lors du test GitHub : ${err.message}`
      });
    }
  });
  app.post("/api/github/sync", async (req, res) => {
    try {
      const { owner, repo, branch, token, content, filePath, message } = req.body;
      const ghOwner = (owner || process.env.GITHUB_OWNER || "GoliathAppli").trim();
      const ghRepo = (repo || process.env.GITHUB_REPO || "Ma-collection-de-fossiles-").trim();
      const rawToken = (token || process.env.GITHUB_TOKEN || "").trim();
      const ghToken = rawToken.replace(/^Bearer\s+/i, "").replace(/^token\s+/i, "").replace(/^["']|["']$/g, "").replace(/[\r\n\t\s]/g, "");
      const ghBranch = (branch || process.env.GITHUB_BRANCH || "main").trim();
      const ghPath = (filePath || "public/data/fossiles.json").replace(/^\/+/, "");
      if (!ghOwner || !ghRepo || !ghToken) {
        return res.status(400).json({
          error: "Identifiants GitHub manquants (owner, repo et token requis)."
        });
      }
      const headers = {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${ghToken}`,
        "User-Agent": "Conservatoire-Fossiles-App",
        "Cache-Control": "no-cache"
      };
      const jsonStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);
      const commitMessage = message || `Synchronisation exposition - ${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR")}`;
      try {
        if (!import_fs.default.existsSync(publicDataDir)) import_fs.default.mkdirSync(publicDataDir, { recursive: true });
        import_fs.default.writeFileSync(dataFile, jsonStr, "utf-8");
        const altDataDir = import_path.default.join(process.cwd(), "data");
        if (!import_fs.default.existsSync(altDataDir)) import_fs.default.mkdirSync(altDataDir, { recursive: true });
        import_fs.default.writeFileSync(import_path.default.join(altDataDir, "fossiles.json"), jsonStr, "utf-8");
      } catch (localErr) {
        console.warn("Could not write local data backup:", localErr);
      }
      let gitApiError = "";
      try {
        const blobRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/blobs`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ content: jsonStr, encoding: "utf-8" })
          }
        );
        if (!blobRes.ok) {
          const bErr = await blobRes.json().catch(() => ({}));
          gitApiError = bErr.message || `Erreur Blob (${blobRes.status})`;
        } else {
          const blobData = await blobRes.json();
          const blobSha = blobData.sha;
          let baseTreeSha;
          let latestCommitSha;
          try {
            const branchRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/branches/${encodeURIComponent(ghBranch)}?t=${Date.now()}`,
              { headers }
            );
            if (branchRes.ok) {
              const bData = await branchRes.json();
              latestCommitSha = bData.commit?.sha;
              baseTreeSha = bData.commit?.commit?.tree?.sha;
            }
          } catch (e) {
          }
          const treeEntries = [
            { path: ghPath, mode: "100644", type: "blob", sha: blobSha }
          ];
          if (ghPath === "public/data/fossiles.json") {
            treeEntries.push({ path: "data/fossiles.json", mode: "100644", type: "blob", sha: blobSha });
          } else if (ghPath === "data/fossiles.json") {
            treeEntries.push({ path: "public/data/fossiles.json", mode: "100644", type: "blob", sha: blobSha });
          }
          const treePayload = {
            tree: treeEntries,
            ...baseTreeSha ? { base_tree: baseTreeSha } : {}
          };
          let treeRes = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/trees`,
            {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify(treePayload)
            }
          );
          if (!treeRes.ok && baseTreeSha) {
            delete treePayload.base_tree;
            treeRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/trees`,
              {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(treePayload)
              }
            );
          }
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            const newTreeSha = treeData.sha;
            const commitPayload = {
              message: commitMessage,
              tree: newTreeSha,
              parents: latestCommitSha ? [latestCommitSha] : []
            };
            const commitRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/commits`,
              {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(commitPayload)
              }
            );
            if (commitRes.ok) {
              const commitData = await commitRes.json();
              const newCommitSha = commitData.sha;
              const patchRef = await fetch(
                `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs/heads/${encodeURIComponent(ghBranch)}`,
                {
                  method: "PATCH",
                  headers: { ...headers, "Content-Type": "application/json" },
                  body: JSON.stringify({ sha: newCommitSha, force: true })
                }
              );
              if (patchRef.ok) {
                if (ghBranch !== "gh-pages") {
                  try {
                    await fetch(
                      `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs/heads/gh-pages`,
                      {
                        method: "PATCH",
                        headers: { ...headers, "Content-Type": "application/json" },
                        body: JSON.stringify({ sha: newCommitSha, force: true })
                      }
                    );
                  } catch (e) {
                  }
                }
                return res.json({ success: true, sha: newCommitSha, commitUrl: commitData.html_url });
              } else {
                const postRef = await fetch(
                  `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/git/refs`,
                  {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({ ref: `refs/heads/${ghBranch}`, sha: newCommitSha })
                  }
                );
                if (postRef.ok) {
                  return res.json({ success: true, sha: newCommitSha, commitUrl: commitData.html_url });
                }
              }
            } else {
              const cErr = await commitRes.json().catch(() => ({}));
              gitApiError = cErr.message || `Erreur Commit (${commitRes.status})`;
            }
          } else {
            const tErr = await treeRes.json().catch(() => ({}));
            gitApiError = tErr.message || `Erreur Tree (${treeRes.status})`;
          }
        }
      } catch (gitErr) {
        console.warn("Server Git Data API error, testing Contents API fallback:", gitErr);
        gitApiError = gitErr.message;
      }
      let sha;
      try {
        const getRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/contents/${ghPath}?ref=${encodeURIComponent(ghBranch)}&t=${Date.now()}`,
          { headers }
        );
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }
      } catch (e) {
      }
      const base64Data = Buffer.from(jsonStr, "utf-8").toString("base64");
      const putRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/contents/${ghPath}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: commitMessage,
            content: base64Data,
            branch: ghBranch,
            ...sha ? { sha } : {}
          })
        }
      );
      if (putRes.ok) {
        const putData = await putRes.json();
        return res.json({
          success: true,
          sha: putData.content?.sha || putData.commit?.sha,
          commitUrl: putData.commit?.html_url
        });
      }
      const errorData = await putRes.json().catch(() => ({}));
      const combinedError = errorData.message || gitApiError || `Erreur GitHub API (${putRes.status})`;
      return res.status(putRes.status || 500).json({
        error: String(combinedError)
      });
    } catch (err) {
      console.error("Server GitHub sync exception:", err);
      return res.status(500).json({
        error: `Erreur interne lors de la synchronisation : ${err.message}`
      });
    }
  });
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(import_path.default.join(process.cwd(), "public", "sw.js"));
  });
  app.get(["/manifest.webmanifest", "/manifest.json"], (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const manifestFile = req.path.endsWith(".webmanifest") ? import_path.default.join(process.cwd(), "public", "manifest.webmanifest") : import_path.default.join(process.cwd(), "public", "manifest.json");
    if (import_fs.default.existsSync(manifestFile)) {
      res.sendFile(manifestFile);
    } else {
      res.sendFile(import_path.default.join(process.cwd(), "public", "manifest.json"));
    }
  });
  app.use("/icons", import_express.default.static(import_path.default.join(process.cwd(), "public", "icons")));
  app.use("/screenshots", import_express.default.static(import_path.default.join(process.cwd(), "public", "screenshots")));
  app.use("/images", import_express.default.static(import_path.default.join(process.cwd(), "public", "images")));
  app.use("/data", import_express.default.static(import_path.default.join(process.cwd(), "public", "data")));
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
