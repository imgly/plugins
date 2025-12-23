import * as esbuild from 'esbuild';
import chalk from 'chalk';
import { readFile, copyFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Add webpackIgnore comments to Node.js module imports in gs.js
 */
function addWebpackIgnoreComments(content) {
  const nodeModules = ['module', 'path', 'fs', 'url', 'os'];
  let transformed = content;

  for (const mod of nodeModules) {
    const pattern = new RegExp(`import\\(\\s*["']${mod}["']\\s*\\)`, 'g');
    transformed = transformed.replace(pattern, `import(/* webpackIgnore: true */ "${mod}")`);
  }

  return transformed;
}

// Plugin to replace node-loader with browser stub in browser builds
const browserNodeLoaderStub = {
  name: 'browser-node-loader-stub',
  setup(build) {
    // Redirect node-loader imports to the browser stub
    build.onResolve({ filter: /\.\/loaders\/node-loader$/ }, () => ({
      path: join(__dirname, '../src/loaders/node-loader.browser.ts'),
    }));
  }
};

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

      // Copy and transform gs.js file
      const srcJs = join(__dirname, '../src/wasm/gs.js');
      const distJs = join(distDir, 'gs.js');
      const gsContent = await readFile(srcJs, 'utf-8');
      const transformedContent = addWebpackIgnoreComments(gsContent);
      await writeFile(distJs, transformedContent);
      log(chalk.green('✓ Copied and transformed gs.js to dist/'));

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

      // Copy type declaration files
      const typesDir = join(distDir, 'types');
      if (!existsSync(typesDir)) {
        await mkdir(typesDir, { recursive: true });
      }
      const typeFiles = ['pdfx.ts', 'ghostscript.ts', 'index.ts', 'asset-loader.ts'];
      for (const typeFile of typeFiles) {
        const srcType = join(__dirname, '../src/types', typeFile);
        const distType = join(typesDir, typeFile);
        if (existsSync(srcType)) {
          await copyFile(srcType, distType);
        }
      }
      log(chalk.green('✓ Copied type declarations to dist/types/'));
    });
  }
};

async function build() {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url))
  );

  log(`${chalk.yellow('Building version:')} ${chalk.bold(packageJson.version)}`);

  const isDevelopment = false;
  const commonExternal = ['@cesdk/cesdk-js'];
  const nodeExternal = ['path', 'url', 'fs', 'os', 'module'];

  // Helper to create config
  const createConfig = (entryPoint, outfile, platform, external, extraPlugins = []) => {
    const config = baseConfig({
      isDevelopment,
      external,
      pluginVersion: packageJson.version
    });

    config.entryPoints = [entryPoint];
    config.outfile = outfile;
    config.platform = platform;
    config.loader = { ...config.loader, '.wasm': 'file' };
    config.plugins = [...(config.plugins || []), ...extraPlugins];

    return config;
  };

  // Build all bundles
  const configs = [
    // Main/universal bundle (copies assets)
    createConfig('src/index.ts', 'dist/index.mjs', 'neutral', [...commonExternal, ...nodeExternal], [copyWasmPlugin]),
    // Browser bundle - use stub for node-loader to avoid bundling Node.js-specific code
    createConfig('src/index.browser.ts', 'dist/index.browser.mjs', 'browser', [...commonExternal], [browserNodeLoaderStub]),
    // Node.js bundle
    createConfig('src/index.node.ts', 'dist/index.node.mjs', 'node', [...commonExternal, ...nodeExternal], []),
  ];

  // Build each config sequentially to avoid race conditions with the copy plugin
  for (const config of configs) {
    log(chalk.blue(`Building ${config.outfile}...`));
    await esbuild.build(config);
    log(chalk.green(`✓ Built ${config.outfile}`));
  }

  log(chalk.green('\n✓ All bundles built successfully!'));
}

build().catch((error) => {
  console.error(chalk.red('Build failed:'), error);
  process.exit(1);
});
