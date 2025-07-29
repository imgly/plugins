export class BrowserDetection {
  supportsWebAssembly(): boolean {
    try {
      return typeof WebAssembly === 'object' && 
             typeof WebAssembly.instantiate === 'function';
    } catch {
      return false;
    }
  }

  supportsWorkers(): boolean {
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
    // Try to get memory info from performance API
    const memory = (performance as any).memory;
    if (memory && memory.jsHeapSizeLimit) {
      return memory.jsHeapSizeLimit;
    }

    // Fallback estimates based on browser/platform
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
    
    return 1 * 1024 * 1024 * 1024; // 1GB default
  }

  getBrowserInfo(): {
    name: string;
    version: string;
    platform: string;
  } {
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
      platform: navigator.platform
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