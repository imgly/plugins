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
await cesdk.addPlugin(VectorizerPlugin());

// Add the canvas menu component for background removal
cesdk.ui.setCanvasMenuOrder([
  '@imgly/plugin-vectorizer-web.canvasMenu',
  ...cesdk.ui.getCanvasMenuOrder()
]);

await cesdk.createDesignScene();
```

## Configuration

### Adding Canvas Menu Component

After adding the plugin to CE.SDK, it will register several components that can be
used inside the editor. They are not added by default but can be included
using the following configuration:

```typescript
// Potential locations are:
// 'dock', 'canvasMenu', 'canvasBarTop', 'canvasBarBottom',
// 'inspectorBar', 'navigationBar'
VectorizerPlugin({
  ui: { locations: 'canvasMenu' }
})
```

However, if you want to add the components manually, e.g. to be more flexible about the concrete position, you can use the following code snippet:

```typescript
// Adding to the dock
cesdk.ui.setDockOrder([
  ...cesdk.ui.getDockOrder(),
  '@imgly/plugin-vectorizer-web.dock',
]);

// Adding to the inspector bar
cesdk.ui.setInspectorBarOrder([
  '@imgly/plugin-vectorizer-web.inspectorBar',
  ...cesdk.ui.getInspectorBarOrder()
]);

// Adding to the canvas menu
cesdk.ui.setCanvasMenuOrder([
  '@imgly/plugin-vectorizer-web.canvasMenu',
  ...cesdk.ui.getCanvasMenuOrder()
]);
```

### Further Configuration Options

#### Timeout

The duration of the vectorization process depends on the complexity of the input image. For highly detailed images, it can take a considerable amount of time. A timeout is configured to abort the process after 30 seconds by default, but this can be customized using the `timeout` option.

```typescript
VectorizerPlugin({
  // Reduce the timeout to 5s
  timeout: 5000
})
```

#### Threshold for Group Creation

For simple vectorized images, using groups makes a lot of sense. Single paths can be selected, allowing the user to change the color, for instance. However, once the number of paths exceeds a certain threshold, the user experience deteriorates significantly as it becomes difficult to select individual paths.

Based on the use case you can adapt this threshold (default is 500).

```typescript
VectorizerPlugin({
  // Reducing the maximal number of groups to 200
  groupingThreshold: 200
})
```
