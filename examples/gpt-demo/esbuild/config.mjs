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

dotenv.config();

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
      isDevelopment && 'CESDK_LICENSE' in process.env
        ? process.env.CESDK_LICENSE
        : ''
    )
  };

  return config;
};
