import { CreativeEngine } from '@cesdk/cesdk-js';

export type CreativeEngineWithPolyfills = CreativeEngine & { polyfill_commands?: Commands };

export type CommandType = (params: any) => Promise<void>;

export class Commands {
  #engine: CreativeEngineWithPolyfills
  #entries = new Map<string, CommandType>()
  constructor(engine: CreativeEngineWithPolyfills) {
    this.#engine = engine;
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
export function polyfillEngineWithCommands(engine: CreativeEngineWithPolyfills) {
  //polyfill
  if (!engine.polyfill_commands) {
    engine.polyfill_commands = new Commands(engine);
  }
}