# IMG.LY CE.SDK Plugin QR Code

This plugin introduces QR codes to the CE.SDK editor. It integrates seamlessly with CE.SDK, providing users with an easy-to-use tool to add QR codes to their designs, which can be scanned to visit a URL.

## Installation

You can install the plugin via npm or a compatible package manager. Use the following commands to install the package:

```
pnpm add @imgly/plugin-qr-code-web
yarn add @imgly/plugin-qr-code-web
npm install @imgly/plugin-qr-code-web
```

## Usage

Adding the plugin to CE.SDK will register panels and components that can be used inside the editor. 

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import QrCodePlugin from '@imgly/plugin-qr-code-web';

const config = {
    license: '<your-license-here>'
};

const cesdk = await CreativeEditorSDK.create(container, config);
await cesdk.addDefaultAssetSources(),
    await cesdk.addDemoAssetSources({ sceneMode: 'Design' }),

    await cesdk.addPlugin(QrCodePlugin());

await cesdk.createDesignScene();
```

## Configuration

### Adding Dock Component

After adding the plugin to CE.SDK, it will register a component that can be
used inside the dock to create a QR code.

```typescript
cesdk.ui.setDockOrder([
  ...cesdk.ui.getDockOrder(),
  // The spacer is optional and pushes the QR code generator to the bottom
  'ly.img.spacer',
  // This will add a button to the dock that opens the QR code generator panel
  'ly.img.generate-qr.dock'
]);
```
