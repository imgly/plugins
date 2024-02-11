import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import ui from './ui';
import commands from './commands';
import i18n from './i18n';
import Manifest from './manifest';

import { PLUGIN_ID } from './utils/constants';
import { PLUGIN_CANVAS_MENU_COMPONENT_ID } from './utils/constants';
import { polyfillEngineWithCommands, CreativeEngineWithPolyfills } from './utils/polyfills';
import {
  clearPluginMetadata,
  fixDuplicateMetadata,
  getPluginMetadata,
  isDuplicate,
  isMetadataConsistent
} from './utils/utils';


export interface PluginConfiguration {
  // uploader ? 
}



export { Manifest };

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    initialize(engine: CreativeEngineWithPolyfills) {
      polyfillEngineWithCommands(engine);
      console.log("checking if engine has polyfill_commands", engine.polyfill_commands? "yes": "no")
      engine.event.subscribe([], async (events) => {
        events
          .filter((e) => engine.block.isValid(e.block) && engine.block.hasMetadata(e.block, PLUGIN_ID))
          .forEach((e) => {
            const id = e.block;
            if (e.type === 'Created') {
              const metadata = getPluginMetadata(engine, id);
              if (isDuplicate(engine, id, metadata)) {
                fixDuplicateMetadata(engine, id);
              }
            }
          });
      });
    },
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      const engine = cesdk.engine as CreativeEngineWithPolyfills;
      polyfillEngineWithCommands(engine);
      console.log("checking if engine has polyfill_commands", engine.polyfill_commands? "yes": "no")

      engine.event.subscribe([], async (events) => {
        events
          .filter((e) => engine.block.isValid(e.block) && cesdk.engine.block.hasMetadata(e.block, PLUGIN_ID))
          .filter((e) => e.type === 'Updated')
          .forEach((e) => { handleUpdateEvent(cesdk, e.block); });
      });


      console.info("Registering plugin actions")
      Object.keys(commands).forEach((action) => {
        console.info(`Registering action: ${action}`)
        // @ts-ignore
        const func = commands[action];
        engine.polyfill_commands?.registerCommand(
          action,
          async (params: any) => await func(cesdk, params)
        );
      })

      console.info("Registering plugin I18N translations")
      cesdk.setTranslations(i18n);

      console.info("Registering plugin UI components")
      Object.keys(ui).forEach((componentId) => {
        console.info(`Registering component: ${componentId}`)
        // @ts-ignore
        const component = ui[componentId]
        cesdk.ui.unstable_registerComponent(componentId, component);
      })



      // Always prepend the registered component to the canvas menu order.
      console.info("Changing canvas menu order")
      cesdk.ui.unstable_setCanvasMenuOrder([
        PLUGIN_CANVAS_MENU_COMPONENT_ID,
        ...cesdk.ui.unstable_getCanvasMenuOrder()
      ]);
    },

    update() {

    },

  };
};

/**
 * Handle every possible state of the vectorization state if the block was
 * updated.
 */
async function handleUpdateEvent(cesdk: CreativeEditorSDK, blockId: number) {
  const metadata = getPluginMetadata(cesdk.engine, blockId);

  switch (metadata.status) {

    case 'PROCESSING':
    case 'PROCESSED': {
      if (!isMetadataConsistent(cesdk.engine, blockId)) {
        clearPluginMetadata(cesdk.engine, blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}
