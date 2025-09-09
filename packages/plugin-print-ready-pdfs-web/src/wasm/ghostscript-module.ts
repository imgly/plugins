// Wrapper for the Ghostscript WASM module to ensure proper loading
import type { EmscriptenModule, GhostscriptModuleFactory } from '../types/ghostscript';

export default async function createGhostscriptModule(): Promise<EmscriptenModule> {
  // Dynamically import the gs.js module from dist
  const moduleUrl = new URL('./gs.js', import.meta.url).href;
  const GhostscriptModule = await import(/* webpackIgnore: true */ moduleUrl);
  const factory = (GhostscriptModule.default || GhostscriptModule) as GhostscriptModuleFactory;
  
  // Configure the module to load WASM from the bundled location
  const module = await factory({
    locateFile: (filename: string) => {
      if (filename === 'gs.wasm') {
        // Return relative path - the WASM will be in the same directory
        return new URL('./gs.wasm', import.meta.url).href;
      }
      return filename;
    }
  });
  
  return module;
}