# Image-to-Video (I2V) Provider Pattern

Implementation guide for image-to-video providers. For general principles, see [ui-guidelines.md](./ui-guidelines.md), [quick-actions.md](./quick-actions.md), and [architecture.md](../architecture.md).

## Overview

| Property | Value |
|----------|-------|
| Kind | `'video'` |
| Output Type | `VideoOutput { kind: 'video'; url: string }` |
| Primary Input | Image URL (+ optional prompt) |
| Factory | `createVideoProvider` |

## Input Schema

### Required Fields

| Field | Type | UI Component |
|-------|------|--------------|
| `image_url` | `string` | `ImageUrl` |

### Recommended Optional Fields

| Field | Type | UI Component | Include When |
|-------|------|--------------|--------------|
| `prompt` | `string` | `TextArea` | Motion/animation guidance |
| `duration` | `enum` or `number` | `Select` or `Slider` | Always |
| `last_frame_url` | `string` | `ImageUrl` | First+last frame models |

### Output Dimensions

I2V providers derive output dimensions from the input image - no aspect ratio selection needed.

## Key Differences from T2V

| Aspect | T2V | I2V |
|--------|-----|-----|
| Primary input | Prompt only | Image (+ optional prompt) |
| Dimensions | User-selected aspect ratio | Derived from input image |
| Block input | Sync `getBlockInput` | Async `getBlockInput` |
| Quick actions | `ly.img.createVideo` (prompt) | `ly.img.createVideo` (image) |
| i18n | Not needed | Image selection text required |

## TypeScript Template

```typescript
import { getPanelId } from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './{ModelName}.json';
import createVideoProvider from './createVideoProvider';
import { ProviderConfiguration } from './types';

type {ModelName}Input = {
  image_url: string;
  prompt?: string;
  duration?: number;
};

export function {ModelName}(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const providerId = '{partner}/{vendor}/{model-name}';

    // Required i18n for image selection UI
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]: 'Select Image To Animate',
        [`libraries.${getPanelId(providerId)}.history.label`]: 'Generated From Image'
      }
    });

    return createVideoProvider<{ModelName}Input>(
      {
        modelId: '{model-identifier}',
        providerId,
        name: '{Display Name}',
        schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],

        // Quick action support
        supportedQuickActions: {
          'ly.img.createVideo': {
            mapInput: (input) => ({
              image_url: input.uri,
              prompt: input.prompt ?? ''
            })
          }
        },

        // Async - reads dimensions from input image
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          return {
            video: {
              width,
              height,
              duration: input.duration ?? 5
            }
          };
        },

        mapInput: (input) => ({
          image: input.image_url,
          prompt: input.prompt ?? '',
          duration: input.duration ?? 5
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
            "title": "Motion Prompt",
            "maxLength": 1000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "duration": {
            "type": "number",
            "title": "Duration",
            "minimum": 1,
            "maximum": 10,
            "default": 5
          }
        },
        "required": ["image_url"],
        "x-fal-order-properties": ["image_url", "prompt", "duration"]
      }
    }
  }
}
```

## First + Last Frame Pattern

For models that interpolate between two images:

### Input Type

```typescript
type FirstLastFrameInput = {
  first_frame_url: string;
  last_frame_url: string;
  prompt?: string;
  duration?: number;
};
```

### JSON Schema Addition

```json
{
  "first_frame_url": {
    "type": "string",
    "title": "First Frame",
    "x-imgly-builder": { "component": "ImageUrl" }
  },
  "last_frame_url": {
    "type": "string",
    "title": "Last Frame",
    "x-imgly-builder": { "component": "ImageUrl" }
  }
}
```

### Quick Action Support

```typescript
supportedQuickActions: {
  'ly.img.animateBetweenImages': {
    mapInput: (input) => ({
      first_frame_url: input.firstFrameUri,
      last_frame_url: input.lastFrameUri,
      prompt: ''
    })
  }
}
```

## Quick Actions

I2V providers commonly support (see [quick-actions.md](./quick-actions.md) for full reference):

| Quick Action | Input → Provider Mapping |
|--------------|--------------------------|
| `ly.img.createVideo` | `uri` → `image_url`, `prompt` → `prompt` |
| `ly.img.animateBetweenImages` | `firstFrameUri` → `first_frame_url`, `lastFrameUri` → `last_frame_url` |

## Checklist

- [ ] TypeScript provider file with `createVideoProvider`
- [ ] JSON schema with `ImageUrl` component for input image
- [ ] Export added to partner `index.ts`
- [ ] **i18n**: Image selection UI (`panel.{panelId}.imageSelection`) - see `i18n.md`
- [ ] **i18n**: History label (`libraries.{panelId}.history.label`)
- [ ] **i18n**: Custom enum translations if applicable
- [ ] `supportedQuickActions` with appropriate mappings
- [ ] `getBlockInput` reads dimensions from input image (async) + includes duration
- [ ] `mapInput` transforms to API format
- [ ] If supporting first+last frame, add `ly.img.animateBetweenImages` quick action
- [ ] Build passes: `pnpm --filter "@imgly/plugin-ai-*" check:all`
