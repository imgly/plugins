import chalk from 'chalk';
import { readFile } from 'fs/promises';

// import packageJson from '../package.json' assert { type: 'json' };
// Avoid the Experimental Feature warning when using the above.
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

console.log(
  chalk.yellow('Building version: '),
  chalk.green(packageJson.version)
);

const configs = [
  {
    entryPoints: ['src/index.ts'],
    define: {
      PLUGIN_VERSION: `"${packageJson.version}"`
    },
    minify: true,
    bundle: true,
    sourcemap: true,
    external: ['@imgly/background-removal', '@cesdk/cesdk-js', 'lodash'],
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/index.mjs',
    plugins: [
      {
        name: 'reporter',
        setup(build) {
          build.onEnd((result) => {
            console.log(
              `[${new Date().toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}] Build ${
                result.errors.length
                  ? chalk.red('failed')
                  : chalk.green('succeeded')
              }`
            );
          });
        }
      }
    ]
  }
];

export default configs;
