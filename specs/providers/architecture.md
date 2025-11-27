# Provider Architecture

This document explains how providers fit into the AI plugin system and how to implement them.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CE.SDK Application                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              plugin-ai-apps-web (optional)                   ││
│  │         Orchestrates AI plugins into app structure           ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│    ┌─────────────┬───────────┼───────────┬─────────────┐        │
│    ▼             ▼           ▼           ▼             ▼        │
│  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐      │
│  │Image│     │Video│     │Audio│     │Text │     │Stick│      │
│  │ Gen │     │ Gen │     │ Gen │     │ Gen │     │ Gen │      │
│  └──┬──┘     └──┬──┘     └──┬──┘     └──┬──┘     └──┬──┘      │
│     │           │           │           │           │          │
│     └───────────┴───────────┴───────────┴───────────┘          │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              plugin-ai-generation-web                        ││
│  │         Base plugin: Provider interface, middleware,         ││
│  │         UI components, quick actions infrastructure          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Providers (per generation plugin):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Partner A   │ │  Partner B   │ │  Partner C   │
│  Providers   │ │  Providers   │ │  Providers   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Provider Interface

All providers implement the `Provider<K, I, O>` interface defined in:

**Source:** `packages/plugin-ai-generation-web/src/core/provider.ts`

The interface is generic over:
- `K extends OutputKind`: The output kind (`'image' | 'video' | 'audio' | 'text' | 'sticker'`)
- `I`: The provider-specific input type (e.g., `{ prompt: string; aspect_ratio?: string }`)
- `O extends Output`: The output type (e.g., `ImageOutput`)

## Creating Providers with Factory Functions

Each partner has a `create{Kind}Provider` utility that handles common boilerplate. These factories:
- Initialize API clients
- Wire up schema-based UI generation
- Handle image URL conversion for different APIs
- Merge configuration with defaults

### Partner Factory Locations

Each partner has factory functions at:
- Image: `plugin-ai-image-generation-web/src/{partner}/createImageProvider.ts`
- Video: `plugin-ai-video-generation-web/src/{partner}/createVideoProvider.ts`

See each partner's folder in `specs/providers/{partner}/` for specific implementation details. See `patterns/` for implementation patterns.

### Example: Text-to-Image Provider

```typescript
// packages/plugin-ai-image-generation-web/src/{partner}/{ModelName}.ts

import createImageProvider from './createImageProvider';

type ModelNameInput = {
  prompt: string;
  aspect_ratio?: string;
};

export function ModelName(config: PartnerProviderConfiguration) {
  return async ({ cesdk }) => {
    return createImageProvider<ModelNameInput>(
      {
        modelAIR: 'vendor:model@version',
        providerId: '{partner}/vendor/model-name',
        name: 'Model Display Name',
        schema,
        inputReference: '#/components/schemas/ModelNameInput',

        // See "mapInput" section below
        mapInput: (input) => ({
          // Transform to partner's API format
          prompt: input.prompt,
          width: dims.width,
          height: dims.height
        }),

        // See "getBlockInput" section below
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
      },
      config
    );
  };
}
```

### Example: Image-to-Image Provider with Quick Actions

```typescript
// packages/plugin-ai-image-generation-web/src/{partner}/{ModelNameEdit}.ts

export function ModelNameEdit(config: PartnerProviderConfiguration) {
  return async ({ cesdk }) => {
    return createImageProvider<ModelNameEditInput>(
      {
        // ... basic config ...

        // Quick action support - see section below
        supportedQuickActions: {
          'ly.img.editImage': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.createVariant': {
            mapInput: (input) => ({
              prompt: input.prompt ?? 'Create a variant',
              image_url: input.uri
            })
          }
        },

        // For I2I: derive dimensions from input image
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          return { image: { width, height } };
        },

        // Map to partner's API format
        mapInput: (input) => ({
          prompt: input.prompt,
          source_image: input.image_url
        })
      },
      config
    );
  };
}
```

## Critical Implementation Details

### The `mapInput` Function

**Purpose:** Transforms the provider's internal input type to the API's expected format.

**Why it matters:** Each AI API has different parameter names and structures. The provider's input type is what the UI generates (based on the OpenAPI schema), but the API may expect completely different field names.

```typescript
// Provider input type (matches OpenAPI schema, shown in UI)
type ModelNameInput = {
  prompt: string;
  aspect_ratio?: string;
};

// mapInput transforms to partner's API format
mapInput: (input) => ({
  text_prompt: input.prompt,      // Partner API may use different name
  width: dims.width,              // API wants explicit dimensions
  height: dims.height             // not aspect_ratio
})
```

**Common patterns:**
- `prompt` → partner-specific field name (e.g., `text_prompt`, `positivePrompt`)
- `image_url` → partner-specific field name (e.g., `source_image`, `init_image`, `seedImage`)
- `aspect_ratio` → `{ width, height }` (most APIs want explicit dimensions)

### The `getBlockInput` Function

**Purpose:** Tells the system the expected output dimensions before generation starts.

**Why it matters:** When using `userFlow: 'placeholder'`, a placeholder block is created in the canvas while generation runs. The system needs to know the output dimensions to:
1. Create a correctly-sized placeholder
2. Reserve appropriate space in the layout
3. Show accurate loading state

```typescript
// For T2I: derive from user-selected size/aspect ratio
getBlockInput: (input) => ({
  image: { width: 1024, height: 1024 }
})

// For I2I: derive from input image
getBlockInput: async (input) => {
  const { width, height } = await getImageDimensionsFromURL(input.image_url, engine);
  return { image: { width, height } };
}

// For video
getBlockInput: (input) => ({
  video: { width: 1280, height: 720, duration: 5 }
})
```

**Shortcuts in factory functions:**
- `getImageSize`: Simpler alternative that just returns `{ width, height }`
- Auto-detection: Factories try to extract from `aspect_ratio`, `image_size`, or `size` fields

### Quick Action Support via `mapInput`

**Purpose:** Enables the provider to work with quick actions (contextual AI actions in the canvas).

**Why it matters:** Quick actions pass their own input format to providers. Each quick action defines its `InputType` (e.g., `EditImage` passes `{ prompt: string; uri: string }`). Providers must map this to their expected input format.

**Source:** Quick actions are defined in `plugin-ai-{kind}-generation-web/src/quickActions/`

```typescript
// Quick action defines its output (what it passes to provider)
// See: plugin-ai-image-generation-web/src/quickActions/EditImage.ts
export type InputType = {
  prompt: string;
  uri: string;  // The image URI from the canvas
};

// Provider declares support and maps the input
supportedQuickActions: {
  'ly.img.editImage': {
    mapInput: (quickActionInput) => ({
      prompt: quickActionInput.prompt,
      image_url: quickActionInput.uri  // Map uri → image_url
    })
  },
  'ly.img.createVariant': true,  // Direct pass-through (types match)
  'ly.img.styleTransfer': false  // Explicitly unsupported
}
```

**Mapping options:**
- `{ mapInput: fn }`: Transform quick action input to provider input
- `true`: Direct pass-through when types are compatible
- `false` / omitted: Not supported

## Configuration Flow

```
User Configuration
        │
        ▼
┌──────────────────┐
│ Provider Factory │  e.g., Partner.ModelName(config)
│   (exported fn)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Factory Creator  │  e.g., createImageProvider()
│ (internal util)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Provider Object  │  implements Provider<K, I, O>
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Plugin registers │  ImageGeneration plugin
│   provider       │
└──────────────────┘
```

## File Organization

```
packages/plugin-ai-{kind}-generation-web/
├── package.json                      # Includes partner export paths
├── src/
│   ├── index.ts                      # Main plugin export
│   ├── {partner}/                    # Partner-specific providers
│   │   ├── index.ts                  # Barrel export (exports Partner object)
│   │   ├── {Model}.ts                # Provider implementation
│   │   ├── {Model}.json              # OpenAPI schema
│   │   ├── types.ts                  # Partner-specific types
│   │   ├── utils.ts                  # Partner-specific utilities
│   │   └── create{Kind}Provider.ts   # Factory function
│   │
│   ├── types.ts                      # Plugin-level types
│   ├── quickActions/                 # Quick action definitions
│   │   ├── EditImage.ts              # Each quick action file
│   │   ├── CreateVariant.ts          # defines ID, InputType, render
│   │   └── types.ts                  # Shared quick action types
│   └── plugin.ts                     # Plugin entry point
```

## Partner Export Pattern

Partner providers are exported as **separate entry points** from the plugin package, not from the main export. This keeps the main plugin lean and allows tree-shaking of unused partners.

### Package.json Exports

Each partner gets its own export path in the plugin's `package.json`:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./{partner}": {
      "import": "./dist/{partner}/index.mjs",
      "types": "./dist/{partner}/index.d.ts"
    }
  }
}
```

### Partner Index File

Each partner folder has an `index.ts` that exports a namespace object containing all providers:

```typescript
// src/{partner}/index.ts
import { ModelA } from './ModelA';
import { ModelB } from './ModelB';
import { ModelCEdit } from './ModelCEdit';

const Partner = {
  ModelA,
  ModelB,
  ModelCEdit
};
export default Partner;
```

### Consumer Usage

Users import partner providers from the sub-path:

```typescript
// Import partner providers from sub-path
import Partner from '@imgly/plugin-ai-image-generation-web/{partner}';

// Use providers
ImageGeneration({
  providers: [
    Partner.ModelA({ proxyUrl: '...' }),
    Partner.ModelB({ proxyUrl: '...' })
  ]
});
```

## Initialization Sequence

1. Plugin loads provider factory functions
2. User calls factory with configuration: `Partner.ModelName({ proxyUrl: '...' })`
3. Factory returns async initializer function
4. Plugin calls initializer with `{ cesdk }` context
5. Provider:
   - Registers icons and translations (see `patterns/i18n.md`)
   - Registers provider-specific feature flags if needed (see `patterns/feature-api.md`)
   - Creates API client for the partner
   - Builds and returns Provider object
6. Plugin registers provider for use

## Feature API Integration

Most providers don't need to register feature flags - the plugin handles standard features automatically.

Only register provider-specific feature flags if your provider has toggleable sub-features (e.g., Recraft's style groups). See `patterns/feature-api.md` for the rare cases when this is needed.

## Internationalization (i18n)

All providers must register translations during initialization. See `patterns/i18n.md` for full details.

**Required translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated Images'
  }
});
```

**Translation key patterns:**
- `libraries.{panelId}.history.label` - History/generated items label
- `panel.{panelId}.{feature}` - Panel-specific labels
- `ly.img.plugin-ai-{kind}-generation-web.{modelKey}.property.{prop}.{value}` - Enum value labels

**Default translations** are provided for common properties (prompt, aspect_ratio, style, etc.) - only register custom values.

## Related Documentation

- `patterns/text-to-image.md` - T2I implementation details
- `patterns/image-to-image.md` - I2I implementation details
- `patterns/text-to-video.md` - T2V implementation details
- `patterns/image-to-video.md` - I2V implementation details
- `patterns/quick-actions.md` - Quick action patterns
- `patterns/feature-api.md` - Feature flag integration
- `patterns/i18n.md` - Internationalization patterns
