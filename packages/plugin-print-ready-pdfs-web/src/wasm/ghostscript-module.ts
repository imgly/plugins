// Wrapper for the Ghostscript WASM module to ensure proper loading
import type {
  EmscriptenModule,
  GhostscriptModuleFactory,
} from '../types/ghostscript';
import type { AssetLoader } from '../types/asset-loader';

export interface GhostscriptModuleOptions {
  /**
   * Whether to suppress Ghostscript's stdout/stderr output.
   * Default: true (silent mode)
   */
  silent?: boolean;

  /**
   * Asset loader for loading gs.js and gs.wasm.
   * Required - use BrowserAssetLoader or NodeAssetLoader.
   */
  assetLoader: AssetLoader;
}

export default async function createGhostscriptModule(
  options: GhostscriptModuleOptions
): Promise<EmscriptenModule> {
  const { silent = true, assetLoader } = options;

  // Load the Ghostscript module using the provided loader
  const factory = await assetLoader.loadGhostscriptModule();
  const wasmPath = assetLoader.getWasmPath();

  // Configure the module to load WASM from the specified location
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
