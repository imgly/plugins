# Runware API Patterns

This document covers the Runware API conventions used in provider implementations.

## API Architecture

Runware uses an HTTP REST API with JSON request/response format. All requests go through a proxy that handles authentication.

```
Client → Proxy (proxyUrl) → Runware API
```

## Request Format

Requests are sent as JSON arrays containing task objects:

```json
[
  {
    "taskType": "imageInference",
    "taskUUID": "unique-uuid",
    "model": "provider:model@version",
    "positivePrompt": "...",
    "width": 1024,
    "height": 1024
  }
]
```

## Response Format

```json
{
  "data": [
    {
      "taskType": "imageInference",
      "taskUUID": "matching-uuid",
      "imageURL": "https://...",
      "seed": 12345,
      "cost": 0.05
    }
  ]
}
```

## Model AIR Format

AIR (AI Resource Identifier) follows the pattern:

```
{provider}:{model}@{version}
```

| Provider | Example AIR | Description |
|----------|-------------|-------------|
| Google | `google:2@1` | Imagen 4 |
| Ideogram | `ideogram:4@2` | Ideogram 3.0 Remix |
| Black Forest Labs | `bfl:3@1` | FLUX.1 Kontext [pro] |
| ByteDance | `bytedance:5@0` | Seedream 4.0 |
| OpenAI | `openai:1@1` | GPT Image 1 |
| Runware | `runware:400@1` | Runware-specific models |

## Core API Parameters

### Required

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | AIR identifier |
| `positivePrompt` | string | Text prompt for generation |
| `width` | number | Output width (divisible by 64) |
| `height` | number | Output height (divisible by 64) |

### Common Optional

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `negativePrompt` | string | - | What to avoid |
| `numberResults` | number | 1 | Images to generate |
| `outputType` | enum | "URL" | "URL", "base64Data", "dataURI" |
| `outputFormat` | enum | "PNG" | "PNG", "JPG", "WEBP" |
| `steps` | number | model default | Inference steps |
| `CFGScale` | number | model default | Classifier-free guidance |
| `seed` | number | random | For reproducibility |

### Image-to-Image Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `seedImage` | string | Input image URL |
| `maskImage` | string | Mask for inpainting |
| `strength` | number | How much to modify (0-1) |

## Dimension Constraints

All dimensions must be divisible by 64. Use the predefined mappings:

**⚠️ Important**: Some models require specific dimension combinations and do NOT accept
the generic `ASPECT_RATIO_MAP` values. Always check the model's documentation. Models
with specific requirements include:
- **Nano Banana 2 Pro** (`google:4@2`): Requires specific 1K/2K/4K dimension presets
- **Seedream 4.0** (`bytedance:5@0`): Only supports 1:1 at 1K; other ratios need 2K dimensions

See `implementation-notes.md` for model-specific dimension tables.

### Aspect Ratio Map

```typescript
const ASPECT_RATIO_MAP = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1152, height: 768 },
  '2:3': { width: 768, height: 1152 },
  '21:9': { width: 1536, height: 640 },
  '9:21': { width: 640, height: 1536 }
};
```

### Size Preset Map

```typescript
const IMAGE_SIZE_MAP = {
  square: { width: 1024, height: 1024 },
  square_hd: { width: 2048, height: 2048 },
  portrait_4_3: { width: 896, height: 1152 },
  portrait_3_2: { width: 768, height: 1152 },
  portrait_16_9: { width: 768, height: 1344 },
  landscape_4_3: { width: 1152, height: 896 },
  landscape_3_2: { width: 1152, height: 768 },
  landscape_16_9: { width: 1344, height: 768 },
  landscape_21_9: { width: 1536, height: 640 }
};
```

## Input Mapping

The `mapInput` function transforms UI input to Runware API format:

### Common Mappings

| UI Field | Runware Field |
|----------|---------------|
| `prompt` | `positivePrompt` |
| `negative_prompt` | `negativePrompt` |
| `image_url` | `seedImage` |
| `cfg_scale` | `CFGScale` |

### Example mapInput

```typescript
mapInput: (input) => {
  const dims = getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1');
  return {
    positivePrompt: input.prompt,
    width: dims.width,
    height: dims.height,
    ...(input.negative_prompt && { negativePrompt: input.negative_prompt }),
    ...(input.steps && { steps: input.steps })
  };
}
```

## Image URL Handling

For image-to-image providers, input images must be accessible URLs. The `createImageProvider` handles this automatically:

```typescript
// Converts blob:// and data:// URLs to accessible URLs
if (input.image_url != null) {
  const convertedUrl = await convertImageUrlForRunware(input.image_url, cesdk);
  processedInput = { ...input, image_url: convertedUrl };
}
```

## Provider Documentation URLs

Fetch model-specific parameters from Runware docs:

```
https://runware.ai/docs/en/providers/{provider}.md
```

| Provider Slug | Vendor |
|---------------|--------|
| `bfl` | Black Forest Labs |
| `bria` | Bria |
| `bytedance` | ByteDance |
| `google` | Google |
| `ideogram` | Ideogram |
| `imagineart` | ImagineArt |
| `klingai` | KlingAI |
| `lightricks` | Lightricks |
| `midjourney` | Midjourney |
| `minimax` | MiniMax |
| `openai` | OpenAI |
| `pixverse` | PixVerse |
| `runway` | Runway |
| `sourceful` | Sourceful |
| `vidu` | Vidu |

## Error Handling

Errors come in two formats:

```json
// Array format
{ "errors": [{ "errorId": 123, "errorMessage": "..." }] }

// Object format
{ "error": { "errorMessage": "..." } }
```

The Runware client handles both automatically.

## Model-Specific Notes

### Ideogram
- Uses `seedImage` for remix input
- Resolution options differ from standard aspect ratios

### Google Imagen
- Limited aspect ratio support (1:1, 16:9, 9:16, 4:3, 3:4)
- No negative prompt support on some versions

### FLUX Kontext
- Supports both text-to-image and image-to-image
- Image reference uses `seedImage`

### OpenAI GPT Image
- Uses OpenAI-style size format ("1024x1024")
- Separate providers for edit vs generate modes

Check `providers.md` for model-specific capabilities and the Runware documentation for detailed parameter specifications.

## Provider ID Convention

```
runware/{vendor}/{model-name}

Examples:
- runware/google/imagen-4
- runware/ideogram/v3-remix
- runware/bfl/flux-kontext-pro
- runware/openai/gpt-image-1
```
