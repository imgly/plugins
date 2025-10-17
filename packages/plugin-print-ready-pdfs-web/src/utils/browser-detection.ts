export class BrowserDetection {
  supportsWebAssembly(): boolean {
    try {
      return (
        typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function'
      );
    } catch {
      return false;
    }
  }
}
