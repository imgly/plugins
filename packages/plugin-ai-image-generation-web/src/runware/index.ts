// Runware provider namespace
// Providers are added here via the partner-providers-runware skill

import { Flux2Dev as Flux2DevText2Image } from './Flux2Dev.text2image';
import { Flux2DevImage2Image } from './Flux2Dev.image2image';
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';
import { Flux2ProImage2Image } from './Flux2Pro.image2image';

const Runware = {
  Flux2Dev: {
    Text2Image: Flux2DevText2Image,
    Image2Image: Flux2DevImage2Image
  },
  Flux2Pro: {
    Text2Image: Flux2ProText2Image,
    Image2Image: Flux2ProImage2Image
  }
};

export default Runware;

// Re-export types
export type { RunwareProviderConfiguration } from './types';
