#!/usr/bin/env node
import { spawn } from 'child_process';

// Determine what files to wait for based on SKIP_DTS
const skipDts = process.env.SKIP_DTS === 'true';

// Base files to wait for (always wait for the main bundle)
const filesToWait = ['./dist/index.mjs'];

// Only wait for type files if we're not skipping DTS generation
if (!skipDts) {
  filesToWait.push('./dist/index.d.ts');
}

// Check if there are additional export paths (like elevenlabs)
const additionalExports = process.argv.slice(2);
additionalExports.forEach(exportPath => {
  filesToWait.push(`./dist/${exportPath}/index.mjs`);
  if (!skipDts) {
    filesToWait.push(`./dist/${exportPath}/index.d.ts`);
  }
});

// Build the wait-on command
const args = [
  'exec',
  'wait-on',
  ...filesToWait,
  '--window',
  '250',
  '--timeout',
  '60000'
];

// Run wait-on with the appropriate files
const waitProcess = spawn('pnpm', args, {
  stdio: 'inherit',
  shell: true
});

waitProcess.on('exit', (code) => {
  process.exit(code);
});