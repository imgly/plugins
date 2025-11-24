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

## Parameter Classification

### Group 1: UI-Relevant Parameters (Consumer-Friendly)

These parameters are suitable for a graphic editor UI and align with existing provider patterns:

| Parameter | Type | Required | Default | Description | UI Component |
|-----------|------|----------|---------|-------------|--------------|
| `positivePrompt` | `string` | Yes | - | Text instruction (2-3000 chars). Use `__BLANK__` for no prompt | TextArea |
| `negativePrompt` | `string` | No | - | What to avoid in generation | TextArea |
| `model` | `string` | Yes | - | AIR model identifier (e.g., `"runware:101@1"`) | Select/Dropdown |
| `width` | `number` | Yes* | - | Image width (128-2048, divisible by 64) | - |
| `height` | `number` | Yes* | - | Image height (128-2048, divisible by 64) | - |
| `aspectRatio` | `string` | No | - | FLUX Kontext only: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `21:9`, `9:21` | AspectRatioSelect |
| `resolution` | `string` | No | - | Resolution tier: `"1k"`, `"2k"` (auto-determines from seedImage aspect) | Select |
| `outputFormat` | `string` | No | `"PNG"` | Output format: `"PNG"`, `"JPG"`, `"WEBP"` | Select |
| `numberResults` | `number` | No | `1` | Number of images (1-20) | NumberInput |
| `strength` | `number` | No | `0.8` | Image-to-image influence (0.0-1.0). Lower = preserve original | Slider |
| `seedImage` | `string` | i2i only | - | Source image (URL, base64, dataURI, or UUID) | ImageInput |

**Notes:**
- *Width/height required for text-to-image; image-to-image can use `resolution` instead
- Aspect ratio should be abstracted similar to other providers (e.g., `"1:1"` → `{width: 1024, height: 1024}`)
- `strength` is similar to "creativity" slider - 0.5-0.6 for upscaling, 0.7-0.9 for style transfer

### Group 2: Technical/Advanced Parameters (Power User/API-Only)

These parameters are too technical for a consumer graphic editor UI:

#### Generation Control

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `taskUUID` | `string` | - | Unique UUID v4 for request tracking (auto-generated) |
| `taskType` | `string` | `"imageInference"` | Always `"imageInference"` for image generation |
| `steps` | `number` | Model default | Inference iterations (1-50). Higher = more detail, slower |
| `CFGScale` | `number` | `7.0` | Classifier-Free Guidance (1.5-8.0). Higher = closer to prompt |
| `scheduler` | `string` | Model default | Sampling scheduler: `"Euler Beta"`, `"DPM++ 2M"`, `"DDIM"`, etc. |
| `seed` | `number` | Random | Seed for reproducibility |
| `clipSkip` | `number` | - | CLIP layers to skip |

#### Output & Delivery

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `outputType` | `string` | `"URL"` | `"URL"`, `"base64Data"`, `"dataURI"` |
| `uploadEndpoint` | `string` | - | Custom URL for HTTP PUT upload |
| `webhookURL` | `string` | - | Async webhook delivery URL |
| `skipResponse` | `boolean` | - | Return immediately with taskUUID only |
| `deliveryMethod` | `string` | - | `"async"` or `"sync"` |

#### Advanced Model Features

| Parameter | Type | Description |
|-----------|------|-------------|
| `lora` | `ILora[]` | LoRA model configurations `{model: AIR, weight: 0-1}` |
| `controlNet` | `IControlNet[]` | ControlNet configurations with preprocessing |
| `embeddings` | `IEmbedding[]` | Textual inversion embeddings |
| `ipAdapters` | `IipAdapters[]` | IP-Adapter for style transfer |
| `vae` | `string` | Custom VAE model AIR identifier |
| `refiner` | `IRefiner` | Refiner model configuration |
| `promptWeighting` | `string` | Syntax: `"compel"` or `"sdEmbeds"` |
| `usePromptWeighting` | `boolean` | Enable per-word prompt weights |

#### Acceleration Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `acceleratorOptions.teaCache` | `boolean` | For Flux/SD3 transformer models |
| `acceleratorOptions.teaCacheDistance` | `number` | TeaCache aggressiveness (0.0-1.0) |
| `acceleratorOptions.deepCache` | `boolean` | For SDXL/SD1.5 UNet models |
| `acceleratorOptions.deepCacheInterval` | `number` | Steps between caching |
| `acceleratorOptions.deepCacheBranchId` | `number` | Cache branch ID |
| `acceleratorOptions.fbCache` | `boolean` | Enable fbCache |

#### Inpainting/Outpainting

| Parameter | Type | Description |
|-----------|------|-------------|
| `maskImage` | `string` | Mask image for inpainting |
| `outpaint.top/bottom/left/right` | `number` | Pixels to extend canvas |

#### Content Safety & Metadata

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `checkNSFW` | `boolean` | - | Enable adult content detection |
| `includeCost` | `boolean` | `false` | Include cost in response |

#### Provider-Specific (Black Forest Labs)

| Parameter | Type | Description |
|-----------|------|-------------|
| `providerSettings.bfl.promptUpsampling` | `boolean` | Auto-enhance prompt |
| `providerSettings.bfl.safetyTolerance` | `number` | Content moderation sensitivity |
| `providerSettings.bfl.raw` | `boolean` | Raw output mode |

#### Identity Features

| Parameter | Type | Description |
|-----------|------|-------------|
| PhotoMaker `inputImages` | `string[]` | Up to 4 reference images |
| PhotoMaker `style` | `string` | PhotoMaker style enum |
| PuLID `guidanceScale` | `number` | Identity embedding control |
| ACE++ `acePlusPlus.type` | `string` | `"portrait"` or `"subject"` |

---

## Dimension Handling

Runware has specific dimension constraints:

1. **Divisibility**: All dimensions must be divisible by 64
2. **Range**: 128-2048 pixels (FLUX Pro: 256-1440)
3. **Resolution Tiers**: `"1k"` or `"2k"` for auto-sizing from seedImage

### Recommended Aspect Ratio Mapping

```typescript
const ASPECT_RATIO_MAP = {
  '1:1':   { width: 1024, height: 1024 },
  '16:9':  { width: 1344, height: 768 },  // Divisible by 64
  '9:16':  { width: 768, height: 1344 },
  '4:3':   { width: 1152, height: 896 },  // Divisible by 64
  '3:4':   { width: 896, height: 1152 },
  '3:2':   { width: 1152, height: 768 },
  '2:3':   { width: 768, height: 1152 },
  '21:9':  { width: 1536, height: 640 },  // Divisible by 64
  '9:21':  { width: 640, height: 1536 },
};
```

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
