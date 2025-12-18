// EachLabs video provider namespace

import { KlingV26ProTextToVideo } from './KlingV26Pro.text2video';
import { KlingV26ProImageToVideo } from './KlingV26Pro.image2video';
import { Veo31TextToVideo } from './Veo31.text2video';
import { Veo31ImageToVideo } from './Veo31.image2video';

const EachLabs = {
  KlingV26ProTextToVideo,
  KlingV26ProImageToVideo,
  Veo31TextToVideo,
  Veo31ImageToVideo
};

export default EachLabs;

// Re-export types
export type { EachLabsProviderConfiguration } from './types';

// Re-export individual providers for direct imports
export { KlingV26ProTextToVideo } from './KlingV26Pro.text2video';
export { KlingV26ProImageToVideo } from './KlingV26Pro.image2video';
export { Veo31TextToVideo } from './Veo31.text2video';
export { Veo31ImageToVideo } from './Veo31.image2video';
