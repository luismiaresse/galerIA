import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL cambia según desarrollo o producción
  base: '/static/',
  root: resolve('./app'),
  server: {
    host: 'localhost',
    port: 5173,
    open: false,
    watch: {
      usePolling: true,
      disableGlobbing: false,
    },
  },
  publicDir: resolve('./app/public'),
  build: { 
    outDir: resolve('./app/dist'),
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        main: resolve('./app/assets/js/main.js')
      },
      output: {
        chunkFileNames: undefined,
      },
    },
    target: 'esnext',
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Excluir Material Web Components de la compilación
          isCustomElement: tag => tag.startsWith('md-')
        }
      }
    }),
    VueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './app/locales/**'),
        strictMessage: false,
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '@css': fileURLToPath(new URL('./app/assets/css', import.meta.url)),
      '@img': fileURLToPath(new URL('./app/assets/img', import.meta.url)),
      '@js': fileURLToPath(new URL('./app/assets/js', import.meta.url)),
      '@ts': fileURLToPath(new URL('./app/assets/ts', import.meta.url)),
    }
  }
})
