import dtsPlugin from './plugin-dts.mjs';
import reporterPlugin from './plugin-reporter.mjs';

export default ({ isDevelopment, pluginVersion, pluginName, external }) => {
  const config = {
    entryPoints: ['src/index.ts'],
    define: {
      PLUGIN_VERSION: `"${pluginVersion}"`,
      PLUGIN_NAME: `"${pluginName}"`
    },
    minify: !isDevelopment,
    bundle: true,
    sourcemap: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/index.mjs',
    external,
    plugins: [dtsPlugin, reporterPlugin].filter(Boolean)
  };
  return config;
};
