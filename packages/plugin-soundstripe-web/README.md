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
await refreshSoundstripeAudioURIs(apiKey, cesdk.engine);
```

## Configuration

### Plugin Configuration

```typescript
import SoundstripePlugin from '@imgly/plugin-soundstripe-web';

await cesdk.addPlugin(SoundstripePlugin({
  apiKey: 'your-soundstripe-api-key', // Required: Your Soundstripe API key
}))
```

### Proxy Configuration Example

For production environments, configure your proxy server to handle Soundstripe API requests:

```javascript
// Example Node.js proxy endpoint
app.use('/api/soundstripe', async (req, res) => {
  const response = await fetch(`https://api.soundstripe.com/v1${req.path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SOUNDSTRIPE_API_KEY}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    }
  });
  
  const data = await response.json();
  res.json(data);
});
```

Then modify the plugin to use your proxy endpoint instead of direct API calls.

## API Reference

### `SoundstripePlugin(configuration)`

Creates a new Soundstripe plugin instance.

#### Parameters
- `configuration.apiKey` (string, required): Your Soundstripe API key

#### Returns
A plugin object compatible with CE.SDK's plugin system

### `refreshSoundstripeAudioURIs(apiKey, engine)`

Manually refreshes all Soundstripe audio URIs in the current scene.

#### Parameters
- `apiKey` (string, required): Your Soundstripe API key
- `engine` (CreativeEngine, required): The CE.SDK engine instance

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
