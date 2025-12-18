# Implementation Checklist

Step-by-step process for implementing EachLabs providers.

## Prerequisites

- [ ] User has approved which model to implement
- [ ] Model slug and capability are known from discovery phase

## Key Principle: One Capability = One Provider

**IMPORTANT**: Each capability requires a separate provider file. A model with both text-to-image AND image-to-image capabilities needs TWO provider implementations:

```
Flux2Pro.text2image.ts   -> text-to-image provider
Flux2Pro.image2image.ts  -> image-to-image provider (separate implementation)
```

The `providers.md` file tracks each capability as a separate row. Implement one capability at a time.

## Implementation Steps

### 1. Determine Provider Type

Map capability to provider type:

| Capability | Provider Type | File Pattern | Target Directory |
|------------|---------------|--------------|------------------|
| text-to-image | t2i | `{Model}.text2image.ts` | `plugin-ai-image-generation-web/src/eachlabs/` |
| image-to-image | i2i | `{Model}.image2image.ts` | `plugin-ai-image-generation-web/src/eachlabs/` |
| text-to-video | t2v | `{Model}.text2video.ts` | `plugin-ai-video-generation-web/src/eachlabs/` |
| image-to-video | i2v | `{Model}.image2video.ts` | `plugin-ai-video-generation-web/src/eachlabs/` |

### 2. Read Required Documentation

**Before writing any code**, read these files in order:

1. **`specs/providers/patterns/ui-guidelines.md`** - CRITICAL
   - Which parameters to expose in UI (prompt, aspect_ratio, image_url)
   - Which parameters to NEVER expose (seed, cfg_scale, steps, etc.)
   - Standard aspect ratios and dimensions
   - JSON schema component reference

2. **Existing fal.ai providers as reference**
   - Similar models show the pattern to follow
   - Look at how `request_schema` → OpenAPI conversion works

### 3. Fetch Model Details from API (MANDATORY)

**CRITICAL**: Always fetch the current model details from the API before implementation:

```
WebFetch: https://api.eachlabs.ai/v1/model?slug=<model-slug>
```

Extract:
- `request_schema` - JSON Schema for all input parameters
- `required` - Which fields are mandatory
- `properties` - All available parameters with types, enums, defaults
- `output_type` - Confirm expected output format

### 4. Convert request_schema to OpenAPI Format

EachLabs provides JSON Schema. Convert to OpenAPI with IMG.LY extensions:

#### 4a. Create the OpenAPI wrapper

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "EachLabs API",
    "version": "1.0.0",
    "description": "EachLabs API for <model-name>"
  },
  "components": {
    "schemas": {
      "<ModelName>Input": {
        // Converted request_schema goes here
      }
    }
  },
  "paths": {}
}
```

#### 4b. Add x-imgly-* extensions to properties

For each property in request_schema:

| Property Type | Add Extension |
|---------------|---------------|
| `string` (long text, prompt) | `"x-imgly-builder": { "component": "TextArea" }` |
| `string` (enum) | `"x-imgly-builder": { "component": "Select" }` + `"x-imgly-enum-labels": {...}` |
| `string` (url) | Handle via `renderCustomProperty` |
| `boolean` | `"x-imgly-builder": { "component": "Switch" }` |
| `integer`/`number` | `"x-imgly-builder": { "component": "Number" }` |

#### 4c. Add property ordering

Add `x-fal-order-properties` to control UI display order:

```json
{
  "x-fal-order-properties": ["prompt", "image_size", "duration"]
}
```

**Order priority**:
1. `prompt` - Always first
2. `image_url` / `image_urls` - If present
3. `aspect_ratio` / `image_size` - Format/dimensions
4. `duration` - For video
5. Other user-facing options
6. Hidden parameters (seed, cfg_scale) - Don't include in order

#### 4d. Create human-readable enum labels

```json
"image_size": {
  "type": "string",
  "enum": ["square_hd", "landscape_4_3", "portrait_4_3"],
  "x-imgly-enum-labels": {
    "square_hd": "Square HD",
    "landscape_4_3": "Landscape 4:3",
    "portrait_4_3": "Portrait 4:3"
  }
}
```

### 5. Decide Which Parameters to Expose

Follow `specs/providers/patterns/ui-guidelines.md`:

**ALWAYS expose:**
- `prompt` - Text input for generation
- `image_url` / `image_urls` - For I2I/I2V
- `aspect_ratio` / `image_size` - Format selection
- `duration` - For video

**NEVER expose (hide from UI):**
- `seed` - Reproducibility parameter
- `cfg_scale` / `guidance_scale` - Technical parameter
- `steps` / `num_inference_steps` - Technical parameter
- `enhance_prompt` - Internal processing
- `sync_mode` - API implementation detail
- `enable_safety_checker` / `safety_tolerance` - Let backend handle

To hide a parameter, either:
1. Don't include it in `x-fal-order-properties`
2. Set a sensible default and don't expose in schema

### 6. Create Provider Files

#### 6a. Create JSON Schema file: `{ModelName}.{capability}.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "EachLabs API",
    "version": "1.0.0",
    "description": "EachLabs API for Flux 2 Pro"
  },
  "components": {
    "schemas": {
      "Flux2ProInput": {
        "title": "Flux2ProInput",
        "type": "object",
        "properties": {
          "prompt": {
            "title": "Prompt",
            "type": "string",
            "minLength": 1,
            "description": "The prompt to generate an image from.",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "image_size": {
            "title": "Format",
            "type": "string",
            "enum": ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"],
            "default": "landscape_4_3",
            "x-imgly-enum-labels": {
              "square_hd": "Square HD (1024x1024)",
              "square": "Square (512x512)",
              "portrait_4_3": "Portrait 4:3",
              "portrait_16_9": "Portrait 16:9",
              "landscape_4_3": "Landscape 4:3",
              "landscape_16_9": "Landscape 16:9"
            },
            "x-imgly-builder": { "component": "Select" }
          }
        },
        "x-fal-order-properties": ["prompt", "image_size"],
        "required": ["prompt"]
      }
    }
  },
  "paths": {}
}
```

#### 6b. Create TypeScript file: `{ModelName}.{capability}.ts`

```typescript
import {
  CommonProviderConfiguration,
  ImageOutput,
  type Provider,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './Flux2Pro.text2image.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<Flux2ProInput, ImageOutput> {}

type Flux2ProInput = {
  prompt: string;
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
};

export function Flux2Pro(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2ProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'eachlabs/flux-2-pro';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.prompt`]: 'Describe your image...',
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated Images'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', Flux2ProInput, ImageOutput> {
  return createImageProvider(
    {
      modelSlug: 'flux-2-pro',
      modelKey: 'eachlabs/flux-2-pro',
      name: 'Flux 2 Pro',
      // @ts-ignore - OpenAPI type compatibility
      schema,
      inputReference: '#/components/schemas/Flux2ProInput',
      cesdk,
      getImageSize: (input) => {
        // Map image_size to dimensions
        const sizeMap: Record<string, { width: number; height: number }> = {
          'square_hd': { width: 1024, height: 1024 },
          'square': { width: 512, height: 512 },
          'portrait_4_3': { width: 768, height: 1024 },
          'portrait_16_9': { width: 576, height: 1024 },
          'landscape_4_3': { width: 1024, height: 768 },
          'landscape_16_9': { width: 1024, height: 576 }
        };
        return sizeMap[input.image_size ?? 'landscape_4_3'];
      }
    },
    config
  );
}

export default Flux2Pro;
```

### 7. Update createImageProvider / createVideoProvider

Ensure the EachLabs provider factories use the EachLabs client correctly:

- `createImageProvider` should call `eachlabsClient.createPrediction`
- Poll for completion via `eachlabsClient.getPrediction`
- Extract output URL from response

### 8. Register Provider

Add export to the appropriate index file:

```typescript
// packages/plugin-ai-image-generation-web/src/eachlabs/index.ts
import { Flux2Pro } from './Flux2Pro.text2image';

const EachLabs = {
  Flux2Pro: {
    Text2Image: Flux2Pro
    // Image2Image: Flux2ProI2I  // Added when I2I is implemented
  }
};

export default EachLabs;
```

### 9. Update translations.json (REQUIRED)

**CRITICAL**: Every provider needs UI translations for its properties.

| Capability | Translations File |
|------------|-------------------|
| text-to-image, image-to-image | `packages/plugin-ai-image-generation-web/translations.json` |
| text-to-video, image-to-video | `packages/plugin-ai-video-generation-web/translations.json` |

**Translation Key Pattern**: `ly.img.plugin-ai-{kind}-generation-web.{providerId}.property.{property-name}`

Example:
```json
"ly.img.plugin-ai-image-generation-web.eachlabs/flux-2-pro.property.prompt": "Prompt",
"ly.img.plugin-ai-image-generation-web.eachlabs/flux-2-pro.property.prompt.placeholder": "Describe your image...",
"ly.img.plugin-ai-image-generation-web.eachlabs/flux-2-pro.property.image_size": "Format",
"ly.img.plugin-ai-image-generation-web.eachlabs/flux-2-pro.property.image_size.square_hd": "Square HD",
"ly.img.plugin-ai-image-generation-web.eachlabs/flux-2-pro.property.image_size.landscape_4_3": "Landscape 4:3"
```

### 10. Add to Example App (REQUIRED)

**CRITICAL**: Every new provider MUST be added to `examples/ai/src/eachlabsProviders.ts`:

```typescript
import EachLabsImage from '@imgly/plugin-ai-image-generation-web/eachlabs';
import EachLabsVideo from '@imgly/plugin-ai-video-generation-web/eachlabs';

export function createEachLabsProviders(options: EachLabsProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      EachLabsImage.Flux2Pro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [],
    text2video: [],
    image2video: []
  };
}
```

### 11. Update providers.md

Change status from `planned` to `implemented`:

```markdown
| Slug | Name | Capability | Status |
|------|------|------------|--------|
| flux-2-pro | Flux 2 Pro | text-to-image | implemented |
```

### 12. Update README Documentation (REQUIRED)

Add provider to the plugin's README.md:

1. **Import statement**: Add import example
2. **Providers section**: Add numbered provider entry with code example
3. **API Reference section**: Add provider function signatures
4. **Panel IDs section**: Add provider panel IDs
5. **Asset History section**: Add history source IDs

### 13. Run Validation

```bash
pnpm --filter "@imgly/plugin-ai-*" check:all
```

Fix any:
- [ ] TypeScript errors
- [ ] Lint errors
- [ ] Build failures

### 14. Test (if demo available)

```bash
cd examples/ai
pnpm dev
```

Verify the provider appears and generates correctly.

## Common Issues

| Issue | Solution |
|-------|----------|
| OpenAPI type errors | Add `// @ts-ignore` before `schema:` property |
| Missing paths property | Add `"paths": {}` to JSON schema |
| Unknown image_size values | Check EachLabs API docs for exact enum values |
| Provider not appearing | Check index.ts export and translations |

## EachLabs-Specific Notes

### Polling for Results

EachLabs uses async predictions. The client must:
1. POST to `/v1/prediction` to start generation
2. Poll `GET /v1/prediction/{id}` until status is `success` or `failed`
3. Extract output URL from response

### Image Size Mapping

EachLabs uses named sizes like `square_hd`, `landscape_4_3`. Map these to actual dimensions:

```typescript
const sizeMap: Record<string, { width: number; height: number }> = {
  'square_hd': { width: 1024, height: 1024 },
  'square': { width: 512, height: 512 },
  'portrait_4_3': { width: 768, height: 1024 },
  'portrait_16_9': { width: 576, height: 1024 },
  'landscape_4_3': { width: 1024, height: 768 },
  'landscape_16_9': { width: 1024, height: 576 }
};
```

### Video Duration

EachLabs video models often use string durations like `"5"` or `"10"` (seconds). Parse appropriately:

```typescript
const duration = parseInt(input.duration ?? '5', 10);
```

## Critical Reminders

1. **One capability = one provider file** - Never combine T2I and I2I in one file
2. **Always fetch model details from API** - Don't guess parameter names
3. **JSON schema must include `"paths": {}`** - OpenAPI type requirement
4. **Always use `// @ts-ignore` before schema** - TypeScript workaround
5. **Update providers.md for only the implemented capability**
6. **ALWAYS add to example app**
7. **ALWAYS add translations**
8. **ALWAYS update README documentation**
