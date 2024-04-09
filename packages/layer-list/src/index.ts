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
        thumbUri: `https://staticimgly.com/imgly/cesdk-icons/0.0.1/output/layers-light.svg`,
        height: 24,
        width: 24,
        vectorPath:
          'M3.59006 7.32769C3.33288 7.18481 3.33288 6.81495 3.59006 6.67207L11.2715 2.40458C11.7246 2.1529 12.2754 2.1529 12.7285 2.40458L20.4099 6.67207C20.6671 6.81495 20.6671 7.18481 20.4099 7.32769L12.7285 11.5952C12.2754 11.8469 11.7246 11.8469 11.2715 11.5952L3.59006 7.32769ZM12 9.71196L7.11825 6.99988L12 4.2878L16.8817 6.99988L12 9.71196Z M5.69831 10.5L3.58937 11.6717C3.33219 11.8146 3.33219 12.1844 3.58937 12.3273L11.2708 16.5948C11.7239 16.8465 12.2747 16.8465 12.7278 16.5948L20.4093 12.3273C20.6664 12.1844 20.6664 11.8146 20.4093 11.6717L18.3 10.4999L16.2409 11.6438L16.8811 11.9995L11.9993 14.7116L7.11756 11.9995L7.75743 11.644L5.69831 10.5Z M5.69843 15.4999L3.58937 16.6716C3.33219 16.8145 3.33219 17.1843 3.58937 17.3272L11.2708 21.5947C11.7239 21.8464 12.2747 21.8464 12.7278 21.5947L20.4093 17.3272C20.6664 17.1843 20.6664 16.8145 20.4093 16.6716L18.3002 15.4999L16.2411 16.6438L16.8811 16.9994L11.9993 19.7115L7.11756 16.9994L7.75756 16.6438L5.69843 15.4999Z'
      }
    }
  }
];

export default Plugin;
