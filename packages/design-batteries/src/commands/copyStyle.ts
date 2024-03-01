// import CreativeEditorSDK from "@cesdk/cesdk-js";
// import { type CommandsType } from "@imgly/plugin-commands-polyfill";

// import { readPropValue, writePropValue } from "../utils/cesdk";


// // we can have much more here. What is good UX?
// // copy style to a global buffer 
// // paste style from a global buffer



// // all register should do an unregister, alternatively we can have lifetime


// export const registerCopyStyleCommands = (cesdk: CreativeEditorSDK & CommandsType) => {

//     const { block } = cesdk.engine
//     const commands = cesdk.engine.commands!

//     // do we need that if we bind commands? probably not
//     type MapEntry = { type: string, value: any }


//     const pasteTo = async (blockIds: number[], referenceValues: Map<string, MapEntry>, whitelist: string[] | undefined = [], blacklist: string[] | undefined = []) => {
//         blockIds = block.findAllSelected()
//         blacklist = [...blacklist, "fill/solid/color"]
//         blockIds.forEach((receiverBlockId: number) => {
//             referenceValues.forEach((entry, key) => {
//                 if (whitelist && (whitelist.length !== 0) && !whitelist.includes(key)) return;
//                 if (blacklist && (blacklist.length !== 0) && blacklist.includes(key)) return;
//                 if (!block.isPropertyWritable(key)) return;
//                 const propType = block.getPropertyType(key)
//                 writePropValue(cesdk, receiverBlockId, key, entry.value, propType)
//             })
//         })
//     }

//     // we could simply serialize to json for now and than apply it to the other block
//     const generatedCommands: (() => void)[] = []

//     const unregister = commands.registerCommand(`imgly.style.copy`, async (params: { blockIds: number[], whitelist: string[] | undefined, blacklist: string[] | undefined }) => {
//         let { blockIds = block.findAllSelected(), whitelist = [], blacklist = [] } = params
//         if (blockIds.length === 0) return;

//         generatedCommands.forEach((unregister) => unregister())

//         blacklist = [...blacklist, "fill/solid/color"]
//         const [senderBlockIds, ..._receiverBlockIds] = blockIds
//         const referenceValues = new Map<string, { type: string, value: any }>()
//         {
//             const props = block.findAllProperties(senderBlockIds)
//             props.forEach((propKey: string) => {
//                 if (whitelist && (whitelist.length !== 0) && !whitelist.includes(propKey)) return;
//                 if (blacklist && (blacklist.length !== 0) && blacklist.includes(propKey)) return;
//                 if (!block.isPropertyReadable(propKey)) return;
//                 const propType = block.getPropertyType(propKey)
//                 const propValue = readPropValue(cesdk, senderBlockIds, propKey, propType)
//                 referenceValues.set(propKey, { type: propType, value: propValue })
//                 generatedCommands.push(
//                     commands.registerCommand(`imgly.style.paste.${propKey}`, async (params: { blockIds: number[] }) => await pasteTo(params.blockIds, referenceValues, [propKey], []))
//                 )

//             })
//         }

//         // some special commands
//         generatedCommands.push(
//             commands.registerCommand(`imgly.style.paste.rotation`, async (params: { blockIds: number[] }) => await pasteTo(params.blockIds, referenceValues, ["rotation"], [])),
//             commands.registerCommand(`imgly.style.paste.size`, async (params: { blockIds: number[] }) => await pasteTo(params.blockIds, referenceValues, ["width", "height"], [])),
//             commands.registerCommand(`imgly.style.paste.position`, async (params: { blockIds: number[] }) => await pasteTo(params.blockIds, referenceValues, ["position/x", "position/y"], [])),
//         )

//     })
//     // we could life registe commands and also unregister based on the possibilites

//     return [unregister]
// }



// // we can make sync alive


