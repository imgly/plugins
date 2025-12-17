// EachLabs video provider namespace

import { KlingV26ProTextToVideo } from './KlingV26Pro.text2video';
import { KlingV26ProImageToVideo } from './KlingV26Pro.image2video';

const EachLabs = {
  KlingV26ProTextToVideo,
  KlingV26ProImageToVideo
};

export default EachLabs;

// Re-export types
export type { EachLabsProviderConfiguration } from './types';

// Re-export individual providers for direct imports
export { KlingV26ProTextToVideo } from './KlingV26Pro.text2video';
export { KlingV26ProImageToVideo } from './KlingV26Pro.image2video';
