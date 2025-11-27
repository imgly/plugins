import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface OpenAiProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createOpenAiProviders(options: OpenAiProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      OpenAiImage.GptImage1.Text2Image({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      OpenAiImage.GptImage1.Image2Image({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    text2video: [],
    image2video: []
  };
}
