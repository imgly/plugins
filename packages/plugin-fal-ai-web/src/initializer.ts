import { fal } from '@fal-ai/client';
import { PluginConfiguration } from './types';

class Initializer {
  private initialized = false;

  constructor(config: PluginConfiguration) {
    if (config.proxyUrl != null) {
      fal.config({ proxyUrl: config.proxyUrl });
      this.initialized = true;
    }
  }

  public isInitialized() {
    return this.initialized;
  }

  public initialize({
    credentials,
    proxyUrl
  }: {
    credentials?: string;
    proxyUrl?: string;
  }) {
    if (this.initialized) return;
    if (proxyUrl != null) {
      fal.config({ proxyUrl });
      this.initialized = true;
    } else if (credentials != null) {
      fal.config({ credentials });
      this.initialized = true;
    }
  }
}

export default Initializer;
