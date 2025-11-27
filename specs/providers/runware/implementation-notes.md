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

```typescript
// {ModelName}.ts
import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './{ModelName}.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration, getImageDimensionsFromAspectRatio } from './types';

type {ModelName}Input = {
  prompt: string;
  aspect_ratio?: string;
};

export function {ModelName}(config: RunwareProviderConfiguration) {
  return async ({ cesdk }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<{ModelName}Input>(
      {
        modelAIR: '{air-identifier}',
        providerId: 'runware/{vendor}/{model}',
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
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
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

```json
{
  "openapi": "3.0.0",
  "info": { "title": "{Model} API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "{ModelName}Input": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "enum": ["1:1", "16:9", "9:16"],
            "default": "1:1",
            "x-imgly-enum-labels": { ... },
            "x-imgly-enum-icons": { ... }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

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

### 4. Update PROVIDERS.md

Change status from `planned` to `implemented` in `specs/providers/runware/PROVIDERS.md`.

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
