// Runware provider namespace
// Providers are added here via the partner-providers-runware skill

import { Flux2Dev as Flux2DevText2Image } from './Flux2Dev.text2image';
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';

const Runware = {
  Flux2Dev: {
    Text2Image: Flux2DevText2Image
    // Image2Image will be added here
  },
  Flux2Pro: {
    Text2Image: Flux2ProText2Image
    // Image2Image will be added here
  }
};

export default Runware;

// Re-export types
export type { RunwareProviderConfiguration } from './types';
