#!/usr/bin/env node
import * as esbuild from 'esbuild';
import getConfig from '../esbuild/config.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const license = process.env.VITE_CESDK_LICENSE_KEY || 
                process.env.CESDK_LICENSE || 
                'yDDwCZO23aFG8Ag3i5j81fgUeVGOHNkgKUgW_uczN5p0bJaftF_5LzHd7DpMEAAF';

const htmlWithLicense = htmlContent.replace(
  /license:\s*'[^']*'/,
  `license: '${license}'`
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

console.log('Demo build complete in demo-dist/');