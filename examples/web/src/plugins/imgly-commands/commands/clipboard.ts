import CreativeEditorSDK, { type MimeType } from "@cesdk/cesdk-js";
import { type CommandsType } from "@imgly/plugin-commands-polyfill";



export const registerClipboardCommands = (cesdk: CreativeEditorSDK & CommandsType) => {

    const { block, scene } = cesdk.engine
    const commands = cesdk.engine.commands!


    commands.registerCommand(`imgly.block.clipboard.selected.as.png`, async (params: { blockIds: number[] }) => {
        let blockIds = params.blockIds ?? block.findAllSelected()
        if (blockIds.length === 0) {
            blockIds = [scene.get()!]
        }
        const engine = cesdk.engine
        const clipboardItems = await Promise.all(blockIds.map(async (bId: number) => {
            const blob = await engine.block.export(bId, "image/png" as MimeType)
            return new ClipboardItem({
                ["image/png"]: blob,
            }, { presentationStyle: "attachment" })

        }))

        await navigator.clipboard.write(clipboardItems)
    })

    commands.registerCommand(`imgly.block.clipboard.selected.as.scene`, async (params: { blockIds: number[] }) => {
        let blockIds = params.blockIds ?? block.findAllSelected()

        if (blockIds.length === 0) {
            blockIds = [scene.get()!]
        }

        const blob = new Blob([await block.saveToString(blockIds)], { type: "application/x-cesdk" })
        await navigator.clipboard.writeText(await blob.text())

    })

    commands.registerCommand(`imgly.block.clipboard.selected.as.json`, async (params: { blockIds: number[] }) => {
        let blockIds = params.blockIds ?? block.findAllSelected()
        if (blockIds.length === 0) {
            blockIds = [scene.get()!]
        }
        const str = await block.saveToString(blockIds);
        const base64 = str.substring(4)
        const json = atob(base64)
        const blob = new Blob([json], { type: "application/json" })
        await navigator.clipboard.writeText(await blob.text())

    })

}