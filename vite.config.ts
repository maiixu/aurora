import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    electron([
      {
        // Main process
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', 'uiohook-napi', 'electron-store'],
            },
          },
        },
      },
      {
        // HUD preload
        entry: 'src/preload/hud-preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        // ChatGPT preload
        entry: 'src/preload/chatgpt-preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  root: 'src/renderer',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    rollupOptions: {
      input: {
        hud: resolve(__dirname, 'src/renderer/hud/index.html'),
      },
    },
  },
})
