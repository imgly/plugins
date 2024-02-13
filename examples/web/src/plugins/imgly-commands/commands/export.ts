import CreativeEditorSDK, { type MimeType } from "@cesdk/cesdk-js";
import { type WithCommands } from "@imgly/plugin-commands-polyfill";
import { downloadBlob } from "../../../utils/download";

export const registerDownloadCommands = (cesdk: WithCommands<CreativeEditorSDK>) => {

    const { block, scene } = cesdk.engine
    const commands = cesdk.engine.polyfill_commands

    const types = ["image/png", "image/jpeg", "image/webp", "image/x-tga", "application/pdf", "application/octet-stream"]

    types.forEach((mimeType: string) => {
        const [_, extension] = mimeType.split("/")
        commands.registerCommand(`imgly.block.download.selected.as.${extension}`, async (params: { blockIds: number[] }) => {
            let blockIds = params.blockIds ?? block.findAllSelected()
            if (blockIds.length === 0) {
                blockIds = [scene.get()!]
            }
            const engine = cesdk.engine
            blockIds.forEach(async (bId: number) => {
                const blob = await engine.block.export(bId, mimeType as MimeType)
                downloadBlob(blob, `block-${bId}.${extension}`)
            })
        })
    })

    commands.registerCommand(`imgly.block.download.selected.as.scene`, async (params: { blockIds: number[] }) => {
        let blockIds = params.blockIds ?? block.findAllSelected()

        if (blockIds.length === 0) {
            blockIds = [scene.get()!]
        }
        blockIds.forEach(async (bId: number) => {
            const blob = new Blob([await block.saveToString([bId])], { type: "application/x-cesdk" })
            downloadBlob(blob, `block-${bId}.cesdk`)
        })
    })

    commands.registerCommand(`imgly.block.download.selected.as.json`, async (params: { blockIds: number[] }) => {
        let blockIds = params.blockIds ?? block.findAllSelected()
        if (blockIds.length === 0) {
            blockIds = [scene.get()!]
        }

        blockIds.forEach(async (bId: number) => {
            const str = await block.saveToString([bId]);
            const base64 = str.substring(4)
            const json = atob(base64)
            const blob = new Blob([json], { type: "application/json" })
            downloadBlob(blob, `block-${bId}.json`)
        })
    })
 
}