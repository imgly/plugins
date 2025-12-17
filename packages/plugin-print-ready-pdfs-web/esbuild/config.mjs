import chalk from 'chalk';
import { readFile, copyFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

/**
 * Add webpackIgnore comments to Node.js module imports in gs.js
 * This prevents Webpack 5 from trying to resolve these modules in browser builds.
 * See: https://github.com/imgly/ubq/issues/11471
 */
function addWebpackIgnoreComments(content) {
  // Transform: await import("module") -> await import(/* webpackIgnore: true */ "module")
  // Transform: await import("path") -> await import(/* webpackIgnore: true */ "path")
  // Also handle other Node.js modules that might be imported
  const nodeModules = ['module', 'path', 'fs', 'url', 'os'];
  let transformed = content;

  for (const mod of nodeModules) {
    // Match: import("module") or import('module')
    const patterns = [
      new RegExp(`import\\(\\s*["']${mod}["']\\s*\\)`, 'g'),
      new RegExp(`import\\(\\s*"${mod}"\\s*\\)`, 'g'),
    ];

    for (const pattern of patterns) {
      transformed = transformed.replace(pattern, `import(/* webpackIgnore: true */ "${mod}")`);
    }
  }

  return transformed;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Avoid the Experimental Feature warning when using the above.
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

// Plugin to copy WASM, JS, and ICC profile files to dist
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

      // Copy and transform gs.js file to add webpackIgnore comments
      // This fixes Webpack 5 compatibility (see https://github.com/imgly/ubq/issues/11471)
      const srcJs = join(__dirname, '../src/wasm/gs.js');
      const distJs = join(distDir, 'gs.js');
      const gsContent = await readFile(srcJs, 'utf-8');
      const transformedContent = addWebpackIgnoreComments(gsContent);
      await writeFile(distJs, transformedContent);
      log(chalk.green('✓ Copied and transformed gs.js to dist/ (added webpackIgnore comments)'));

      // Copy ICC profile files
      const iccProfiles = [
        'GRACoL2013_CRPC6.icc',
        'ISOcoated_v2_eci.icc',
        'sRGB_IEC61966-2-1.icc'
      ];

      for (const profile of iccProfiles) {
        const srcProfile = join(__dirname, '../src/assets/icc-profiles', profile);
        const distProfile = join(distDir, profile);
        await copyFile(srcProfile, distProfile);
        log(chalk.green(`✓ Copied ${profile} to dist/`));
      }
    });
  }
};

export default ({ isDevelopment }) => {
  log(
    `${chalk.yellow('Building version:')} ${chalk.bold(packageJson.version)}`
  );

  const config = baseConfig({
    isDevelopment,
    external: ['@cesdk/cesdk-js', 'path', 'url', 'fs', 'os', 'module'],
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