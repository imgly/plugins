// Runware provider namespace
// Providers are added here via the partner-providers-runware skill

import { Flux2Dev as Flux2DevText2Image } from './Flux2Dev.text2image';
import { Flux2DevImage2Image } from './Flux2Dev.image2image';
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';
import { Flux2ProImage2Image } from './Flux2Pro.image2image';
import { Flux2Flex as Flux2FlexText2Image } from './Flux2Flex.text2image';
import { Flux2FlexImage2Image } from './Flux2Flex.image2image';
import { Seedream4 as Seedream4Text2Image } from './Seedream4.text2image';
import { Seedream4Image2Image } from './Seedream4.image2image';
import { NanoBanana2Pro as NanoBanana2ProText2Image } from './NanoBanana2Pro.text2image';
import { NanoBanana2ProImage2Image } from './NanoBanana2Pro.image2image';

const Runware = {
  Flux2Dev: {
    Text2Image: Flux2DevText2Image,
    Image2Image: Flux2DevImage2Image
  },
  Flux2Pro: {
    Text2Image: Flux2ProText2Image,
    Image2Image: Flux2ProImage2Image
  },
  Flux2Flex: {
    Text2Image: Flux2FlexText2Image,
    Image2Image: Flux2FlexImage2Image
  },
  Seedream4: {
    Text2Image: Seedream4Text2Image,
    Image2Image: Seedream4Image2Image
  },
  NanoBanana2Pro: {
    Text2Image: NanoBanana2ProText2Image,
    Image2Image: NanoBanana2ProImage2Image
  }
};

export default Runware;

// Re-export types
export type { RunwareProviderConfiguration } from './types';
