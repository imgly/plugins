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

### 2. Read Implementation Notes

**Before writing any code**, read `specs/providers/runware/implementation-notes.md` which contains:
- Complete TypeScript template with all imports
- Complete JSON schema template with all required fields
- Known issues and gotchas (TypeScript workarounds)

This file has copy-paste ready templates - use them as your starting point.

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

### 6. Update providers.md

Change status from `planned` to `implemented` in `specs/providers/runware/providers.md`:

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
| **TS2741: Property 'paths' is missing** | Add `"paths": {}` to the JSON schema file |
| **TS2322: Type incompatible with Document** | Add `// @ts-ignore` before `schema:` property |

## Critical Reminders

1. **Always read `implementation-notes.md` first** - it has complete templates
2. **JSON schema must include `"paths": {}`** - OpenAPI type requirement
3. **Always use `// @ts-ignore` before schema** - TypeScript workaround for OpenAPI types
