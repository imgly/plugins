# Implementation Checklist

Step-by-step process for implementing Runware providers.

## Prerequisites

- [ ] User has approved which capability to implement
- [ ] Model AIR and capability are known from discovery phase

## Key Principle: One Capability = One Provider

**IMPORTANT**: Each capability requires a separate provider file. A model with both text-to-image AND image-to-image capabilities needs TWO provider implementations:

```
Flux2Pro.text2image.ts   → text-to-image provider
Flux2Pro.image2image.ts  → image-to-image provider (separate implementation)
```

The `providers.md` file tracks each capability as a separate row. Implement one capability at a time.

## Implementation Steps

### 1. Determine Provider Type

Map capability to provider type:

| Capability | Provider Type | File Pattern | Target Directory |
|------------|---------------|--------------|------------------|
| text-to-image | t2i | `{Model}.text2image.ts` | `plugin-ai-image-generation-web/src/runware/` |
| image-to-image | i2i | `{Model}.image2image.ts` | `plugin-ai-image-generation-web/src/runware/` |
| text-to-video | t2v | `{Model}.text2video.ts` | `plugin-ai-video-generation-web/src/runware/` |
| image-to-video | i2v | `{Model}.image2video.ts` | `plugin-ai-video-generation-web/src/runware/` |

### 2. Read Required Documentation

**Before writing any code**, read these files in order:

1. **`specs/providers/patterns/ui-guidelines.md`** - CRITICAL
   - Which parameters to expose in UI (prompt, aspect_ratio, image_url)
   - Which parameters to NEVER expose (seed, cfg_scale, steps, enhance_prompt, etc.)
   - Standard aspect ratios and dimensions
   - JSON schema component reference

2. **`specs/providers/runware/implementation-notes.md`**
   - Complete TypeScript template with all imports
   - Complete JSON schema template with all required fields
   - Known issues and gotchas (TypeScript workarounds)

### 3. Fetch and Verify API Documentation (MANDATORY)

**CRITICAL**: You MUST fetch BOTH documentation sources and verify exact parameter names before writing any code. Do NOT assume parameter names based on feature descriptions.

#### Step 3a: Fetch General API Reference

Fetch the API reference for the inference type:

| Type | Documentation URL |
|------|-------------------|
| Image (T2I/I2I) | `https://runware.ai/docs/en/image-inference/api-reference.md` |
| Video (T2V/I2V) | `https://runware.ai/docs/en/video-inference/api-reference.md` |

```
WebFetch: https://runware.ai/docs/en/{image|video}-inference/api-reference.md
Extract:
- Complete list of allowed top-level parameters
- Request body structure
- Delivery method requirements (sync vs async)
- Response format and polling mechanism (for video)
```

**Record allowed parameters here** (example for video):
```
Allowed top-level: includeCost, taskUUID, taskType, model, height, width,
outputType, outputFormat, numberResults, positivePrompt, negativePrompt,
deliveryMethod, duration, frameImages, providerSettings, advancedFeatures,
fps, uploadEndpoint, outputQuality, webhookURL, ttl, seed, referenceImages, inputs
```

- [ ] Verified: I have the complete list of allowed top-level parameters

#### Step 3b: Fetch Provider-Specific Documentation

```
WebFetch: https://runware.ai/docs/en/providers/{vendor}.md
Extract:
- Model-specific AIR identifiers
- providerSettings.{vendor} options (CRITICAL!)
- Supported resolutions/dimensions
- Model-specific constraints or quirks
```

**Record provider-specific settings** (example for Google):
```
providerSettings.google:
  - generateAudio: boolean (default: true) - Controls audio generation
  - enhancePrompt: always enabled, cannot be disabled
```

- [ ] Verified: I have documented all `providerSettings.{vendor}` options
- [ ] Noted supported dimensions/resolutions from docs

#### Step 3c: Determine Dimension Pattern (T2V/I2V)

For video providers, check how dimensions are specified in the API docs:

| If docs say... | Use this pattern |
|----------------|------------------|
| "aspect_ratio: 16:9, 9:16, 1:1" | `aspect_ratio` enum (flexible) |
| "dimensions: 1280x720, 720x1280, 1920x1080, 1080x1920" | `format` enum with WxH values (fixed) |

- [ ] Dimension pattern: ___ (flexible aspect_ratio / fixed format)

See `specs/providers/patterns/text-to-video.md` for schema examples.

#### Step 3d: Verify Parameter Mapping

Before writing `mapInput`, verify EACH parameter:

| Feature | Parameter Location | Verified |
|---------|-------------------|----------|
| Prompt | `positivePrompt` (top-level) | [ ] |
| Dimensions | `width`, `height` (top-level) | [ ] |
| Duration | `duration` (top-level) | [ ] |
| Frame images | `frameImages` (top-level, for video) | [ ] |
| Audio generation | `providerSettings.google.generateAudio` (nested!) | [ ] |

**NEVER assume a feature is a top-level parameter. ALWAYS verify against the API docs.**

### 4. Extract Dimension Constraints (I2I/I2V Only)

**CRITICAL for image-to-image providers**: Extract width/height constraints from API docs.

When fetching documentation, look for:
```
width: integer, min: XXX, max: YYY, multiples of ZZ
height: integer, min: XXX, max: YYY, multiples of ZZ
```

- [ ] Record width constraints: min=___, max=___
- [ ] Record height constraints: min=___, max=___
- [ ] Record multiple (if any): ___

Example constraints by model:
| Model | Width | Height | Multiple |
|-------|-------|--------|----------|
| FLUX.2 [dev] | 512-2048 | 512-2048 | 16 |
| FLUX.2 [pro] | 256-1920 | 256-1920 | 16 |
| FLUX.2 [flex] | 256-1920 | 256-1920 | 16 |

### 5. Create Provider Files

Follow the structure in `specs/providers/runware/implementation-notes.md`:

- [ ] Create TypeScript file: `{ModelName}.{capability}.ts` (e.g., `Flux2Pro.text2image.ts`)
- [ ] Create JSON schema file: `{ModelName}.{capability}.json` (e.g., `Flux2Pro.text2image.json`)
- [ ] Define provider metadata (id, name, AIR)
- [ ] Define input schema with all parameters
- [ ] **For I2I**: Add `dimensionConstraints` to `createImageProvider` options:
  ```typescript
  dimensionConstraints: {
    width: { min: XXX, max: YYY },
    height: { min: XXX, max: YYY },
    multiple: ZZ  // optional
  }
  ```

### 6. Register Provider

Add export to the appropriate index file with nested structure:

```typescript
// packages/plugin-ai-image-generation-web/src/runware/index.ts
import { Flux2Pro as Flux2ProText2Image } from './Flux2Pro.text2image';
// Later: import { Flux2Pro as Flux2ProImage2Image } from './Flux2Pro.image2image';

const Runware = {
  Flux2Pro: {
    Text2Image: Flux2ProText2Image
    // Image2Image: Flux2ProImage2Image  // Added when I2I is implemented
  }
};

export default Runware;
```

### 7. Update translations.json (REQUIRED)

**CRITICAL**: Every provider needs UI translations for its properties.

| Capability | Translations File |
|------------|-------------------|
| text-to-image, image-to-image | `packages/plugin-ai-image-generation-web/translations.json` |
| text-to-video, image-to-video | `packages/plugin-ai-video-generation-web/translations.json` |

**Translation Key Pattern**: `ly.img.plugin-ai-{kind}-generation-web.{providerId}.property.{property-name}`

#### For Text-to-Image Providers

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

#### For Image-to-Image Providers

```json
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.image_url": "Source Image",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.prompt": "Prompt",
"ly.img.plugin-ai-image-generation-web.runware/{vendor}/{model-name}/image2image.property.prompt.placeholder": "Describe the changes..."
```

#### For Text-to-Video Providers

```json
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.prompt": "Prompt",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.prompt.placeholder": "Describe the video scene...",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio": "Aspect Ratio",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.16:9": "16:9 (Landscape)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.9:16": "9:16 (Vertical)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.aspect_ratio.1:1": "1:1 (Square)",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.duration": "Duration",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}.property.duration.{value}": "{X} seconds"
```

#### For Image-to-Video Providers

```json
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.image_url": "Source Image",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.prompt": "Prompt",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.prompt.placeholder": "Describe the video...",
"ly.img.plugin-ai-video-generation-web.runware/{vendor}/{model-name}/image2video.property.duration": "Duration"
```

#### Translation Guidelines

- **Property labels**: Use the same labels as the JSON schema `title` fields
- **Placeholders**: Add `.placeholder` suffix for textarea placeholder text (e.g., `.property.prompt.placeholder`)
- **Enum values**: Add human-readable labels for each enum option
- **Image vs Video naming**: Use "Format" for image `aspect_ratio`, "Aspect Ratio" for video
- **Provider ID**: Use the exact `providerId` from the TypeScript file (e.g., `runware/bfl/flux-2-dev`)

#### Translation Priority (Fallback Chain)

Translations follow this priority order (highest to lowest):
1. `ly.img.plugin-ai-{kind}-generation-web.{providerId}.property.{field}` - Provider-specific
2. `ly.img.plugin-ai-generation-web.property.{field}` - Generic base
3. `ly.img.plugin-ai-{kind}-generation-web.{providerId}.defaults.property.{field}` - Provider defaults
4. `ly.img.plugin-ai-generation-web.defaults.property.{field}` - Base defaults

This allows customers to override any translation at the provider level.

### 8. Add to Example App (REQUIRED)

**CRITICAL**: Every new provider MUST be added to `examples/ai/src/runwareProviders.ts`:

```typescript
import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';

export function createRunwareProviders(options: RunwareProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      // T2I providers use .Text2Image
      RunwareImage.Flux2Pro.Text2Image({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      // I2I providers use .Image2Image
      // RunwareImage.Flux2Pro.Image2Image({...})
    ],
    text2video: [
      // T2V providers use .Text2Video
    ],
    image2video: [
      // I2V providers use .Image2Video
    ]
  };
}
```

### 9. Update providers.md

Change status from `planned` to `implemented` for **only the capability you implemented**:

```markdown
| Provider | Model Name | AIR | Capability | Release Date | Status |
| BFL | FLUX.2 [pro] | `bfl:5@1` | text-to-image | Nov 2025 | implemented |
| BFL | FLUX.2 [pro] | `bfl:5@1` | image-to-image | Nov 2025 | planned |  ← Still planned!
```

### 10. Update README Documentation (REQUIRED)

**CRITICAL**: Every new provider MUST be documented in the plugin's README.md file.

| Capability | README File |
|------------|-------------|
| text-to-image, image-to-image | `packages/plugin-ai-image-generation-web/README.md` |
| text-to-video, image-to-video | `packages/plugin-ai-video-generation-web/README.md` |

#### Sections to Update

1. **Import statement** (if first Runware provider): Add `import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';` or video equivalent

2. **Providers section**: Add a numbered provider entry (e.g., `#### 14. Flux2Dev (Text-to-Image & Image-to-Image)`) with:
   - Code example showing configuration
   - Key features bullet list
   - Supported aspect ratios/resolutions

3. **API Reference section**: Add provider function signatures under "Runware Providers" subsection:
   ```typescript
   RunwareImage.Flux2Dev.Text2Image(config: RunwareProviderConfiguration)
   RunwareImage.Flux2Dev.Image2Image(config: RunwareProviderConfiguration)
   ```

4. **Panel IDs section**: Add provider panel IDs:
   ```
   - Runware Flux2Dev.Text2Image: `ly.img.ai.runware/bfl/flux-2-dev`
   - Runware Flux2Dev.Image2Image: `ly.img.ai.runware/bfl/flux-2-dev/image2image`
   ```

5. **Asset History section**: Add history source IDs:
   ```
   - Runware Flux2Dev.Text2Image: `runware/bfl/flux-2-dev.history`
   - Runware Flux2Dev.Image2Image: `runware/bfl/flux-2-dev/image2image.history`
   ```

#### Documentation Template

```markdown
#### N. {ModelName} (Text-to-Image & Image-to-Image)

{Description of the model}:

\`\`\`typescript
// Text-to-Image
text2image: RunwareImage.{ModelName}.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.{ModelName}.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
\`\`\`

Key features:
- {Feature 1}
- {Feature 2}
- Resolution: {min}-{max} pixels
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
```

### 11. Run Validation

```bash
pnpm --filter "@imgly/plugin-ai-*" check:all
```

Fix any:
- [ ] TypeScript errors
- [ ] Lint errors
- [ ] Build failures

### 12. Test (if demo available)

If the example app is set up:

```bash
cd examples/ai
pnpm dev
```

Verify the provider appears and generates correctly.

## Common Issues

| Issue | Solution |
|-------|----------|
| Dimension constraints | Check API docs for allowed sizes, implement validation |
| Missing AIR format | Use pattern `provider:model@version` |
| Type errors | Ensure schema matches provider interface |
| Export not found | Add to index.ts barrel export |
| **TS2741: Property 'paths' is missing** | Add `"paths": {}` to the JSON schema file |
| **TS2322: Type incompatible with Document** | Add `// @ts-ignore` before `schema:` property |

## Critical Reminders

1. **One capability = one provider file** - Never combine T2I and I2I in one file
2. **Always read `implementation-notes.md` first** - it has complete templates
3. **JSON schema must include `"paths": {}`** - OpenAPI type requirement
4. **Always use `// @ts-ignore` before schema** - TypeScript workaround for OpenAPI types
5. **Update providers.md for only the implemented capability** - Don't mark the whole model as done
6. **ALWAYS add to example app** - Every provider must be added to `examples/ai/src/runwareProviders.ts`
7. **For I2I: Set `dimensionConstraints` in provider** - Extract width/height min/max from API docs and pass to `createImageProvider`. Each provider defines its own constraints inline.
8. **ALWAYS add translations** - Add property translations to `translations.json` for all UI-visible properties using the pattern `ly.img.plugin-ai-image-generation-web.{providerId}.property.{property-name}`
9. **ALWAYS update README documentation** - Add provider to the plugin's README.md (Providers section, API Reference, Panel IDs, Asset History)
