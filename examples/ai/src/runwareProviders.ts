// import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';
// import RunwareVideo from '@imgly/plugin-ai-video-generation-web/runware';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface RunwareProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createRunwareProviders(options: RunwareProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      // Runware text-to-image providers will be added here
    ],
    image2image: [
      // Runware image-to-image providers will be added here
    ],
    text2video: [
      // Runware text-to-video providers will be added here
    ],
    image2video: [
      // Runware image-to-video providers will be added here
    ]
  };
}
