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

To use the plugin, import it and configure it with your preferred provider(s):

#### Single Provider

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
                proxyUrl: 'https://your-anthropic-proxy.example.com',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                }
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

#### Multiple Providers

You can configure multiple providers, and users will see a selection box to choose between them:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the text generation plugin with multiple providers
    cesdk.addPlugin(
        TextGeneration({
            provider: [
                Anthropic.AnthropicProvider({
                    proxyUrl: 'https://your-anthropic-proxy.example.com',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                }),
                // Add more providers here as they become available
                // OtherProvider.SomeModel({
                //     proxyUrl: 'https://your-other-proxy.example.com',
                //     headers: {
                //         'x-api-key': 'your-key',
                //         'x-source': 'cesdk'
                //     }
                // })
            ],

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
    
    // Optional custom headers for API requests
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0',
        'x-request-source': 'cesdk-plugin'
    },
    
    // Optional debug mode
    debug: false
});
```

Key features:

-   High-quality text transformations
-   Multiple transformation types
-   Supports various languages
-   Natural, human-like outputs
-   Custom headers support for API requests

### Configuration Options

The plugin accepts the following configuration options:

| Option       | Type                 | Description                                     | Default  |
| ------------ | -------------------- | ----------------------------------------------- | -------- |
| `provider`   | Provider \| Provider[] | Provider(s) for text generation and transformation. When multiple providers are provided, users can select between them | required |
| `debug`      | boolean              | Enable debug logging                            | false    |
| `middleware` | Function[]           | Array of middleware functions for the generation| undefined|

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
    proxyUrl: 'https://your-anthropic-proxy.example.com',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Your proxy server should:

1. Receive requests from the client
2. Add the necessary authentication (API key) to the requests
3. Forward requests to the Anthropic API
4. Return responses to the client

The `headers` option allows you to include custom HTTP headers in all API requests. This is useful for:
- Adding custom client identification headers
- Including version information
- Passing through metadata required by your API
- Adding correlation IDs for request tracing

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
    // Provider(s) for text generation and transformation
    provider: (context: {
        cesdk: CreativeEditorSDK;
    }) => Promise<Provider<'text', any, any> | Provider<'text', any, any>[]>;

    // Enable debug logging
    debug?: boolean;
}
```

### Anthropic Provider Configuration

```typescript
Anthropic.AnthropicProvider(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Quick Actions**: Canvas menu items for text transformations

### Canvas Menu Integration

The plugin automatically registers quick actions for text transformation. Here are the available quick actions:

#### Available Quick Actions

- **`ly.img.improve`**: Improve writing quality
  - Input: `{ prompt: string }`

- **`ly.img.fix`**: Fix spelling and grammar
  - Input: `{ prompt: string }`

- **`ly.img.shorter`**: Make text shorter
  - Input: `{ prompt: string }`

- **`ly.img.longer`**: Make text longer
  - Input: `{ prompt: string }`

- **`ly.img.changeTone`**: Change the tone of the text
  - Input: `{ prompt: string, type: string }`

- **`ly.img.translate`**: Translate text to different languages
  - Input: `{ prompt: string, language: string }`

- **`ly.img.changeTextTo`**: Change text to a different format or style
  - Input: `{ prompt: string, customPrompt: string }`

#### Provider Quick Action Support

Providers declare which quick actions they support through their configuration:

```typescript
const myTextProvider = {
    // ... other provider config
    input: {
        // ... panel config
        quickActions: {
            supported: {
                'ly.img.improve': {
                    mapInput: (quickActionInput) => ({
                        prompt: quickActionInput.prompt
                    })
                },
                'ly.img.fix': {
                    mapInput: (quickActionInput) => ({
                        prompt: quickActionInput.prompt
                    })
                },
                'ly.img.changeTone': {
                    mapInput: (quickActionInput) => ({
                        prompt: quickActionInput.prompt,
                        tone: quickActionInput.type
                    })
                }
                // Add more supported quick actions as needed
            }
        }
    }
};
```

To add the AI text menu to your canvas menu, use:

```typescript
cesdk.ui.setCanvasMenuOrder([
    'ly.img.ai.text.canvasMenu',
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

## Related Packages

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web) - AI video generation
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
