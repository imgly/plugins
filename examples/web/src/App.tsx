import { useRef, useState } from "react";
import CreativeEditorSDKComponent from "./components/CreativeEditorSDK";
import CreativeEditorSDK, { Configuration} from "@cesdk/cesdk-js";

// React UI Components
import { CommandPalette } from "./components/CommandPalette"
// Utils
import { downloadBlocks } from "./utils/download";

// IMGLY Plugins
import PolyfillCommandsPlugin, { WithCommands } from "@imgly/plugin-commands-polyfill"
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';
import ImglyCommandsPlugin from "./plugins/imgly-commands";


// i18n fake 
import i18n from "./utils/i18n";
import translations from "./plugins/imgly-commands/translations/translations";
i18n.setTranslations(translations)


declare global {
  interface Window { cesdk: WithCommands<CreativeEditorSDK> }
}


function App() {
  const cesdkRef = useRef<WithCommands<CreativeEditorSDK>>();
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
          debugger
          setIsCommandPaletteOpen(true)
        }
      });
  }

  const [config, setConfig] = useState<Object>(
    {
      "license": import.meta.env.VITE_CESDK_LICENSE_KEY,
      "callbacks.onUpload": "local",
      "callbacks.onDownload": "download",
      "callbacks.onSave": async (str: string) => downloadBlocks(cesdkRef.current!, [new Blob([str])], { mimeType: 'application/imgly' }),
      "callbacks.onExport": async (blobs: Array<Blob>, options: any) => downloadBlocks(cesdkRef.current!, blobs, { mimeType: options.mimeType, pages: options.pages }),
      "callbacks.onLoad": "upload",
      // devMode: true,
      "theme": "dark",
      "role": 'Creator',
      "ui.hide": false,
      "ui.elements.view": "advanced",
      "ui.elements.navigation.action.save": true,
      "ui.elements.navigation.action.load": true,
      "ui.elements.navigation.action.export": true,
    })


  const initCallback = async (_cesdk: CreativeEditorSDK) => {
    const cesdk = _cesdk as WithCommands<CreativeEditorSDK>;
    window.cesdk = cesdkRef.current = cesdk

    
    // Init Scene Programatically
    await cesdk.createDesignScene();
    cesdk.engine.scene.setDesignUnit("Pixel");  // 
    
    // Plugins

    const polyfillCommandsPlugin  = PolyfillCommandsPlugin()
    const vectorizerPlugin = VectorizerPlugin()
    const backgroundRemovalPlugin = BackgroundRemovalPlugin()
    const imglyCommandsPlugin = ImglyCommandsPlugin()
    // Workaround and we need to find a better way. Probably we need to have i18n be part of the sdk
    i18n.setTranslations(vectorizerPlugin.contributes.i18n)

    // Register Plguins 
    await Promise.all([
      cesdk.addDefaultAssetSources(),
      cesdk.addDemoAssetSources({ sceneMode: "Design" }),
      cesdk.unstable_addPlugin(polyfillCommandsPlugin),
      cesdk.unstable_addPlugin(imglyCommandsPlugin),
      cesdk.unstable_addPlugin(vectorizerPlugin),
      cesdk.unstable_addPlugin(backgroundRemovalPlugin),
    ]);

    console.log("Commands", cesdk.engine.polyfill_commands.listCommands())

    // Ui components
    cesdk.ui.unstable_registerComponent("plugin.imgly.commandpalette", commandPaletteButton);
    "plugin.imgly.commandpalette2"
    cesdk.setTranslations({ en: { "plugin.imgly.commandpalette.label": ">" } })
    // Canvas Menu
    const canvasMenuItems = cesdk.ui.unstable_getCanvasMenuOrder()
    console.log("Canvas Menu Items", canvasMenuItems)
    const newCanvasMenuItems = ["plugin.imgly.commandpalette", ...canvasMenuItems];
    cesdk.ui.unstable_setCanvasMenuOrder(newCanvasMenuItems)



    // react components

    const commandItems = generateCommandItemsfromCESDK(cesdk)
    const customItems = [
      {
        id: "ui.theme.light",
        children: "UI: Switch to Light Theme",
        showType: true,
        onClick: async () => {
          setConfig((current: Configuration) => {
            console.log(current)
            return {
              ...current,
              theme: "light",
              "ui.hide": true
            }
          })
        }
      },
      {
        id: "ui.theme.dark",
        children: "UI: Switch to Dark Theme",
        showType: true,
        onClick: async () => {
          setConfig((current) => {
            return {
              ...current,
              theme: "dark"
            }
          })
        }
      }
    ]
    const allCommands = [...commandItems, ...customItems]
    setCommandItems(allCommands)
  }


  return (
    <>
      <CommandPalette items={commandItems} isOpen={isCommandPaletteOpen} />
      <CreativeEditorSDKComponent config={config} callback={initCallback} />

    </>
  );
}

const generateCommandItemsfromCESDK = (cesdk: WithCommands<CreativeEditorSDK>): Array<any> => {
  return cesdk
    .engine
    .polyfill_commands
    .listCommands()
    .map((cmdId: string) => {
      const titel = i18n.t(cmdId) // this comes from the metadata
      console.log(titel)
      return {
        id: cmdId,
        children: titel,
        showType: true,
        onClick: async () => {
          await cesdk.engine.polyfill_commands.executeCommand(cmdId, {})
        }
      }
    })
}



export default App;
