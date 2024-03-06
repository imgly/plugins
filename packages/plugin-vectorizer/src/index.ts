import Manifest from '../manifest.json';
import { Context } from "./deps";

import { activate } from './activate';



export interface PluginConfiguration {
  
}

export { Manifest };

export default (ctx: Context, pluginConfiguration: PluginConfiguration) => {

  return {
    ...Manifest,
    async initializeUserInterface() {
    return activate(ctx)
    },

    // maybe this should be just engine.event.onUpdate()

  };
};
