import { PluginContext } from './PluginContext';
import { Subscribable } from './Subscribable';

export type CommandCallback = (ctx: PluginContext, params: any) => Promise<any> | any;
export type CommandArgs = { blockIds?: number[] }

export type CommandEvents = "register" | "unregister"

export type CommandDescription = {
  id?: string,
  category?: string
  args?: any, //JSONSchema
  returns?: any // JSONSchema
}

export class Commands extends Subscribable<CommandEvents, string> {
  #entries = new Map<string, CommandCallback>()
  #descs = new Map<string, CommandDescription>()
  #ctx: PluginContext;

  constructor(ctx: PluginContext) {
    super()
    this.#ctx = ctx
  }

  listCommands() {
    return Array.from(this.#entries.keys());
  }

  registerCommand(label: string, callback: CommandCallback, description: CommandDescription) {
    this.#entries.set(label, callback);
    this.#descs.set(label, description || {});
    this.notify("register", label)
    return () => this.unregisterCommand(label)
  }

  unregisterCommand(label: string) {
    this.notify("unregister", label)
    this.#entries.delete(label);
    this.#descs.delete(label);
  }

  getCommandCallback(label: string) {
    return this.#entries.get(label);
  }
  getCommandDescription(label: string) {
    return this.#descs.get(label);
  }


  async executeCommand<P = any, R = any>(cmd: string, params: P): Promise<R | undefined> {
    
    const command = this.#entries.get(cmd);
    if (command) {
      
      // this.#ctx.ui?.showNotification({ message: `Running command: ${cmd}`, type: "info" })
      return await command(this.#ctx, params);
    } else {
      // this.#ctx.ui?.showNotification({ message: `Command not found: ${cmd}`, type: "info" })
    }
  }
}



