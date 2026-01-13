/**
 * Browser stub for NodeAssetLoader.
 * This file is only used by the browser bundle and should never be called at runtime.
 * If it is called, it means the user didn't provide assetPath or assetLoader option.
 */

// This error will never actually be thrown because the browser entry point
// throws before reaching the NodeAssetLoader import. But Webpack needs to
// be able to resolve this import, so we provide a stub.
export class NodeAssetLoader {
  constructor() {
    throw new Error(
      'NodeAssetLoader cannot be used in browser environments. ' +
        'Please provide the `assetPath` or `assetLoader` option to convertToPDFX3().'
    );
  }

  async loadGhostscriptModule(): Promise<never> {
    throw new Error('Not available in browser');
  }

  getWasmPath(): string {
    throw new Error('Not available in browser');
  }

  async loadICCProfile(): Promise<never> {
    throw new Error('Not available in browser');
  }
}
