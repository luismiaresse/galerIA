import { fileURLToPath, URL } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL cambia según desarrollo o producción
  base: "/static/",
  server: {
    host: "localhost",
    port: 5173,
    open: false,
    watch: {
      usePolling: true,
      disableGlobbing: false
    }
  },
  publicDir: resolve("./src/public"),
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
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Excluir Material Web Components de la compilación
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
    })
  ],
  resolve: {
    alias: {
      "@css": fileURLToPath(new URL("./src/assets/css", import.meta.url)),
      "@img": fileURLToPath(new URL("./src/assets/img", import.meta.url)),
      "@js": fileURLToPath(new URL("./src/assets/js", import.meta.url)),
      "@ts": fileURLToPath(new URL("./src/assets/ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
