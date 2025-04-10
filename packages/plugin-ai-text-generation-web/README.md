# IMG.LY Creative Editor SDK AI Text2Text Plugin

A plugin for [IMG.LY Creative Editor SDK](https://img.ly/) that provides AI-powered text transformation capabilities using the Claude AI model from Anthropic. Other providers will be added in the future.

## Features

This plugin adds a "Magic Menu" with the following text transformation options:

-   **Improve Writing**: Enhance the quality and clarity of text
-   **Fix Spelling & Grammar**: Correct language errors in text
-   **Make Shorter**: Create a more concise version of the text
-   **Make Longer**: Expand text with additional details
-   **Change Tone**: Modify the tone of text to professional, casual, friendly, serious, humorous, or optimistic
-   **Translate**: Translate text to various languages
-   **Change Text to...**: Completely rewrite text based on a custom prompt

## Installation

```bash
npm install @imgly/plugin-ai-text2text-web
```

## Usage

Add the plugin to your Creative Engine instance:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AIText2TextPlugin from '@imgly/plugin-ai-text2text-web';

const cesdk = CreativeEditorSDK.create(domElement, {
    // other configuration options...
});

// Add the plugin
cesdk.addPlugin(
    AIText2TextPlugin({
        provider: {
            id: 'anthropic',
            proxyUrl: 'https://your-proxy-server.com/anthropic',
            // Optional configuration
            model: 'claude-3-haiku-20240307',
            maxTokens: 1000,
            temperature: 0.7
        },
        // Optional debug mode
        debug: false
    })
);

// The plugin registers new canvas "magic menu" for text. It can
// be placed in the desired position in the menu order with the
// following code:
cesdk.ui.setCanvasMenuOrder([
    'ly.img.ai.text.canvasMenu',
    ...instance.ui.getCanvasMenuOrder()
]);
```

## Security Note

This plugin requires a proxy server to handle API key injection. The proxy server should:

1. Receive requests from the client
2. Add the Anthropic API key to the request
3. Forward the request to Anthropic
4. Return the response to the client

Never expose your Anthropic API key in client-side code.

## Configuration

### PluginConfiguration

| Option     | Type                | Required | Description                       |
| ---------- | ------------------- | -------- | --------------------------------- |
| `provider` | `Text2TextProvider` | Yes      | The AI provider configuration     |
| `debug`    | `boolean`           | No       | Enable console logs for debugging |

### AnthropicProvider (only supported provider for now)

| Option        | Type          | Required | Description                                                                                                               |
| ------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `'anthropic'` | Yes      | Provider identifier (must be 'anthropic')                                                                                 |
| `proxyUrl`    | `string`      | Yes      | URL to AI service that handles API key injection                                                                          |
| `model`       | `string`      | No       | Anthropic model to use (see [Anthropic documentation](https://docs.anthropic.com/en/docs/about-claude/models/all-models)) |
| `maxTokens`   | `number`      | No       | Maximum token generation limit                                                                                            |
| `temperature` | `number`      | No       | Randomness level (0.0-1.0)                                                                                                |

### Extending the "magic menu"

The "magic menu" can be extended with additional entries from other plugins. This allows you to combine multiple AI-powered text transformation plugins, each providing their own specialized capabilities.

#### Adding entries from other plugins

When other plugins export their own `MagicEntry` objects, you can add them to the existing magic menu:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AIText2TextPlugin from '@imgly/plugin-ai-text2text-web';
import OtherPlugin from '@imgly/other-plugin';

// Initialize Creative Engine
const cesdk = CreativeEditorSDK.create(domElement, {
    // config options...
});

// Add the plugins
cesdk.addPlugin(
    AIText2TextPlugin({
        provider: {
            id: 'anthropic',
            proxyUrl: 'https://your-proxy-server.com/anthropic'
        }
    })
);
cesdk.addPlugin(OtherPlugin());

// Set canvas menu order to render the magic button
instance.ui.setCanvasMenuOrder([
    'ly.img.ai.text.canvasMenu',
    ...instance.ui.getCanvasMenuOrder()
]);
```

For plugin developers wanting to create and export compatible magic entries, refer to the `MagicEntry` interface in the plugin source code.
