# Text-to-Video (T2V) Provider Pattern

Implementation guide for text-to-video providers. For general principles, see [ui-guidelines.md](./ui-guidelines.md) and [architecture.md](../architecture.md).

## Overview

| Property | Value |
|----------|-------|
| Kind | `'video'` |
| Output Type | `VideoOutput { kind: 'video'; url: string }` |
| Primary Input | Text prompt |
| Factory | `createVideoProvider` |

## Input Schema

### Required Fields

| Field | Type | UI Component |
|-------|------|--------------|
| `prompt` | `string` | `TextArea` |

### Recommended Optional Fields

| Field | Type | UI Component | Include When |
|-------|------|--------------|--------------|
| `aspect_ratio` | `enum` | `Select` with icons | Model accepts any aspect ratio |
| `duration` | `enum` or `number` | `Select` or `Slider` | Always |
| `resolution` | `enum` | `Select` | Provider has quality levels |
| `format` | `enum` | `Select` with icons | Model only accepts fixed WxH combinations (see below) |

### Dimension Patterns

**Flexible (default)**: Use `aspect_ratio` when the model accepts aspect ratios and calculates dimensions internally.

**Fixed dimensions**: Some models (e.g., Veo 3.1) only accept specific pixel combinations. Use a single `format` field with WxH values:

```json
"format": {
  "title": "Format",
  "type": "string",
  "enum": ["1280x720", "720x1280", "1920x1080", "1080x1920"],
  "default": "1280x720",
  "x-imgly-enum-labels": {
    "1280x720": "Landscape HD (1280×720)",
    "720x1280": "Portrait HD (720×1280)"
  },
  "x-imgly-enum-icons": {
    "1280x720": "@imgly/plugin/formats/ratio16by9",
    "720x1280": "@imgly/plugin/formats/ratio9by16"
  }
}
```

**How to choose**: Check API docs for "supported dimensions". If it lists specific pixel values, use `format`. If it accepts aspect ratios like "16:9", use `aspect_ratio`.

## Key Differences from Image Providers

| Aspect | Image Provider | Video Provider |
|--------|----------------|----------------|
| Kind | `'image'` | `'video'` |
| Output | `ImageOutput` | `VideoOutput` |
| Block input | `{ image: { width, height } }` | `{ video: { width, height, duration } }` |
| Factory | `createImageProvider` | `createVideoProvider` |
| Model ID field | `modelAIR` | `modelId` |

## TypeScript Template

```typescript
import { addIconSetOnce, getPanelId } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './{ModelName}.json';
import createVideoProvider from './createVideoProvider';
import { ProviderConfiguration, getVideoDimensionsFromAspectRatio } from './types';

type {ModelName}Input = {
  prompt: string;
  aspect_ratio?: string;
  duration?: number;
};

export function {ModelName}(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const modelKey = '{partner}/{vendor}/{model-name}';

    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    // Register translations
    cesdk.i18n.setTranslations({
      en: {
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated Videos'
      }
    });

    return createVideoProvider<{ModelName}Input>(
      {
        modelId: '{model-identifier}',
        providerId: '{partner}/{vendor}/{model-name}',
        name: '{Display Name}',
        schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],

        // Video requires duration in block input
        getBlockInput: (input) => {
          const dims = getVideoDimensionsFromAspectRatio(input.aspect_ratio ?? '16:9');
          return {
            video: {
              width: dims.width,
              height: dims.height,
              duration: input.duration ?? 5
            }
          };
        },

        mapInput: (input) => ({
          prompt: input.prompt,
          aspect_ratio: input.aspect_ratio ?? '16:9',
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
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "9:16", "1:1"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape (16:9)",
              "9:16": "Portrait (9:16)",
              "1:1": "Square (1:1)"
            },
            "x-imgly-enum-icons": {
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "1:1": "@imgly/plugin/formats/ratio1by1"
            }
          },
          "duration": {
            "type": "number",
            "title": "Duration",
            "minimum": 1,
            "maximum": 10,
            "default": 5,
            "x-imgly-builder": {
              "component": "Slider",
              "props": { "min": 1, "max": 10, "step": 1 }
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "duration"]
      }
    }
  }
}
```

## Quick Actions

T2V providers typically support:

| Quick Action | Use Case |
|--------------|----------|
| `ly.img.createVideo` | Generate video from prompt (no image input) |

```typescript
supportedQuickActions: {
  'ly.img.createVideo': {
    mapInput: (input) => ({
      prompt: input.prompt ?? ''
    })
  }
}
```

## Checklist

- [ ] TypeScript provider file with `createVideoProvider`
- [ ] JSON schema with duration field (Slider or Select)
- [ ] Export added to partner `index.ts`
- [ ] **i18n**: History label registered (`libraries.{panelId}.history.label`) - see `i18n.md`
- [ ] **i18n**: Custom enum translations if applicable
- [ ] `getBlockInput` returns `video` with width, height, AND duration
- [ ] `mapInput` transforms to API format
- [ ] Quick action support for `ly.img.createVideo` if applicable
- [ ] Build passes: `pnpm --filter "@imgly/plugin-ai-*" check:all`
