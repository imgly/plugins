import CreativeEditorSDK from '@cesdk/cesdk-js';
import * as PLUGIN_META from './constants';
import { LayerListPlugin } from './layer-list-plugin/LayerListPlugin';

const Plugin = () => ({
  name: PLUGIN_META.LAYER_LIST_ID,
  version: PLUGIN_VERSION,
  ...LayerListPlugin
});

export const Meta = PLUGIN_META;
export const Apps = [
  {
    id: 'open-panel',
    handler: (cesdk: CreativeEditorSDK) => {
      cesdk.ui.openPanel(PLUGIN_META.PANEL_COMPONENT_ID);
    },
    asset: {
      id: 'open-panel',
      label: {
        en: 'Layers',
        de: 'Ebenen'
      },
      meta: {
        thumbUri: `https://staticimgly.com/imgly/cesdk-icons/0.0.1/output/layers-light.svg`
      }
    }
  }
];

export default Plugin;
