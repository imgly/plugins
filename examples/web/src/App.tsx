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
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';
import DesignBatteriesPlugin from "@imgly/plugin-design-batteries";
import { PluginContext } from "@imgly/plugin-api-utils";


declare global {
  interface Window { imgly: PluginContext }
}


function App() {
  const cesdkRef = useRef<CreativeEditorSDK>();
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
      "callbacks.onSave": async (str: string) => downloadBlocks(cesdkRef.current!, [new Blob([str])], { mimeType: 'application/imgly' }),
      "callbacks.onExport": async (blobs: Array<Blob>, options: any) => downloadBlocks(cesdkRef.current!, blobs, { mimeType: options.mimeType, pages: options.pages }),
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
    // @ts-ignore
    window.cesdk = cesdkRef.current = cesdk
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
    imgly.commands.subscribe("register", (_label: string) => setCommandItems(generateCommandItemsfromCESDK(imgly)))
    imgly.commands.subscribe("unregister", (_label: string) => setCommandItems(generateCommandItemsfromCESDK(imgly)))

    setCommandItems(generateCommandItemsfromCESDK(imgly))
  }


  return (
    <>
      <CommandPalette items={commandItems} isOpen={isCommandPaletteOpen} setIsOpen={(val) => setIsCommandPaletteOpen(val)} />
      <CreativeEditorSDKComponent config={config} callback={initCallback} />

    </>
  );
}

const generateCommandItemsfromCESDK = (ctx: PluginContext): Array<any> => {
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
        group: desc?.group || "Commands",
        showType: true,
        onClick: async () => {
          await ctx.commands!.executeCommand(cmdId, {})
        }
      }
    })
}



export default App;
