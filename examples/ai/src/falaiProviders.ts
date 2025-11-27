import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import { Middleware } from '@imgly/plugin-ai-generation-web';

export interface FalAiProviderOptions {
  imageRateLimitMiddleware: Middleware<any, any>;
  videoRateLimitMiddleware: Middleware<any, any>;
  errorMiddleware: Middleware<any, any>;
  proxyUrl: string;
}

export function createFalAiProviders(options: FalAiProviderOptions) {
  const {
    imageRateLimitMiddleware,
    videoRateLimitMiddleware,
    errorMiddleware,
    proxyUrl
  } = options;

  return {
    text2image: [
      FalAiImage.RecraftV3({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.Recraft20b({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.GeminiFlash25({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.NanoBanana({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.NanoBananaPro({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.IdeogramV3({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.SeedreamV4({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      FalAiImage.Gemini25FlashImageEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.GeminiFlashEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.NanoBananaEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.NanoBananaProEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.FluxProKontextEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.FluxProKontextMaxEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.QwenImageEdit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.IdeogramV3Remix({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiImage.SeedreamV4Edit({
        middleware: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    text2video: [
      FalAiVideo.MinimaxVideo01Live({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo3TextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31TextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31FastTextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.KlingVideoV21MasterTextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.PixverseV35TextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.ByteDanceSeedanceV1ProTextToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2video: [
      FalAiVideo.MinimaxVideo01LiveImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.KlingVideoV21MasterImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.MinimaxHailuo02StandardImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.ByteDanceSeedanceV1ProImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31ImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31FastImageToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31FirstLastFrameToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      }),
      FalAiVideo.Veo31FastFirstLastFrameToVideo({
        middleware: [videoRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ]
  };
}
