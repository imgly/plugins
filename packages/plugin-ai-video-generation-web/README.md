# IMG.LY AI Video Generation for Web

A plugin for integrating AI video generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-video-generation-web` package enables users to generate videos using AI directly within CreativeEditor SDK. This shipped provider leverages the [fal.ai](https://fal.ai) platform to provide high-quality video generation from text-to-video and image-to-video transformations.

Features include:

-   Text-to-video generation
-   Image-to-video transformations
-   Multiple model options
-   Automatic history tracking
-   Canvas menu quick actions
-   Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-video-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

#### Single Provider Configuration

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the video generation plugin
    cesdk.addPlugin(
        VideoGeneration({
            // Text-to-video provider
            text2video: FalAiVideo.MinimaxVideo01Live({
                proxyUrl: 'http://your-proxy-server.com/api/proxy',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                }
            }),

            // Image-to-video provider (optional)
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                proxyUrl: 'http://your-proxy-server.com/api/proxy',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                }
            }),

            // Optional configuration
            debug: false,
            dryRun: false
        })
    );
});
```

#### Multiple Providers Configuration

You can configure multiple providers for each generation type, and users will see a selection box to choose between them:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the video generation plugin with multiple providers
    cesdk.addPlugin(
        VideoGeneration({
            // Multiple text-to-video providers
            text2video: [
                FalAiVideo.MinimaxVideo01Live({
                    proxyUrl: 'http://your-proxy-server.com/api/proxy',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                }),
                FalAiVideo.PixverseV35TextToVideo({
                    proxyUrl: 'http://your-proxy-server.com/api/proxy',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                })
            ],

            // Image-to-video provider (optional)
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                proxyUrl: 'http://your-proxy-server.com/api/proxy',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                }
            }),

            // Optional configuration
            debug: false,
            dryRun: false
        })
    );
});
```

### Providers

The plugin comes with pre-configured providers for fal.ai models:

#### 1. MinimaxVideo01Live (Text-to-Video)

A model that generates videos based on text prompts:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Fixed output dimensions (1280×720)
-   5-second video duration
-   Custom headers support for API requests

#### 2. MinimaxVideo01LiveImageToVideo (Image-to-Video)

A model that transforms still images into videos:

```typescript
image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Key features:

-   Transform existing images into videos
-   Available through canvas quick actions
-   Maintains original image aspect ratio
-   Custom headers support for API requests

#### 3. PixverseV35TextToVideo (Text-to-Video)

An alternative text-to-video model:

```typescript
text2video: FalAiVideo.PixverseV35TextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Key features:

-   Alternative text-to-video generation
-   Custom headers support for API requests

### Configuration Options

The plugin accepts the following configuration options:

| Option        | Type                 | Description                                     | Default   |
| ------------- | -------------------- | ----------------------------------------------- | --------- |
| `text2video`  | Provider \| Provider[] | Provider(s) for text-to-video generation. When multiple providers are provided, users can select between them | undefined |
| `image2video` | Provider \| Provider[] | Provider(s) for image-to-video transformation. When multiple providers are provided, users can select between them | undefined |
| `debug`       | boolean              | Enable debug logging                            | false     |
| `dryRun`      | boolean              | Simulate generation without API calls           | false     |
| `middleware`  | Function[]           | Array of middleware functions for the generation | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 5,
  timeWindowMs: 300000, // 5 minutes
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Video generation rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
    return false; // Reject request
  }
});

// Create custom middleware
const customMiddleware = async (input, options, next) => {
  console.log('Before generation:', input);
  
  // Add custom fields or modify the input
  const modifiedInput = {
    ...input,
    customField: 'custom value'
  };
  
  // Call the next middleware or generation function
  const result = await next(modifiedInput, options);
  
  console.log('After generation:', result);
  
  // You can also modify the result before returning it
  return result;
};

// Apply middleware to plugin
cesdk.addPlugin(
  VideoGeneration({
    text2video: FalAiVideo.MinimaxVideo01Live({
      proxyUrl: 'http://your-proxy-server.com/api/proxy'
    }),
    middleware: [logging, rateLimit, customMiddleware] // Apply middleware in order
  })
);
```

Built-in middleware options:

- **loggingMiddleware**: Logs generation requests and responses
- **rateLimitMiddleware**: Limits the number of generation requests in a time window

You can also create custom middleware functions to meet your specific needs.

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

The `headers` option allows you to include custom HTTP headers in all API requests. This is useful for:
- Adding custom client identification headers
- Including version information
- Passing through metadata required by your API
- Adding correlation IDs for request tracing

You'll need to implement a proxy server that forwards requests to fal.ai and handles authentication.

## API Reference

### Main Plugin

```typescript
VideoGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
    // Provider(s) for text-to-video generation
    text2video?: AiVideoProvider | AiVideoProvider[];

    // Provider(s) for image-to-video generation
    image2video?: AiVideoProvider | AiVideoProvider[];

    // Enable debug logging
    debug?: boolean;

    // Skip actual API calls for testing
    dryRun?: boolean;

    // Extend the generation process
    middleware?: GenerationMiddleware;
}
```

### Fal.ai Providers

#### MinimaxVideo01Live

```typescript
FalAiVideo.MinimaxVideo01Live(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### MinimaxVideo01LiveImageToVideo

```typescript
FalAiVideo.MinimaxVideo01LiveImageToVideo(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### PixverseV35TextToVideo

```typescript
FalAiVideo.PixverseV35TextToVideo(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-video generation
2. **Quick Actions**: Canvas menu items for image-to-video transformations
3. **History Library**: Displays previously generated videos
4. **Dock Component**: A button in the dock area to open the video generation panel

### Panel IDs

-   Main panel: `ly.img.ai.video-generation`
-   Canvas quick actions: `ly.img.ai.video.canvasMenu`
-   Provider-specific panels:
    -   MinimaxVideo01Live: `ly.img.ai.fal-ai/minimax/video-01-live`
    -   MinimaxVideo01LiveImageToVideo: `ly.img.ai.fal-ai/minimax/video-01-live/image-to-video`
    -   PixverseV35TextToVideo: `ly.img.ai.fal-ai/pixverse/v3.5/text-to-video`

### Asset History

Generated videos are automatically stored in asset sources with the following IDs:

-   MinimaxVideo01Live: `fal-ai/minimax/video-01-live.history`
-   MinimaxVideo01LiveImageToVideo: `fal-ai/minimax/video-01-live/image-to-video.history`
-   PixverseV35TextToVideo: `fal-ai/pixverse/v3.5/text-to-video.history`

### Dock Integration

The plugin automatically registers a dock component with a sparkle icon that opens the video generation panel. To customize the component's position in the dock, use the `setDockOrder` method:

```typescript
// Add the AI Video component to the beginning of the dock
cesdk.ui.setDockOrder([
  'ly.img.ai.video-generation.dock',
  ...cesdk.ui.getDockOrder()
]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai.video-generation.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Related Packages

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
