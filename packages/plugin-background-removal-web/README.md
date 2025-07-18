# IMG.LY CE.SDK Plugin Background Removal

![Hero image showing the configuration abilities of the Background Removal plugin](https://img.ly/static/plugins/background-removal/gh-repo-header.jpg)

This plugin introduces background removal for the CE.SDK editor, leveraging the power of the [background-removal-js library](https://github.com/imgly/background-removal-js). It integrates seamlessly with CE.SDK, provides users with an efficient tool to remove backgrounds from images directly in the browser with ease and no additional costs or privacy concerns.

## Installation

You can install the plugin via npm or a compatible package manager. We are using the `onnxruntime-web` package as a peer dependency.
Use the following commands to install the package:

```
pnpm add @imgly/plugin-background-removal-web onnxruntime-web@1.21.0
yarn add @imgly/plugin-background-removal-web onnxruntime-web@1.21.0
npm install @imgly/plugin-background-removal-web onnxruntime-web@1.21.0
```

## Usage

Adding the plugin to CE.SDK will automatically add a background removal
canvas menu entry for every block with an image fill.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';

const config = {
  license: '<your-license-here>',
  callbacks: {
    // Please note that the background removal plugin depends on an correctly
    // configured upload. 'local' will work for local testing, but in
    // production you will need something stable. Please take a look at:
    // https://img.ly/docs/cesdk/ui/guides/upload-images/
    onUpload: 'local'
  }
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources();
await cesdk.addDemoAssetSources({ sceneMode: 'Design' });
await cesdk.addPlugin(BackgroundRemovalPlugin());

// Add the canvas menu component for background removal
cesdk.ui.setCanvasMenuOrder([
  '@imgly/plugin-background-removal-web.canvasMenu',
  ...cesdk.ui.getCanvasMenuOrder()
]);

await cesdk.createDesignScene();
```

## Configuration

### Adding Components

After adding the plugin to CE.SDK, it will register several components that can be
used inside the editor. They are not added by default but can be included
using the following configuration:

```typescript
// Potential locations are:
// 'dock', 'canvasMenu', 'canvasBarTop', 'canvasBarBottom',
// 'inspectorBar', 'navigationBar'
BackgroundRemovalPlugin({
  ui: { locations: 'canvasMenu' }
});
```

However, if you want to add the components manually, e.g. to be more flexible about the concrete position, you can use the following code snippet:

```typescript
// Adding to the dock
cesdk.ui.setDockOrder([
  ...cesdk.ui.getDockOrder(),
  '@imgly/plugin-background-removal-web.dock'
]);

// Adding to the inspector bar
cesdk.ui.setInspectorBarOrder([
  '@imgly/plugin-background-removal-web.inspectorBar',
  ...cesdk.ui.getInspectorBarOrder()
]);

// Adding to the canvas menu
cesdk.ui.setCanvasMenuOrder([
  '@imgly/plugin-background-removal-web.canvasMenu',
  ...cesdk.ui.getCanvasMenuOrder()
]);
```

### Configuration of `@imgly/background-removal`

By default, this plugin uses the `@imgly/background-removal-js` library to remove
a background from the image fill. All configuration options from this underlying
library can be used in this plugin.

[See the documentation](https://github.com/imgly/background-removal-js/tree/main/packages/web#advanced-configuration) for further information.

```typescript
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';

[...]

await cesdk.addPlugin(BackgroundRemovalPlugin({
  provider: {
    type: '@imgly/background-removal',
    configuration: {
        publicPath: '...',
        // All other configuration options that are passed to the bg removal
        // library. See https://github.com/imgly/background-removal-js/tree/main/packages/web#advanced-configuration
    }
  }
}))

```

## Performance

For optimal performance using the correct CORS headers is important. See the library documentation [here](https://github.com/imgly/background-removal-js/tree/main/packages/web#performance) for more details.

```
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'require-corp'
```

## Custom Background Removal Provider

It is possible to declare a different provider for the background removal process.

```typescript
BackgroundRemovalPlugin({
  provider: {
    type: 'custom',
    // If the image has only one image file URI defined, this method will
    // be called. It must return a single new image file URI with the
    // removed background.
    processImageFileURI: async (imageFileURI: string) => {
      const blob = await removeBackground(imageFileURI);
      const upload = await uploadBlob(blob);
      return upload;
    },
    // Some images have a source set defined which provides multiple images
    // in different sizes.
    processSourceSet: async (
      // Source set for the current block sorted by the resolution.
      // URI with the highest URI is first
      sourceSet: {
        uri: string;
        width: number;
        height: number;
      }[]
    ) => {
      // You should call the remove background method on every URI in the
      // source set. Depending on your service or your algorithm, you
      // have the following options:
      // - Return a source set with a single image (will contradict the use-case of source sets and degrades the user experience)
      // - Create a segmented mask and apply it to every image (not always available)
      // - Create a new source set by resizing the resulting blob.

      // In this example we will do the last case.
      // First image has the highest resolution and might be the best
      // candidate to remove the background.
      const highestResolution = sourceSet[0];
      const highestResolutionBlob = await removeBackground(
        highestResolution.uri
      );
      const highestResolutionURI = await uploadBlob(highestResolutionBlob);

      const remainingSources = await Promise.all(
        sourceSet.slice(1).map((source) => {
          // ...
          const upload = uploadBlob(/* ... */);
          return { ...source, uri: upload };
        })
      );

      return [
        { ...highestResolution, uri: highestResolutionURI },
        remainingSources
      ];
    }
  }
});
```

Depending on your use case or service you might end up with a blob that you want to upload by the
configured upload handler of the editor. This might look like the following function:

```typescript
async function uploadBlob(
  blob: Blob,
  initialUri: string,
  cesdk: CreativeEditorSDK
) {
  const pathname = new URL(initialUri).pathname;
  const parts = pathname.split('/');
  const filename = parts[parts.length - 1];

  const uploadedAssets = await cesdk.unstable_upload(
    new File([blob], filename, { type: blob.type })
  );

  const url = uploadedAssets.meta?.uri;
  if (url == null) {
    throw new Error('Could not upload processed fill');
  }
  return url;
}
```
