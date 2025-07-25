import chalk from 'chalk';
import { readFile } from 'fs/promises';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

// Avoid the Experimental Feature warning when using the above.
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

export default ({ isDevelopment }) => {
  log(
    `${chalk.yellow('Building version:')} ${chalk.bold(packageJson.version)}`
  );

  return baseConfig({
    isDevelopment,
    external: ['@cesdk/cesdk-js'],
    pluginVersion: packageJson.version
  });
};