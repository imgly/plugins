import * as esbuild from 'esbuild';
import config from '../esbuild/config.mjs';

const context = await esbuild.context(config({ isDevelopment: true }));
await context.watch();
