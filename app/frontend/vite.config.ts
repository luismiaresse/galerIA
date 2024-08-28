/// <reference types="vitest" />

import { fileURLToPath, URL } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
import viteCompression from "vite-plugin-compression";

// Set base URL depending on environment
let baseURL = "/";
if (process.env.NODE_ENV === "production") {
  baseURL = "/static/";
}

// https://vitejs.dev/config/
export default defineConfig({
  base: baseURL,
  publicDir: resolve("./src/public"),
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Exclude Material Web Components from compilation
          isCustomElement: (tag) => tag.startsWith("md-")
        }
      }
    }),
    VueI18nPlugin({
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./src/locales/**"
      ),
      strictMessage: false
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br"
    }),
    crossOriginIsolation()
  ],
  resolve: {
    alias: {
      "@css": fileURLToPath(new URL("./src/assets/css", import.meta.url)),
      "@img": fileURLToPath(new URL("./src/assets/img", import.meta.url)),
      "@js": fileURLToPath(new URL("./src/assets/js", import.meta.url)),
      "@ts": fileURLToPath(new URL("./src/assets/ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "localhost",
    port: 5173,
    open: false,
    watch: {
      usePolling: true,
      disableGlobbing: false
    },
    // Proxy static files and requests to backend server
    proxy: {
      "/static": {
        target: "http://localhost:8000"
      },
      "/api": {
        target: "http://localhost:8000"
      }
    }
  },
  build: {
    outDir: resolve("./dist"),
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        main: resolve("./src/assets/js/main.js")
      },
      output: {
        chunkFileNames: undefined
      }
    },
    target: "esnext"
  },
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: "test/setup.ts",
    environment: "jsdom"
  }
});
