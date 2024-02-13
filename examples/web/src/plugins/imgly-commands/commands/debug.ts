import CreativeEditorSDK from "@cesdk/cesdk-js";
import { type WithCommands } from "@imgly/plugin-commands-polyfill";
import { readPropValue } from "../../../utils/cesdk";


export const registerDebugCommands = (cesdk: WithCommands<CreativeEditorSDK>) => {
    const { asset, block, variable, editor, scene} = cesdk.engine
    const commands = cesdk.engine.polyfill_commands

    commands.registerCommand("imgly.debug.log.metadata", async (params: { blockIds?: number[] }) => {
        const blockIds = params.blockIds ?? block.findAllSelected()

        blockIds.forEach((id: number) => {
            const keys = block.findAllMetadata(id)
            if (keys.length === 0) {
                console.debug("No metadata found for block", id)
                return
            }
            keys.forEach((key: string) => {
                const metadata = block.getMetadata(id, key)
                const obj = JSON.parse(metadata)
                console.debug(key, obj)
            })
        })
    })

    commands.registerCommand("imgly.debug.clear.metadata", async (params: { blockIds?: number[] }) => {
        const blockIds = params.blockIds ?? block.findAllSelected()
        blockIds.forEach((id: number) => {
            block.findAllMetadata(id)
                .forEach((key: string) => {
                    block.setMetadata(id, key, "")
                })
        })
    })

    commands.registerCommand("imgly.debug.log.block_properties", async (params: { blockIds?: number[] }) => {
        const blockIds = params.blockIds ?? block.findAllSelected()

        blockIds.forEach((id: number) => {
            const props = block.findAllProperties(id)
            const propDefinition = new Map<string, { type: string, value: any }>()
            props.forEach((propKey: string) => {
                if (!block.isPropertyReadable(propKey)) return;
                const propType = block.getPropertyType(propKey)
                const propValue = readPropValue(cesdk, id, propKey, propType)
                propDefinition.set(propKey, { type: propType, value: propValue })

            })

            console.debug("Properties for block", id, propDefinition)
        })
    })



    commands.registerCommand("imgly.debug.log.fill_properties", async (params: { blockIds?: number[] }) => {
        const blockIds = params.blockIds ?? block.findAllSelected()
        blockIds.forEach((bId: number) => {
            const fId = block.getFill(bId)
            if (!block.isValid(fId)) {
                console.debug("No fill found for block", bId)
                return
            };

            const props = block.findAllProperties(fId)
            const propDefinition = new Map<string, { type: string, value: any }>()
            props.forEach((propKey: string) => {
                console.debug("Reading propKey", propKey)
                if (!block.isPropertyReadable(propKey)) return;

                const propType = block.getPropertyType(propKey)
                const propValue = readPropValue(cesdk, fId, propKey, propType)
                propDefinition.set(propKey, { type: propType, value: propValue })

            })

            console.debug("Fill properties for block", bId, propDefinition)
        })
    })



    commands.registerCommand("imgly.debug.log.assets", async (_params: { blockIds?: number[] }) => {
        // const blockIds = params.blockIds ?? block.findAllSelected()

        const entries = asset.findAllSources()
        const definition = new Map<string, { types: string[], groups: any }>()
        entries.forEach((key: string) => {
            const types = asset.getSupportedMimeTypes(key)
            const groups = variable.getString(key)
            definition.set(key, { types, groups })
        })
        console.debug("Assets", definition)
    })


    commands.registerCommand("imgly.debug.log.variables", async (_params: { blockIds?: number[] }) => {
        const vars = variable.findAll()
        const definition = new Map<string, { type: string, value: any }>()
        vars.forEach((key: string) => {
            const value = variable.getString(key)

            definition.set(key, { type: "String", value: value })
        })
        console.debug("Variables", definition)

    })


    commands.registerCommand("imgly.debug.log.editor.settings", async (_params: { blockIds?: number[] }) => {
        const entries = editor.findAllSettings()
        const definition = new Map<string, { type: string, value: any }>()
        entries.forEach((key: string) => {
            const type = editor.getSettingType(key)
            const value = undefined; //editor.getSettingValue(key)
            definition.set(key, { type, value })
        })
        console.debug("Settings", definition)

    })



    commands.registerCommand("imgly.debug.log.scene_properties", async (_params: { blockIds?: number[] }) => {    
        console.debug("Settings", {
            designUnit: scene.getDesignUnit(),
            mode: scene.getMode(),
        })

    })



}