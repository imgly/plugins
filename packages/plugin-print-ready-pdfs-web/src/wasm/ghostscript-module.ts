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
  // Check if we're in Node.js
  const isNode =
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
    const moduleUrl = new URL('./gs.js', import.meta.url).href;
    GhostscriptModule = await import(/* webpackIgnore: true */ moduleUrl);
    wasmPath = new URL('./gs.wasm', import.meta.url).href;
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
