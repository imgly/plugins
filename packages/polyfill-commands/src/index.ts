import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import Manifest from './manifest';


import { polyfillEngineWithCommands, CreativeEngineWithPolyfills } from './utils/polyfills';


export interface PluginConfiguration {
  // uploader ? 
}

export { Manifest };

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize(engine: CreativeEngineWithPolyfills) {
      
    },
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      const engine = cesdk.engine as CreativeEngineWithPolyfills;
      polyfillEngineWithCommands(engine);
     
    },


    // maybe this should be just engint.event.onUpdate()
    update() {

    },

  };
};
