import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    host: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5173,
        }
      : undefined,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || process.env.API_INTERNAL_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
