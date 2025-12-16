// EachLabs provider namespace
// Providers are added here via the partner-providers-eachlabs skill

import { NanoBananaPro as NanoBananaProText2Image } from './NanoBananaPro.text2image';
import { NanoBananaProImage2Image } from './NanoBananaPro.image2image';
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';
import { Flux2ProImage2Image } from './Flux2Pro.image2image';
import { OpenAIImageText2Image } from './OpenAIImage.text2image';
import { OpenAIImageImage2Image } from './OpenAIImage.image2image';

const EachLabs = {
  NanoBananaPro: {
    Text2Image: NanoBananaProText2Image,
    Image2Image: NanoBananaProImage2Image
  },
  Flux2Pro: {
    Text2Image: Flux2ProText2Image,
    Image2Image: Flux2ProImage2Image
  },
  OpenAIGptImage: {
    Text2Image: OpenAIImageText2Image,
    Image2Image: OpenAIImageImage2Image
  }
};

export default EachLabs;

// Re-export types
export type { EachLabsProviderConfiguration } from './types';
