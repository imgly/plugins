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
                proxyUrl: 'https://your-elevenlabs-proxy.example.com'
            }),

            // Sound effects provider (optional)
            text2sound: Elevenlabs.ElevenSoundEffects({
                proxyUrl: 'https://your-elevenlabs-proxy.example.com'
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
    proxyUrl: 'https://your-elevenlabs-proxy.example.com'
});
```

Key features:

-   Multiple voice options
-   Multilingual support
-   Adjustable speaking speed
-   Natural-sounding speech

#### 2. ElevenSoundEffects (Text-to-Sound)

A sound effect generator that creates audio from text descriptions:

```typescript
text2sound: Elevenlabs.ElevenSoundEffects({
    proxyUrl: 'https://your-elevenlabs-proxy.example.com'
});
```

Key features:

-   Generate sound effects from text descriptions
-   Create ambient sounds, effects, and music
-   Seamless integration with CreativeEditor SDK
-   Automatic thumbnails and duration detection

### Configuration Options

The plugin accepts the following configuration options:

| Option        | Type     | Description                                  | Default   |
| ------------- | -------- | -------------------------------------------- | --------- |
| `text2speech` | Provider | Provider for text-to-speech generation       | undefined |
| `text2sound`  | Provider | Provider for sound effect generation         | undefined |
| `debug`       | boolean  | Enable debug logging                         | false     |
| `dryRun`      | boolean  | Simulate generation without API calls        | false     |
| `middleware`  | Function | Custom middleware for the generation process | undefined |

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to ElevenLabs. The proxy URL is required when configuring providers:

```typescript
text2speech: Elevenlabs.ElevenMultilingualV2({
    proxyUrl: 'https://your-elevenlabs-proxy.example.com'
});
```

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
    // Provider for text-to-speech generation
    text2speech?: AiAudioProvider;

    // Provider for sound effect generation
    text2sound?: AiAudioProvider;

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
  debug?: boolean;
}): AiAudioProvider
```

#### ElevenSoundEffects

```typescript
Elevenlabs.ElevenSoundEffects(config: {
  proxyUrl: string;
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

-   Main speech panel: `ly.img.ai/elevenlabs/monolingual/v1`
-   Main sound panel: `ly.img.ai/elevenlabs/sound-generation`
-   Voice selection panel: `ly.img.ai/audio-generation/speech/elevenlabs.voiceSelection`

### Asset History

Generated audio files are automatically stored in asset sources with the following IDs:

-   Text-to-Speech: `elevenlabs/monolingual/v1.history`
-   Sound Effects: `elevenlabs/sound-generation.history`

## Related Packages

-   [@imgly/plugin-utils-ai-generation](https://github.com/imgly/plugin-utils-ai-generation) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugin-ai-video-generation-web) - AI video generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
