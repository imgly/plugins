/**
 * Asset path utilities for resolving plugin assets in different environments.
 * Handles the Webpack 5 / Angular CLI issue where import.meta.url is transformed
 * to a file:// URL that doesn't work in browsers.
 */

/**
 * Normalizes an asset path to ensure it has a trailing slash and is a valid URL.
 * Converts relative paths (e.g., '/assets/wasm/') to absolute URLs using the current origin.
 */
export function normalizeAssetPath(path: string): string {
  const normalizedPath = path.endsWith('/') ? path : path + '/';

  // If it's already an absolute URL, return as-is
  if (
    normalizedPath.startsWith('http://') ||
    normalizedPath.startsWith('https://')
  ) {
    return normalizedPath;
  }

  // Convert relative path to absolute URL using document.location.origin
  const origin =
    typeof document !== 'undefined' ? document.location?.origin || '' : '';

  return origin + normalizedPath;
}

/**
 * Resolves the base URL for loading plugin assets in browser environments.
 * Throws a helpful error if assetPath is required but not provided.
 *
 * @param assetPath - Explicit asset path provided by the user
 * @param currentModuleUrl - The import.meta.url of the calling module
 */
export function resolveAssetBasePath(
  assetPath: string | undefined,
  currentModuleUrl: string
): string {
  // 1. Explicit assetPath always wins
  if (assetPath) {
    return normalizeAssetPath(assetPath);
  }

  // 2. Try import.meta.url (works in Vite, native ESM)
  if (!currentModuleUrl.startsWith('file://')) {
    // Valid browser URL - use it directly
    return new URL('./', currentModuleUrl).href;
  }

  // 3. Bundled environment (Webpack 5 transforms to file://)
  //    assetPath is required - throw helpful error
  throw new Error(
    `Could not locate plugin assets. The assetPath option is required.\n\n` +
      `This typically happens when using a bundler (like Webpack 5 or Angular CLI) ` +
      `that transforms import.meta.url to a file:// URL.\n\n` +
      `To fix this, copy the plugin assets to your public folder and provide the assetPath option:\n\n` +
      `Option A: Configure your bundler to copy assets automatically\n\n` +
      `  Angular CLI - add to angular.json "assets" array:\n` +
      `    { "glob": "{gs.js,gs.wasm,*.icc}", "input": "node_modules/@imgly/plugin-print-ready-pdfs-web/dist", "output": "/assets/" }\n\n` +
      `  Webpack - use copy-webpack-plugin:\n` +
      `    new CopyPlugin({ patterns: [{ from: "node_modules/@imgly/plugin-print-ready-pdfs-web/dist/*.{js,wasm,icc}", to: "assets/[name][ext]" }] })\n\n` +
      `Option B: Copy manually\n\n` +
      `  cp node_modules/@imgly/plugin-print-ready-pdfs-web/dist/{gs.js,gs.wasm,*.icc} public/assets/\n\n` +
      `Then pass the assetPath option:\n\n` +
      `  convertToPDFX3(blob, {\n` +
      `    outputProfile: 'fogra39',\n` +
      `    assetPath: '/assets/'  // adjust to match your output path\n` +
      `  });\n\n` +
      `See: https://github.com/imgly/plugins/tree/main/packages/plugin-print-ready-pdfs-web#bundler-setup-webpack-5--angular`
  );
}
