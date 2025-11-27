# Implementation Checklist

Step-by-step process for implementing Runware providers.

## Prerequisites

- [ ] User has approved which models to implement
- [ ] Model AIR and capabilities are known from discovery phase

## Implementation Steps

### 1. Determine Provider Type

Map capabilities to provider type:

| Primary Capability | Provider Type | Target Directory | Schema Doc |
|-------------------|---------------|------------------|------------|
| text-to-image | t2i | `plugin-ai-image-generation-web/src/runware/` | `specs/providers/schemas/text-to-image.md` |
| image-to-image | i2i | `plugin-ai-image-generation-web/src/runware/` | `specs/providers/schemas/image-to-image.md` |
| text-to-video | t2v | `plugin-ai-video-generation-web/src/runware/` | `specs/providers/schemas/text-to-video.md` |
| image-to-video | i2v | `plugin-ai-video-generation-web/src/runware/` | `specs/providers/schemas/image-to-video.md` |

For models with multiple capabilities (e.g., text-to-image AND image-to-image), create one provider that supports both input types.

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

### 4. Create Provider File

Follow the structure in the appropriate `specs/providers/schemas/{type}.md` and `specs/providers/runware/implementation-notes.md`:

- [ ] Create file: `{ModelName}.ts` (PascalCase, no spaces)
- [ ] Define provider metadata (id, name, AIR)
- [ ] Define input schema with all parameters
- [ ] Implement dimension handling if applicable
- [ ] Add to provider index exports

### 5. Register Provider

Add export to the appropriate index file:

```typescript
// packages/plugin-ai-image-generation-web/src/runware/index.ts
import { {ModelName} } from './{ModelName}';

const Runware = {
  // ... existing providers
  {ModelName},
};
```

### 6. Add to Example App

Add the provider to `examples/ai/src/runwareProviders.ts`:

```typescript
import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';

export function createRunwareProviders(options: RunwareProviderOptions) {
  const { imageRateLimitMiddleware, errorMiddleware, proxyUrl } = options;

  return {
    text2image: [
      // Add T2I providers here
      RunwareImage.{ModelName}({
        middlewares: [imageRateLimitMiddleware, errorMiddleware],
        proxyUrl
      })
    ],
    image2image: [
      // Add I2I providers here
    ],
    text2video: [
      // Add T2V providers here
    ],
    image2video: [
      // Add I2V providers here
    ]
  };
}
```

Place the provider in the appropriate array based on its type.

### 7. Update providers.md

Change status from `planned` to `implemented` in `specs/providers/runware/providers.md`:

```markdown
| Provider | Model Name | AIR | Capabilities | Release Date | Status |
| ... | ... | ... | ... | ... | implemented |
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

1. **Always read `implementation-notes.md` first** - it has complete templates
2. **JSON schema must include `"paths": {}`** - OpenAPI type requirement
3. **Always use `// @ts-ignore` before schema** - TypeScript workaround for OpenAPI types
