# IMG.LY AI Audio Generation for Web

A plugin for integrating AI audio generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-audio-generation-web` package enables users to generate audio content using AI directly within CreativeEditor SDK. This shipped provider leverages the [ElevenLabs](https://elevenlabs.io) platform to provide high-quality text-to-speech and sound effect generation.

Features include:

-   Text-to-speech generation with multiple voices
-   Sound effect generation from text descriptions
-   Voice selection interface
-   Speed adjustment
-   Automatic history tracking
-   Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-audio-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

#### Single Provider Configuration

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the audio generation plugin
    cesdk.addPlugin(
        AudioGeneration({
            // Text-to-speech provider
            text2speech: Elevenlabs.ElevenMultilingualV2({
                proxyUrl: 'http://your-proxy-server.com/api/proxy',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                }
            }),

            // Sound effects provider (optional)
            text2sound: Elevenlabs.ElevenSoundEffects({
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
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the audio generation plugin with multiple providers
    cesdk.addPlugin(
        AudioGeneration({
            // Multiple text-to-speech providers
            text2speech: [
                Elevenlabs.ElevenMultilingualV2({
                    proxyUrl: 'http://your-proxy-server.com/api/proxy',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                }),
                // Add more providers here as they become available
                // OtherProvider.SomeModel({
                //     proxyUrl: 'http://your-proxy-server.com/api/proxy',
                //     headers: {
                //         'x-api-key': 'your-key',
                //         'x-source': 'cesdk'
                //     }
                // })
            ],

            // Sound effects provider (optional)
            text2sound: Elevenlabs.ElevenSoundEffects({
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

The plugin comes with two pre-configured providers for ElevenLabs:

#### 1. ElevenMultilingualV2 (Text-to-Speech)

A versatile text-to-speech engine that supports multiple languages and voices:

```typescript
text2speech: Elevenlabs.ElevenMultilingualV2({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Key features:

-   Multiple voice options
-   Multilingual support
-   Adjustable speaking speed
-   Natural-sounding speech
-   Custom headers support for API requests

**Custom Translations:**

```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.prompt': 'Enter text to convert to speech',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.voice_id': 'Select Voice',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.speed': 'Playback Speed'
  }
});
```

#### 2. ElevenSoundEffects (Text-to-Sound)

A sound effect generator that creates audio from text descriptions:

```typescript
text2sound: Elevenlabs.ElevenSoundEffects({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
```

Key features:

-   Generate sound effects from text descriptions
-   Create ambient sounds, effects, and music
-   Seamless integration with CreativeEditor SDK
-   Automatic thumbnails and duration detection
-   Custom headers support for API requests

**Custom Translations:**

```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.prompt': 'Describe the sound you want to create',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.duration': 'Audio Length'
  }
});
```

### Feature Control

You can control various aspects of the audio generation plugin using the Feature API:

```typescript
// Disable provider selection for speech
cesdk.feature.enable('ly.img.plugin-ai-audio-generation-web.speech.providerSelect', false);

// Disable provider selection for sound effects
cesdk.feature.enable('ly.img.plugin-ai-audio-generation-web.sound.providerSelect', false);

// Control individual provider visibility
cesdk.feature.enable('ly.img.plugin-ai-audio-generation-web.providerSelect', false);
```

For more information about Feature API and available feature flags, see the [@imgly/plugin-ai-generation-web documentation](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web#available-feature-flags).

### Customizing Labels and Translations

You can customize all labels and text in the AI audio generation interface using the translation system. This allows you to provide better labels for your users in any language.

#### Translation Key Structure

The system checks for translations in this order (highest to lowest priority):

1. **Provider-specific**: `ly.img.plugin-ai-audio-generation-web.${provider}.property.${field}` - Override labels for a specific AI provider
2. **Generic**: `ly.img.plugin-ai-generation-web.property.${field}` - Override labels for all AI plugins

#### Basic Example

```typescript
// Customize labels for your AI audio generation interface
cesdk.i18n.setTranslations({
  en: {
    // Generic labels (applies to ALL AI plugins)
    'ly.img.plugin-ai-generation-web.property.prompt': 'Describe what you want to create',
    'ly.img.plugin-ai-generation-web.property.voice_id': 'Voice Selection',
    'ly.img.plugin-ai-generation-web.property.speed': 'Speaking Speed',

    // Provider-specific for ElevenMultilingualV2
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.prompt': 'Enter text to speak',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.voice_id': 'Choose Voice',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.speed': 'Speech Speed',

    // Provider-specific for ElevenSoundEffects
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.prompt': 'Describe the sound effect',
    'ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.duration': 'Sound Duration'
  }
});
```

### Configuration Options

The plugin accepts the following configuration options:

| Option        | Type                 | Description                                     | Default   |
| ------------- | -------------------- | ----------------------------------------------- | --------- |
| `text2speech` | Provider \| Provider[] | Provider(s) for text-to-speech generation. When multiple providers are provided, users can select between them | undefined |
| `text2sound`  | Provider \| Provider[] | Provider(s) for sound effect generation. When multiple providers are provided, users can select between them | undefined |
| `debug`       | boolean              | Enable debug logging                            | false     |
| `dryRun`      | boolean              | Simulate generation without API calls           | false     |
| `middleware`  | Function[]           | Array of middleware functions for the generation | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 15,
  timeWindowMs: 60000, // 1 minute
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Audio generation rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
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
  AudioGeneration({
    text2speech: Elevenlabs.ElevenMultilingualV2({
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

For security reasons, it's recommended to use a proxy server to handle API requests to ElevenLabs. The proxy URL is required when configuring providers:

```typescript
text2speech: Elevenlabs.ElevenMultilingualV2({
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

You'll need to implement a proxy server that forwards requests to ElevenLabs and handles authentication.

## API Reference

### Main Plugin

```typescript
AudioGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
    // Provider(s) for text-to-speech generation
    text2speech?: AiAudioProvider | AiAudioProvider[];

    // Provider(s) for sound effect generation
    text2sound?: AiAudioProvider | AiAudioProvider[];

    // Enable debug logging
    debug?: boolean;

    // Skip actual API calls for testing
    dryRun?: boolean;

    // Extend the generation process
    middleware?: GenerationMiddleware;
}
```

### ElevenLabs Providers

#### ElevenMultilingualV2

```typescript
Elevenlabs.ElevenMultilingualV2(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiAudioProvider
```

#### ElevenSoundEffects

```typescript
Elevenlabs.ElevenSoundEffects(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiAudioProvider
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Speech Generation Panel**: A sidebar panel for text-to-speech generation
2. **Sound Generation Panel**: A sidebar panel for generating sound effects
3. **Voice Selection Panel**: A panel for choosing different voice options
4. **History Library**: Displays previously generated audio clips

### Panel IDs

-   Main speech panel: `ly.img.ai.elevenlabs/monolingual/v1`
-   Main sound panel: `ly.img.ai.elevenlabs/sound-generation`
-   Voice selection panel: `ly.img.ai.audio-generation/speech/elevenlabs.voiceSelection`

### Asset History

Generated audio files are automatically stored in asset sources with the following IDs:

-   Text-to-Speech: `elevenlabs/monolingual/v1.history`
-   Sound Effects: `elevenlabs/sound-generation.history`

## Translations

For customization and localization, see the [translations.json](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web/translations.json) file which contains provider-specific translation keys for audio generation interfaces.

## Related Packages

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web) - AI video generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
