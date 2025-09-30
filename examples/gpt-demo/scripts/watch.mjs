import * as esbuild from 'esbuild';
import config from '../esbuild/config.mjs';

const context = await esbuild.context(config({ isDevelopment: true }));
await context.watch();

const { port } = await context.serve({
  servedir: '.',
  port: 5177
});

console.log(`\n🚀 GPT Demo running at: http://localhost:${port}\n`);
