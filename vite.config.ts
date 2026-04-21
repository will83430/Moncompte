import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'src',
  plugins: [tailwindcss()],
  build: {
    outDir: '../www',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.ts'],
  },
});
