import chalk from 'chalk';
import { readFile } from 'fs/promises';

import baseConfig from '../../../esbuild/config.mjs';
import log from '../../../esbuild/log.mjs';

// import packageJson from '../package.json' assert { type: 'json' };
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
    external: ['@cesdk/cesdk-js', 'lodash'],

    pluginVersion: packageJson.version,
    pluginName: packageJson.name
  });
};
