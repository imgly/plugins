// EachLabs provider namespace
// Providers will be added here when EachLabs models are implemented
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface EachLabsProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createEachLabsProviders(_options: EachLabsProviderOptions) {
  return {
    text2image: [],
    image2image: [],
    text2video: [],
    image2video: []
  };
}
