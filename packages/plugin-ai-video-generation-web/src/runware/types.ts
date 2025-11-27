// Re-export client type from the HTTP client
export type { RunwareClient } from './createRunwareClient';

export interface RunwareProviderConfiguration {
  /**
   * HTTP endpoint URL for the Runware proxy. The proxy handles API key injection.
   */
  proxyUrl: string;
  debug?: boolean;
  middlewares?: any[];
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  supportedQuickActions?: {
    [quickActionId: string]: any | false | null;
  };
}

// Video aspect ratio to dimensions mapping (all divisible by 64)
export const VIDEO_ASPECT_RATIO_MAP: Record<
  string,
  { width: number; height: number }
> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '21:9': { width: 1344, height: 576 },
  '9:21': { width: 576, height: 1344 }
};

export function getVideoDimensionsFromAspectRatio(aspectRatio: string): {
  width: number;
  height: number;
} {
  return VIDEO_ASPECT_RATIO_MAP[aspectRatio] ?? { width: 1280, height: 720 };
}
