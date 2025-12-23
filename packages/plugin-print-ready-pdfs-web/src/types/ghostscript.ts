/**
 * Type definitions for the Ghostscript WASM module.
 * Based on Emscripten module types with Ghostscript-specific extensions.
 */

/**
 * Emscripten filesystem interface for file operations.
 */
export interface EmscriptenFS {
  mkdir(path: string): void;
  writeFile(path: string, data: string | Uint8Array): void;
  readFile(path: string): Uint8Array;
  stat(path: string): { size: number };
  unlink(path: string): void;
}

/**
 * Ghostscript WASM module interface.
 * Extends Emscripten module with Ghostscript-specific methods.
 */
export interface EmscriptenModule {
  /** Emscripten virtual filesystem */
  FS: EmscriptenFS;

  /** Call the main() function with arguments */
  callMain(args: string[]): Promise<number>;

  /** Optional version string */
  version?: string;

  /** Print function for stdout */
  print?: (text: string) => void;

  /** Print function for stderr */
  printErr?: (text: string) => void;

  /** Custom locateFile function for WASM loading */
  locateFile?: (filename: string) => string;
}

/**
 * Factory function returned by the Ghostscript JavaScript module.
 * Creates an initialized EmscriptenModule instance.
 */
export type GhostscriptModuleFactory = (
  config?: Record<string, unknown>
) => Promise<EmscriptenModule>;
