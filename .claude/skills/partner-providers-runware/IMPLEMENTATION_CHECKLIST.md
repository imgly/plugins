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

### 3. Fetch Detailed API Documentation

```
WebFetch: https://runware.ai/docs/en/providers/{provider}.md
Extract:
- Required parameters
- Optional parameters with defaults
- Dimension/resolution constraints
- Any model-specific quirks
```

### 4. Create Provider Files

Follow the structure in `specs/providers/runware/implementation-notes.md`:

- [ ] Create TypeScript file: `{ModelName}.{capability}.ts` (e.g., `Flux2Pro.text2image.ts`)
- [ ] Create JSON schema file: `{ModelName}.{capability}.json` (e.g., `Flux2Pro.text2image.json`)
- [ ] Define provider metadata (id, name, AIR)
- [ ] Define input schema with all parameters
- [ ] Implement dimension handling if applicable

### 5. Register Provider

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

### 6. Add to Example App

Add the provider to `examples/ai/src/runwareProviders.ts`:

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

### 7. Update providers.md

Change status from `planned` to `implemented` for **only the capability you implemented**:

```markdown
| Provider | Model Name | AIR | Capability | Release Date | Status |
| BFL | FLUX.2 [pro] | `bfl:5@1` | text-to-image | Nov 2025 | implemented |
| BFL | FLUX.2 [pro] | `bfl:5@1` | image-to-image | Nov 2025 | planned |  ← Still planned!
```

### 8. Run Validation

```bash
pnpm --filter "@imgly/plugin-ai-*" check:all
```

Fix any:
- [ ] TypeScript errors
- [ ] Lint errors
- [ ] Build failures

### 9. Test (if demo available)

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
