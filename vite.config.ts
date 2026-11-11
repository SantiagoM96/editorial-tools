import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

// En Vite, public/cronica/index.html no se resuelve automáticamente desde /cronica/.
// Esta reescritura es solo para el servidor de desarrollo; Pages maneja el index por carpeta.
function legacyEditorRoutes(): Plugin {
  return {
    name: 'editorial-legacy-pages-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const current = req.url ?? '/';
        const pathname = current.split('?')[0];
        if (pathname && ['/bae/', '/diarioshow/'].includes(pathname)) {
          req.url = current.replace(pathname, pathname + 'index.html');
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  // Cada build de GitHub Pages recibe su propia base. En local se usa la raíz.
  base: command === 'build' ? (process.env.EDITORIAL_BASE || '/editorial-tools/') : '/',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        dashboard: fileURLToPath(new URL('./index.html', import.meta.url)),
        cronica: fileURLToPath(new URL('./cronica/index.html', import.meta.url)),
      },
    },
  },
  plugins: [legacyEditorRoutes(), react(), tailwindcss()],
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
