import { Context } from "./Context";
import { Subscribable } from './Subscribable';

type Plugin = any & {id: string, version: string}
export class Plugins extends Subscribable<"register" | "unregister", any> {
    #ctx: Context;

    constructor(ctx: Context) {
        super()
        this.#ctx = ctx
    }

    async registerPlugin(plugin: Plugin) {
        await this.notify("register", plugin)
        return () => this.unregisterPlugin(plugin)
    }
    async unregisterPlugin(plugin: Plugin) {
        await this.notify("unregister", plugin)
    }

    listPlugins() {

    }

}