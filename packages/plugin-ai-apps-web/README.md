# IMG.LY AI Apps for Web

A plugin for orchestrating all AI generation capabilities in CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-apps-web` package provides a unified interface for accessing and organizing all AI generation features within the CreativeEditor SDK. It combines image, video, audio, and text generation capabilities into a single cohesive user experience.

Features include:

-   Central AI dock component with loading indicators
-   AI apps menu for quick access to all AI features
-   Integrated history management for generated assets
-   Automatic integration with asset libraries
-   Support for both Design and Video modes

## Installation

```bash
npm install @imgly/plugin-ai-apps-web
```

## Usage

To use the plugin, import it and configure it with your preferred providers:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';

// Import providers from individual AI generation packages
import { AnthropicProvider } from '@imgly/plugin-ai-text-generation-web/anthropic';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import ElevenLabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the AI Apps plugin
    cesdk.addPlugin(
        AiApps({
            providers: {
                // Text generation
                text2text: AnthropicProvider({
                    proxyUrl: 'https://your-anthropic-proxy.example.com'
                }),

                // Image generation
                text2image: FalAiImage.RecraftV3({
                    proxyUrl: 'https://your-fal-ai-proxy.example.com'
                }),
                image2image: FalAiImage.GeminiFlashEdit({
                    proxyUrl: 'https://your-fal-ai-proxy.example.com'
                }),

                // Video generation (used in video mode)
                text2video: FalAiVideo.MinimaxVideo01Live({
                    proxyUrl: 'https://your-fal-ai-proxy.example.com'
                }),
                image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                    proxyUrl: 'https://your-fal-ai-proxy.example.com'
                }),

                // Audio generation (used in video mode)
                text2speech: ElevenLabs.MonolingualV1({
                    proxyUrl: 'https://your-elevenlabs-proxy.example.com'
                }),
                text2sound: ElevenLabs.SoundEffects({
                    proxyUrl: 'https://your-elevenlabs-proxy.example.com'
                })
            }
        })
    );

    // Position the AI dock button in the dock order
    cesdk.ui.setDockOrder(['ly.img.ai/apps.dock', ...cesdk.ui.getDockOrder()]);
    
    // Note: Canvas menu quick actions are automatically added by the providers
    // You can access them via provider canvasMenu properties if needed:
    // - AnthropicProvider.canvasMenu.text
    // - FalAiImage.RecraftV3.canvasMenu.image
    // - FalAiVideo.MinimaxVideo01LiveImageToVideo.canvasMenu.image
});
```

## Configuration Options

The plugin accepts the following configuration options:

| Option      | Type        | Description                                   |
| ----------- | ----------- | --------------------------------------------- |
| `providers` | `Providers` | Object containing all AI providers to be used |
| `debug`     | `boolean`   | Print debug messages                          |

### Providers Configuration

The `providers` object can include the following provider functions:

| Provider      | Type                | Description                                              |
| ------------- | ------------------- | -------------------------------------------------------- |
| `text2text`   | `Provider<'text'>`  | Provider for text generation and transformation          |
| `text2image`  | `Provider<'image'>` | Provider for text-to-image generation                    |
| `image2image` | `Provider<'image'>` | Provider for image-to-image transformation               |
| `text2video`  | `Provider<'video'>` | Provider for text-to-video generation (video mode only)  |
| `image2video` | `Provider<'video'>` | Provider for image-to-video generation (video mode only) |
| `text2speech` | `Provider<'audio'>` | Provider for text-to-speech generation (video mode only) |
| `text2sound`  | `Provider<'audio'>` | Provider for sound effects generation (video mode only)  |

## UI Integration

The plugin adds the following UI components:

1. **AI Dock Button**: Access point for all AI features
2. **AI Apps Menu**: In video mode, shows cards for all available AI generation types

### Dock Integration

To position the AI dock button in your editor's dock, use the `setDockOrder` method:

```typescript
// Add the AI dock component to the beginning of the dock
cesdk.ui.setDockOrder(['ly.img.ai/apps.dock', ...cesdk.ui.getDockOrder()]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai/apps.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Asset History Integration

The plugin automatically integrates generated assets into the appropriate asset libraries:

-   AI-generated images appear in the standard image library
-   AI-generated videos appear in the standard video library
-   AI-generated audio appears in the standard audio library

This integration creates a seamless experience where users can easily find and reuse their AI-generated assets.

## Provider Quick Actions Reference

Each AI provider automatically registers quick actions in canvas menus. Here's what gets added by each provider type:

### Text Providers (Anthropic)

**Canvas Menu:** `ly.img.ai.text.canvasMenu`

- `anthropic.improve` - Improve writing quality
- `anthropic.fix` - Fix spelling & grammar
- `anthropic.shorter` / `anthropic.longer` - Adjust text length
- `anthropic.changeTone` - Change writing tone
- `anthropic.translate` - Translate to different languages
- `anthropic.changeTextTo` - Custom text transformation

### Image Providers (fal.ai/OpenAI)

**Canvas Menu:** `ly.img.ai.image.canvasMenu`

**GeminiFlashEdit (fal.ai):**
- `fal-ai/gemini-flash-edit.changeImage` - Edit image with text prompt
- `fal-ai/gemini-flash-edit.swapBackground` - Change image background
- `fal-ai/gemini-flash-edit.styleTransfer` - Apply artistic styles
- `fal-ai/gemini-flash-edit.createVariant` - Create image variants

**OpenAI GPT-4:**
- `open-ai/gpt-image-1/image2image.changeImage` - Edit image with text prompt
- `open-ai/gpt-image-1/image2image.swapBackground` - Change image background
- `open-ai/gpt-image-1/image2image.createVariant` - Create image variants

### Video Providers (fal.ai)

**Canvas Menu:** `ly.img.ai.image.canvasMenu` (appears in image context)

**MinimaxVideo01LiveImageToVideo:**
- `fal-ai/minimax/video-01-live/image-to-video.createVideo` - Convert image to video

### Canvas Menu Control

To disable automatic canvas menu registration and handle manually:

```typescript
AiApps({
    providers: {
        text2text: AnthropicProvider({
            proxyUrl: 'https://your-anthropic-proxy.example.com',
            addToCanvasMenu: false // Disable automatic registration
        }),
        // ... other providers
    }
})

// Manually configure canvas menu
cesdk.ui.setCanvasMenuOrder([
    {
        id: AnthropicProvider.canvasMenu.text.id,
        children: AnthropicProvider.canvasMenu.text.children
    },
    {
        id: FalAiImage.GeminiFlashEdit.canvasMenu.image.id,
        children: FalAiImage.GeminiFlashEdit.canvasMenu.image.children
    },
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

### Customizing Quick Action Order

To customize quick action ordering or remove specific actions, disable automatic registration and configure manually:

```typescript
// Example: Customize text quick actions - remove some actions and reorder
cesdk.ui.setCanvasMenuOrder([
    {
        id: 'ly.img.ai.text.canvasMenu',
        children: [
            'anthropic.improve',      // Keep most commonly used first
            'anthropic.fix',
            'ly.img.separator',
            'anthropic.translate',    // Moved up in priority
            'anthropic.changeTextTo'  // Keep custom transformation
            // Removed: shorter, longer, changeTone for simplified menu
        ]
    },
    {
        id: 'ly.img.ai.image.canvasMenu', 
        children: [
            'fal-ai/gemini-flash-edit.changeImage',     // Most used first
            'fal-ai/gemini-flash-edit.swapBackground',
            'ly.img.separator',
            'fal-ai/gemini-flash-edit.createVariant'    // Keep variant creation
            // Removed: styleTransfer, artistStyles for focused menu
        ]
    },
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

## Related Packages

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugin-ai-generation-web) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugin-ai-video-generation-web) - AI video generation
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugin-ai-audio-generation-web) - AI audio generation
-   [@imgly/plugin-ai-text-generation-web](https://github.com/imgly/plugin-ai-text-generation-web) - AI text generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
