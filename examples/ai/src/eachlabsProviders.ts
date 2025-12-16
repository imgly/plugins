import EachLabsImage from '@imgly/plugin-ai-image-generation-web/eachlabs';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface EachLabsProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createEachLabsProviders(options: EachLabsProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      EachLabsImage.NanoBananaPro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      EachLabsImage.Flux2Pro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      EachLabsImage.OpenAIGptImage.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      EachLabsImage.NanoBananaPro.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      EachLabsImage.Flux2Pro.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      EachLabsImage.OpenAIGptImage.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    text2video: [],
    image2video: []
  };
}
