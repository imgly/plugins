import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import ui from './ui';
import commands from './commands';
import Manifest, { PLUGIN_ACTION_VECTORIZE_LABEL, PLUGIN_COMPONENT_BUTTON_ID, PLUGIN_ID } from './manifest';



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
    initialize(engine: CreativeEngine) {
      // it is unclear for a user which one to call and what happens and if we have to put code in both or just one
      // we should have a clear separation of concerns
      // also maybe better naming
      // onInitEngine
      // onInitUI
    },
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      // This should move into a seperate plugin
      // const engine = polyfillEngineWithCommands(cesdk.engine);
      const engine = cesdk.engine;
      // @ts-ignore
      if (!cesdk.engine.polyfill_commands) {
        console.error("Polyfill engine.engine.polyfill_commands not available!")
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

      //@ts-ignore
      console.log("checking if engine has polyfill_commands", cesdk.engine.polyfill_commands ? "yes" : "no")

      engine.event.subscribe([], async (events) => {
        events
          .filter(e => engine.block.isValid(e.block) && cesdk.engine.block.hasMetadata(e.block, PLUGIN_ID))
          .filter(e => e.type === 'Updated')
          .forEach(e => handleUpdateEvent(engine, e.block))
      });

      console.info("Registering plugin command")
      Object.keys(commands).forEach((command) => {
        console.info(`Registering action: ${command}`)
        // @ts-ignore
        const func = commands[command];
        // @ts-ignore
        cesdk.engine.polyfill_commands?.registerCommand(
          command,
          async (params: any) => await func(cesdk, params)
        );
      })

      console.info("Registering plugin I18N translations")
      cesdk.setTranslations(Manifest.contributes.i18n);


      console.info("Registering plugin UI components")
      const components = ui(cesdk)

      Object.keys(components).forEach((componentId) => {
        // @ts-ignore
        const component = components[componentId]
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
