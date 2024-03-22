import CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore
import tw from 'inline:./tw-compiled.css';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodePanel } from './Panels/LayerList/LayerListPanel';

function initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
  const engine = cesdk.engine;

  // if there is a ly.img.apps asset, add layer list asset:
  if (
    engine.asset.findAllSources().some((source) => source === 'ly.img.apps')
  ) {
    // add layer list asset
    engine.asset.addAssetToSource(
      'ly.img.apps',

      {
        id: '//ly.img.cesdk.stickers.doodle/camera',
        groups: ['//ly.img.cesdk.stickers.doodle/category/doodle'],
        label: {
          en: 'Layers',
          de: 'Kamera'
        },
        tags: {},
        meta: {
          uri: '{{base_url}}/ly.img.sticker/images/doodle/doodle_camera.svg',
          thumbUri:
            '{{base_url}}/ly.img.sticker/thumbnails/doodle/doodle_camera.png',
          filename: 'doodle_camera.svg',
          kind: 'sticker',
          fillType: '//ly.img.ubq/fill/image',
          width: 2048,
          height: 1339
        }
      }
    );
  }

  cesdk.ui.unstable_registerCustomPanel('ly.img.qr-code', (domElement) => {
    const mode = engine.scene.getMode();
    if (mode !== 'Design') {
      // eslint-disable-next-line no-console
      console.error('The Layer List Panel is only available in Design mode.');
      domElement.innerHTML =
        'The Layer List Panel is only available in Design mode.';
      return () => {};
    }

    const reactRoot = document.createElement('div');
    domElement.appendChild(reactRoot);
    const root = createRoot(reactRoot);
    root.render(createElement(QRCodePanel, { cesdk }, null));

    const style = document.createElement('style');
    style.innerHTML = tw;
    domElement.appendChild(style);

    return () => {};
  });
}

export const QRCodeExtension = { initializeUserInterface };
