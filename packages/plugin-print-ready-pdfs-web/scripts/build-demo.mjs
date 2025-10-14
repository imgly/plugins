#!/usr/bin/env node
import * as esbuild from 'esbuild';
import getConfig from '../esbuild/config.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
loadEnv({ path: path.join(__dirname, '../.env.local') });

// Get the config
const config = getConfig({ isDevelopment: false });

// Remove outfile and set outdir for the demo build
delete config.outfile;

// Build the plugin first
const buildResult = await esbuild.build({
  ...config,
  outdir: 'demo-dist',
  write: true,
  metafile: false
});

// Copy the HTML file and replace the license
const htmlPath = path.join(__dirname, '../test/cesdk-integration.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Replace the license placeholder with the actual license
// Use the same environment variable as the main examples (VITE_CESDK_LICENSE_KEY)
// This allows reusing the same Vercel secret across all demos
const license = process.env.VITE_CESDK_LICENSE_KEY;

// Replace %CESDK_LICENSE% placeholder with the actual license
const htmlWithLicense = htmlContent.replace(
  '%CESDK_LICENSE%',
  license || ''
);

// Write the modified HTML to demo-dist
fs.mkdirSync('demo-dist', { recursive: true });
fs.writeFileSync('demo-dist/index.html', htmlWithLicense);

// Copy any additional assets
const assetsDir = path.join(__dirname, '../src/assets');
const destAssetsDir = path.join('demo-dist', 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, destAssetsDir, { recursive: true });
}

// Copy the built plugin files from dist to demo-dist
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  // Copy index.mjs (the main plugin file)
  const srcPlugin = path.join(distDir, 'index.mjs');
  if (fs.existsSync(srcPlugin)) {
    fs.copyFileSync(srcPlugin, path.join('demo-dist', 'index.mjs'));
  }
  
  // Copy WASM files
  const wasmFiles = ['gs.wasm', 'gs.js'];
  wasmFiles.forEach(file => {
    const src = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join('demo-dist', file));
    }
  });
}

console.log('Demo build complete in demo-dist/');