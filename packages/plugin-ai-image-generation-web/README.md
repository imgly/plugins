# IMG.LY AI Image Generation for Web

A plugin for integrating AI image generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-image-generation-web` package enables users to generate and modify images using AI directly within CreativeEditor SDK. This shipped provider leverages the [fal.ai](https://fal.ai) platform to provide high-quality image generation from text-to-image and image-to-image transformations.

Features include:
- Text-to-image generation
- Image-to-image transformations
- Multiple style options (realistic, illustration, vector)
- Various size presets and custom dimensions
- Automatic history tracking
- Canvas menu quick actions
- Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-image-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  // Other configuration options...
}).then(async (cesdk) => {
  // Add the image generation plugin
  cesdk.addPlugin(
    ImageGeneration({
      // Text-to-image provider
      text2image: FalAiImage.RecraftV3({
        proxyUrl: 'https://your-fal-ai-proxy.example.com'
      }),
      
      // Image-to-image provider (optional)
      image2image: FalAiImage.GeminiFlashEdit({
        proxyUrl: 'https://your-fal-ai-proxy.example.com'
      }),
      
      // Optional configuration
      debug: false,
      dryRun: false
    })
  );
});
```

### Providers

The plugin comes with two pre-configured providers for fal.ai models:

#### 1. RecraftV3 (Text-to-Image)

A versatile text-to-image model that generates images based on text prompts:

```typescript
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'https://your-fal-ai-proxy.example.com'
})
```

Key features:
- Multiple style options (realistic, illustration, vector)
- Various image size presets
- Custom dimensions support
- Adjustable quality settings

#### 2. GeminiFlashEdit (Image-to-Image)

An image modification model that transforms existing images:

```typescript
image2image: FalAiImage.GeminiFlashEdit({
  proxyUrl: 'https://your-fal-ai-proxy.example.com'
})
```

Key features:
- Transform existing images with text prompts
- Available directly through canvas quick actions
- Maintains original image dimensions

### Configuration Options

The plugin accepts the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `text2image` | Provider | Provider for text-to-image generation | undefined |
| `image2image` | Provider | Provider for image-to-image transformation | undefined |
| `debug` | boolean | Enable debug logging | false |
| `dryRun` | boolean | Simulate generation without API calls | false |
| `middleware` | Function[] | Array of middleware functions to extend the generation process | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 10,
  timeWindowMs: 60000, // 1 minute
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
    return false; // Reject request
  }
});

// Apply middleware to plugin
cesdk.addPlugin(
  ImageGeneration({
    text2image: FalAiImage.RecraftV3({
      proxyUrl: 'https://your-fal-ai-proxy.example.com'
    }),
    middleware: [logging, rateLimit] // Apply middleware in order
  })
);
```

Built-in middleware options:

- **loggingMiddleware**: Logs generation requests and responses
- **rateLimitMiddleware**: Limits the number of generation requests in a time window

#### Creating Custom Middleware

Custom middleware functions follow this pattern:

```typescript
const customMiddleware = async (input, options, next) => {
  // Pre-processing logic
  console.log('Before generation:', input);
  
  // Add custom fields or modify the input if needed
  const modifiedInput = {
    ...input,
    customField: 'custom value'
  };
  
  // Call the next middleware or generation function
  const result = await next(modifiedInput, options);
  
  // Post-processing logic
  console.log('After generation:', result);
  
  // You can also modify the result before returning it
  return result;
};
```

The middleware function signature is:

```typescript
type Middleware<I, O extends Output> = (
  input: I,
  options: GenerationOptions & {
    // The block IDs the generation is applied on
    blockIds?: number[] | null;
    
    // Function to add a cleanup handler
    addDisposer: (dispose: () => Promise<void>) => void;
  },
  next: (input: I, options: GenerationOptions) => Promise<GenerationResult<O>>
) => Promise<GenerationResult<O>>;
```

Middleware functions are applied in order, creating a chain of processing steps. The `next` parameter calls the next middleware in the chain or the generation function itself.

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'https://your-fal-ai-proxy.example.com'
})
```

You'll need to implement a proxy server that forwards requests to fal.ai and handles authentication.

## API Reference

### Main Plugin

```typescript
ImageGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
  // Provider for text-to-image generation
  text2image?: AiImageProvider;
  
  // Provider for image-to-image generation
  image2image?: AiImageProvider;
  
  // Enable debug logging
  debug?: boolean;
  
  // Skip actual API calls for testing
  dryRun?: boolean;
  
  // Extend the generation process
  middleware?: GenerationMiddleware;
}
```

### Fal.ai Providers

#### RecraftV3

```typescript
FalAiImage.RecraftV3(config: {
  proxyUrl: string;
  debug?: boolean;
})
```

#### GeminiFlashEdit

```typescript
FalAiImage.GeminiFlashEdit(config: {
  proxyUrl: string;
  debug?: boolean;
})
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-image generation
2. **Quick Actions**: Canvas menu items for image-to-image transformations
3. **History Library**: Displays previously generated images
4. **Dock Component**: A button in the dock area to open the image generation panel

### Panel IDs

- Main panel: `ly.img.ai/image-generation`
- Canvas quick actions: `ly.img.ai.image.canvasMenu`
- Provider-specific panels:
  - RecraftV3: `ly.img.ai/fal-ai/recraft-v3`
  - GeminiFlashEdit: `ly.img.ai/fal-ai/gemini-flash-edit`

### Asset History

Generated images are automatically stored in asset sources with the following IDs:
- RecraftV3: `fal-ai/recraft-v3.history`
- GeminiFlashEdit: `fal-ai/gemini-flash-edit.history`

### Dock Integration

The plugin automatically registers a dock component with a sparkle icon that opens the image generation panel. To customize the component's position in the dock, use the `setDockOrder` method:

```typescript
// Add the AI Image component to the beginning of the dock
cesdk.ui.setDockOrder([
  'ly.img.ai/image-generation.dock',
  ...cesdk.ui.getDockOrder()
]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai/image-generation.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Related Packages

- [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugin-ai-generation-web) - Core utilities for AI generation
- [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugin-ai-video-generation-web) - AI video generation
- [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
