# IMG.LY CE.SDK Plugin Vectorizer

This plugin introduces a vectorizer for the CE.SDK editor.

## Installation

You can install the plugin via npm or yarn. Use the following commands to install the package:

```
yarn add @imgly/plugin-vectorizer-web
npm install @imgly/plugin-vectorizer-web
```

## Usage

Adding the plugin to CE.SDK will automatically add a vectorizer
canvas menu entry for every block with an image fill.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

const config = {
  license: '<your-license-here>',
  callbacks: {
    // Please note that the vectorizer plugin depends on an correctly
    // configured upload. 'local' will work for local testing, but in
    // production you will need something stable. Please take a look at:
    // https://img.ly/docs/cesdk/ui/guides/upload-images/
    onUpload: 'local'
  }
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources(),
  await cesdk.addDemoAssetSources({ sceneMode: 'Design' }),
  await cesdk.unstable_addPlugin(VectorizerPlugin());

await cesdk.createDesignScene();
```
