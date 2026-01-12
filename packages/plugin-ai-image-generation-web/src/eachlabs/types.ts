// Re-export client type from the HTTP client
export type { EachLabsClient } from './createEachLabsClient';

// Re-export configuration type from createImageProvider
export type { EachLabsProviderConfiguration } from './createImageProvider';

// Aspect ratio to dimensions mapping (all divisible by 64)
export const ASPECT_RATIO_MAP: Record<
  string,
  { width: number; height: number }
> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1152, height: 768 },
  '2:3': { width: 768, height: 1152 },
  '21:9': { width: 1536, height: 640 },
  '9:21': { width: 640, height: 1536 },
  '2.4:1': { width: 2400, height: 1000 }
};

export function getImageDimensionsFromAspectRatio(aspectRatio: string): {
  width: number;
  height: number;
} {
  return ASPECT_RATIO_MAP[aspectRatio] ?? { width: 1024, height: 1024 };
}
