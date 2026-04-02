import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
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
