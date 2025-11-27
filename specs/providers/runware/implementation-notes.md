# Runware Implementation Notes

This document covers Runware-specific implementation details and quirks.

## Why HTTP REST Instead of WebSocket

Runware offers two connection methods: WebSocket and HTTP REST API ([documentation](https://runware.ai/docs/en/getting-started/how-to-connect.md)).

While Runware recommends WebSocket for its efficiency and persistent connections, we chose the **HTTP REST API** for the following reasons:

1. **Proxy Simplicity**: HTTP requests are trivial to proxy. Our architecture requires injecting API keys server-side to avoid exposing them in client code. Proxying HTTP POST requests is a standard pattern supported by all backend frameworks and edge functions.

2. **No SDK Dependency**: The WebSocket approach requires the `@runware/sdk` package, which adds bundle size and complexity. HTTP requests use the native `fetch` API with no additional dependencies.

3. **Stateless Architecture**: HTTP requests are stateless and self-contained. Each request includes all necessary context, making debugging easier and eliminating connection state management.

4. **Infrastructure Compatibility**: HTTP works seamlessly with existing API gateways, load balancers, and serverless functions. WebSocket connections require special handling and long-lived connection support.

The trade-off is that HTTP may have slightly higher latency per request (no persistent connection), but for our use case of individual image generation requests, this is negligible.

## File Organization

```
packages/plugin-ai-image-generation-web/src/runware/
├── index.ts                    # Barrel export
├── types.ts                    # RunwareProviderConfiguration, dimension maps
├── createRunwareClient.ts      # HTTP client
├── createImageProvider.ts      # Factory function
├── utils.ts                    # Image URL conversion, helpers
├── {ModelName}.ts              # Provider implementations
└── {ModelName}.json            # OpenAPI schemas
```

## Configuration Type

```typescript
interface RunwareProviderConfiguration {
  /**
   * HTTP endpoint URL for the Runware proxy.
   * The proxy handles API key injection.
   */
  proxyUrl: string;

  middlewares?: Middleware[];
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  supportedQuickActions?: QuickActionOverrides;
}
```

## Client Implementation

The Runware client uses HTTP REST API (not WebSocket SDK):

```typescript
// createRunwareClient.ts
export function createRunwareClient(proxyUrl: string): RunwareClient {
  return {
    imageInference: async (params, abortSignal) => {
      const taskUUID = generateUUID();

      const requestBody = [{
        taskType: 'imageInference',
        taskUUID,
        model: params.model,
        positivePrompt: params.positivePrompt,
        width: params.width,
        height: params.height,
        outputType: params.outputType ?? 'URL',
        outputFormat: params.outputFormat ?? 'PNG',
        numberResults: params.numberResults ?? 1,
        // ... optional params
      }];

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      // Handle response and errors
      // ...
    }
  };
}
```

## Factory Function

The `createImageProvider` factory creates Provider objects:

```typescript
function createImageProvider<I extends Record<string, any>>(
  options: CreateProviderOptions<I>,
  config: RunwareProviderConfiguration
): Provider<'image', I, ImageOutput> {
  let runwareClient: RunwareClient | null = null;

  return {
    id: options.providerId,
    kind: 'image',
    name: options.name,
    configuration: config,

    initialize: async (context) => {
      runwareClient = createRunwareClient(config.proxyUrl);
      options.initialize?.(context);
    },

    input: {
      quickActions: {
        supported: mergeQuickActionsConfig(
          options.supportedQuickActions ?? {},
          config.supportedQuickActions
        )
      },
      panel: {
        type: 'schema',
        document: options.schema,
        inputReference: options.inputReference,
        // ...
      }
    },

    output: {
      abortable: true,
      middleware: options.middleware ?? config.middlewares ?? [],
      history: config.history ?? '@imgly/indexedDB',
      generate: async (input, { abortSignal }) => {
        // Handle image URL conversion for I2I
        // Call mapInput
        // Call runwareClient.imageInference
        // Return { kind: 'image', url }
      }
    }
  };
}
```

## Image URL Conversion

For I2I providers, local image URLs (blob://, data://) must be converted:

```typescript
// utils.ts
export async function convertImageUrlForRunware(
  imageUrl: string,
  cesdk?: CreativeEditorSDK
): Promise<string> {
  // If already a public URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert blob/data URLs to uploadable format
  // Implementation depends on CE.SDK capabilities
  // ...
}
```

## Adding a New Provider

### 1. Create TypeScript File

**IMPORTANT**: The JSON schema import requires `// @ts-ignore` because the OpenAPI types are stricter than what we actually need at runtime. This is a known pattern used across all providers.

```typescript
// {ModelName}.ts
import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {ModelName}Schema from './{ModelName}.json';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for {Model Display Name}
 *
 * Use only aspect ratios that have icons available:
 * - 1:1, 16:9, 9:16, 4:3, 3:4 (have dedicated icons)
 * - 3:2, 2:3, 21:9, 9:21 (no icons, avoid unless model requires)
 */
export type {ModelName}Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  // Add model-specific optional parameters here
};

/**
 * {Model Display Name} - {Brief description}
 *
 * AIR: {air-identifier}
 *
 * Features:
 * - {List key capabilities}
 *
 * Specifications:
 * - {List key specs from API docs}
 */
export function {ModelName}(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', {ModelName}Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<{ModelName}Input>(
      {
        modelAIR: '{air-identifier}',
        providerId: 'runware/{vendor}/{model-name}',
        name: '{Display Name}',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: {ModelName}Schema,
        inputReference: '#/components/schemas/{ModelName}Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
        mapInput: (input) => {
          const dims = getImageDimensionsFromAspectRatio(
            input.aspect_ratio ?? '1:1'
          );
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
            // Map additional parameters here using spread syntax:
            // ...(input.param && { apiParam: input.param })
          };
        }
      },
      config
    );
  };
}

export default {ModelName};
```

### 2. Create JSON Schema

**IMPORTANT**: The schema must include an empty `"paths": {}` property to satisfy the OpenAPI type requirements.

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "{Model Display Name} API",
    "version": "1.0.0",
    "description": "{Model Display Name} generation via Runware"
  },
  "components": {
    "schemas": {
      "{ModelName}Input": {
        "title": "{ModelName}Input",
        "type": "object",
        "properties": {
          "prompt": {
            "title": "Prompt",
            "type": "string",
            "description": "Text description for image generation",
            "x-imgly-builder": {
              "component": "TextArea"
            }
          },
          "aspect_ratio": {
            "title": "Format",
            "type": "string",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1",
            "description": "Aspect ratio for the generated image",
            "x-imgly-enum-labels": {
              "1:1": "Square",
              "16:9": "Landscape 16:9",
              "9:16": "Portrait 9:16",
              "4:3": "Landscape 4:3",
              "3:4": "Portrait 3:4"
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
        "x-fal-order-properties": ["prompt", "aspect_ratio"],
        "required": ["prompt"]
      }
    }
  },
  "paths": {}
}
```

#### Schema Extension Keywords

| Keyword | Purpose |
|---------|---------|
| `x-imgly-builder` | Specifies UI component (e.g., `TextArea` for multiline input) |
| `x-imgly-enum-labels` | Human-readable labels for enum values |
| `x-imgly-enum-icons` | Icon paths for enum values (aspect ratios use `@imgly/plugin/formats/ratio*`) |
| `x-fal-order-properties` | Array defining the display order of properties in the UI |

#### Available Aspect Ratio Icons

Only use aspect ratios that have icons available in `@imgly/plugin/formats`:

| Aspect Ratio | Icon ID | Use For |
|--------------|---------|---------|
| `1:1` | `ratio1by1` | Square images |
| `16:9` | `ratio16by9` | Landscape widescreen |
| `9:16` | `ratio9by16` | Portrait (mobile/stories) |
| `4:3` | `ratio4by3` | Landscape standard |
| `3:4` | `ratio3by4` | Portrait standard |
| Custom | `ratioFree` | User-defined dimensions |

**Avoid these** (no icons, will show blank):
- `3:2`, `2:3` - No dedicated icons
- `21:9`, `9:21` - No dedicated icons

### 3. Add to Index

```typescript
// index.ts
import { {ModelName} } from './{ModelName}';

const Runware = {
  // ... existing
  {ModelName},
};

export default Runware;
```

### 4. Update providers.md

Change status from `planned` to `implemented` in `specs/providers/runware/providers.md`.

## Common Patterns

### T2I Provider (Simple)

Minimal implementation with aspect ratio:
- `prompt` input field
- `aspect_ratio` selection with icon labels

### I2I Provider (With Quick Actions)

Includes:
- `image_url` input field
- Quick action support
- i18n translations
- Dynamic dimensions from input image

### Style Selection

Complex style selection with CustomAssetSource for models that support style presets.

## Known Issues & Gotchas

### TypeScript and JSON Schema

The OpenAPI types from `openapi-types` are stricter than what we need at runtime. When importing JSON schemas:

1. **Always use `// @ts-ignore`** before the `schema:` property in `createImageProvider`
2. **Always include `"paths": {}`** in the JSON schema file

```typescript
// @ts-ignore - JSON schema types are compatible at runtime
schema: MyModelSchema,
```

### Required Schema Properties

The JSON schema must have these properties to avoid TypeScript errors:
- `"openapi": "3.0.0"`
- `"info": { ... }`
- `"components": { "schemas": { ... } }`
- `"paths": {}` ← Often forgotten, causes TS2741 error
