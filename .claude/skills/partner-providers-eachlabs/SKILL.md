---
name: partner-providers-eachlabs
description: |
  Discover and implement EachLabs AI providers. Use when: checking for new
  EachLabs models, implementing EachLabs providers, updating providers.md status,
  or working with EachLabs API integrations.
---

# EachLabs Provider Management

Manage the lifecycle of EachLabs AI providers: discover new models via API and implement them as IMG.LY providers.

## Key Advantages Over Other Providers

EachLabs provides a **structured API** for model discovery:
1. **Programmatic model listing** - No need to scrape documentation
2. **request_schema** - Each model includes JSON Schema for inputs (similar to fal.ai)
3. **Consistent API patterns** - Unified prediction/polling interface across all models

## Key Files

- **Provider Tracking**: `specs/providers/eachlabs/providers.md`
- **Provider Specifications**: `specs/providers/` (schemas, architecture)
- **Provider Implementations**:
  - Image: `packages/plugin-ai-image-generation-web/src/eachlabs/`
  - Video: `packages/plugin-ai-video-generation-web/src/eachlabs/`
- **README Documentation**:
  - Image: `packages/plugin-ai-image-generation-web/README.md`
  - Video: `packages/plugin-ai-video-generation-web/README.md`

## EachLabs API Reference

### Base URL
```
https://api.eachlabs.ai
```

### Authentication
- API Key via header: `X-API-Key: <your-api-key>`
- **Discovery endpoints do NOT require authentication:**
  - `GET /v1/models` - List all models
  - `GET /v1/model?slug=<slug>` - Get model details including `request_schema`
- **Prediction endpoints require API key:**
  - `POST /v1/prediction` - Create prediction
  - `GET /v1/prediction/{id}` - Get prediction status

### Endpoints

#### List All Models (No Auth Required)
```
GET /v1/models?limit=500&offset=0&name=<filter>
```

Response:
```json
{
  "models": [
    {
      "title": "Flux 2 Pro",
      "slug": "flux-2-pro",
      "version": "0.0.1",
      "output_type": "image"
    }
  ]
}
```

#### Get Model Details (No Auth Required)
```
GET /v1/model?slug=<model-slug>
```

Response includes `request_schema`:
```json
{
  "title": "Flux 2 Pro",
  "slug": "flux-2-pro",
  "version": "0.0.1",
  "output_type": "image",
  "request_schema": {
    "type": "object",
    "required": ["prompt"],
    "properties": {
      "prompt": {
        "type": "string",
        "default": "",
        "description": "The prompt to generate an image from."
      },
      "image_size": {
        "type": "string",
        "default": "landscape_4_3",
        "enum": ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"]
      }
    }
  }
}
```

#### Create Prediction (Auth Required)
```
POST /v1/prediction
Content-Type: application/json
X-API-Key: <api-key>

{
  "model": "flux-2-pro",
  "version": "0.0.1",
  "input": { ... }
}
```

#### Get Prediction Status (Auth Required)
```
GET /v1/prediction/{id}
X-API-Key: <api-key>
```

Response:
```json
{
  "id": "...",
  "status": "success|processing|starting|failed|cancelled",
  "output": { ... },
  "predict_time": 12.5,
  "cost": 0.05
}
```

## Workflow Overview

This skill operates in two phases:

1. **Discovery** (automatic): Fetch models via API and compare against tracked models
2. **Implementation** (user-approved): Create provider files for selected models

## Phase 1: Discovery

Run the discovery script to get available models:

```bash
node .claude/skills/partner-providers-eachlabs/discover-models.mjs
```

This outputs a minimal JSON array with `slug`, `title`, and `output_type` for each model. Compare against `specs/providers/eachlabs/providers.md` to identify new models.

For detailed steps, see `DISCOVERY_CHECKLIST.md`.

### Model Categories

Classify models by `output_type`:
- `image` - Image generation (text-to-image, image-to-image)
- `video` - Video generation (text-to-video, image-to-video)
- `audio` - Audio generation
- `text` - Text generation
- `array` - Multi-output (e.g., multiple images)

### Determining Capability from Slug/Schema

| Pattern | Capability |
|---------|------------|
| `-text-to-video` | text-to-video |
| `-image-to-video` | image-to-video |
| `image_url` in required | image-to-image or image-to-video |
| Only `prompt` required, output=image | text-to-image |
| Only `prompt` required, output=video | text-to-video |

### Discovery Output Format

```
## Discovery Results

### New Models Found
| Slug | Name | Type | Capability | Recommendation |
|------|------|------|------------|----------------|
| flux-2-pro | Flux 2 Pro | image | t2i | implement |

### Updated Models
| Slug | Change |
|------|--------|
| ... | ... |

### Summary
- X new models found
- Y recommended for implementation
- Z skipped (older versions, niche use cases)
```

After presenting results, ask: "Which models would you like me to implement?"

## Phase 2: Implementation

Only proceed after user approval. Follow `IMPLEMENTATION_CHECKLIST.md` to:

1. Fetch model details to get `request_schema`
2. Convert `request_schema` to OpenAPI format (add x-imgly-* extensions)
3. Create provider TypeScript file and JSON schema
4. Export provider from `eachlabs/index.ts`
5. Add translations to `translations.json`
6. Add to example app (`examples/ai/src/eachlabsProviders.ts`)
7. Update `specs/providers/eachlabs/providers.md` status to "implemented"
8. Update README documentation
9. Run build checks: `pnpm --filter "@imgly/plugin-ai-*" check:all`

### Schema Conversion

EachLabs `request_schema` is JSON Schema format. Convert to OpenAPI with IMG.LY extensions:

**Input (EachLabs):**
```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "The prompt"
    },
    "image_size": {
      "type": "string",
      "enum": ["square", "landscape_4_3"]
    }
  }
}
```

**Output (OpenAPI with extensions):**
```json
{
  "openapi": "3.0.0",
  "info": { "title": "EachLabs API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "ModelNameInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "title": "Prompt",
            "type": "string",
            "description": "The prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "image_size": {
            "title": "Format",
            "type": "string",
            "enum": ["square", "landscape_4_3"],
            "x-imgly-enum-labels": {
              "square": "Square",
              "landscape_4_3": "Landscape 4:3"
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

### UI Component Mapping

| JSON Schema Type | x-imgly-builder component |
|------------------|---------------------------|
| `string` (long text) | `TextArea` |
| `string` (enum) | `Select` |
| `string` (url/image) | Custom via `renderCustomProperty` |
| `boolean` | `Switch` |
| `integer`/`number` | `Number` |

## Status Values

When updating providers.md:

| Status | When to Use |
|--------|-------------|
| `implemented` | Provider code exists and works |
| `planned` | Will implement (high priority) |
| `skipped` | Intentionally not implementing (older version, limited use) |
| `undecided` | Needs discussion |

## References

### Skill Files (this folder)
- `discover-models.mjs` - **Discovery script** (run to find new models)
- `DISCOVERY_CHECKLIST.md` - Step-by-step discovery process
- `IMPLEMENTATION_CHECKLIST.md` - Step-by-step implementation process

### Provider Specifications
- `specs/providers/README.md` - Overview of provider system
- `specs/providers/architecture.md` - How providers fit into the plugin system
- `specs/providers/patterns/ui-guidelines.md` - **CRITICAL**: Which parameters to expose/hide in UI
- `specs/providers/patterns/text-to-image.md` - T2I implementation pattern
- `specs/providers/patterns/image-to-image.md` - I2I implementation pattern
- `specs/providers/patterns/text-to-video.md` - T2V implementation pattern
- `specs/providers/patterns/image-to-video.md` - I2V implementation pattern

### EachLabs-Specific
- `specs/providers/eachlabs/providers.md` - Model inventory and status
