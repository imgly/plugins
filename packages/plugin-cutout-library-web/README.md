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

await cesdk.createDesignScene();
```

## Internationalization (i18n)

The cutout plugin provides several i18n keys that can be customized to support different languages or custom labels.

### Available i18n Keys

| Key | Default (English) | Description |
|-----|------------------|-------------|
| `libraries.ly.img.cutout.entry.label` | "Cutouts" | Label for the cutout library in the dock |
| `plugin-cutout-library-web.notifications.selectCutoutBlock` | "Please select a block to cutout" | Error message when no blocks are selected |
| `plugin-cutout-library-web.notifications.cutoutBlockSelected` | "Cutout blocks cannot be cutout from selection" | Error message when trying to cutout from a cutout block |
| `plugin-cutout-library-web.notifications.differentPages` | "Selected Blocks are from different pages. Please select blocks from the same page." | Error message when blocks from different pages are selected |
| `plugin-cutout-library-web.canvasMenu.button.label` | "Cutout" | Label for the canvas menu button |

### Asset Labels (from content.json)

The plugin also includes labels for the cutout assets themselves:

| Asset | English | German |
|-------|---------|--------|
| Generate from Selection | "Generate from Selection" | "Auswahl ausschneiden" |
| Cutout Rectangle | "Cutout Rectangle" | "Rechteck ausschneiden" |
| Cutout Circle | "Cutout Circle" | "Kreis ausschneiden" |

### Customization Example

You can customize the translations when initializing the plugin by using `cesdk.setTranslations()`:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import CutoutLibraryPlugin from '@imgly/plugin-cutout-library-web';

const cesdk = await CreativeEditorSDK.create(container, config);

// Add the plugin first
await cesdk.addPlugin(
  CutoutLibraryPlugin({
    ui: { locations: ['canvasMenu'] }
  })
);

// Then customize the translations
cesdk.setTranslations({
  en: {
    'libraries.ly.img.cutout.entry.label': 'My Custom Cutouts',
    'plugin-cutout-library-web.notifications.selectCutoutBlock': 'You need to select something first!',
    'plugin-cutout-library-web.notifications.cutoutBlockSelected': 'Cannot cutout a cutout!',
    'plugin-cutout-library-web.notifications.differentPages': 'All selections must be on the same page.',
    'plugin-cutout-library-web.canvasMenu.button.label': 'Create Cutout'
  },
  fr: {
    'libraries.ly.img.cutout.entry.label': 'Découpes',
    'plugin-cutout-library-web.notifications.selectCutoutBlock': 'Veuillez sélectionner un bloc à découper',
    'plugin-cutout-library-web.notifications.cutoutBlockSelected': 'Les blocs de découpe ne peuvent pas être découpés',
    'plugin-cutout-library-web.notifications.differentPages': 'Les blocs sélectionnés proviennent de pages différentes. Veuillez sélectionner des blocs de la même page.',
    'plugin-cutout-library-web.canvasMenu.button.label': 'Découper'
  },
  es: {
    'libraries.ly.img.cutout.entry.label': 'Recortes',
    'plugin-cutout-library-web.notifications.selectCutoutBlock': 'Por favor, seleccione un bloque para recortar',
    'plugin-cutout-library-web.notifications.cutoutBlockSelected': 'Los bloques de recorte no se pueden recortar',
    'plugin-cutout-library-web.notifications.differentPages': 'Los bloques seleccionados son de páginas diferentes. Seleccione bloques de la misma página.',
    'plugin-cutout-library-web.canvasMenu.button.label': 'Recortar'
  }
});

// Continue with setup
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
