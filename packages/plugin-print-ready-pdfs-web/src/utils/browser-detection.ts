export class BrowserDetection {
  private get isNode(): boolean {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    );
  }

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

  supportsWorkers(): boolean {
    if (this.isNode) {
      // Node.js has worker_threads but they work differently
      return false;
    }
    try {
      return typeof Worker !== 'undefined';
    } catch {
      return false;
    }
  }

  supportsSharedArrayBuffer(): boolean {
    try {
      return typeof SharedArrayBuffer !== 'undefined';
    } catch {
      return false;
    }
  }

  getEstimatedMemoryLimit(): number {
    // Node.js environment
    if (this.isNode) {
      try {
        // Use dynamic import to avoid bundling 'os' module for browser builds
        const os = require('os');
        // Return free memory, capped at 4GB for safety
        return Math.min(os.freemem(), 4 * 1024 * 1024 * 1024);
      } catch {
        // Fallback if 'os' module not available
        return 2 * 1024 * 1024 * 1024; // 2GB default for Node.js
      }
    }

    // Browser environment
    // Try to get memory info from performance API
    if (typeof performance !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory && memory.jsHeapSizeLimit) {
        return memory.jsHeapSizeLimit;
      }
    }

    // Fallback estimates based on browser/platform
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();

      if (userAgent.includes('mobile')) {
        return 512 * 1024 * 1024; // 512MB for mobile
      }

      if (userAgent.includes('chrome')) {
        return 4 * 1024 * 1024 * 1024; // 4GB for Chrome desktop
      }

      if (userAgent.includes('firefox')) {
        return 2 * 1024 * 1024 * 1024; // 2GB for Firefox
      }

      if (userAgent.includes('safari')) {
        return 1 * 1024 * 1024 * 1024; // 1GB for Safari
      }
    }

    return 1 * 1024 * 1024 * 1024; // 1GB default
  }

  getBrowserInfo(): {
    name: string;
    version: string;
    platform: string;
  } {
    // Node.js environment
    if (this.isNode) {
      return {
        name: 'Node.js',
        version: process.version,
        platform: process.platform,
      };
    }

    // Browser environment
    if (typeof navigator === 'undefined') {
      return {
        name: 'Unknown',
        version: 'Unknown',
        platform: 'Unknown',
      };
    }

    const userAgent = navigator.userAgent;

    let name = 'Unknown';
    let version = 'Unknown';

    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edge\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    return {
      name,
      version,
      platform: navigator.platform,
    };
  }

  isFeatureSupported(feature: string): boolean {
    switch (feature) {
      case 'wasm':
        return this.supportsWebAssembly();
      case 'workers':
        return this.supportsWorkers();
      case 'sharedArrayBuffer':
        return this.supportsSharedArrayBuffer();
      default:
        return false;
    }
  }
}
