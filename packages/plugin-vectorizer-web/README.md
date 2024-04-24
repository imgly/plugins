# IMG.LY CE.SDK Plugin Vectorizer

This plugin introduces vectorization for the CE.SDK editor, leveraging the power of the [vectorizer library](https://github.com/imgly/vectorizer). It integrates seamlessly with CE.SDK, providing users with an efficient tool to vectorize images directly in the browser with ease and no additional costs or privacy concerns.

## Installation

You can install the plugin via npm or yarn. Use the following commands to install the package:

```
yarn add @imgly/plugin-vectorizer-web
npm install @imgly/plugin-vectorizer-web
```

## Usage

Adding the plugin to CE.SDK will automatically register a vectorizer
canvas menu component that can be rendered for every block with an image fill.
To automatically add this button to the canvas menu, please use the `locations`
configuration option.

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
  await cesdk.unstable_addPlugin(VectorizerPlugin({
    // This will automatically prepend a button to the canvas menu
    ui: { locations: 'canvasMenu' }
  }));

await cesdk.createDesignScene();
```
