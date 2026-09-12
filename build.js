import { build as viteBuild } from "vite";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";

async function run() {
  try {
    console.log("=== STEP 1: Starting standard Vite build ===");
    await viteBuild();
    console.log("✔ Standard Vite build completed successfully.");

    console.log("\n=== STEP 2: Starting standalone single-file Vite build ===");
    process.env.VITE_SINGLE_FILE = "true";
    await viteBuild({
      build: {
        outDir: "standalone-build",
      }
    });
    console.log("✔ Standalone single-file Vite build completed successfully.");

    console.log("\n=== STEP 3: Copying and injecting data into standalone HTML file ===");
    const srcPath = path.join("standalone-build", "index.html");
    const destPath = "Mon_Exposition_Fossiles.html";
    if (fs.existsSync(srcPath)) {
      let htmlContent = fs.readFileSync(srcPath, "utf-8");
      
      // Load current fossils.json config to embed in the standalone HTML
      let fossilsData = "{}";
      const dataFilePath = path.join("public", "data", "fossiles.json");
      if (fs.existsSync(dataFilePath)) {
        try {
          fossilsData = fs.readFileSync(dataFilePath, "utf-8");
          // Validate JSON
          JSON.parse(fossilsData);
          console.log("✔ Loaded and validated public/data/fossiles.json for embedding.");
        } catch (e) {
          console.warn("⚠ Failed to load or parse public/data/fossiles.json, fallback to empty object:", e.message);
          fossilsData = "{}";
        }
      }

      // Escape '<' inside JSON to prevent premature script tag closure in the standalone HTML
      const safeFossilsData = fossilsData.trim().replace(/</g, '\\u003c');
      
      // Inject the preloaded configuration script inside the head tag
      const injection = `<script>window.__PRELOADED_CONFIG__ = ${safeFossilsData};</script></head>`;
      htmlContent = htmlContent.replace('</head>', injection);
      
      fs.writeFileSync(destPath, htmlContent, "utf-8");
      console.log(`✔ Successfully generated standalone HTML with embedded data: ${destPath}`);

      // Also copy to public/ and dist/ so it is served statically in dev and production
      try {
        const publicDest = path.join("public", "Mon_Exposition_Fossiles.html");
        fs.writeFileSync(publicDest, htmlContent, "utf-8");
        console.log(`✔ Copied standalone HTML to: ${publicDest}`);
      } catch (err) {
        console.warn("⚠ Non-critical: Failed to copy to public/ folder:", err.message);
      }

      try {
        const distDest = path.join("dist", "Mon_Exposition_Fossiles.html");
        // Ensure dist folder exists
        if (!fs.existsSync("dist")) {
          fs.mkdirSync("dist", { recursive: true });
        }
        fs.writeFileSync(distDest, htmlContent, "utf-8");
        console.log(`✔ Copied standalone HTML to: ${distDest}`);
      } catch (err) {
        console.warn("⚠ Non-critical: Failed to copy to dist/ folder:", err.message);
      }
    } else {
      throw new Error(`Source file ${srcPath} does not exist!`);
    }

    console.log("\n=== STEP 4: Cleaning up standalone-build directory ===");
    if (fs.existsSync("standalone-build")) {
      fs.rmSync("standalone-build", { recursive: true, force: true });
      console.log("✔ Removed standalone-build directory.");
    }

    console.log("\n=== STEP 5: Bundling server.ts with esbuild ===");
    await esbuild.build({
      entryPoints: ["server.ts"],
      bundle: true,
      platform: "node",
      format: "cjs",
      packages: "external",
      sourcemap: true,
      outfile: "dist/server.cjs",
    });
    console.log("✔ Server bundled successfully to dist/server.cjs.");

    console.log("\n🚀 All build steps completed successfully!");
  } catch (error) {
    console.error("\n❌ Build process failed:", error);
    process.exit(1);
  }
}

run();
