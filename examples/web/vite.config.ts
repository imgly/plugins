import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { createLogger } from "./vite/logger";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 4096
  },
  worker: {
    format: "es" // Default was "iife" but then import.meta.url for importing worker does not worker
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  customLogger: createLogger()
});

