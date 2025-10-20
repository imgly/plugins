import * as esbuild from 'esbuild';
import config from '../esbuild/config.mjs';

const ctx = await esbuild.context(config({ isDevelopment: true }));
await ctx.watch();