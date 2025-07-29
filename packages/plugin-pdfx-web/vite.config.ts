import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PDFXPlugin',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'index.mjs';
          case 'cjs':
            return 'index.cjs';
          case 'umd':
            return 'index.umd.js';
          default:
            return `index.${format}.js`;
        }
      }
    },
    rollupOptions: {
      external: ['@cesdk/cesdk-js', '@cesdk/engine'],
      output: {
        globals: {
          '@cesdk/cesdk-js': 'CESDK',
          '@cesdk/engine': 'CESDKEngine'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'wasm/[name][extname]';
          }
          if (assetInfo.name?.includes('icc')) {
            return 'assets/icc/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    target: 'es2020',
    sourcemap: true
  },
  define: {
    __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0')
  },
  optimizeDeps: {
    exclude: ['@privyid/ghostscript']
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});