# Image-to-Image (I2I) Provider Pattern

Implementation guide for image-to-image providers. For general principles, see [UI-GUIDELINES.md](./UI-GUIDELINES.md), [quick-actions.md](./quick-actions.md), and [ARCHITECTURE.md](../ARCHITECTURE.md).

## Overview

| Property | Value |
|----------|-------|
| Kind | `'image'` |
| Output Type | `ImageOutput { kind: 'image'; url: string }` |
| Primary Input | Image URL + Text prompt |
| Factory | `createImageProvider` |

## Input Schema

### Required Fields

| Field | Type | UI Component |
|-------|------|--------------|
| `image_url` | `string` | `ImageUrl` |
| `prompt` | `string` | `TextArea` |

### Recommended Optional Fields

| Field | Type | UI Component | Include When |
|-------|------|--------------|--------------|
| `style` | `enum` | `Select` | Provider has 3+ distinct styles |

### Output Dimensions

I2I providers derive output dimensions from the input image - no aspect ratio selection needed.

## Key Differences from T2I

| Aspect | T2I | I2I |
|--------|-----|-----|
| Primary input | Prompt only | Image + Prompt |
| Dimensions | User-selected aspect ratio | Derived from input image |
| Block input | `getImageSize(input)` | `getBlockInput(input)` async |
| Quick actions | None | Multiple supported |
| i18n | Not needed | Image selection text required |

## TypeScript Template

```typescript
import { getPanelId } from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './{ModelName}.json';
import createImageProvider from './createImageProvider';
import { ProviderConfiguration } from './types';

type {ModelName}Input = {
  image_url: string;
  prompt: string;
  style?: string;
};

export function {ModelName}(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const providerId = '{partner}/{vendor}/{model-name}';

    // Required i18n for image selection UI
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]: 'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]: 'Generated From Image'
      }
    });

    return createImageProvider<{ModelName}Input>(
      {
        modelAIR: '{partner}:{model}@{version}',
        providerId,
        name: '{Display Name}',
        schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],

        // Quick action support - see quick-actions.md for all options
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

        // Async - reads dimensions from input image
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          return { image: { width, height } };
        },

        mapInput: (input) => ({
          positivePrompt: input.prompt,  // Map to API field name
          seedImage: input.image_url     // Map to API field name
        })
      },
      config
    );
  };
}
```

## JSON Schema Template

```json
{
  "openapi": "3.0.0",
  "info": { "title": "{Model Name} API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "{ModelName}Input": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "title": "Input Image",
            "x-imgly-builder": { "component": "ImageUrl" }
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt"]
      }
    }
  }
}
```

## Quick Actions

I2I providers commonly support these quick actions (see [quick-actions.md](./quick-actions.md) for full reference):

| Quick Action | Input → Provider Mapping |
|--------------|--------------------------|
| `ly.img.editImage` | `uri` → `image_url`, `prompt` → `prompt` |
| `ly.img.createVariant` | `uri` → `image_url`, `prompt` → `prompt` (with default) |
| `ly.img.styleTransfer` | `uri` → `image_url`, `style` → `prompt` |
| `ly.img.artistTransfer` | `uri` → `image_url`, `artist` → `prompt` |

## Checklist

- [ ] TypeScript provider file with `createImageProvider`
- [ ] JSON schema with `ImageUrl` component for input image
- [ ] Export added to partner `index.ts`
- [ ] **i18n**: Image selection UI (`panel.{panelId}.imageSelection`) - see `i18n.md`
- [ ] **i18n**: History label (`libraries.{panelId}.history.label`)
- [ ] **i18n**: Custom enum translations if applicable
- [ ] `supportedQuickActions` with appropriate mappings
- [ ] `getBlockInput` reads dimensions from input image (async)
- [ ] `mapInput` transforms to API format
- [ ] Build passes: `pnpm --filter "@imgly/plugin-ai-*" check:all`
