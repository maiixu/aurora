import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    electron([
      {
        // Main process — absolute path avoids root: 'src/renderer' confusion
        entry: resolve(__dirname, 'src/main/index.ts'),
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist/main'),
            rollupOptions: {
              external: [
                'electron',
                'uiohook-napi',
              ],
            },
          },
        },
      },
      {
        // HUD preload
        entry: resolve(__dirname, 'src/preload/hud-preload.ts'),
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist/preload'),
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
