import chalk from 'chalk';
import { readFile, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Avoid the Experimental Feature warning when using the above.
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

// Plugin to copy WASM and JS files to dist
const copyWasmPlugin = {
  name: 'copy-wasm',
  setup(build) {
    build.onEnd(async () => {
      const distDir = join(__dirname, '../dist');
      
      if (!existsSync(distDir)) {
        await mkdir(distDir, { recursive: true });
      }
      
      // Copy WASM file
      const srcWasm = join(__dirname, '../src/wasm/gs.wasm');
      const distWasm = join(distDir, 'gs.wasm');
      await copyFile(srcWasm, distWasm);
      log(chalk.green('✓ Copied gs.wasm to dist/'));
      
      // Copy gs.js file 
      const srcJs = join(__dirname, '../src/wasm/gs.js');
      const distJs = join(distDir, 'gs.js');
      await copyFile(srcJs, distJs);
      log(chalk.green('✓ Copied gs.js to dist/'));
    });
  }
};

export default ({ isDevelopment }) => {
  log(
    `${chalk.yellow('Building version:')} ${chalk.bold(packageJson.version)}`
  );

  const config = baseConfig({
    isDevelopment,
    external: ['@cesdk/cesdk-js'],
    pluginVersion: packageJson.version
  });

  // Add loader configuration for WASM files
  config.loader = {
    ...config.loader,
    '.wasm': 'file'
  };

  // Add our custom plugin
  config.plugins = [...(config.plugins || []), copyWasmPlugin];

  return config;
};