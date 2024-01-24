# IMG.LY Plugins for the CE.SDK editor

Sample vite projects that can be used to test the plugins in the repository.

## How to add a plugin into this example project

- In the plugin's directory (e.g. `packages/background-removal`)
  - Go into the plugin package you want to add and test, and call `yarn link`.
  - Start building and developing this plugin project, e.g. with `yarn watch`
  - Changes in the plugin will reload the example project
- In this example project's directory (`examples/web`)
  - Call `yarn link @imgly/plugin-${myPlugin}` in this example project.
  - Add import statement and add the plugin in `src/addPlugins` in this project.

> [!NOTE]
> If you want to unlink a project for any reason you can delete it
> by deleting the link in `~/.config/yarn/link/`.

## CE.SDK License Key

To start the CE.SDK editor with a valid license, create a file `.env.local` with
the following content:

```
VITE_CESDK_LICENSE_KEY=<the-cesdk-license-key>
```
