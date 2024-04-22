# IMG.LY CE.SDK Plugin Cutouts

This plugin introduces adds cutout functionality to the CreativeEditor SDK.
It allows users to add a rectangular or elliptical cutout to the scene. It also allows users to cutout the currently selected shape.
It registers a custom asset source called `ly.img.cutout` which then can be added to the dock.
It also adds a custom canvas menu entry when a graphic or text block is selected.

## Installation

You can install the plugin via npm or yarn. Use the following commands to install the package:

```
yarn add @imgly/plugin-cutout-library-web
npm install @imgly/plugin-cutout-library-web
```

## Usage

Adding the plugin to CE.SDK will automatically add a background removal
canvas menu entry for every block with an image fill.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';

const config = {
  license: '<your-license-here>'
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources(),
  await cesdk.addDemoAssetSources({ sceneMode: 'Design' }),
  await cesdk.unstable_addPlugin(
    CutoutLibraryPlugin({
      ui: { locations: ['canvasMenu'] }
    })
  );

await cesdk.createDesignScene();
```
