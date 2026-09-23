import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ command }) => {
  const isSingleFile = process.env.VITE_SINGLE_FILE === 'true';
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(), 
      isSingleFile ? viteSingleFile() : null,
      nodePolyfills()
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    build: {
      target: 'es2020'
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
