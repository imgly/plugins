import * as esbuild from 'esbuild';
import config from '../esbuild/config.mjs';

await esbuild.build(config({ isDevelopment: false }));
