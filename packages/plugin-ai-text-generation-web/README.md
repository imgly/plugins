# IMG.LY AI Text Generation for Web

A plugin for integrating AI text generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-text-generation-web` package enables users to generate and transform text using AI directly within CreativeEditor SDK. This plugin provides text generation capabilities through AI models like Anthropic Claude.

Features include:

-   Text-to-text transformations
-   Quick AI actions for text blocks
-   Multiple transformation options:
    -   Improve writing
    -   Fix spelling and grammar
    -   Make text shorter or longer
    -   Change tone (professional, casual, friendly, etc.)
    -   Translate to various languages
    -   Custom text transformation with prompts
-   Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-text-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred provider:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the text generation plugin
    cesdk.addPlugin(
        TextGeneration({
            provider: Anthropic.AnthropicProvider({
                proxyUrl: 'https://your-anthropic-proxy.example.com'
            }),

            // Optional configuration
            debug: false
        })
    );

    // Note: Canvas menu quick actions are automatically added by the provider
    // The text quick actions are available via: Anthropic.AnthropicProvider.canvasMenu.text
});
```

### Providers

The plugin currently includes the following provider:

#### Anthropic Claude

A versatile text generation model that handles various text transformations:

```typescript
provider: Anthropic.AnthropicProvider({
    proxyUrl: 'https://your-anthropic-proxy.example.com',
    // Optional debug mode
    debug: false
});
```

Key features:

-   High-quality text transformations
-   Multiple transformation types
-   Supports various languages
-   Natural, human-like outputs

### Configuration Options

The plugin accepts the following configuration options:

| Option       | Type       | Description                                     | Default  |
| ------------ | ---------- | ----------------------------------------------- | -------- |
| `provider`   | Provider   | Provider for text generation and transformation | required |
| `debug`      | boolean    | Enable debug logging                            | false    |
| `middleware` | Function[] | Array of middleware functions for the generation| undefined|

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 20,
  timeWindowMs: 60000, // 1 minute
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Text generation rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
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
  TextGeneration({
    provider: Anthropic.AnthropicProvider({
      proxyUrl: 'https://your-anthropic-proxy.example.com'
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

For security reasons, you must use a proxy server to handle API requests to Anthropic. The proxy URL is required when configuring providers:

```typescript
provider: Anthropic.AnthropicProvider({
    proxyUrl: 'https://your-anthropic-proxy.example.com'
});
```

Your proxy server should:

1. Receive requests from the client
2. Add the necessary authentication (API key) to the requests
3. Forward requests to the Anthropic API
4. Return responses to the client

Never expose your Anthropic API key in client-side code.

## API Reference

### Main Plugin

```typescript
TextGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
    // Provider for text generation and transformation
    provider: (context: {
        cesdk: CreativeEditorSDK;
    }) => Promise<Provider<'text', any, any>>;

    // Enable debug logging
    debug?: boolean;
}
```

### Anthropic Provider Configuration

```typescript
Anthropic.AnthropicProvider(config: {
  proxyUrl: string;
  debug?: boolean;
})
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Quick Actions**: Canvas menu items for text transformations

### Canvas Menu Integration

The plugin adds a "Magic Menu" to the canvas context menu for text blocks with the following transformation options:

-   **Improve Writing**: Enhance the quality and clarity of text
-   **Fix Spelling & Grammar**: Correct language errors in text
-   **Make Shorter**: Create a more concise version of the text
-   **Make Longer**: Expand text with additional details
-   **Generate Speech Text**: Format text for speech or presentations
-   **Change Tone**: Modify the tone of text to professional, casual, friendly, serious, humorous, or optimistic
-   **Translate**: Translate text to various languages
-   **Change Text to...**: Completely rewrite text based on a custom prompt

The AI text menu is automatically added to the canvas menu by the enhanced provider. You can access the canvas menu component ID via:

```typescript
// Access the canvas menu ID from the enhanced provider
const textCanvasMenuId = Anthropic.AnthropicProvider.canvasMenu.text.id; // 'ly.img.ai.text.canvasMenu'

// Manual canvas menu ordering (if needed)
cesdk.ui.setCanvasMenuOrder([
    Anthropic.AnthropicProvider.canvasMenu.text.id,
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

### Canvas Menu Control

If you need full control over canvas menu integration, you can disable automatic registration:

```typescript
provider: Anthropic.AnthropicProvider({
    proxyUrl: 'https://your-anthropic-proxy.example.com',
    addToCanvasMenu: false // Disable automatic canvas menu registration
})

// You are now responsible for manually adding the canvas menu components
cesdk.ui.setCanvasMenuOrder([
    {
        id: Anthropic.AnthropicProvider.canvasMenu.text.id,
        children: Anthropic.AnthropicProvider.canvasMenu.text.children
    },
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

## Anthropic Provider Quick Actions

The Anthropic provider automatically registers the following quick actions in the text canvas menu (in this default order):

### Default Quick Action Order

| Quick Action ID | Label | Description | Icon |
|-----------------|-------|-------------|------|
| `anthropic.improve` | Improve | Enhance the quality and clarity of text | @imgly/MagicWand |
| `anthropic.fix` | Fix Spelling & Grammar | Correct language errors in text | @imgly/CheckmarkAll |
| `anthropic.shorter` | Make Shorter | Create a more concise version of the text | @imgly/TextShorter |
| `anthropic.longer` | Make Longer | Expand text with additional details | @imgly/TextLonger |
| `ly.img.separator` | — | Visual separator | — |
| `anthropic.changeTone` | Change Tone | Modify tone (professional, casual, friendly, etc.) | @imgly/Microphone |
| `anthropic.translate` | Translate | Translate text to various languages | @imgly/Language |
| `ly.img.separator` | — | Visual separator | — |
| `anthropic.changeTextTo` | Change Text to... | Completely rewrite text based on custom prompt | @imgly/Rename |

### Canvas Menu Component Information

```typescript
// Access the Anthropic provider's canvas menu information
Anthropic.AnthropicProvider.canvasMenu.text = {
    id: 'ly.img.ai.text.canvasMenu',
    children: [
        'anthropic.improve',
        'anthropic.fix', 
        'anthropic.shorter',
        'anthropic.longer',
        'ly.img.separator',
        'anthropic.changeTone',
        'anthropic.translate',
        'ly.img.separator',
        'anthropic.changeTextTo'
    ]
}
```

### Customizing Quick Action Order

To customize the order of text quick actions, disable automatic canvas menu registration and configure manually:

```typescript
// Configure provider without automatic canvas menu registration
provider: Anthropic.AnthropicProvider({
    proxyUrl: 'https://your-anthropic-proxy.example.com',
    addToCanvasMenu: false
})

// Manually configure canvas menu with custom order
cesdk.ui.setCanvasMenuOrder([
    {
        id: 'ly.img.ai.text.canvasMenu',
        children: [
            'anthropic.improve',      // Most commonly used first
            'anthropic.fix',
            'ly.img.separator',
            'anthropic.changeTone',   // Advanced options
            'anthropic.translate',
            'anthropic.changeTextTo'
            // Note: removed shorter/longer for a more focused menu
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

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
