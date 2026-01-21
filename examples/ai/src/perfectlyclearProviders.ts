import { PerfectlyClearProvider } from '@imgly/plugin-ai-image-generation-web';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface PerfectlyClearProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  apiKey: string;
  cdnUrl: string;
}

export function createPerfectlyClearProviders(
  options: PerfectlyClearProviderOptions
) {
  const { apiKey, cdnUrl } = options;
  // Note: PerfectlyClear doesn't use rate limiting middlewares as it runs locally

  return {
    text2image: [],
    image2image: [
      PerfectlyClearProvider({
        apiKey,
        cdnUrl,
        cacheCertificate: true,
        numWorkers: 4
      })
    ],
    text2video: [],
    image2video: []
  };
}
