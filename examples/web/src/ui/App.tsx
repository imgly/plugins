import { useRef, useState } from "react";

import { type WithCommands } from "@imgly/plugin-commands-polyfill";
import { CommandPalette } from "./CommandPalette"
import { downloadBlocks } from "../utils/utils";

import addPlugins from "../plugins/addPlugins";
import CreativeEditorSDKComponent from "./CreativeEditorSDK";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";

declare global {
  interface Window { cesdk: WithCommands<CreativeEditorSDK> }
}


function App() {
  const cesdkRef = useRef<WithCommands<CreativeEditorSDK>>();
  const [commandItems, setCommandItems] = useState<Array<any>>([])

  const config: Configuration = {
    license: import.meta.env.VITE_CESDK_LICENSE_KEY,
    callbacks: {
      onUpload: "local",
      onDownload: "download",
      onSave: async (str: string) => {
        // improve
        return downloadBlocks(cesdkRef.current!, [new Blob([str])], { mimeType: 'application/imgly' })
      },

      onExport: async (blobs, options) => {
        return downloadBlocks(cesdkRef.current!, blobs, { mimeType: options.mimeType, pages: options.pages })

      },
      onLoad: "upload",
    },
    // devMode: true,
    theme: "dark",
    role: 'Creator',

    ui: {
      hide: false,
      elements: {
        view: "advanced",
        navigation: {
          title: "IMG.LY Plugin Sandbox",
          action: {
            save: true,
            load: true,
            export: true,
            // share: true,
          }
        }
      }
    }
  }



  return (
    <>
      <CommandPalette items={commandItems ?? []} />
      <CreativeEditorSDKComponent config={config} callback={async (cesdk: CreativeEditorSDK) => {

        cesdk = cesdk as WithCommands<CreativeEditorSDK>;
        await Promise.all([
          cesdk.addDefaultAssetSources(),
          cesdk.addDemoAssetSources({ sceneMode: "Design" }),
          addPlugins(cesdk)
        ]);
        await cesdk.createDesignScene();

        // window.cesdk = cesdk as WithCommands<CreativeEditorSDK>;
        window.cesdk = cesdkRef.current = cesdk as WithCommands<CreativeEditorSDK>;
        const commandItems = generateCommandItems(cesdk as WithCommands<CreativeEditorSDK>)
        setCommandItems(commandItems)


      }} />
    </>
  );
}

export default App;




const generateCommandItems = (cesdk: WithCommands<CreativeEditorSDK>): Array<any> => {
  return cesdk
    .engine
    .polyfill_commands
    .listCommands()
    .map((cmdId: string) => {

      const titel = cmdId
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