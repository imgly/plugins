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

### 2. Find Reference Provider

Locate an existing Runware provider of the same type:

```
Glob: packages/plugin-ai-image-generation-web/src/runware/*.ts
```

Use the most similar model as a template (same provider family if possible).

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

### 6. Update PROVIDERS.md

Change status from `planned` to `implemented` in `specs/providers/runware/PROVIDERS.md`:

```markdown
| Provider | Model Name | AIR | Capabilities | Release Date | Status |
| ... | ... | ... | ... | ... | implemented |
```

### 7. Run Validation

```bash
pnpm --filter "@imgly/plugin-ai-*" check:all
```

Fix any:
- [ ] TypeScript errors
- [ ] Lint errors
- [ ] Build failures

### 8. Test (if demo available)

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
