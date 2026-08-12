import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@public': fileURLToPath(new URL('./public', import.meta.url)),
    },
  },
});