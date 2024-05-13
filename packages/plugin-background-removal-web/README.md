# IMG.LY CE.SDK Plugin Background Removal

![Hero image showing the configuration abilities of the Background Removal plugin](https://img.ly/static/plugins/background-removal/gh-repo-header.jpg)

This plugin introduces background removal for the CE.SDK editor, leveraging the power of the [background-removal-js library](https://github.com/imgly/background-removal-js). It integrates seamlessly with CE.SDK, providing users with an efficient tool to remove backgrounds from images directly in the browser with ease and no additional costs or privacy concerns.

## Installation

You can install the plugin via npm or yarn. Use the following commands to install the package:

```
yarn add @imgly/plugin-background-removal-web
npm install @imgly/plugin-background-removal-web
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
await cesdk.addDefaultAssetSources(),
    await cesdk.addDemoAssetSources({ sceneMode: 'Design' }),
    await cesdk.unstable_addPlugin(BackgroundRemovalPlugin());

await cesdk.createDesignScene();
```

## Configuration

By default, this plugin uses the `@imgly/background-removal-js` library to remove
a background from the image fill. All configuration options from this underlying
library can be used in this plugin.

[See the documentation](https://github.com/imgly/background-removal-js/tree/main/packages/web#advanced-configuration) for further information.

```typescript
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';

[...]

await cesdk.unstable_addPlugin(BackgroundRemovalPlugin({
  provider: {
    type: '@imgly/background-removal',
    configuration: {
        publicPath: '...',
        // All other configuration option that are passed to the bg removal
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
        // This is an optional function that can do some pre-processing, e.g. creating
        // a mask that is applied on all images from the source set in the process function.
        // The returned blob is passed as the second argument in `process`
        preprocess: async (uriToProcess: string) => {
            const mask = await segmentForeground(uriToProcess);
            return mask;
        },
        process: (
            sourceSet: {
                uri: string;
                width?: number;
                height?: number;
            }[],
            preprocessedData?: Blob
        ): Blob[] => {
            const masked = await Promise.all(
                sourceSet.map((source) => {
                    // ...
                })
            );

            return masked;
        }
    }
});
```
