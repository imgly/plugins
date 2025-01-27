import {
  initializeFillProcessing,
  registerFillProcessingComponents
} from '@imgly/plugin-utils';

import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';
import {
  processBackgroundRemoval,
  type BackgroundRemovalProvider
} from './processBackgroundRemoval';
import { UserInterfaceConfiguration } from './types';

export const PLUGIN_ID = '@imgly/plugin-background-removal-web';

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
  provider?: BackgroundRemovalProvider;
}

export default (
  pluginConfiguration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      addIconSet(cesdk);

      initializeFillProcessing(cesdk, {
        pluginId: PLUGIN_ID,
        process: (blockId, metadata) => {
          processBackgroundRemoval(
            cesdk,
            blockId,
            metadata,
            pluginConfiguration.provider ?? {
              type: '@imgly/background-removal'
            }
          );
        }
      });

      const { translationsKeys } = registerFillProcessingComponents(cesdk, {
        pluginId: PLUGIN_ID,
        icon: '@imgly/icons/BGRemove',
        // @ts-ignore
        locations: pluginConfiguration.ui?.locations
      });

      cesdk.setTranslations({
        en: {
          // @ts-ignore
          [translationsKeys.inspectorBarLabel]: 'BG Removal',
          // @ts-ignore
          [translationsKeys.navigationBarLabel]: 'BG Removal',
          // @ts-ignore
          [translationsKeys.canvasBarLabel]: 'BG Removal',
          // @ts-ignore
          [translationsKeys.canvasMenuLabel]: 'BG Removal',
          // @ts-ignore
          [translationsKeys.dockLabel]: 'BG Removal'
        }
      });
    }
  };
};

function addIconSet(cesdk: CreativeEditorSDK) {
  cesdk.ui.addIconSet(
    '@imgly/plugin/background-removal',
    `
        <svg>
          <symbol
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            id="@imgly/icons/BGRemove"
          >
          <path d="M5.5 3H7.59095L3 7.59095V5.5C3 4.11929 4.11929 3 5.5 3Z" fill="currentColor"/>
<path d="M3 10.4093V13.5913L7.86161 8.72966C8.31641 7.66789 9.16789 6.81641 10.2297 6.36161L13.5913 3H10.4093L3 10.4093Z" fill="currentColor"/>
<path d="M7.67225 11.737L3 16.4093V18.5C3 18.8239 3.06161 19.1335 3.17374 19.4175L6.14525 16.446L6.12969 16.2437C6.02445 14.8755 6.56566 13.3081 7.96581 12.4956C7.84616 12.2543 7.74749 12.0006 7.67225 11.737Z" fill="currentColor"/>
<path d="M15.2273 7.36398C14.6868 6.80782 14.0037 6.39091 13.2371 6.17218L16.4093 3H18.5C18.8239 3 19.1335 3.06161 19.4175 3.17374L15.2273 7.36398Z" fill="currentColor"/>
<path d="M6.34648 19.0623L4.58247 20.8263C4.86654 20.9384 5.17607 21 5.5 21H6.49553L6.34648 19.0623Z" fill="currentColor"/>
<path d="M16.0725 12.5182C16.0598 12.5106 16.047 12.5031 16.0342 12.4956C16.3322 11.8946 16.5 11.2171 16.5 10.5C16.5 10.0198 16.4248 9.5572 16.2855 9.12328L20.8263 4.58253C20.9384 4.86658 21 5.1761 21 5.5V7.59079L16.0725 12.5182Z" fill="currentColor"/>
<path d="M17.8305 16.7607L17.8703 16.2437C17.9278 15.4966 17.7925 14.69 17.4298 13.9795L21 10.4093V13.5913L17.8305 16.7607Z" fill="currentColor"/>
<path d="M17.5045 21L17.5957 19.8136L21 16.4093V18.5C21 19.8807 19.8807 21 18.5 21H17.5045Z" fill="currentColor"/>
<path d="M13.4317 13.1374C14.3663 12.6292 15.0007 11.6387 15.0007 10.5C15.0007 8.84315 13.6576 7.5 12.0007 7.5C10.3439 7.5 9.00074 8.84315 9.00074 10.5C9.00074 11.6387 9.63515 12.6292 10.5698 13.1374C9.94563 13.2733 9.38367 13.4801 8.9164 13.6917C7.98874 14.112 7.54792 15.1133 7.62602 16.1287L8.00074 21.0005H16.0007L16.3755 16.1287C16.4536 15.1133 16.0128 14.112 15.0851 13.6917C14.6178 13.4801 14.0559 13.2733 13.4317 13.1374Z" fill="currentColor"/>
          </symbol>
        </svg>
      `
  );
}
