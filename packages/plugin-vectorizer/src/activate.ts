import { PluginManifest, CommandContributions, UIComponentKeys } from './PluginManifest';

import {
    fixDuplicateMetadata,
    getPluginMetadata,
    isDuplicate,
} from './utils/common';

import { Context, CommandCallback } from './deps';
import { update as handleUpdateEvent } from './handler';


export async function activate(ctx: Context) {
    // const { engine, logger, i18n, ui, commands } = ctx
    

    // @ts-ignore
    ctx.logger?.trace("checking if engine has commands", cesdk.engine.commands ? "yes" : "no")

    {
        ctx.logger?.trace("Registering commands")
        type CommandsDef = Record<CommandContributions, CommandCallback>
        const commands: CommandsDef = await import('./commands')

        for (const command in commands) {
            const callback = commands[command as CommandContributions]
            const desc = PluginManifest.contributes.commands[command as CommandContributions];
            ctx.commands.registerCommand(desc.id, 
                async (params: any) => await callback(ctx as any, params),
                desc
                );
        }
    }

    {
        type UIComponentDefs = Record<UIComponentKeys, (ctx: Context, params: any) => any>
        const uiComponents: UIComponentDefs = await import('./ui')

        for (const key in uiComponents) {
            const callback = uiComponents[key as UIComponentKeys]

            ctx.ui?.unstable_registerComponent(
                PluginManifest.contributes.ui[key as UIComponentKeys].id,
                (params: any) => callback(ctx, params));
        }
    }


    {
        // FIXME: This should probablly be done automagically
        ctx.logger?.trace("Registering I18N translations")
        ctx.i18n.registerTranslations({ en: PluginManifest.contributes.i18n })
    }


    {
        ctx.logger?.trace("Subscribing to events");
        const unsubscribe = ctx.engine.event.subscribe([], async (events) => {
            events
                .filter(e => ctx.engine.block.isValid(e.block) && ctx.engine.block.hasMetadata(e.block, PluginManifest.id))
                .filter(e => e.type === 'Updated')
                .forEach(e => handleUpdateEvent(ctx.engine, e.block))
        });
    }
    {
        const unsubscribe = ctx.engine.event.subscribe([], async (events) => {
            events
                .filter(({ block: blockId }) => ctx.engine.block.isValid(blockId) && ctx.engine.block.hasMetadata(blockId, PluginManifest.id))
                .forEach(({ type, block: blockId }) => {
                    if (type === 'Created') {
                        const metadata = getPluginMetadata(ctx.engine, blockId);
                        if (isDuplicate(ctx.engine, blockId, metadata)) {
                            fixDuplicateMetadata(ctx.engine, blockId);
                        }
                    }
                });
        });
    }
    // {
    //     // THIS DOES not belong here maybe
    //     ctx.logger?.trace("Defaulting canvas menu order")
    //     const canvasMenuEntries = [
    //         PluginManifest.contributes.ui.button.id,
    //         ...ctx.ui?.unstable_getCanvasMenuOrder() ?? []
    //     ]
    //     ctx.ui?.unstable_setCanvasMenuOrder(canvasMenuEntries);
    // }
}

// maybe this should be just engine.event.onUpdate()
