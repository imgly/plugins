// Wrapper for the Ghostscript WASM module to ensure proper loading
import type {
  EmscriptenModule,
  GhostscriptModuleFactory,
} from '../types/ghostscript';

export interface GhostscriptModuleOptions {
  /**
   * Whether to suppress Ghostscript's stdout/stderr output.
   * Default: true (silent mode)
   */
  silent?: boolean;

  /**
   * Base URL path where plugin assets (gs.js, gs.wasm) are served from.
   * Required for bundled environments (Webpack 5, Angular).
   * For Vite and native ESM, this is optional.
   */
  assetPath?: string;
}

/**
 * Normalizes an asset path to ensure it has a trailing slash and is a valid URL.
 * Converts relative paths (e.g., '/assets/wasm/') to absolute URLs using the current origin.
 */
function normalizeAssetPath(path: string): string {
  const normalizedPath = path.endsWith('/') ? path : path + '/';

  // If it's already an absolute URL, return as-is
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  // Convert relative path to absolute URL using document.location.origin
  const origin =
    typeof document !== 'undefined' ? document.location?.origin || '' : '';

  return origin + normalizedPath;
}

/**
 * Resolves the base URL for loading assets in browser environments.
 * Throws a helpful error if assetPath is required but not provided.
 */
function resolveBrowserAssetPath(assetPath: string | undefined): string {
  // 1. Explicit assetPath always wins
  if (assetPath) {
    return normalizeAssetPath(assetPath);
  }

  // 2. Try import.meta.url (works in Vite, native ESM)
  const baseUrl = import.meta.url;

  if (!baseUrl.startsWith('file://')) {
    // Valid browser URL - use it directly
    return new URL('./', baseUrl).href;
  }

  // 3. Bundled environment (Webpack 5 transforms to file://)
  //    assetPath is required - throw helpful error
  throw new Error(
    `Could not locate plugin assets (gs.js, gs.wasm). The assetPath option is required.\n\n` +
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
      `See: https://img.ly/docs/cesdk/print-ready-pdfs/bundler-setup`
  );
}

export default async function createGhostscriptModule(
  options: GhostscriptModuleOptions = {}
): Promise<EmscriptenModule> {
  const { silent = true, assetPath } = options;

  // Check if we're in a browser environment
  // This is more reliable than checking for Node.js because bundlers like Webpack
  // may polyfill `process` and `process.versions.node` in browser builds
  const isBrowser =
    typeof window !== 'undefined' || typeof document !== 'undefined';

  // Check if we're in Node.js - only trust this if we're NOT in a browser
  // Webpack 5 and other bundlers may polyfill process.versions.node
  const isNode =
    !isBrowser &&
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;

  let GhostscriptModule: any;
  let wasmPath: string;

  if (isNode) {
    // Node.js: Use require.resolve to find gs.js relative to this module
    // Use indirect dynamic import to prevent Webpack 5 from statically analyzing these imports
    // But use direct imports in test environments (vitest) where indirect imports bypass mocking
    // See: https://github.com/imgly/ubq/issues/11471
    const isTestEnv =
      typeof process !== 'undefined' &&
      (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test');

    // Helper for dynamic imports - uses indirect import in production to avoid Webpack static analysis
    // Note: new Function() could fail in CSP-restricted environments, but CSP is a browser
    // security mechanism and doesn't apply to Node.js. This code only runs in Node.js (isNode check above).
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const indirectImport = new Function('s', 'return import(s)') as (
      s: string
    ) => Promise<any>;
    const dynamicImport = isTestEnv ? (s: string) => import(s) : indirectImport;

    const moduleLib = await dynamicImport('module');
    const pathLib = await dynamicImport('path');
    const createRequire = moduleLib.createRequire;
    const dirname = pathLib.dirname;
    const join = pathLib.join;

    const requireForESM = createRequire(import.meta.url);

    // Resolve gs.js directly (it's copied to dist/ alongside the bundle)
    const gsPath = requireForESM.resolve('./gs.js');
    const moduleDir = dirname(gsPath);
    wasmPath = join(moduleDir, 'gs.wasm');

    GhostscriptModule = await dynamicImport(gsPath);
  } else {
    // Browser: Resolve asset path with explicit option or import.meta.url
    const baseUrl = resolveBrowserAssetPath(assetPath);

    const moduleUrl = new URL('gs.js', baseUrl).href;
    wasmPath = new URL('gs.wasm', baseUrl).href;

    // Use indirect import to prevent Webpack from transforming this dynamic import
    // The /* webpackIgnore: true */ comment is stripped by esbuild during bundling,
    // so we need to use new Function() to create an import that Webpack can't analyze
    // Note: This may fail in CSP-restricted environments that block eval/new Function
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const indirectImport = new Function('s', 'return import(s)') as (
      s: string
    ) => Promise<any>;
    GhostscriptModule = await indirectImport(moduleUrl);
  }

  const factory = (GhostscriptModule.default ||
    GhostscriptModule) as GhostscriptModuleFactory;

  // Configure the module to load WASM from the bundled location
  const moduleConfig: Record<string, unknown> = {
    locateFile: (filename: string) => {
      if (filename === 'gs.wasm') {
        return wasmPath;
      }
      return filename;
    },
  };

  // Suppress Ghostscript stdout/stderr output in silent mode
  if (silent) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    moduleConfig.print = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    moduleConfig.printErr = () => {};
  }

  const module = await factory(moduleConfig);

  return module;
}
