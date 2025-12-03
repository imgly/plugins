// Runware provider namespace
// Providers are added here via the partner-providers-runware skill

import { Veo31Text2Video } from './Veo31.text2video';
import { Veo31Image2Video } from './Veo31.image2video';
import { Veo31FastText2Video } from './Veo31Fast.text2video';
import { Veo31FastImage2Video } from './Veo31Fast.image2video';

const Runware = {
  Veo31: {
    Text2Video: Veo31Text2Video,
    Image2Video: Veo31Image2Video
  },
  Veo31Fast: {
    Text2Video: Veo31FastText2Video,
    Image2Video: Veo31FastImage2Video
  }
};

export default Runware;

// Re-export types
export type { RunwareProviderConfiguration } from './types';
