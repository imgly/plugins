// Re-export client type from the HTTP client
export type { RunwareClient } from './createRunwareClient';

// Re-export configuration type from createImageProvider
export type { RunwareProviderConfiguration } from './createImageProvider';

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
  '9:21': { width: 640, height: 1536 }
};

// Image size presets for Seedream-style naming
export const IMAGE_SIZE_MAP: Record<string, { width: number; height: number }> =
  {
    square: { width: 1024, height: 1024 },
    square_hd: { width: 2048, height: 2048 },
    portrait_4_3: { width: 896, height: 1152 },
    portrait_3_2: { width: 768, height: 1152 },
    portrait_16_9: { width: 768, height: 1344 },
    landscape_4_3: { width: 1152, height: 896 },
    landscape_3_2: { width: 1152, height: 768 },
    landscape_16_9: { width: 1344, height: 768 },
    landscape_21_9: { width: 1536, height: 640 }
  };

export function getImageDimensionsFromAspectRatio(aspectRatio: string): {
  width: number;
  height: number;
} {
  return ASPECT_RATIO_MAP[aspectRatio] ?? { width: 1024, height: 1024 };
}

export function getImageDimensionsFromSize(imageSize: string): {
  width: number;
  height: number;
} {
  return IMAGE_SIZE_MAP[imageSize] ?? { width: 1024, height: 1024 };
}
