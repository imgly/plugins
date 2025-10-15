# IMG.LY AI Sticker Generation for Web

A plugin for integrating AI sticker generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-sticker-generation-web` package enables users to generate stickers using AI directly within CreativeEditor SDK. This plugin leverages the [fal.ai](https://fal.ai) platform to provide high-quality sticker generation from text prompts using optimized icon styles.

Features include:
- Text-to-sticker generation
- Icon-style sticker generation optimized for transparency
- Various icon styles (broken line, colored outline, colored shapes, etc.)
- Custom dimensions support
- Automatic history tracking
- Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-sticker-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

#### Single Provider Configuration

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import StickerGeneration from '@imgly/plugin-ai-sticker-generation-web';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  // Other configuration options...
}).then(async (cesdk) => {
  // Add the sticker generation plugin with fal.ai provider
  cesdk.addPlugin(
    StickerGeneration({
      // Text-to-sticker provider
      text2sticker: FalAiSticker.Recraft20b({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        headers: {
          'x-custom-header': 'value',
          'x-client-version': '1.0.0'
        },
        // Optional: Configure default property values
        properties: {
          style: { default: 'broken_line' },  // Default icon style for stickers
          image_size: { default: 'square' },  // Default size
          n_colors: { default: 2 }  // Default color count
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

You can configure multiple providers for text-to-sticker generation, and users will see a selection box to choose between them:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import StickerGeneration from '@imgly/plugin-ai-sticker-generation-web';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  // Other configuration options...
}).then(async (cesdk) => {
  // Add the sticker generation plugin with multiple providers
  cesdk.addPlugin(
    StickerGeneration({
      // Multiple text-to-sticker providers
      text2sticker: [
        FalAiSticker.Recraft20b({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        })
        // Add more providers as they become available
      ],
      
      // Optional configuration
      debug: false,
      dryRun: false
    })
  );
});
```

### Providers

The plugin comes with pre-configured providers for fal.ai models:

#### Recraft20b (Text-to-Sticker)

A specialized text-to-sticker model from fal.ai with icon style support optimized for sticker generation:

```typescript
text2sticker: FalAiSticker.Recraft20b({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  }
})
```

Key features:
- **Icon styles optimized for stickers**: broken_line, colored_outline, colored_shapes, doodle_fill, and more
- Various image size presets (square, landscape, portrait)
- Custom dimensions support
- Transparent background support
- Cost-effective sticker generation
- Custom headers support for API requests

Available icon styles:
- `broken_line`: Clean broken line style
- `colored_outline`: Colored outline style
- `colored_shapes`: Filled colored shapes
- `colored_shapes_gradient`: Gradient filled shapes
- `doodle_fill`: Doodle-style fill
- `doodle_offset_fill`: Offset doodle fill
- `offset_fill`: Offset fill style
- `outline`: Simple outline style
- `outline_gradient`: Gradient outline
- `uneven_fill`: Uneven fill style

### Configuration Options

The plugin accepts the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `text2sticker` | Provider \| Provider[] | Provider(s) for text-to-sticker generation. When multiple providers are provided, users can select between them | undefined |
| `debug` | boolean | Enable debug logging | false |
| `dryRun` | boolean | Simulate generation without API calls | false |
| `middleware` | Function[] | Array of middleware functions to extend the generation process | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import StickerGeneration from '@imgly/plugin-ai-sticker-generation-web';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';
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
  StickerGeneration({
    text2sticker: FalAiSticker.Recraft20b({
      proxyUrl: 'http://your-proxy-server.com/api/proxy'
    }),
    middleware: [logging, rateLimit] // Apply middleware in order
  })
);
```

Built-in middleware options:

- **loggingMiddleware**: Logs generation requests and responses
- **rateLimitMiddleware**: Limits the number of generation requests in a time window

#### Preventing Default Feedback

Middleware can suppress default UI feedback behaviors using `options.preventDefault()`:

```typescript
const customErrorMiddleware = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent default error notification
    options.preventDefault();

    // Show custom error notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: `Sticker generation failed: ${error.message}`,
      action: {
        label: 'Try Again',
        onClick: () => {/* retry logic */}
      }
    });

    throw error;
  }
};
```

**What gets prevented:**
- Error/success notifications
- Block error state
- Console error logging

**What is NOT prevented:**
- Pending → Ready transition (loading spinner always stops)

For more details, see the [@imgly/plugin-ai-generation-web documentation](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web#preventing-default-feedback).

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2sticker: FalAiSticker.Recraft20b({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  }
})
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
StickerGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
  // Provider(s) for text-to-sticker generation
  text2sticker?: AiStickerProvider | AiStickerProvider[];
  
  // Enable debug logging
  debug?: boolean;
  
  // Skip actual API calls for testing
  dryRun?: boolean;
  
  // Extend the generation process
  middleware?: GenerationMiddleware;
}
```

### Fal.ai Providers

#### Recraft20b

```typescript
FalAiSticker.Recraft20b(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-sticker generation
2. **History Library**: Displays previously generated stickers
3. **Dock Component**: A button in the dock area to open the sticker generation panel

### Panel IDs

- Main panel: `ly.img.ai.sticker-generation`
- Provider-specific panels:
  - Recraft20b: `ly.img.ai.fal-ai/recraft/v2/text-to-sticker`

### Asset History

Generated stickers are automatically stored in asset sources with the following IDs:
- Recraft20b: `fal-ai/recraft/v2/text-to-sticker.history`

### Dock Integration

The plugin automatically registers a dock component with a sparkle icon that opens the sticker generation panel. To customize the component's position in the dock, use the `setDockOrder` method:

```typescript
// Add the AI Sticker component to the beginning of the dock
cesdk.ui.setDockOrder([
  'ly.img.ai.sticker-generation.dock',
  ...cesdk.ui.getDockOrder()
]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai.sticker-generation.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Integration with AI Apps Plugin

The sticker generation plugin integrates seamlessly with the AI Apps plugin:

```typescript
import AIApps from '@imgly/plugin-ai-apps-web';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';

cesdk.addPlugin(
  AIApps({
    providers: {
      // Other providers...
      text2sticker: FalAiSticker.Recraft20b({
        proxyUrl: 'http://your-proxy-server.com/api/proxy'
      })
    }
  })
);
```

When integrated with AI Apps, the sticker generation functionality appears in the main AI interface alongside other AI generation capabilities.

## Translations

For customization and localization, see the [translations.json](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-sticker-generation-web/translations.json) file which contains provider-specific translation keys for sticker generation interfaces.

## Related Packages

- [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
- [@imgly/plugin-ai-apps-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-apps-web) - AI apps orchestration
- [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web) - AI image generation
- [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web) - AI video generation
- [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.