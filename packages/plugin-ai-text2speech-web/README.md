# CE.SDK AI Text-to-Speech Plugin

This plugin integrates Text-to-Speech capabilities into the Creative Editor SDK.

## Features

- Convert text to natural-sounding speech
- Support for multiple voices and languages
- Customizable text input
- Easy integration with CE.SDK

## Installation

```bash
npm install @imgly/plugin-ai-text2speech-web
```

## Usage

```js
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AITextToSpeechPlugin from '@imgly/plugin-ai-text2speech-web';

// Initialize CE.SDK with the plugin
const cesdk = CreativeEditorSDK.create({
  container: '#cesdk',
  plugins: [
    AITextToSpeechPlugin({
      // Plugin configuration options
    })
  ]
});
```

## Configuration

The plugin accepts the following configuration options:

```typescript
{
  // Plugin configuration options will be documented here
}
```

## License

See [LICENSE.md](./LICENSE.md) file for details.