
// // we can have much more here. What is good UX?
// // copy style to a global buffer 
// // paste style from a global buffer



// // all register should do an unregister, alternatively we can have lifetime

// // This is a simple example of a command that syncs the rotation of multiple blocks
// // We would need to store the blocks that need syncing and add a dedicated sync-system / handler. That on every frame or change syncs these blocks with the same value


// import CreativeEditorSDK, { type BlockEvent } from "@cesdk/cesdk-js";
// import { CommandArgs, type CommandsType } from "@imgly/plugin-commands-polyfill";

// import { readPropValue, writePropValue } from "../utils/cesdk";

// export const registerSyncStyleCommands = (cesdk: CreativeEditorSDK & CommandsType) => {

//     const { block, event } = cesdk.engine
//     const commands = cesdk.engine.commands!



//     const handleSyncProperties = (context: CommandArgs, properties: string[]) => {
//         let { blockIds = block.findAllSelected() } = context
//         if (blockIds.length <= 1) return;

//         const unsubscribe = event.subscribe(blockIds, (events: BlockEvent[]) => {
//             events.forEach((event: BlockEvent) => {
//                 const bId = event.block;
//                 switch (event.type) {
//                     case 'Created': {
//                         throw new Error("Not implemented")
//                         break;
//                     }
//                     case 'Updated': {
//                         syncProperties(properties, bId, blockIds)
//                         break;
//                     }
//                     case "Destroyed": {
//                         if (blockIds.includes(bId)) {
//                             blockIds.splice(blockIds.indexOf(bId), 1)
//                         }
//                         if (blockIds.length === 1) {
//                             unsubscribe()
//                         }
//                         break;
//                     }
//                 }
//             })
//         })


//         const syncProperties = (propertyKeys: string[], sourceId: number, destIds: number[]) => {
//             if (!block.isValid(sourceId)) return

//             propertyKeys.forEach((propertyKey: string) => {
//                 const sourceValue = readPropValue(cesdk, sourceId, propertyKey)
//                 destIds.forEach((receiverBlockId: number) => {
//                     if (!block.isValid(receiverBlockId)) return
//                     if (sourceId === receiverBlockId) return;
//                     const receiverValue = readPropValue(cesdk, receiverBlockId, propertyKey)
//                     if (receiverValue === sourceValue) return;
//                     writePropValue(cesdk, receiverBlockId, propertyKey, sourceValue)
//                 })
//             })
//         }

//         commands.registerCommand<CommandArgs>(`imgly.sync.stroke`, async (context) => {
//             await handleSyncProperties(context, [
//                 "stroke/enabled",
//                 "stroke/color",
//                 "stroke/style",
//                 "stroke/width",
//                 "stroke/position"
//             ])
//         })

//         commands.registerCommand<CommandArgs>(`imgly.sync.shadow`, async (context) => {
//             await handleSyncProperties(context, [
                
//                 "dropShadow/enabled",
//                 "dropShadow/color",
//                 "dropShadow/clip",
//                 "dropShadow/offset/x",
//                 "dropShadow/offset/y",
//             ])
//         })

//         commands.registerCommand<CommandArgs>(`imgly.sync.rotation`, async (context) => {
//             await handleSyncProperties(context, [
//                 "rotation"
//             ])
//         })

//         commands.registerCommand<CommandArgs>(`imgly.sync.width+height`, async (context) => {
//             await handleSyncProperties(context, [
//                 "width",
//                 "height"
//             ])
//         })


//         // commands.registerCommand<CommandArgs>(`imgly.sync.effects`, async (context) => {
//         //     const { blockIds = block.findAllSelected() } = context

//         //     blockIds.forEach((bId: number) => {
//         //         const eIds = block.getEffects(bId)
//         //         if (eIds.length === 0) return;

//         //     })
//         // })

//         // // we could life registe commands and also unregister based on the possibilites

//         return []
//     }
// }
// // we can make sync alive


