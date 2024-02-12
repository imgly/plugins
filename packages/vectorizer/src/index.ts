import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import ui from './ui';
import commands from './commands';
import i18n from './i18n';
import Manifest, { PLUGIN_ACTION_VECTORIZE_LABEL, PLUGIN_COMPONENT_BUTTON_ID, PLUGIN_ID } from './manifest';

import { polyfillEngineWithCommands, CreativeEngineWithPolyfills } from './utils/polyfills';
import {
  clearPluginMetadata,
  fixDuplicateMetadata,
  getPluginMetadata,
  isDuplicate,
  isMetadataConsistent,
  areBlocksSupported
} from './utils';


export interface PluginConfiguration {
  // uploader ? 
}

export { Manifest };

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    initialize(engine: CreativeEngineWithPolyfills) {
      // it is unclear for a user which one to call and what happens and if we have to put code in both or just one
      // we should have a clear separation of concerns
      // also maybe better naming
      // onInitEngine
      // onInitUI
    },
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      // This should move into a seperate plugin
      const engine = polyfillEngineWithCommands(cesdk.engine);
      if (!engine.polyfill_commands) {
        console.error("Polyfill engine.commands not available!")
        return;
      }

      console.log("Subscribing to events");
      engine.event.subscribe([], async (events) => {
        events
          .filter(({ block: blockId }) => engine.block.isValid(blockId) && engine.block.hasMetadata(blockId, PLUGIN_ID))
          .forEach(({ type, block: blockId }) => {
            if (type === 'Created') {
              const metadata = getPluginMetadata(engine, blockId);
              if (isDuplicate(engine, blockId, metadata)) {
                fixDuplicateMetadata(engine, blockId);
              }
            }
          });
      });

      console.log("checking if engine has polyfill_commands", engine.polyfill_commands ? "yes" : "no")

      engine.event.subscribe([], async (events) => {
        events
          .filter(e => engine.block.isValid(e.block) && cesdk.engine.block.hasMetadata(e.block, PLUGIN_ID))
          .filter(e => e.type === 'Updated')
          .forEach(e => handleUpdateEvent(engine, e.block))
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

      // DEFAULTS
      // define what blocks the component button is enabled for
      // WHERE IS THIS USED? AND HOW DOES IT WORK? It seems the button is shown no matter what.
      console.info("Enabling plugin component button for supported blocks")
      cesdk.feature.unstable_enable(PLUGIN_COMPONENT_BUTTON_ID, (context: any) => {
        return areBlocksSupported(engine, engine.block.findAllSelected())
      })
      
      cesdk.feature.unstable_enable(PLUGIN_COMPONENT_BUTTON_ID, false);
      cesdk.feature.unstable_enable(PLUGIN_ID, false);
      cesdk.feature.unstable_enable(PLUGIN_ACTION_VECTORIZE_LABEL, false);
      

      console.info("Changing canvas menu order")
      const canvasMenuEntries = [
        PLUGIN_COMPONENT_BUTTON_ID,
        ...cesdk.ui.unstable_getCanvasMenuOrder()
      ]
      cesdk.ui.unstable_setCanvasMenuOrder(canvasMenuEntries);
    },


    // maybe this should be just engine.event.onUpdate()
    update() {

    },

  };
};

/**
 * Handle every possible state of the vectorization state if the block was
 * updated.
 */
async function handleUpdateEvent(engine: CreativeEngine, blockId: number) {
  const metadata = getPluginMetadata(engine, blockId);
  switch (metadata.status) {
    case 'PROCESSING':
    case 'PROCESSED': {
      if (!isMetadataConsistent(engine, blockId)) {
        clearPluginMetadata(engine, blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}
