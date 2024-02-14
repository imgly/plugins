import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import Manifest from './manifest';


export interface PluginConfiguration {
  // uploader ? 
}

export { Manifest };

export default () => {
  return {
    ...Manifest,
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      polyfillWithCommands(cesdk);
    }
  };
};
export type CommandsType =  { engine: CreativeEngine & { commands?: Commands } }

export type CommandType = (params: any) => Promise<void>;

export class Commands {
  #entries = new Map<string, CommandType>()

  listCommands() {
    return Array.from(this.#entries.keys());
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
  if (!sdk.engine.commands) {
    // @ts-ignore
    sdk.engine.commands = new Commands();
  }
}