import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import * as packageJson from './package.json';

// Get the current git branch name
function getGitBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    return branch || '';
  } catch (error) {
    console.warn('Failed to get git branch:', error);
    return '';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(getGitBranch())
  },
  plugins: [
    react(),
    {
      name: 'custom-urls',
      configureServer(server) {
        const originalPrintUrls = server.printUrls;
        server.printUrls = () => {
          originalPrintUrls();
          const protocol = server.config.server.https ? 'https' : 'http';
          const port = server.config.server.port || 5173;

          // Compact display
          console.log('');
          console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
          console.log('  \x1b[1m\x1b[33m🚀 IMG.LY Plugin Examples\x1b[0m');
          console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
          console.log(`  \x1b[32m📱 AI Demo:\x1b[0m        \x1b[1m\x1b[36m${protocol}://localhost:${port}/ai-demo\x1b[0m`);
          console.log(`  \x1b[32m🎨 AI Photo:\x1b[0m       \x1b[1m\x1b[36m${protocol}://localhost:${port}/ai-photoeditor\x1b[0m`);
          console.log(`  \x1b[32m🏠 Root:\x1b[0m           \x1b[1m\x1b[36m${protocol}://localhost:${port}/\x1b[0m`);
          console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
          console.log('');
        };
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
});
