# IMG.LY CE.SDK Plugin Remote Asset Source

This plugin introduces the client side plugin for interfacing with Remote Asset Source Server Interfaces.
The unified server side interface provides the following endpoints currently:

- `GET /` - to get metadata about this particular remote asset source, like e.g its id and capabilities
- `GET /assets` - to get a list of assets, and query them using `findAssets``
- `GET /assets/:id` - (optional) to get a single asset by its id, if the remote asset source supports it. Can be used e.g to revalidate assets.

Currently this interface does not implement Create, Update or Delete operations, but it is planned to do so in the future.

Contact us for access to our alpha version of the server side interface, which includes interfaces for:

- "Giphy" API video resources
- "Unsplash" API image resources
- "Pexels" API image resources
- "Pexels" API video resources
- "Getty Images" API image resources

## Installation

You can install the plugin via npm or a compatible package manager. Use the following commands to install the package:

```
pnpm add @imgly/plugin-remote-asset-source-web
yarn add @imgly/plugin-remote-asset-source-web
npm install @imgly/plugin-remote-asset-source-web
```

## Usage

Adding the plugin to CE.SDK will add a new asset source to the engine.

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import RemoteAssetSourcePlugin from '@imgly/plugin-background-removal-web';

const config = {
  license: '<your-license-here>'
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources();
await cesdk.addDemoAssetSources({ sceneMode: 'Design' });
await cesdk.addPlugin(
  RemoteAssetSourcePlugin({
    baseUrl: 'https://your-remote-asset-source-server.com'
  })
);
console.log(
  `Available asset sources: ${cesdk.engine.asset
    .findAllSources()
    .join(
      ', '
    )}. Don't forget to newly added asset sources to the Dock by adjusting the insertEntries in the CE.SDK UI configuration. See more on that here: https://img.ly/docs/cesdk/ui/guides/customize-asset-library `
);

await cesdk.createDesignScene();
```

## Configuration

The plugin needs to be configured with a `baseUrl` to the remote asset source server. The `baseUrl` should point to the root of the remote asset source interface.

```typescript
import RemoteAssetSourcePlugin from '@imgly/plugin-remote-asset-source-web';

[...]

await cesdk.addPlugin(RemoteAssetSourcePlugin({
  baseUrl: '...',
}))

```
