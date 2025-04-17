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

    // Set canvas menu order to display AI text actions
    cesdk.ui.setCanvasMenuOrder([
        'ly.img.ai.text.canvasMenu',
        ...cesdk.ui.getCanvasMenuOrder()
    ]);
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

| Option     | Type     | Description                                     | Default  |
| ---------- | -------- | ----------------------------------------------- | -------- |
| `provider` | Provider | Provider for text generation and transformation | required |
| `debug`    | boolean  | Enable debug logging                            | false    |

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

To add the AI text menu to your canvas menu, use:

```typescript
cesdk.ui.setCanvasMenuOrder([
    'ly.img.ai.text.canvasMenu',
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
