# IMG.LY AI Apps for Web

A plugin for orchestrating all AI generation capabilities in CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-apps-web` package provides a unified interface for accessing and organizing all AI generation features within the CreativeEditor SDK. It combines image, video, audio, and text generation capabilities into a single cohesive user experience.

### Key Features

- **Unified AI Experience**: Centralized access to all AI generation capabilities
- **AI Dock Component**: Single entry point for all AI features with loading indicators
- **Smart Provider Management**: Automatically organizes providers based on editor mode
- **Integrated History**: Seamless integration with asset libraries for generated content
- **Mode-Aware Interface**: Different UI layouts for Design and Video modes
- **Cross-Plugin Support**: Works with all IMG.LY AI generation plugins

## Installation

```bash
npm install @imgly/plugin-ai-apps-web
```

## Basic Usage

To use the plugin, import it and configure it with your preferred providers:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';

// Import providers from individual AI generation packages
import { AnthropicProvider } from '@imgly/plugin-ai-text-generation-web/anthropic';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import ElevenLabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';

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
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),

        // Image generation
        text2image: FalAiImage.RecraftV3({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        image2image: FalAiImage.GeminiFlashEdit({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),

        // Video generation (used in video mode)
        text2video: FalAiVideo.MinimaxVideo01Live({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),

        // Audio generation (used in video mode)
        text2speech: ElevenLabs.MonolingualV1({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        text2sound: ElevenLabs.SoundEffects({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),

        // Sticker generation
        text2sticker: FalAiSticker.Recraft20b({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        })
      }
    })
  );

  // Position the AI dock button in the dock order
  cesdk.ui.setDockOrder(['ly.img.ai.apps.dock', ...cesdk.ui.getDockOrder()]);
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
| `text2sticker` | `Provider<'sticker'>` | Provider for sticker generation                          |

### Provider Selection Strategy

The plugin intelligently selects which providers to use based on the current editor mode:

#### Design Mode
- **Uses**: `text2text`, `text2image`, `image2image`, `text2sticker`
- **Focus**: Image, text, and sticker generation for design workflows
- **UI**: Shows AI apps cards for different generation types

#### Video Mode  
- **Uses**: All providers including `text2video`, `image2video`, `text2speech`, `text2sound`, `text2sticker`
- **Focus**: Comprehensive media generation for video production
- **UI**: Shows AI apps cards for different generation types

## Advanced Configuration

### Multiple Providers per Type

You can configure multiple providers for the same generation type by passing an array. When multiple providers are configured, a selection box will be rendered in the AI app interface allowing users to choose between different providers:

```typescript
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';

cesdk.addPlugin(
  AiApps({
    providers: {
      // Multiple image providers - selection box will be shown
      text2image: [
        FalAiImage.RecraftV3({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        FalAiImage.Recraft20b({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        OpenAiImage.GptImage1.Text2Image({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        })
      ],
      
      // Other providers...
    }
  })
);
```

### Custom Headers and Configuration

Pass custom headers and configuration to providers:

```typescript
cesdk.addPlugin(
  AiApps({
    providers: {
      text2image: FalAiImage.RecraftV3({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        headers: {
          'x-client-version': '1.0.0',
          'x-request-source': 'cesdk-plugin',
          'x-user-id': 'user-123'
        },
        debug: true
      })
    },
    debug: true
  })
);
```

### Property Configuration

Providers support configuring default values for their properties. These defaults can be static or dynamic based on context:

```typescript
cesdk.addPlugin(
  AiApps({
    providers: {
      text2image: FalAiImage.RecraftV3({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        properties: {
          // Static default
          image_size: { default: 'square_hd' },

          // Dynamic default based on locale
          style: {
            default: (context) => {
              return context.locale === 'ja' ? 'anime' : 'realistic';
            }
          }
        }
      })
    }
  })
);
```

## UI Integration

The plugin adds the following UI components to CreativeEditor SDK:

### AI Dock Button

The main entry point for all AI features, accessible from the dock:

- **ID**: `ly.img.ai.apps.dock`
- **Functionality**: Opens AI generation interface
- **Loading States**: Shows progress indicators during generation
- **Mode Awareness**: Adapts interface based on current editor mode

### AI Apps Menu

The plugin shows a card-based interface for different AI capabilities:

- **Generate Image**: Access to image generation providers
- **Generate Video**: Access to video generation providers  
- **Generate Audio**: Access to audio generation providers
- **Edit Text**: Access to text generation providers

### Dock Integration

To position the AI dock button in your editor's dock, use the `setDockOrder` method:

```typescript
// Add the AI dock component to the beginning of the dock
cesdk.ui.setDockOrder(['ly.img.ai.apps.dock', ...cesdk.ui.getDockOrder()]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai.apps.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Asset History Integration

The plugin automatically integrates generated assets into the appropriate asset libraries. For each generation type, both a history asset source and a corresponding asset library entry are automatically created with the same ID:

- **Image Generation History**: `ly.img.ai.image-generation.history`
- **Video Generation History**: `ly.img.ai.video-generation.history`
- **Audio Generation History**: `ly.img.ai.audio-generation.history`
- **Sticker Generation History**: `ly.img.ai.sticker-generation.history`

These asset library entries are automatically configured with:
- Sorted by insertion date (newest first)
- Square grid item height
- Cover background type
- Removable items

### Integrating with Default Asset Libraries

To add these history sources to CE.SDK's default asset library entries, use the following approach:

```typescript
// Add AI image history to the default image asset library
const imageEntry = cesdk.ui.getAssetLibraryEntry('ly.img.image');
if (imageEntry != null) {
  cesdk.ui.updateAssetLibraryEntry('ly.img.image', {
    sourceIds: [...imageEntry.sourceIds, 'ly.img.ai.image-generation.history']
  });
}

// Add AI video history to the default video asset library
const videoEntry = cesdk.ui.getAssetLibraryEntry('ly.img.video');
if (videoEntry != null) {
  cesdk.ui.updateAssetLibraryEntry('ly.img.video', {
    sourceIds: [...videoEntry.sourceIds, 'ly.img.ai.video-generation.history']
  });
}

// Add AI audio history to the default audio asset library
const audioEntry = cesdk.ui.getAssetLibraryEntry('ly.img.audio');
if (audioEntry != null) {
  cesdk.ui.updateAssetLibraryEntry('ly.img.audio', {
    sourceIds: [...audioEntry.sourceIds, 'ly.img.ai.audio-generation.history']
  });
}

// Add AI sticker history to the default sticker asset library
const stickerEntry = instance.ui.getAssetLibraryEntry('ly.img.sticker');
if (stickerEntry != null) {
  instance.ui.updateAssetLibraryEntry('ly.img.sticker', {
    sourceIds: [...stickerEntry.sourceIds, 'ly.img.ai.sticker-generation.history']
  });
}
```

This integration creates a seamless experience where users can easily find and reuse their AI-generated assets alongside other content.

## Quick Actions Integration

The plugin automatically integrates with the quick actions system, providing context-sensitive AI operations directly in the canvas menu. You need to specify the children with the quick action order:

```typescript
// Quick actions are automatically registered and will appear in canvas menus
cesdk.ui.setCanvasMenuOrder([
  {
    id: 'ly.img.ai.text.canvasMenu',
    children: [
      'ly.img.improve',
      'ly.img.fix',
      'ly.img.shorter',
      'ly.img.longer',
      'ly.img.separator',
      'ly.img.changeTone',
      'ly.img.translate',
      'ly.img.separator',
      'ly.img.changeTextTo'
    ]
  },
  {
    id: 'ly.img.ai.image.canvasMenu',
    children: [
      'ly.img.styleTransfer',
      'ly.img.artistTransfer',
      'ly.img.separator',
      'ly.img.editImage',
      'ly.img.swapBackground',
      'ly.img.createVariant',
      'ly.img.combineImages',
      'ly.img.separator',
      'ly.img.remixPage',
      'ly.img.separator',
      'ly.img.createVideo'
    ]
  },
  ...cesdk.ui.getCanvasMenuOrder()
]);
```

Quick actions provide:
- **Context-aware operations**: Work with currently selected blocks
- **One-click transformations**: Apply AI operations without opening panels
- **Cross-plugin functionality**: Actions from one plugin can work with providers from another

## Error Handling and Debugging

### Debug Mode

Enable debug mode to get detailed logging information:

```typescript
cesdk.addPlugin(
  AiApps({
    providers: {
      text2image: FalAiImage.RecraftV3({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        debug: true // Provider-level debugging
      })
    },
    debug: true // Plugin-level debugging
  })
);
```

### Common Issues and Solutions

#### Provider Not Loading
- **Check proxy URLs**: Ensure all proxy URLs are correctly configured and accessible
- **Verify licenses**: Make sure your CreativeEditor SDK license includes AI features
- **Check browser console**: Look for network errors or API issues

#### Quick Actions Not Appearing
- **Verify canvas menu order**: Ensure quick action menus are added to canvas menu order with proper children configuration
- **Check provider support**: Verify that providers declare support for the quick actions
- **Scope permissions**: Ensure blocks have the required scopes for quick actions

#### Generation Failures
- **API connectivity**: Check that your proxy endpoints are working
- **Rate limiting**: Verify you're not exceeding API rate limits
- **Input validation**: Ensure inputs meet provider requirements

## Plugin Architecture

### How It Works

The AI Apps plugin acts as an orchestrator that:

1. **Initializes Providers**: Sets up all configured AI providers
2. **Manages UI**: Creates appropriate interface based on editor mode
3. **Coordinates Actions**: Integrates quick actions across different plugins
4. **Handles Assets**: Manages generated content and asset library integration

### Provider Lifecycle

1. **Registration**: Providers are registered with the global ProviderRegistry
2. **Initialization**: Provider `initialize` methods are called
3. **UI Setup**: Panels and quick actions are registered
4. **Event Handling**: The plugin coordinates between providers and UI

## TypeScript Support

The plugin is fully typed with TypeScript, providing excellent development experience:

```typescript
import AiApps, { Providers } from '@imgly/plugin-ai-apps-web';

// Strongly typed provider configuration
const providers: Providers = {
  text2image: FalAiImage.RecraftV3({
    proxyUrl: 'http://your-proxy-server.com/api/proxy'
  }),
  // TypeScript will enforce correct provider types
};

cesdk.addPlugin(AiApps({ providers }));
```

## Related Packages

This plugin works with the following IMG.LY AI generation packages:

- **[@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web)** - Core utilities for AI generation
- **[@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web)** - AI image generation
- **[@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web)** - AI video generation
- **[@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web)** - AI audio generation
- **[@imgly/plugin-ai-text-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-text-generation-web)** - AI text generation

## Examples

### Simple Setup for Design Mode

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';

CreativeEditorSDK.create(domElement, {
  license: 'your-license-key'
}).then(async (cesdk) => {
  cesdk.addPlugin(
    AiApps({
      providers: {
        text2image: FalAiImage.RecraftV3({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        })
      }
    })
  );

  cesdk.ui.setDockOrder(['ly.img.ai.apps.dock', ...cesdk.ui.getDockOrder()]);
});
```

### Complete Setup for Video Mode

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import ElevenLabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import { AnthropicProvider } from '@imgly/plugin-ai-text-generation-web/anthropic';

CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  ui: {
    elements: {
      panels: {
        settings: true
      }
    }
  }
}).then(async (cesdk) => {
  cesdk.addPlugin(
    AiApps({
      providers: {
        text2text: AnthropicProvider({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        text2image: FalAiImage.RecraftV3({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        image2image: FalAiImage.GeminiFlashEdit({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        text2video: FalAiVideo.MinimaxVideo01Live({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        text2speech: ElevenLabs.MonolingualV1({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        }),
        text2sound: ElevenLabs.SoundEffects({
          proxyUrl: 'http://your-proxy-server.com/api/proxy'
        })
      }
    })
  );

  // Setup dock and canvas menus
  cesdk.ui.setDockOrder(['ly.img.ai.apps.dock', ...cesdk.ui.getDockOrder()]);
  cesdk.ui.setCanvasMenuOrder([
    {
      id: 'ly.img.ai.text.canvasMenu',
      children: [
        'ly.img.improve',
        'ly.img.fix',
        'ly.img.shorter',
        'ly.img.longer',
        'ly.img.separator',
        'ly.img.changeTone',
        'ly.img.translate',
        'ly.img.separator',
        'ly.img.changeTextTo'
      ]
    },
    {
      id: 'ly.img.ai.image.canvasMenu',
      children: [
        'ly.img.styleTransfer',
        'ly.img.artistTransfer',
        'ly.img.separator',
        'ly.img.editImage',
        'ly.img.swapBackground',
        'ly.img.createVariant',
        'ly.img.combineImages',
        'ly.img.separator',
        'ly.img.remixPage',
        'ly.img.separator',
        'ly.img.createVideo'
      ]
    },
    ...cesdk.ui.getCanvasMenuOrder()
  ]);
});
```

## Internationalization (i18n)

The AI Apps plugin supports full internationalization. To customize translations, set them **before** adding the plugin:

```typescript
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  locale: 'de'
}).then(async (cesdk) => {
  // Set custom translations BEFORE adding plugins
  cesdk.i18n.setTranslations({
    en: {
      '@imgly/plugin-ai-image-generation-web.action.label': 'Create Image',
      'panel.ly.img.ai.apps': 'AI Tools'
    },
    de: {
      '@imgly/plugin-ai-image-generation-web.action.label': 'Bild erstellen',
      'panel.ly.img.ai.apps': 'KI-Werkzeuge'
    }
  });

  // Now add the plugins - they won't override your custom translations
  await cesdk.addPlugin(AiApps({ providers: { /* ... */ } }));
});
```

For detailed documentation on the translation system, including all available translation keys and utilities, see the [Internationalization section](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web#internationalization-i18n) in the core AI generation package.

### Translation Files

- [AI Apps translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-apps-web/translations.json) - AI Apps panel labels
- [Base translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web/translations.json) - Core translation keys
- [Image generation translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web/translations.json) - Image generation interfaces
- [Video generation translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web/translations.json) - Video generation interfaces
- [Text generation translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-text-generation-web/translations.json) - Text generation interfaces
- [Audio generation translations](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web/translations.json) - Audio generation interfaces

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
