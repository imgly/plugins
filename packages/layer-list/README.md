# IMG.LY CE.SDK Plugin Layer List

This plugin adds registers a custom panel that displays a list of all layers in the current design scene.

## Installation

You can install the plugin via npm or yarn. Use the following commands to install the package:

```
yarn add @imgly/plugin-layer-list-web
npm install @imgly/plugin-layer-list-web
```

## Usage

This plugin will register a custom panel inside the editor.
You can then open the custom panel depending on your needs.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import LayerListPlugin from '@imgly/plugin-layer-list-web';

const config = {
  license: '<your-license-here>',
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources(),
await cesdk.addDemoAssetSources({ sceneMode: 'Design' }),
await cesdk.unstable_addPlugin(LayerListPlugin());

await cesdk.createDesignScene();
await cesdk.ui.openPanel("@imgly/plugin-layer-list-web.panel"),
```

### Contributing

This repository is actively maintained by img.ly. We are always open to feedback and suggestions. If you find a bug, please report it by opening an issue or getting in contact with support@img.ly
