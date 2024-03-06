import commands from "./commands"
import locale from "./locale"
import panels from "./panels"

import { PluginContext, CommandDescription, CommandCallback, Commands } from '@imgly/plugin-core';
import { CommandContributions, PluginManifest } from './PluginManifest';


// This helps creating the right types 
declare module '@imgly/plugin-core' {
    interface Register {
        commands: typeof commands;
        locale: typeof locale;
    }
}


const loadTranslation = async (ctx: PluginContext, locale: Record<string, Record<string,string>> ) => {
    ctx.i18n.setTranslations(locale)
}

const loadCommands = async (ctx: PluginContext, commands: Record<string, any> ) => {
    for (const command in commands) {
        const callback: CommandCallback = commands[command as string]
        let desc: CommandDescription = PluginManifest.contributes.commands[command as CommandContributions];
        desc ??= {};
        desc.id ??= `${PluginManifest.id}.commands.${command as string}`;
        const [category, name] = (command as string).split("_")
        desc.category ??= name ? category : "Commands";
        ctx.commands.registerCommand(
            desc.id,
            async (params: any) => await callback(ctx, params),
            desc
        );
    }
}

type PanelCallback = any
const loadPanels = async (ctx: PluginContext, panels: Record<string, PanelCallback) => {
    for (const panel in panels) {
        const id = `${PluginManifest.id}.panels.${panel}`
        // ctx.ui?.unstable_registerCustomPanel(panel,  ()  => {
        //     // return panels[panel](ctx, builder)
        // })
    }
}




export const activate = async (ctx: PluginContext) => {
    await loadTranslation(ctx, locale)
    await loadCommands(ctx, commands)
    await loadPanels(ctx, panels)
}




export default (ctx: PluginContext) => {

    return {
      ...PluginManifest,
      async initializeUserInterface() {
      return await activate(ctx)
      },
  
      // maybe this should be just engine.event.onUpdate()
  
    };
  };
