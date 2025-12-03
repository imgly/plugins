import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';
import RunwareVideo from '@imgly/plugin-ai-video-generation-web/runware';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface RunwareProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createRunwareProviders(options: RunwareProviderOptions) {
  const {
    imageRateLimitMiddleware,
    videoRateLimitMiddleware,
    errorMiddleware,
    proxyUrl
  } = options;

  return {
    text2image: [
      RunwareImage.Flux2Dev.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Flux2Pro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Flux2Flex.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Seedream4.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.NanoBanana2Pro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      RunwareImage.Flux2Dev.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Flux2Pro.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Flux2Flex.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.Seedream4.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareImage.NanoBanana2Pro.Image2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    text2video: [
      RunwareVideo.Veo31.Text2Video({
        middlewares: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareVideo.Veo31Fast.Text2Video({
        middlewares: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2video: [
      RunwareVideo.Veo31.Image2Video({
        middlewares: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      RunwareVideo.Veo31Fast.Image2Video({
        middlewares: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ]
  };
}
