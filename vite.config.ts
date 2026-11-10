import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  // Las páginas públicas viven en /editorial-tools/; en desarrollo se sirven desde /.
  base: command === 'build' ? '/editorial-tools/' : '/',
  publicDir: 'public',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
}));
