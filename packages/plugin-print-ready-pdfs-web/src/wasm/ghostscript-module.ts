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
}

export default async function createGhostscriptModule(
  options: GhostscriptModuleOptions = {}
): Promise<EmscriptenModule> {
  const { silent = true } = options;

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
    // Browser: Use URL-based imports
    // Note: Webpack and other bundlers may transform import.meta.url to a file:// URL at build time
    // which won't work in browsers. We need to detect this and use alternative loading strategies.
    let baseUrl = import.meta.url;

    // Check if the bundler transformed import.meta.url to a file:// URL
    // This happens with Webpack 5 when bundling for browser targets
    if (baseUrl.startsWith('file://')) {
      // In bundled browser environments, we need to find the assets relative to the current page
      // or from a known CDN/asset path. Try multiple strategies:
      const origin =
        typeof document !== 'undefined' ? document.location?.origin || '' : '';

      // Try common asset paths used by bundlers/frameworks
      // The assets (gs.js, gs.wasm) should be copied to one of these locations
      const commonAssetPaths = [
        '/assets/wasm/', // Angular default asset path
        '/assets/', // Common asset directory
        '/', // Root (when assets are at the root)
      ];

      // Try to find gs.js at each path
      let foundPath: string | null = null;
      for (const assetPath of commonAssetPaths) {
        const testUrl = origin + assetPath + 'gs.js';
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (response.ok) {
            foundPath = origin + assetPath;
            break;
          }
        } catch {
          // Continue to next path
        }
      }

      if (foundPath) {
        baseUrl = foundPath;
      } else {
        // Last resort: use the current page's directory
        const pathname =
          typeof document !== 'undefined'
            ? document.location?.pathname || ''
            : '';
        const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        baseUrl = origin + baseDir;
      }
    }

    const moduleUrl = new URL('./gs.js', baseUrl).href;
    wasmPath = new URL('./gs.wasm', baseUrl).href;

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
