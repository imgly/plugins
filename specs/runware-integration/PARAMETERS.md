# Runware Parameters Reference

This document provides a comprehensive reference for all Runware API parameters, classified by their suitability for UI exposure.

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
