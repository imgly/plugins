
import { useRef, useState } from "react";
import CreativeEditorSDKComponent from "./CreativeEditorSDK";
import CreativeEditorSDK from "@cesdk/cesdk-js";


// React UI Components
import { CommandPalette } from "./CommandPalette"
// Utils
import { downloadBlocks } from "@imgly/plugin-utils";

// Plugins
// import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import * as IMGLY from "@imgly/plugin-core";
import * as DesignBatteriesPlugin from "@imgly/plugin-design-essentials";

import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer';

import DocumentPlugin from "@imgly/plugin-documents";
import { generateItems } from "../utils/registerCommandPalette";
import { addDemoRemoteAssetSourcesPlugins } from "../utils/addDemoRemoteAssetSourcesPlugins";



declare global {
  interface Window { imgly: IMGLY.Context }
}


function App() {
  // const cesdkRef = useRef<CreativeEditorSDK>();
  const contextRef = useRef<IMGLY.Context>();
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

    const imgly = IMGLY.createContext(cesdk) 
    window.imgly = imgly


    // Init Scene Programatically
    await cesdk.createDesignScene();
    cesdk.engine.scene.setDesignUnit("Pixel");  // 

    const backgroundRemovalPlugin = BackgroundRemovalPlugin({ ui: { locations: 'canvasMenu' } })
    const vectorizerPlugin = VectorizerPlugin(imgly, {})
    const documentPlugin = DocumentPlugin(imgly, {})
    // Register Plguins 
    await Promise.all([
      cesdk.addDefaultAssetSources(),
      cesdk.addDemoAssetSources({ sceneMode: "Design" }),
      imgly.plugins.registerPlugin(DesignBatteriesPlugin),
      cesdk.unstable_addPlugin(vectorizerPlugin),
      cesdk.unstable_addPlugin(documentPlugin),
      cesdk.unstable_addPlugin(backgroundRemovalPlugin),
      ...addDemoRemoteAssetSourcesPlugins(cesdk) //FIXME
    ]);



    // Ui components
    imgly.ui?.unstable_registerComponent("plugin.imgly.commandpalette", commandPaletteButton);

    imgly.i18n.registerTranslations({ en: { "plugin.imgly.commandpalette.label": "✨ Run .." } });
    // Canvas Menu
    const canvasMenuItems = imgly.ui?.unstable_getCanvasMenuOrder() ?? [];
    const newCanvasMenuItems = ["plugin.imgly.commandpalette", ...canvasMenuItems];
    imgly.ui?.unstable_setCanvasMenuOrder(newCanvasMenuItems);
  
    // Bind our react command paltte to cesdk command palettes are listen on new commands being created 
    imgly.engine.event.subscribe([], (events) => {
      events
        .forEach(_ => {
          setCommandItems(generateItems(imgly));
        });
    });
  
  
    imgly.commands.subscribe("register", (_label: string) => setCommandItems(generateItems(imgly)));
    imgly.commands.subscribe("unregister", (_label: string) => setCommandItems(generateItems(imgly)));
    setCommandItems(generateItems(imgly));
  }


  return (
    <>
      <CommandPalette items={commandItems} isOpen={isCommandPaletteOpen} setIsOpen={(val) => setIsCommandPaletteOpen(val)} />
      <CreativeEditorSDKComponent config={config} callback={initCallback} />

    </>
  );
}

export default App;
