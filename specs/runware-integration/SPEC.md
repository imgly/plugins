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

---

## Parameters

See [PARAMETERS.md](./PARAMETERS.md) for a comprehensive reference of all API parameters, including:
- UI-relevant parameters suitable for graphic editor integration
- Technical/advanced parameters for power users
- Dimension handling and aspect ratio mapping

---

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
// <ModelName>TextToVideo.ts
export function <ModelName>TextToVideo(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareVideoProvider<<ModelName>TextToVideoInput>(
      {
        modelAIR: '<air-identifier>',       // e.g., 'klingai:5@3'
        name: '<Display Name>',
        schema: <ModelName>TextToVideoSchema, // Imported from .json
        inputReference: '#/components/schemas/<ModelName>TextToVideoInput',
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
// <ModelName>ImageToVideo.ts
export function <ModelName>ImageToVideo(config: RunwareProviderConfiguration) {
  return async () => {
    return createRunwareVideoProvider<<ModelName>ImageToVideoInput>(
      {
        modelAIR: '<air-identifier>',       // e.g., 'klingai:5@3'
        name: '<Display Name> Image-to-Video',
        schema: <ModelName>ImageToVideoSchema, // Imported from .json
        inputReference: '#/components/schemas/<ModelName>ImageToVideoInput',
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

---

## Available Models

See [PROVIDERS.md](./PROVIDERS.md) for a complete list of all available image and video generation models with their AIR identifiers, capabilities, and specifications.
