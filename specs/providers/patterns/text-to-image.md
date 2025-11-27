# Text-to-Image (T2I) Provider Pattern

Implementation guide for text-to-image providers. For general principles, see [UI-GUIDELINES.md](./UI-GUIDELINES.md) and [ARCHITECTURE.md](../ARCHITECTURE.md).

## Overview

| Property | Value |
|----------|-------|
| Kind | `'image'` |
| Output Type | `ImageOutput { kind: 'image'; url: string }` |
| Primary Input | Text prompt |
| Factory | `createImageProvider` |

## Input Schema

### Required Fields

| Field | Type | UI Component |
|-------|------|--------------|
| `prompt` | `string` | `TextArea` |

### Recommended Optional Fields

| Field | Type | UI Component | Include When |
|-------|------|--------------|--------------|
| `aspect_ratio` | `enum` | `Select` with icons | Always |
| `style` | `enum` | `Select` | Provider has 3+ distinct styles |

## TypeScript Template

```typescript
import { addIconSetOnce, getPanelId } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './{ModelName}.json';
import createImageProvider from './createImageProvider';
import { ProviderConfiguration, getImageDimensionsFromAspectRatio } from './types';

type {ModelName}Input = {
  prompt: string;
  aspect_ratio?: string;
};

export function {ModelName}(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const modelKey = '{partner}/{vendor}/{model-name}';

    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    // Register translations
    cesdk.i18n.setTranslations({
      en: {
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated From Text'
      }
    });

    return createImageProvider<{ModelName}Input>(
      {
        modelAIR: '{partner}:{model}@{version}',
        providerId: modelKey,
        name: '{Display Name}',
        schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],

        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),

        mapInput: (input) => {
          const dims = getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1');
          return {
            positivePrompt: input.prompt,  // Map to API field name
            width: dims.width,
            height: dims.height
          };
        }
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
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1",
            "x-imgly-enum-labels": {
              "1:1": "Square (1024x1024)",
              "16:9": "Landscape (1344x768)",
              "9:16": "Portrait (768x1344)",
              "4:3": "Landscape (1152x896)",
              "3:4": "Portrait (896x1152)"
            },
            "x-imgly-enum-icons": {
              "1:1": "@imgly/plugin/formats/ratio1by1",
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "4:3": "@imgly/plugin/formats/ratio4by3",
              "3:4": "@imgly/plugin/formats/ratio3by4"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

## Quick Actions

T2I providers typically don't support quick actions (no input image). For providers supporting both T2I and I2I modes, see [image-to-image.md](./image-to-image.md).

## Checklist

- [ ] TypeScript provider file with `createImageProvider`
- [ ] JSON schema with `TextArea` for prompt, icons for aspect ratio
- [ ] Export added to partner `index.ts`
- [ ] `getImageSize` returns dimensions for placeholder
- [ ] `mapInput` transforms to API format
- [ ] **i18n**: History label registered (`libraries.{panelId}.history.label`)
- [ ] **i18n**: Custom enum translations if applicable (see `i18n.md`)
- [ ] **Feature API**: Provider-specific features registered if needed (see `feature-api.md`)
- [ ] Build passes: `pnpm --filter "@imgly/plugin-ai-*" check:all`
