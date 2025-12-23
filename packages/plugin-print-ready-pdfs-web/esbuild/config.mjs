/**
 * esbuild configuration for plugin-print-ready-pdfs-web
 *
 * NOTE: This config is used by the shared build infrastructure.
 * For multi-bundle builds (browser, node, universal), see scripts/build.mjs
 * which handles the full build process directly.
 */

import { readFile } from 'fs/promises';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

export default ({ isDevelopment }) => {
  log(`Building version: ${packageJson.version}`);

  const config = baseConfig({
    isDevelopment,
    external: ['@cesdk/cesdk-js', 'path', 'url', 'fs', 'os', 'module'],
    pluginVersion: packageJson.version
  });

  config.loader = {
    ...config.loader,
    '.wasm': 'file'
  };

  return config;
}
