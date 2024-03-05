import Manifest from '../manifest.json';
import { PluginContext } from "./deps";

import { activate } from './activate';



export interface PluginConfiguration {
  
}

export { Manifest };

export default (ctx: PluginContext, pluginConfiguration: PluginConfiguration) => {

  return {
    ...Manifest,
    async initializeUserInterface() {
    return await activate(ctx)
    },

    // maybe this should be just engine.event.onUpdate()

  };
};
''