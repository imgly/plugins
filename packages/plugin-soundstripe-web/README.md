# IMG.LY CE.SDK Plugin Soundstripe

This plugin provides integration with Soundstripe's audio library, allowing you to search and use Soundstripe audio tracks directly within CE.SDK.

## Features

- 🎵 Search and browse Soundstripe's audio library directly in CE.SDK
- 🔄 Automatic refresh of expired audio URIs
- 📦 Seamless integration with CE.SDK's asset management system
- 🎨 Artist credits and metadata support

## Installation

You can install the plugin via npm or a compatible package manager. Use the following commands to install the package:

```bash
pnpm add @imgly/plugin-soundstripe-web
# or
yarn add @imgly/plugin-soundstripe-web
# or
npm install @imgly/plugin-soundstripe-web
```

## Prerequisites

### 1. Soundstripe API Key
You'll need a valid Soundstripe API key. You can obtain one from [Soundstripe](https://soundstripe.com/).

### 2. Proxy Server Setup (Required)
**⚠️ Important:** Soundstripe's API requires server-side proxy implementation for production use. Direct browser access to Soundstripe's API is intended for development only.

You must set up a proxy server as described in [Soundstripe's integration guide](https://docs.soundstripe.com/docs/integrating-soundstripes-content-into-your-application). This proxy will:
- Handle authentication securely
- Prevent exposing your API key in client-side code
- Ensure CORS compliance
- Maintain stable API access

## Usage

### Basic Setup

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import SoundstripePlugin from '@imgly/plugin-soundstripe-web';

const config = {
  license: '<your-license-here>'
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources();
await cesdk.addDemoAssetSources({ sceneMode: 'Design' });

// Add the Soundstripe plugin
await cesdk.addPlugin(
  SoundstripePlugin({
    apiKey: 'your-soundstripe-api-key'
  })
);

// Verify the asset source is available
console.log(
  `Available asset sources: ${cesdk.engine.asset
    .findAllSources()
    .join(', ')}`
);

await cesdk.createDesignScene();
```

### Adding Soundstripe to Audio Asset Library

To make Soundstripe appear in the Audio asset library panel, update the audio entry to include the Soundstripe source:

```typescript
// After adding the Soundstripe plugin
await cesdk.addPlugin(
  SoundstripePlugin({
    apiKey: 'your-soundstripe-api-key'
  })
);

// Get the existing audio entry
const audioEntry = cesdk.ui.getAssetLibraryEntry('ly.img.audio');

// Add Soundstripe to the audio sources
cesdk.ui.updateAssetLibraryEntry('ly.img.audio', {
  sourceIds: [...audioEntry.sourceIds, 'ly.img.audio.soundstripe']
});

// Now Soundstripe will appear in the Audio asset panel
```

### Automatic URI Refresh

Soundstripe MP3 file URIs expire after a certain time period. This plugin automatically handles URI refresh to ensure your audio tracks continue to play without interruption. The refresh happens:
- When a scene is loaded
- When the block selection changes
- Before playback if URIs are expired

You can also manually trigger a refresh using the exported utility function:

```typescript
import { refreshSoundstripeAudioURIs } from '@imgly/plugin-soundstripe-web';

// Manually refresh all Soundstripe audio URIs in the current scene
await refreshSoundstripeAudioURIs(cesdk.engine, { apiKey });

// Or when using a proxy server
await refreshSoundstripeAudioURIs(cesdk.engine, { baseUrl: 'https://your-proxy.com' });
```

## Configuration

### Plugin Configuration

The plugin can be configured in two ways depending on your setup:

#### Option 1: Direct API Access (Development)
```typescript
import SoundstripePlugin from '@imgly/plugin-soundstripe-web';

await cesdk.addPlugin(SoundstripePlugin({
  apiKey: 'your-soundstripe-api-key' // Your Soundstripe API key
}))
```

#### Option 2: Proxy Server (Production - Recommended)
```typescript
import SoundstripePlugin from '@imgly/plugin-soundstripe-web';

await cesdk.addPlugin(SoundstripePlugin({
  baseUrl: 'https://your-proxy-server.com' // Your proxy server URL
}))
```

#### Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Conditional | Your Soundstripe API key. Required when using direct API access (Option 1). |
| `baseUrl` | `string` | Conditional | Your proxy server base URL. Required when using proxy server (Option 2). |

**Note:** Either `apiKey` or `baseUrl` must be provided. You cannot omit both parameters.


## API Reference

### `SoundstripePlugin(configuration)`

Creates a new Soundstripe plugin instance.

#### Parameters
- `configuration.apiKey` (string, optional): Your Soundstripe API key. Required when using direct API access.
- `configuration.baseUrl` (string, optional): Your proxy server base URL. Required when using proxy server.

**Note:** Either `apiKey` or `baseUrl` must be provided.

#### Returns
A plugin object compatible with CE.SDK's plugin system

### `refreshSoundstripeAudioURIs(engine, config)`

Manually refreshes all Soundstripe audio URIs in the current scene.

#### Parameters
- `engine` (CreativeEngine, required): The CE.SDK engine instance
- `config` (object, optional): Configuration object with the following properties:
  - `apiKey` (string, optional): Your Soundstripe API key. Optional when using proxy server.
  - `baseUrl` (string, optional): Your proxy server base URL

#### Returns
Promise<void>

## How It Works

1. **Asset Discovery**: The plugin registers as an asset source (`ly.img.audio.soundstripe`) in CE.SDK
2. **Search Integration**: Users can search Soundstripe's library through CE.SDK's asset panel
3. **Metadata Storage**: When an audio track is added, the plugin stores the Soundstripe song ID as metadata
4. **Automatic Refresh**: The plugin monitors for expired URIs and automatically fetches fresh ones using the stored song IDs
5. **Seamless Playback**: Users experience uninterrupted audio playback even when URIs expire

## License

See LICENSE.md file for licensing information.

## Support

For support, please contact support@img.ly
