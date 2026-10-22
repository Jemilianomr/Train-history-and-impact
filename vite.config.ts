import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work both at a domain root and under a GitHub Pages project path.
  base: './',
  build: { chunkSizeWarningLimit: 750 },
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
});
