import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      input: {
        storefront: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin-key.html'),
      },
    },
  },
});
