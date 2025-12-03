# Runware Implementation Notes

This document covers Runware-specific implementation details and quirks.

## Why HTTP REST Instead of WebSocket

Runware offers two connection methods: WebSocket and HTTP REST API ([documentation](https://runware.ai/docs/en/getting-started/how-to-connect.md)).

While Runware recommends WebSocket for its efficiency and persistent connections, we chose the **HTTP REST API** for the following reasons:

1. **Proxy Simplicity**: HTTP requests are trivial to proxy. Our architecture requires injecting API keys server-side to avoid exposing them in client code. Proxying HTTP POST requests is a standard pattern supported by all backend frameworks and edge functions.

2. **No SDK Dependency**: The WebSocket approach requires the `@runware/sdk` package, which adds bundle size and complexity. HTTP requests use the native `fetch` API with no additional dependencies.

3. **Stateless Architecture**: HTTP requests are stateless and self-contained. Each request includes all necessary context, making debugging easier and eliminating connection state management.

4. **Infrastructure Compatibility**: HTTP works seamlessly with existing API gateways, load balancers, and serverless functions. WebSocket connections require special handling and long-lived connection support.

The trade-off is that HTTP may have slightly higher latency per request (no persistent connection), but for our use case of individual image generation requests, this is negligible.

## File Organization

```
packages/plugin-ai-image-generation-web/src/runware/
├── index.ts                         # Barrel export (nested structure)
├── types.ts                         # RunwareProviderConfiguration, dimension maps
├── createRunwareClient.ts           # HTTP client
├── createImageProvider.ts           # Factory function
├── utils.ts                         # Image URL conversion, helpers
├── {ModelName}.text2image.ts        # T2I provider implementations
├── {ModelName}.text2image.json      # T2I OpenAPI schemas
├── {ModelName}.image2image.ts       # I2I provider implementations
└── {ModelName}.image2image.json     # I2I OpenAPI schemas
```

**Key Principle**: One capability = one provider file. Models with multiple capabilities (e.g., T2I + I2I) have separate files for each.

## Configuration Type

```typescript
interface RunwareProviderConfiguration {
  /**
   * HTTP endpoint URL for the Runware proxy.
   * The proxy handles API key injection.
   */
  proxyUrl: string;

  middlewares?: Middleware[];
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  supportedQuickActions?: QuickActionOverrides;
}
```

## Client Implementation

The Runware client uses HTTP REST API (not WebSocket SDK):

```typescript
// createRunwareClient.ts
export function createRunwareClient(proxyUrl: string): RunwareClient {
  return {
    imageInference: async (params, abortSignal) => {
      const taskUUID = generateUUID();

      const requestBody = [{
        taskType: 'imageInference',
        taskUUID,
        model: params.model,
        positivePrompt: params.positivePrompt,
        width: params.width,
        height: params.height,
        outputType: params.outputType ?? 'URL',
        outputFormat: params.outputFormat ?? 'PNG',
        numberResults: params.numberResults ?? 1,
        // ... optional params
      }];

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      // Handle response and errors
      // ...
    }
  };
}
```

## Factory Function

The `createImageProvider` factory creates Provider objects:

```typescript
function createImageProvider<I extends Record<string, any>>(
  options: CreateProviderOptions<I>,
  config: RunwareProviderConfiguration
): Provider<'image', I, ImageOutput> {
  let runwareClient: RunwareClient | null = null;

  return {
    id: options.providerId,
    kind: 'image',
    name: options.name,
    configuration: config,

    initialize: async (context) => {
      runwareClient = createRunwareClient(config.proxyUrl);
      options.initialize?.(context);
    },

    input: {
      quickActions: {
        supported: mergeQuickActionsConfig(
          options.supportedQuickActions ?? {},
          config.supportedQuickActions
        )
      },
      panel: {
        type: 'schema',
        document: options.schema,
        inputReference: options.inputReference,
        // ...
      }
    },

    output: {
      abortable: true,
      middleware: options.middleware ?? config.middlewares ?? [],
      history: config.history ?? '@imgly/indexedDB',
      generate: async (input, { abortSignal }) => {
        // Handle image URL conversion for I2I
        // Call mapInput
        // Call runwareClient.imageInference
        // Return { kind: 'image', url }
      }
    }
  };
}
```

## Image URL Conversion

For I2I providers, local image URLs (blob://, data://) must be converted:

```typescript
// utils.ts
export async function convertImageUrlForRunware(
  imageUrl: string,
  cesdk?: CreativeEditorSDK
): Promise<string> {
  // If already a public URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert blob/data URLs to uploadable format
  // Implementation depends on CE.SDK capabilities
  // ...
}
```

## Adding a New Provider

### 1. Create TypeScript File

**File Naming**: Use `{ModelName}.{capability}.ts` pattern:
- `Flux2Pro.text2image.ts` for T2I
- `Flux2Pro.image2image.ts` for I2I

**IMPORTANT**: The JSON schema import requires `// @ts-ignore` because the OpenAPI types are stricter than what we actually need at runtime. This is a known pattern used across all providers.

```typescript
// {ModelName}.text2image.ts
import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import {ModelName}Schema from './{ModelName}.text2image.json';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for {Model Display Name}
 *
 * Use only aspect ratios that have icons available:
 * - 1:1, 16:9, 9:16, 4:3, 3:4 (have dedicated icons)
 * - 3:2, 2:3, 21:9, 9:21 (no icons, avoid unless model requires)
 */
export type {ModelName}Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  // Add model-specific optional parameters here
};

/**
 * {Model Display Name} - {Brief description}
 *
 * AIR: {air-identifier}
 *
 * Features:
 * - {List key capabilities}
 *
 * Specifications:
 * - {List key specs from API docs}
 */
export function {ModelName}(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', {ModelName}Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<{ModelName}Input>(
      {
        modelAIR: '{air-identifier}',
        providerId: 'runware/{vendor}/{model-name}',
        name: '{Display Name}',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: {ModelName}Schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
        mapInput: (input) => {
          const dims = getImageDimensionsFromAspectRatio(
            input.aspect_ratio ?? '1:1'
          );
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
            // Map additional parameters here using spread syntax:
            // ...(input.param && { apiParam: input.param })
          };
        }
      },
      config
    );
  };
}

export default {ModelName};
```

### 2. Create JSON Schema

**IMPORTANT**: The schema must include an empty `"paths": {}` property to satisfy the OpenAPI type requirements.

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "{Model Display Name} API",
    "version": "1.0.0",
    "description": "{Model Display Name} generation via Runware"
  },
  "components": {
    "schemas": {
      "{ModelName}Input": {
        "title": "{ModelName}Input",
        "type": "object",
        "properties": {
          "prompt": {
            "title": "Prompt",
            "type": "string",
            "description": "Text description for image generation",
            "x-imgly-builder": {
              "component": "TextArea"
            }
          },
          "aspect_ratio": {
            "title": "Format",
            "type": "string",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1",
            "description": "Aspect ratio for the generated image",
            "x-imgly-enum-labels": {
              "1:1": "Square",
              "16:9": "Landscape 16:9",
              "9:16": "Portrait 9:16",
              "4:3": "Landscape 4:3",
              "3:4": "Portrait 3:4"
            },
            "x-imgly-enum-icons": {
              "1:1": "@imgly/plugin/formats/ratio1by1",
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "4:3": "@imgly/plugin/formats/ratio4by3",
              "3:4": "@imgly/plugin/formats/ratio3by4"
            }
          }
        },
        "x-fal-order-properties": ["prompt", "aspect_ratio"],
        "required": ["prompt"]
      }
    }
  },
  "paths": {}
}
```

#### Schema Extension Keywords

| Keyword | Purpose |
|---------|---------|
| `x-imgly-builder` | Specifies UI component (e.g., `TextArea` for multiline input) |
| `x-imgly-enum-labels` | Human-readable labels for enum values |
| `x-imgly-enum-icons` | Icon paths for enum values (aspect ratios use `@imgly/plugin/formats/ratio*`) |
| `x-fal-order-properties` | Array defining the display order of properties in the UI |

#### Available Aspect Ratio Icons

Only use aspect ratios that have icons available in `@imgly/plugin/formats`:

| Aspect Ratio | Icon ID | Use For |
|--------------|---------|---------|
| `1:1` | `ratio1by1` | Square images |
| `16:9` | `ratio16by9` | Landscape widescreen |
| `9:16` | `ratio9by16` | Portrait (mobile/stories) |
| `4:3` | `ratio4by3` | Landscape standard |
| `3:4` | `ratio3by4` | Portrait standard |
| Custom | `ratioFree` | User-defined dimensions |

**Avoid these** (no icons, will show blank):
- `3:2`, `2:3` - No dedicated icons
- `21:9`, `9:21` - No dedicated icons

### 3. Add to Index

Use a nested structure grouping capabilities under model names:

```typescript
// index.ts
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';
// Later when I2I is implemented:
// import { Flux2Pro as Flux2ProImage2Image } from './Flux2Pro.image2image';

const Runware = {
  Flux2Pro: {
    Text2Image: Flux2ProText2Image
    // Image2Image: Flux2ProImage2Image  // Added when implemented
  }
};

export default Runware;
```

Usage in apps:
```typescript
RunwareImage.Flux2Pro.Text2Image({ proxyUrl, middlewares: [...] })
RunwareImage.Flux2Pro.Image2Image({ proxyUrl, middlewares: [...] })  // When available
```

### 4. Update providers.md

Change status from `planned` to `implemented` for **only the capability you implemented**:

```markdown
| Provider | Model Name | AIR | Capability | Release Date | Status |
| BFL | FLUX.2 [pro] | `bfl:5@1` | text-to-image | Nov 2025 | implemented |
| BFL | FLUX.2 [pro] | `bfl:5@1` | image-to-image | Nov 2025 | planned |  ← Still planned!
```

Each capability has its own row in the table.

## UI Parameter Guidelines

**IMPORTANT**: Before implementing any provider, read `specs/providers/patterns/ui-guidelines.md` for comprehensive guidance on:
- Which parameters to expose in UI (prompt, aspect_ratio, image_url)
- Which parameters to NEVER expose (seed, cfg_scale, steps, enhance_prompt, etc.)
- Standard aspect ratios and dimension mappings
- JSON schema component reference and examples

## Image Input Parameters (I2I)

Runware uses different parameter names and structures for passing input images depending on the model. **Do not abstract these differences** - each provider's `mapInput` should return exactly what Runware expects for that specific model.

### Why No Abstraction?

1. **Debugging clarity**: When something breaks, you see exactly what's sent to the API
2. **Documentation match**: Code matches Runware docs 1:1
3. **Model-specific behavior**: Different parameters have different semantics (see below)
4. **Minimal benefit**: We're not building a generic client library

### Parameter Types

| Parameter | Location | Semantics | Models |
|-----------|----------|-----------|--------|
| `seedImage` | Root | Direct transformation via diffusion; `strength` controls preservation | FLUX.1 Fill Pro, FLUX.1 Expand Pro |
| `referenceImages` | Root | Visual guidance for style/composition | Nano Banana (Gemini), Ideogram |
| `inputs.referenceImages` | Nested | Reference-based generation | FLUX.2 [dev], FLUX.2 [pro], FLUX.2 [flex] |

### Semantic Differences

- **`seedImage`**: The image IS the starting point. Model modifies it directly. Used for inpainting, outpainting, and direct style transfer.
- **`referenceImages`**: Images INFLUENCE generation. Model creates new content inspired by the references. Used for style matching, composition guidance.

The distinction matters less for end users (both feel like "image-to-image"), but affects what the model produces.

### Implementation Pattern

Our UI consistently uses `image_url` as the input field. Each provider maps it to the correct wire format:

```typescript
// FLUX.2 [dev] - uses nested inputs.referenceImages
mapInput: (input) => ({
  positivePrompt: input.prompt,
  inputs: {
    referenceImages: [input.image_url]
  }
})

// Nano Banana (Gemini) - uses root-level referenceImages
mapInput: (input) => ({
  positivePrompt: input.prompt,
  referenceImages: [input.image_url]
})

// FLUX.1 Fill Pro (inpainting) - uses seedImage
mapInput: (input) => ({
  positivePrompt: input.prompt,
  seedImage: input.image_url,
  maskImage: input.mask_url,
  strength: 0.8
})
```

### Finding the Right Parameter

When implementing a new model:

1. Fetch the model's documentation: `https://runware.ai/docs/en/providers/{vendor}.md`
2. Look for the exact JSON example for image-to-image
3. Copy the parameter structure exactly into `mapInput`

## Common Patterns

### T2I Provider (Simple)

Minimal implementation with aspect ratio:
- `prompt` input field
- `aspect_ratio` selection with icon labels
- **No advanced parameters** (prompt enhancement, CFG, steps, etc.)

### I2I Provider (With Quick Actions)

Includes:
- `image_url` input field (mapped to model-specific parameter in `mapInput`)
- Quick action support
- i18n translations
- Dynamic dimensions from input image

### Style Selection

Complex style selection with CustomAssetSource for models that support style presets.

## Dimension Constraints (CRITICAL for I2I)

**IMPORTANT**: Different models have different dimension constraints. Using wrong constraints will cause API errors like `invalidCustomWidth`.

### DimensionConstraints Interface

```typescript
interface DimensionConstraints {
  width: { min: number; max: number };
  height: { min: number; max: number };
  multiple?: number;  // Optional, defaults to 1
}
```

### Using Dimension Constraints

Pass `dimensionConstraints` to `createImageProvider` for I2I providers:

```typescript
return createImageProvider<MyModelInput>(
  {
    // ... other options
    dimensionConstraints: {
      width: { min: 256, max: 1920 },
      height: { min: 256, max: 1920 },
      multiple: 16
    },
    // ...
  },
  config
);
```

The `adjustDimensions` utility is also available for use in `getBlockInput`:

```typescript
import { adjustDimensions } from './utils';

getBlockInput: async (input) => {
  const { width, height } = await getImageDimensionsFromURL(...);
  const adjusted = adjustDimensions(width, height, {
    width: { min: 256, max: 1920 },
    height: { min: 256, max: 1920 },
    multiple: 16
  });
  return { image: { width: adjusted.width, height: adjusted.height } };
}
```

### Known Model Constraints

| Model | AIR | Width | Height | Multiple |
|-------|-----|-------|--------|----------|
| FLUX.2 [dev] | `runware:400@1` | 512-2048 | 512-2048 | 16 |
| FLUX.2 [pro] | `bfl:5@1` | 256-1920 | 256-1920 | 16 |
| FLUX.2 [flex] | `bfl:6@1` | 256-1920 | 256-1920 | 16 |

### Extracting Constraints from API Docs

When fetching documentation, look for width/height parameter specs:
```
width: integer, min: XXX, max: YYY, multiples of ZZ
height: integer, min: XXX, max: YYY, multiples of ZZ
```

## Known Issues & Gotchas

### TypeScript and JSON Schema

The OpenAPI types from `openapi-types` are stricter than what we need at runtime. When importing JSON schemas:

1. **Always use `// @ts-ignore`** before the `schema:` property in `createImageProvider`
2. **Always include `"paths": {}`** in the JSON schema file

```typescript
// @ts-ignore - JSON schema types are compatible at runtime
schema: MyModelSchema,
```

### Required Schema Properties

The JSON schema must have these properties to avoid TypeScript errors:
- `"openapi": "3.0.0"`
- `"info": { ... }`
- `"components": { "schemas": { ... } }`
- `"paths": {}` ← Often forgotten, causes TS2741 error

## Undocumented API Parameters

This section tracks API parameters discovered through testing that are **not yet documented** by Runware. These should be verified periodically and removed once official documentation is updated.

### GPT Image 1 (`openai:1@1`) - Image-to-Image

**Discovered**: 2025-12-02
**Status**: Works in production, not documented

The Runware documentation only shows text-to-image for GPT Image 1, but image-to-image works via `referenceImages`:

```json
{
  "taskType": "imageInference",
  "model": "openai:1@1",
  "positivePrompt": "A dog instead of a cat",
  "height": 1024,
  "width": 1024,
  "numberResults": 1,
  "outputType": ["dataURI", "URL"],
  "outputFormat": "JPEG",
  "includeCost": true,
  "referenceImages": ["https://im.runware.ai/image/ii/example.png"],
  "outputQuality": 85,
  "taskUUID": "76a2ddb0-21ce-403c-95ca-45fbfbb61c27"
}
```

**Key points**:
- Uses root-level `referenceImages` (not nested under `inputs`)
- Accepts at least 1 reference image
- Works as instruction-based editing (prompt describes the change)
- Same dimensions as T2I: 1024×1024, 1536×1024, 1024×1536

## Translations

Every provider requires UI translations in the appropriate translations.json file.

| Capability | Translations File |
|------------|-------------------|
| text-to-image, image-to-image | `packages/plugin-ai-image-generation-web/translations.json` |
| text-to-video, image-to-video | `packages/plugin-ai-video-generation-web/translations.json` |

### Translation Key Pattern

```
ly.img.plugin-ai-{kind}-generation-web.{providerId}.property.{property-name}
```

### Image Provider Translations (T2I)

```json
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.prompt": "Prompt",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.prompt.placeholder": "Describe your image...",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio": "Format",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.1:1": "Square",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.16:9": "Landscape 16:9",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.9:16": "Portrait 9:16",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.4:3": "Landscape 4:3",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.3:4": "Portrait 3:4"
```

### Image Provider Translations (I2I)

```json
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.image_url": "Source Image",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.prompt": "Prompt",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.prompt.placeholder": "Describe the changes..."
```

### Video Provider Translations (T2V)

```json
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.prompt": "Prompt",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.prompt.placeholder": "Describe the video scene...",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio": "Aspect Ratio",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.16:9": "16:9 (Landscape)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.9:16": "9:16 (Vertical)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.1:1": "1:1 (Square)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.duration": "Duration",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.duration.5s": "5 seconds",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.duration.8s": "8 seconds"
```

### Video Provider Translations (Fixed Dimensions)

For models with fixed dimension combinations (see `text-to-video.md`), use `format` instead of `aspect_ratio`:

```json
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.format": "Format",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.format.1280x720": "Landscape HD (1280×720)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.format.720x1280": "Portrait HD (720×1280)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.format.1920x1080": "Landscape Full HD (1920×1080)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.format.1080x1920": "Portrait Full HD (1080×1920)"
```

### Video Provider Translations (I2V)

```json
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.image_url": "Source Image",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.prompt": "Prompt",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.prompt.placeholder": "Describe the video...",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.duration": "Duration"
```

### Guidelines

- Use the exact `providerId` from the TypeScript file (e.g., `runware/bfl/flux-2-dev`)
- Match the `title` values from the JSON schema for consistency
- **Placeholders**: Add `.placeholder` suffix for textarea placeholder text
- **Image providers**: Use "Format" for `aspect_ratio` label
- **Video providers**: Use "Aspect Ratio" for `aspect_ratio` label
- For `image_url`, use "Source Image" as the label

### Translation Priority (Fallback Chain)

Translations follow this priority order (highest to lowest):
1. `ly.img.plugin-ai-{kind}-generation-web.{providerId}.property.{field}` - Provider-specific
2. `ly.img.plugin-ai-generation-web.property.{field}` - Generic base
3. `ly.img.plugin-ai-{kind}-generation-web.{providerId}.defaults.property.{field}` - Provider defaults
4. `ly.img.plugin-ai-generation-web.defaults.property.{field}` - Base defaults

This allows customers to override any translation (labels, placeholders, enum values) at the provider level.

## Video-Specific Patterns

Video inference has different requirements than image inference.

### Async Delivery and Polling

Video generation uses async delivery with polling:

```typescript
// 1. Submit with deliveryMethod: "async"
const requestBody = [{
  taskType: 'videoInference',
  taskUUID,
  model: params.model,
  deliveryMethod: 'async',  // REQUIRED for video
  // ... other params
}];

// 2. Response is just acknowledgment
{ "data": [{ "taskType": "videoInference", "taskUUID": "..." }] }

// 3. Poll with getResponse until status is "success"
const pollBody = [{ taskType: 'getResponse', taskUUID }];
// Response when complete:
{ "data": [{ "taskType": "videoInference", "taskUUID": "...", "status": "success", "videoURL": "..." }] }
```

### Frame Images (for I2V)

Video uses `frameImages` instead of `seedImage` for input images:

```typescript
mapInput: (input) => ({
  positivePrompt: input.prompt ?? '',
  frameImages: [
    {
      inputImage: input.image_url,
      frame: 'first'  // or 'last', or a frame number
    }
  ],
  // ...
})
```

### Provider Settings

Provider-specific features (like audio) go under `providerSettings.{vendor}`:

```typescript
// WRONG - will cause "unsupportedParameter" error
mapInput: (input) => ({
  generateAudio: true  // NOT a top-level parameter!
})

// CORRECT - nested under providerSettings
mapInput: (input) => ({
  providerSettings: {
    google: {
      generateAudio: input.generate_audio ?? true
    }
  }
})
```

### Video File Organization

```
packages/plugin-ai-video-generation-web/src/runware/
├── index.ts                         # Barrel export
├── types.ts                         # RunwareProviderConfiguration
├── createRunwareClient.ts           # HTTP client with polling
├── createVideoProvider.ts           # Factory function
├── utils.ts                         # Helpers
├── {ModelName}.text2video.ts        # T2V provider
├── {ModelName}.text2video.json      # T2V schema
├── {ModelName}.image2video.ts       # I2V provider
└── {ModelName}.image2video.json     # I2V schema
```

## Implementation Checklist

After creating provider files, ensure you've completed ALL steps:

- [ ] **VERIFIED API docs** - Fetched both general API reference AND provider-specific docs
- [ ] **Listed allowed parameters** - Know exactly which params are top-level vs nested
- [ ] Created `{ModelName}.{capability}.ts` with `// @ts-ignore` before schema
- [ ] Created `{ModelName}.{capability}.json` with `"paths": {}`
- [ ] Added export to `index.ts` with nested structure (`Model.Text2Image` or `Model.Image2Image`)
- [ ] Added translations to `translations.json` for all UI properties
- [ ] Added to `examples/ai/src/runwareProviders.ts` in appropriate array
- [ ] Updated `specs/providers/runware/providers.md` status **for that capability only**
- [ ] Ran `pnpm --filter "@imgly/plugin-ai-*" check:all`

**Remember**: One capability = one provider file. Don't mark the whole model as implemented if you only did T2I!
