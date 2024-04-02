import CreativeEditorSDK from '@cesdk/cesdk-js';
// Since custom panels are mounted inside a shadow dom, we need to inline the CSS.
// We are compiling tailwind classes into a CSS file and importing it here inline.
// @ts-ignore
// eslint-disable-next-line import/extensions
import tw from 'inline:./tw-compiled.css';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Meta } from '..';
import { PANEL_COMPONENT_ID } from '../constants';
import { LayerListPanel } from './Panels/LayerList/LayerListPanel';

function initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
  const engine = cesdk.engine;

  cesdk.ui.unstable_registerCustomPanel(PANEL_COMPONENT_ID, (domElement) => {
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
    root.render(createElement(LayerListPanel, { cesdk }, null));

    const style = document.createElement('style');
    style.innerHTML = tw;
    domElement.appendChild(style);

    return () => {};
  });

  cesdk.setTranslations({
    en: {
      [`panel.${Meta.PANEL_COMPONENT_ID}`]: 'Layers'
    }
  });
}

export const LayerListPlugin = { initializeUserInterface };