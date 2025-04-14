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
                proxyUrl: 'https://your-fal-ai-proxy.example.com'
            }),

            // Image-to-video provider (optional)
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
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

The plugin comes with pre-configured providers for fal.ai models:

#### 1. MinimaxVideo01Live (Text-to-Video)

A model that generates videos based on text prompts:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'https://your-fal-ai-proxy.example.com'
});
```

Key features:

-   Generate videos from text descriptions
-   Fixed output dimensions (1280×720)
-   5-second video duration

#### 2. MinimaxVideo01LiveImageToVideo (Image-to-Video)

A model that transforms still images into videos:

```typescript
image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
    proxyUrl: 'https://your-fal-ai-proxy.example.com'
});
```

Key features:

-   Transform existing images into videos
-   Available through canvas quick actions
-   Maintains original image aspect ratio

#### 3. PixverseV35TextToVideo (Text-to-Video)

An alternative text-to-video model:

```typescript
text2video: FalAiVideo.PixverseV35TextToVideo({
    proxyUrl: 'https://your-fal-ai-proxy.example.com'
});
```

### Configuration Options

The plugin accepts the following configuration options:

| Option        | Type     | Description                                  | Default   |
| ------------- | -------- | -------------------------------------------- | --------- |
| `text2video`  | Provider | Provider for text-to-video generation        | undefined |
| `image2video` | Provider | Provider for image-to-video transformation   | undefined |
| `debug`       | boolean  | Enable debug logging                         | false     |
| `dryRun`      | boolean  | Simulate generation without API calls        | false     |
| `middleware`  | Function | Custom middleware for the generation process | undefined |

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'https://your-fal-ai-proxy.example.com'
});
```

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
    // Provider for text-to-video generation
    text2video?: AiVideoProvider;

    // Provider for image-to-video generation
    image2video?: AiVideoProvider;

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
  debug?: boolean;
}): AiVideoProvider
```

#### MinimaxVideo01LiveImageToVideo

```typescript
FalAiVideo.MinimaxVideo01LiveImageToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### PixverseV35TextToVideo

```typescript
FalAiVideo.PixverseV35TextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-video generation
2. **Quick Actions**: Canvas menu items for image-to-video transformations
3. **History Library**: Displays previously generated videos

### Panel IDs

-   Main panel: `ly.img.ai/video-generation`
-   Canvas quick actions: `ly.img.ai.video.canvasMenu`
-   Provider-specific panels:
    -   MinimaxVideo01Live: `ly.img.ai/fal-ai/minimax/video-01-live`
    -   MinimaxVideo01LiveImageToVideo: `ly.img.ai/fal-ai/minimax/video-01-live/image-to-video`
    -   PixverseV35TextToVideo: `ly.img.ai/fal-ai/pixverse/v3.5/text-to-video`

### Asset History

Generated videos are automatically stored in asset sources with the following IDs:

-   MinimaxVideo01Live: `fal-ai/minimax/video-01-live.history`
-   MinimaxVideo01LiveImageToVideo: `fal-ai/minimax/video-01-live/image-to-video.history`
-   PixverseV35TextToVideo: `fal-ai/pixverse/v3.5/text-to-video.history`

## Related Packages

-   [@imgly/plugin-utils-ai-generation](https://github.com/imgly/plugin-utils-ai-generation) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
