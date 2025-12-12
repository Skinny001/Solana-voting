import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({}),
    react(),
    tailwindcss(),
    viteTsconfigPaths({
      //
      root: resolve(__dirname),
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@project/voting': resolve(__dirname, '../anchor_project/src'),
    },
  },
})
