import chalk from 'chalk';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

// import packageJson from '../package.json' assert { type: 'json' };
// Avoid the Experimental Feature warning when using the above.
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

// Load .env.local only in local development (not in CI/Vercel)
if (!process.env.CI && !process.env.VERCEL) {
  dotenv.config({ path: '.env.local' });
}

// Debug: Log ALL environment variables to diagnose Vercel issue
console.log('[esbuild config] All env vars:', Object.keys(process.env).filter(k =>
  k.includes('CESDK') || k.includes('PROXY') || k.includes('FAL') || k.includes('ANTHROPIC')
).reduce((acc, k) => ({ ...acc, [k]: process.env[k]?.substring(0, 50) + '...' }), {}));

console.log('[esbuild config] Environment check:', {
  CI: process.env.CI,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  hasCESDKLicense: !!process.env.CESDK_LICENSE,
  licenseLength: process.env.CESDK_LICENSE?.length,
  hasFalAiProxy: !!process.env.FAL_AI_PROXY_URL,
  falAiProxyUrl: process.env.FAL_AI_PROXY_URL,
  hasAnthropicProxy: !!process.env.ANTHROPIC_PROXY_URL,
  anthropicProxyUrl: process.env.ANTHROPIC_PROXY_URL
});

export default ({ isDevelopment }) => {
  log(
    `${chalk.yellow('Building version:')} ${chalk.bold(packageJson.version)}`
  );

  // Base configuration that applies to all builds
  const baseOptions = {
    isDevelopment,
    external: [],
    pluginVersion: packageJson.version
  };

  // Get the base configuration
  const config = baseConfig(baseOptions);

  // Set entry points and output configuration
  config.entryPoints = ['./src/index.ts'];
  config.outExtension = { '.js': '.mjs' };
  config.outdir = './dist';
  config.outbase = './src';
  config.outfile = undefined;
  config.define = {
    ...config.define,
    'process.env.CESDK_LICENSE': JSON.stringify(
      'CESDK_LICENSE' in process.env ? process.env.CESDK_LICENSE : ''
    ),
    'process.env.FAL_AI_PROXY_URL': JSON.stringify(
      'FAL_AI_PROXY_URL' in process.env ? process.env.FAL_AI_PROXY_URL : ''
    ),
    'process.env.ANTHROPIC_PROXY_URL': JSON.stringify(
      'ANTHROPIC_PROXY_URL' in process.env
        ? process.env.ANTHROPIC_PROXY_URL
        : ''
    )
  };

  return config;
};
