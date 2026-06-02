import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function copyStaticShowcaseAssets() {
  return {
    name: "copy-static-showcase-assets",
    closeBundle() {
      const root = process.cwd();
      const outDir = resolve(root, "dist");
      for (const entry of ["assets/audio", "assets/models", "assets/podcasts", "assets/posters", "assets/textures", "assets/videos-web", "docs"]) {
        const from = resolve(root, entry);
        if (existsSync(from)) cpSync(from, resolve(outDir, entry), { recursive: true });
      }
      for (const file of [".nojekyll", "README.md"]) {
        const from = resolve(root, file);
        if (existsSync(from)) cpSync(from, resolve(outDir, file));
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyStaticShowcaseAssets()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          "vendor-physics": ["@react-three/rapier"],
          "vendor-motion": ["framer-motion"]
        }
      }
    }
  }
});
