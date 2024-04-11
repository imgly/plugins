import chalk from 'chalk';
import * as esbuild from 'esbuild';

import configs from '../esbuild/config.mjs';

console.log(
  `[${new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })}] ${chalk.green('Watching...')}`
);

const contexts = await Promise.all(
  configs.map((config) => esbuild.context(config))
);

await Promise.any(contexts.map((ctx) => ctx.watch()));
