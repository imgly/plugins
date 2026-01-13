/**
 * Custom Webpack 5 configuration for Angular
 *
 * This tests the runtime compatibility of @imgly/plugin-print-ready-pdfs-web
 * with Angular + Webpack 5 bundling.
 *
 * Issue context: Customer reports runtime error:
 * "Cannot find module 'file:///.../node_modules/@imgly/plugin-print-ready-pdfs-web/dist/gs.js'"
 */
module.exports = {
  // Log webpack version to verify we're using Webpack 5
  stats: {
    version: true
  },
  resolve: {
    fallback: {
      // Node.js modules that shouldn't be bundled for browser
      "path": false,
      "fs": false,
      "module": false,
      "url": false,
      "os": false
    }
  },
  module: {
    rules: [
      {
        // Handle .wasm files as assets
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/wasm/[name][ext]'
        }
      }
    ]
  },
  // Don't bundle these as they're browser-incompatible
  externals: {
    'module': 'commonjs module',
    'path': 'commonjs path',
    'fs': 'commonjs fs'
  }
};
