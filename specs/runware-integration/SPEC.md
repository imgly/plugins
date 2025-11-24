# Runware Integration

## Overview

Integration of Runware as an AI provider for IMG.LY AI plugins.

**SDK**: `@runware/sdk-js`
**Documentation**: https://runware.ai/docs/en/libraries/javascript
**GitHub**: https://github.com/Runware/sdk-js

## SDK

### Installation

```bash
pnpm add @runware/sdk-js
```

### Initialization

```typescript
import Runware from '@runware/sdk-js';

const runware = await Runware.initialize({ apiKey: 'API_KEY' });
```

### Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | `string` | required | API key |
| `url` | `string` | - | Custom WebSocket endpoint (for proxy) |
| `shouldReconnect` | `boolean` | `true` | Auto-reconnect |
| `globalMaxRetries` | `number` | `2` | Retry attempts |
| `timeoutDuration` | `number` | `60000` | Timeout per retry (ms) |

## API Reference

### Image Inference

```typescript
const images = await runware.imageInference({
  // Required
  positivePrompt: string,
  width: number,              // 256-2048, 64px increments
  height: number,             // 256-2048, 64px increments
  model: string,              // AIR format

  // Optional
  negativePrompt?: string,
  numberResults?: number,     // 1-20
  outputType?: 'URL' | 'base64Data' | 'dataURI',
  outputFormat?: 'JPG' | 'PNG' | 'WEBP',
  seed?: number,
  steps?: number,             // 25-40 typical
  CFGScale?: number,          // 3.0-8.0 typical
  scheduler?: string,

  // Image-to-Image
  seedImage?: File | string,  // UUID, data URI, base64, or URL
  strength?: number,          // 0.0-1.0
});
```

### Response

The SDK returns `IImage` (or `ITextToImage` which extends it) from `@runware/sdk-js`:

```typescript
// From @runware/sdk-js
interface IImage {
  taskUUID: string;
  imageUUID: string;
  imageURL?: string;
  imageBase64Data?: string;
  imageDataURI?: string;
}
```

## Model System (AIR)

Models use AIR (Artificial Intelligence Resource) identifiers:

```
runware:100@1          // Runware-hosted
civitai:139562@297320  // CivitAI model
```

## Implementation

### File Structure

```
packages/plugin-ai-image-generation-web/src/
└── runware/
    ├── index.ts                        # Exports all providers
    ├── createRunwareClient.ts          # SDK client wrapper
    ├── createRunwareImageProvider.ts   # Provider factory
    ├── types.ts                        # Shared types
    ├── <ModelName>TextToImage.ts       # Text-to-image provider
    ├── <ModelName>TextToImage.json     # OpenAPI schema
    ├── <ModelName>ImageToImage.ts      # Image-to-image provider
    └── <ModelName>ImageToImage.json    # OpenAPI schema
```

### Provider Configuration

```typescript
interface RunwareProviderConfiguration {
  apiKey: string;
  proxyUrl?: string;
  debug?: boolean;
  middlewares?: Middleware<any, any>[];
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  supportedQuickActions?: {
    [quickActionId: string]: QuickActionSupport | false | null;
  };
}
```

### Client Wrapper

```typescript
// createRunwareClient.ts
import Runware from '@runware/sdk-js';

export async function createRunwareClient(
  apiKey: string,
  options?: { proxyUrl?: string }
): Promise<Runware> {
  return Runware.initialize({
    apiKey,
    url: options?.proxyUrl,
  });
}
```

### Example Provider (Text-to-Image)

```typescript
// <ModelName>TextToImage.ts
export function <ModelName>TextToImage(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareImageProvider<<ModelName>TextToImageInput>(
      {
        modelAIR: '<air-identifier>',       // e.g., 'civitai:101055@128078'
        name: '<Display Name>',
        schema: <ModelName>TextToImageSchema, // Imported from .json
        inputReference: '#/components/schemas/<ModelName>TextToImageInput',
        getImageSize: (input) => ({
          width: input.width,
          height: input.height,
        }),
        mapInput: (input) => ({
          positivePrompt: input.prompt,
          negativePrompt: input.negative_prompt,
          width: input.width,
          height: input.height,
          steps: input.steps ?? 30,
          CFGScale: input.cfg_scale ?? 7,
          seed: input.seed,
        }),
      },
      config
    );
  };
}
```

### Example Provider (Image-to-Image)

```typescript
// <ModelName>ImageToImage.ts
export function <ModelName>ImageToImage(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareImageProvider<<ModelName>Img2ImgInput>(
      {
        modelAIR: '<air-identifier>',
        name: '<Display Name> Image-to-Image',
        schema: <ModelName>Img2ImgSchema,
        inputReference: '#/components/schemas/<ModelName>Img2ImgInput',
        mapInput: (input) => ({
          positivePrompt: input.prompt,
          negativePrompt: input.negative_prompt,
          seedImage: input.image_url,
          strength: input.strength ?? 0.75,
          width: input.width,
          height: input.height,
          steps: input.steps ?? 30,
          CFGScale: input.cfg_scale ?? 7,
        }),
        supportedQuickActions: {
          'ly.img.editImage': {
            mapInput: (qa) => ({
              prompt: qa.prompt,
              image_url: qa.imageUri,
              strength: 0.75,
            }),
          },
          'ly.img.createVariant': {
            mapInput: (qa) => ({
              prompt: '',
              image_url: qa.imageUri,
              strength: 0.3,
            }),
          },
        },
      },
      config
    );
  };
}
```

## Video Generation

Runware supports video generation through the `videoInference` method with support for multiple providers and workflows.

**Documentation**: https://runware.ai/docs/en/video-inference/api-reference

### Supported Workflows

- **Text-to-video**: Generate videos from text descriptions
- **Image-to-video**: Generate videos using images to guide content or constrain specific frames
- **Video-to-video**: Transform existing videos based on prompts

### Video Inference API

```typescript
const videos = await runware.videoInference({
  // Required
  positivePrompt: string,
  model: string,                    // AIR format (e.g., "klingai:5@3")

  // Dimensions
  width?: number,
  height?: number,
  duration?: number,                // Duration in seconds

  // Output
  outputType?: 'URL' | 'base64Data' | 'dataURI',
  outputFormat?: 'MP4' | 'WEBM',
  outputQuality?: number,

  // Generation
  seed?: number,

  // Image-to-video
  frameImages?: Array<{
    image: string,                  // URL, base64, or data URI
    frame?: number,                 // Frame position (optional, auto-distributed if omitted)
  }>,

  // Provider-specific settings
  providerSettings?: {
    klingai?: IKlingAIProviderSettings,
    pixverse?: IPixverseProviderSettings,
    minimax?: IMinimaxProviderSettings,
    google?: IGoogleProviderSettings,
    bytedance?: IBytedanceProviderSettings,
    vidu?: IViduProviderSettings,
  },

  // Webhook
  webhookUrl?: string,
});
```

### Video Response

```typescript
interface IVideo {
  taskUUID: string;
  videoUUID: string;
  videoURL?: string;
  videoBase64Data?: string;
  videoDataURI?: string;
  seed?: number;
}
```

### Available Video Models

Runware provides access to video models from multiple providers:

| Provider | Models | Features |
|----------|--------|----------|
| **Kling AI** | Kling 2.1 | High quality, camera control |
| **PixVerse** | v3.5, v4, v4.5 | 20+ effects, camera movements, sound effects |
| **MiniMax** | Hailuo | Prompt optimization |
| **Google** | Veo 2, Veo 3 | Veo 3 supports native audio generation |
| **ByteDance** | Seedance | Static camera option |
| **Vidu** | - | - |

### Provider-Specific Settings

#### PixVerse
```typescript
providerSettings: {
  pixverse: {
    effect?: string,              // 20+ stylized effects
    cameraMovement?: string,      // 21 cinematic camera movements (v4+)
    soundEffectSwitch?: boolean,  // Enable background sound generation
    soundEffectContent?: string,  // Description of desired audio
  }
}
```

#### KlingAI
```typescript
providerSettings: {
  klingai: {
    originalAudioVolume?: number, // 0-1, preserve original audio (for dubbing)
  }
}
```

#### MiniMax
```typescript
providerSettings: {
  minimax: {
    promptOptimizer?: boolean,    // Auto-optimize prompt for better results
  }
}
```

#### ByteDance
```typescript
providerSettings: {
  bytedance: {
    staticCamera?: boolean,       // Lock camera position
  }
}
```

### Video Provider Implementation

#### File Structure

```
packages/plugin-ai-video-generation-web/src/
└── runware/
    ├── index.ts                        # Exports all providers
    ├── createRunwareClient.ts          # Shared SDK client wrapper
    ├── createRunwareVideoProvider.ts   # Provider factory
    ├── types.ts                        # Shared types
    ├── <ModelName>TextToVideo.ts       # Text-to-video provider
    ├── <ModelName>TextToVideo.json     # OpenAPI schema
    ├── <ModelName>ImageToVideo.ts      # Image-to-video provider
    └── <ModelName>ImageToVideo.json    # OpenAPI schema
```

#### Example Provider (Text-to-Video)

```typescript
// KlingTextToVideo.ts
export function KlingTextToVideo(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareVideoProvider<KlingTextToVideoInput>(
      {
        modelAIR: 'klingai:5@3',
        name: 'Kling 2.1 Text-to-Video',
        schema: KlingTextToVideoSchema,
        inputReference: '#/components/schemas/KlingTextToVideoInput',
        mapInput: (input) => ({
          positivePrompt: input.prompt,
          width: input.width,
          height: input.height,
          duration: input.duration ?? 5,
          seed: input.seed,
        }),
      },
      config
    );
  };
}
```

#### Example Provider (Image-to-Video)

```typescript
// KlingImageToVideo.ts
export function KlingImageToVideo(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareVideoProvider<KlingImageToVideoInput>(
      {
        modelAIR: 'klingai:5@3',
        name: 'Kling 2.1 Image-to-Video',
        schema: KlingImageToVideoSchema,
        inputReference: '#/components/schemas/KlingImageToVideoInput',
        mapInput: (input) => ({
          positivePrompt: input.prompt,
          frameImages: [{ image: input.image_url }],
          width: input.width,
          height: input.height,
          duration: input.duration ?? 5,
          seed: input.seed,
        }),
        supportedQuickActions: {
          'ly.img.animateImage': {
            mapInput: (qa) => ({
              prompt: qa.prompt ?? '',
              image_url: qa.imageUri,
              duration: 5,
            }),
          },
        },
      },
      config
    );
  };
}
```

## Quick Action Support

### Image Quick Actions

| Quick Action | Text-to-Image | Image-to-Image |
|--------------|---------------|----------------|
| `editImage` | - | ✓ |
| `createVariant` | - | ✓ |
| `styleTransfer` | - | ✓ |
| `remixPage` | ✓ | ✓ |

### Video Quick Actions

| Quick Action | Text-to-Video | Image-to-Video |
|--------------|---------------|----------------|
| `animateImage` | - | ✓ |
| `remixPage` | ✓ | ✓ |

## Implementation Checklist

### Image Generation
- [ ] Add `@runware/sdk-js` dependency
- [ ] Create `runware/createRunwareClient.ts`
- [ ] Create `runware/createRunwareImageProvider.ts`
- [ ] Create `runware/types.ts`
- [ ] Implement SDXL text-to-image provider
- [ ] Implement SDXL image-to-image provider
- [ ] Add image quick action support
- [ ] Export providers from index.ts
- [ ] Write tests

### Video Generation
- [ ] Create `runware/createRunwareVideoProvider.ts`
- [ ] Implement Kling text-to-video provider
- [ ] Implement Kling image-to-video provider
- [ ] Add video quick action support
- [ ] Export video providers from index.ts
- [ ] Write tests
