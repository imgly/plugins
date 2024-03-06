import { Context } from './Context';
import { Subscribable } from './Subscribable';

export type CommandCallback = (ctx: Context, params: any) => Promise<any> | any;
export type CommandArgs = { blockIds?: number[] }

export type CommandEvents = "register" | "unregister"

export type CommandDescription = {
  id?: string,
  category?: string
  args?: any, // JSONSchema
  returns?: any // JSONSchema
}

export class Commands<K extends string = string> extends Subscribable<CommandEvents, string> {
  #entries = new Map<K, CommandCallback>()

  #descs = new Map<K, CommandDescription>()

  #ctx: Context;

  constructor(ctx: Context) {
    super()
    this.#ctx = ctx
  }

  listCommands() {
    return Array.from(this.#entries.keys());
  }

  async registerCommand(label: K, callback: CommandCallback, description: CommandDescription) {
    this.#entries.set(label, callback);
    this.#descs.set(label, description || {});
    await this.notify("register", label)
    return () => this.unregisterCommand(label)
  }

  unregisterCommand(label: K) {
    this.notify("unregister", label)
    this.#entries.delete(label);
    this.#descs.delete(label);
  }

  getCommandCallback(label: K) {
    return this.#entries.get(label);
  }

  getCommandDescription(label: K) {
    return this.#descs.get(label);
  }


  async executeCommand<P = any, R = any>(cmd: K, params: P): Promise<R | undefined> {

    const command = this.#entries.get(cmd);
    if (command) {
      this.#ctx.ui?.showNotification({ message: `Running command: ${cmd}`, type: "info" })
      return await command(this.#ctx, params);
    } else {
      this.#ctx.ui?.showNotification({ message: `Command not found: ${cmd}`, type: "warning" })
    }
  }
}



