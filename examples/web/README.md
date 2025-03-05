# IMG.LY Plugins for the CE.SDK editor

Sample vite projects that can be used to test the plugins in the repository.

## How to add a plugin into this example project

If a new plugin is under `packages/` it will automatically be picked up
by the pnpm workspaces. Calling `pnpm dev` in the projects root, will automatically
call `pnpm dev` for the plugin.

All you have to do is to import and add the plugin in `examples/web/src/addPlugins`.

## CE.SDK License Key

To start the CE.SDK editor with a valid license, create a file `.env.local` with
the following content:

```
VITE_CESDK_LICENSE_KEY=<the-cesdk-license-key>
```
