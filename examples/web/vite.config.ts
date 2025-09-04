import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import * as packageJson from './package.json';

// Get the current git branch name
function getGitBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    return branch || 'unknown';
  } catch (error) {
    console.warn('Failed to get git branch:', error);
    return 'unknown';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(getGitBranch())
  },
  plugins: [
    react(),
    // https://github.com/vitejs/vite/issues/8619#issuecomment-2606507049
    {
      name: 'watch-workspace-packages',
      configureServer(server) {
        server.watcher.options = {
          ...server.watcher.options,
          ignored: [
            (path) => {
              const isNodeModules = path.includes('node_modules/');
              const isWorkspace = Object.keys(
                packageJson.dependenciesMeta
              ).some(
                (pkgName) =>
                  path.includes(pkgName) ||
                  path.includes(pkgName.replace('/', '+'))
              );
              return isNodeModules && !isWorkspace;
            },
            '**/.git/**'
          ]
        };
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  optimizeDeps: {
    exclude: Object.keys(packageJson.dependenciesMeta)
  }
});
