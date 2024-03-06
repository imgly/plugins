import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { pathToFileURL } from 'node:url';
import {glob} from 'glob';

const workingUrl = pathToFileURL(process.cwd() + '/')

const pkgUrl = new URL('./package.json', workingUrl)

const packageJson = JSON.parse(
  await readFile(pkgUrl)
)

const dependencies = Object.keys(packageJson.dependencies)
const peerDependencies = Object.keys(packageJson.peerDependencies)
const externals = [...dependencies, ...peerDependencies]

console.log(
  chalk.yellow('Building version: '),
  chalk.green(packageJson.version)
);

const entryPoints = glob.sync(['src/index.[tj]s','src/worker.[tj]s', 'src/lib/*.[tj]s',])




const configs = [
  {
    entryPoints: entryPoints,
    define: {
      PLUGIN_VERSION: `"${packageJson.version}"`,
      PLUGIN_NAME: `"${packageJson.name}"`
    },
    minify: true,
    bundle: true,
    sourcemap: true,
    external: externals,
    platform: 'neutral',
    format: 'esm',
    outdir: 'dist',
    outExtension: { '.js': '.mjs' },
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
              })}] Build ${result.errors.length
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
