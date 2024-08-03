/// <reference types="vitest" />

import { fileURLToPath, URL } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/static/",
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
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: "test/setup.ts",
    environment: "jsdom"
  }
});
