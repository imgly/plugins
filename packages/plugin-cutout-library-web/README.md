# IMG.LY CE.SDK Plugin Cutouts

This plugin introduces adds cutout functionality to the CreativeEditor SDK.
It allows users to add a rectangular or elliptical cutout to the scene. It also allows users to cutout the currently selected shape.
It registers a custom asset source called `ly.img.cutout` which then can be added to the dock.
It also adds a custom canvas menu entry when a graphic or text block is selected.

## Installation

You can install the plugin via npm or a compatible package manager. Use the following commands to install the package:

```
pnpm add @imgly/plugin-cutout-library-web
yarn add @imgly/plugin-cutout-library-web
npm install @imgly/plugin-cutout-library-web
```

## Usage

When adding the plugin to the CE.SDK, you can also add an action button to the canvas menu. Further, we provide a utility method for getting a insert entry for the cutout library that adds the cutout library to the dock.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import CutoutLibraryPlugin from '@imgly/plugin-cutout-library-web';

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources();
await cesdk.addDemoAssetSources({ sceneMode: 'Design' });
await cesdk.addPlugin(
  CutoutLibraryPlugin({
    ui: { locations: ['canvasMenu'] }
  })
);
const cutoutAssetEntry = cesdk.ui.getAssetLibraryEntry('ly.img.cutout.entry');
cesdk.ui.setDockOrder([
  ...cesdk.ui.getDockOrder(),
  {
    id: 'ly.img.assetLibrary.dock',
    label: 'Cutout',
    key: 'ly.img.assetLibrary.dock',
    icon: cutoutAssetEntry?.icon,
    entries: ['ly.img.cutout.entry']
  }
]);

await cesdk.createDesignScene();
```
