import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import Manifest from './manifest';


export interface PluginConfiguration {
  // uploader ? 
}

export { Manifest };

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize(engine: CreativeEngine) {
      
      
    },
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      polyfillWithCommands(cesdk);
    },

    // maybe this should be just engint.event.onUpdate()
    update() {

    },

  };
};



export type CreativeEngineWithPolyfills = CreativeEngine & { polyfill_commands?: Commands };

export type CommandType = (params: any) => Promise<void>;

export class Commands {
  #entries = new Map<string, CommandType>()
  constructor(sdk: CreativeEditorSDK) {
  }
  registerCommand(label: string, callback: (params: any) => Promise<void>) {
    this.#entries.set(label, callback);
  }
  async executeCommand(label: string, params: any) {
    const command = this.#entries.get(label);
    if (command) {
      await command(params);
    } else {
      throw new Error(`Command ${label} not found`);
    }
  }

}
export function polyfillWithCommands(sdk: CreativeEditorSDK) {
  // @ts-ignore
  if (!sdk.engine.polyfill_commands) {
    // @ts-ignore
    sdk.engine.polyfill_commands = new Commands();
  }
}