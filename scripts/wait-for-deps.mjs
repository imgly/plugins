#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the example package.json to get workspace dependencies
const examplePkgPath = join(__dirname, '../examples/web/package.json');
const packageJson = JSON.parse(await readFile(examplePkgPath, 'utf-8'));

// Get all workspace dependencies
const workspaceDeps = Object.entries(packageJson.dependencies || {})
  .filter(([_, version]) => version.startsWith('workspace:'))
  .map(([name]) => name);

// Build list of files to wait for from each workspace dependency
const filesToWait = [];
const skipDts = process.env.SKIP_DTS === 'true';

for (const dep of workspaceDeps) {
  // Convert package name to directory name
  const packageDir = dep.replace('@imgly/', '');
  const packagePath = join(__dirname, '../packages', packageDir);
  
  // Check if this package has special exports (like elevenlabs)
  if (dep === '@imgly/plugin-ai-audio-generation-web') {
    filesToWait.push(join(packagePath, 'dist/index.mjs'));
    filesToWait.push(join(packagePath, 'dist/elevenlabs/index.mjs'));
    if (!skipDts) {
      filesToWait.push(join(packagePath, 'dist/index.d.ts'));
      filesToWait.push(join(packagePath, 'dist/elevenlabs/index.d.ts'));
    }
  } else {
    filesToWait.push(join(packagePath, 'dist/index.mjs'));
    if (!skipDts) {
      filesToWait.push(join(packagePath, 'dist/index.d.ts'));
    }
  }
}

console.log(`Waiting for ${workspaceDeps.length} dependencies to build...`);
if (skipDts) {
  console.log('(Skipping type files due to SKIP_DTS=true)');
}

// Run wait-on with all the files
const args = [
  'exec',
  'wait-on',
  ...filesToWait,
  '--window',
  '500',
  '--timeout',
  '120000'
];

const waitProcess = spawn('pnpm', args, {
  stdio: 'inherit',
  shell: true
});

waitProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('All dependencies built successfully!');
  }
  process.exit(code);
});