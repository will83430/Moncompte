import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../www',
    emptyOutDir: false,
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.ts'],
  },
});
