// use DENO best practice and move all externals into externals.ts 

import { useRef, useState } from "react";
import CreativeEditorSDKComponent from "./components/CreativeEditorSDK";
import CreativeEditorSDK from "@cesdk/cesdk-js";


// React UI Components
import { CommandPalette } from "./components/CommandPalette"
// Utils
import { downloadBlocks } from "./utils/download";

// IMGLY Plugins


// Plugins
// import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer';
import DesignBatteriesPlugin from "@imgly/plugin-design-essentials";
import { PluginContext } from "@imgly/plugin-core";


declare global {
  interface Window { imgly: PluginContext }
}


function App() {
  // const cesdkRef = useRef<CreativeEditorSDK>();
  const contextRef = useRef<PluginContext>();
  const [commandItems, setCommandItems] = useState<Array<any>>([])
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false)


  const commandPaletteButton = (params: { builder: any }) => {
    params
      .builder!
      .Button("plugin.imgly.commandpalette.id", {
        label: "plugin.imgly.commandpalette.label",
        icon: undefined,
        isActive: isCommandPaletteOpen,
        isLoading: false,
        isDisabled: isCommandPaletteOpen,
        loadingProgress: undefined, // creates infinite spinner
        onClick: () => {
          setIsCommandPaletteOpen(true)
        }
      });
  }



  const [config, _setConfig] = useState<Object>(
    {
      "license": import.meta.env.VITE_CESDK_LICENSE_KEY,
      "callbacks.onUpload": 'local',
      "callbacks.onDownload": "download",
      "callbacks.onSave": async (str: string) => downloadBlocks(contextRef.current!.engine.block, [new Blob([str])], { mimeType: 'application/imgly' }),
      "callbacks.onExport": async (blobs: Array<Blob>, options: any) => downloadBlocks(contextRef.current!.engine.block, blobs, { mimeType: options.mimeType, pages: options.pages }),
      // "callbacks.onLoad": ,
      // devMode: true,
      "theme": "dark",
      "role": 'Creator',
      "ui.hide": false,
      "ui.elements.view": "advanced",
      "ui.elements.navigation.action.save": true,
      "ui.elements.navigation.action.load": true,
      "ui.elements.navigation.action.export": true,
    })


  const initCallback = async (cesdk: CreativeEditorSDK) => {

    const imgly = new PluginContext(cesdk)
    window.imgly = imgly


    // Init Scene Programatically
    await cesdk.createDesignScene();
    cesdk.engine.scene.setDesignUnit("Pixel");  // 


    const vectorizerPlugin = VectorizerPlugin(imgly, {})
    const commandsPlugin = DesignBatteriesPlugin(imgly, {})

    // Register Plguins 
    await Promise.all([
      cesdk.addDefaultAssetSources(),
      cesdk.addDemoAssetSources({ sceneMode: "Design" }),
      cesdk.unstable_addPlugin(commandsPlugin),
      cesdk.unstable_addPlugin(vectorizerPlugin),

    ]);



    // Ui components
    imgly.ui?.unstable_registerComponent("plugin.imgly.commandpalette", commandPaletteButton);

    imgly.i18n.setTranslations({ en: { "plugin.imgly.commandpalette.label": "✨ Run .." } })
    // Canvas Menu
    const canvasMenuItems = imgly.ui?.unstable_getCanvasMenuOrder() ?? []
    const newCanvasMenuItems = ["plugin.imgly.commandpalette", ...canvasMenuItems];
    imgly.ui?.unstable_setCanvasMenuOrder(newCanvasMenuItems)



    // Bind our react command paltte to cesdk command palettes are listen on new commands being created 
    imgly.engine.event.subscribe([], (events) => {
      events
        .forEach(_ => {
          setCommandItems(generateItems(imgly))
        })
    })
    imgly.commands.subscribe("register", (_label: string) => setCommandItems(generateItems(imgly)))
    imgly.commands.subscribe("unregister", (_label: string) => setCommandItems(generateItems(imgly)))

    setCommandItems(generateItems(imgly))
  }


  return (
    <>
      <CommandPalette items={commandItems} isOpen={isCommandPaletteOpen} setIsOpen={(val) => setIsCommandPaletteOpen(val)} />
      <CreativeEditorSDKComponent config={config} callback={initCallback} />

    </>
  );
}

const generateItems = (ctx: PluginContext) => {
  return [...generateBlockHierarchy(ctx), ...generateCommandItems(ctx), ...generateProperyItems(ctx)]
}

const generateBlockHierarchy = (ctx: PluginContext) => {
  const blocks = ctx.engine.block.findAll()

  return blocks.map((bId: number) => {
    const titel = ctx.engine.block.getName(bId) || ctx.engine.block.getUUID(bId).toString()
    return {
      id: bId,
      children: titel,
      kind: "block",
      group: "Hierarchy",
      showType: false,
      onClick: () => ctx.engine.block.select(bId)
    }
  })
}

const generateProperyItems = (ctx: PluginContext) => {
  const { block } = ctx.engine
  const bIds = block.findAllSelected()
  const bId = bIds[0]
  if (!bId) return [] // for now

  const props = bIds.flatMap((bId: number) => block.findAllProperties(bId))
  const uniqueProps = Array.from(new Set(props))

  return uniqueProps.map((p) => {
    const titel = p
    const value = 42

    return {
      id: bId,
      children: titel,
      kind: "property",
      group: "Properties",
      showType: false,
      onClick: () => prompt(`Change ${p} to`, value.toString())
    }
  })
}


const generateCommandItems = (ctx: PluginContext): Array<any> => {
  const cmds = ctx
    .commands!
    .listCommands()

  return cmds
    .map((cmdId: string) => {
      const titel = ctx.i18n.translate(cmdId) // this comes from the metadata
      const desc = ctx.commands.getCommandDescription(cmdId)
      if (titel === undefined) throw new Error(`No translation found for command ${cmdId}`)
      return {
        id: cmdId,
        children: titel,
        kind: "command",
        group: desc?.category || "Commands",
        showType: false,
        onClick: async () => {
          await ctx.commands!.executeCommand(cmdId, {})
        }
      }
    })
}



export default App;
