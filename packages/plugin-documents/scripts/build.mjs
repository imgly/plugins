import * as esbuild from 'esbuild';

import configs from '../esbuild/config.mjs';

await Promise.all(configs.map(async (config) => await esbuild.build(config)));
