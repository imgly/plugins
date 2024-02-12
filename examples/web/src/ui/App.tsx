import { useRef } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin, { Manifest as VectorizerManifest } from '@imgly/plugin-vectorizer-web';

import { CommandPalette } from "./CommandPalette"
import { downloadBlocks } from "../utils/utils";

import addPlugins from "../plugins/addPlugins";


function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  const config: Configuration = {
    license: import.meta.env.VITE_CESDK_LICENSE_KEY,
    callbacks: {
      onUpload: "local",
      onDownload: "download",
      onSave: async (str: string) => {
        // improve
        return downloadBlocks(cesdk.current!, [new Blob([str])], { mimeType: 'application/imgly' })
      },

      onExport: async (blobs, options) => {
        return downloadBlocks(cesdk.current!, blobs, { mimeType: options.mimeType, pages: options.pages })

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
      <CommandPalette cesdkRef={cesdk} />
      <div
        style={{ width: "100vw", height: "100vh" }}
        ref={(domElement) => {
          if (domElement != null) {
            CreativeEditorSDK
              .create(domElement, config)
              .then(async (instance) => {
                // @ts-ignore
                window.cesdk = instance;
                cesdk.current = instance;

                // Do something with the instance of CreativeEditor SDK, for example:
                // Populate the asset library with default / demo asset sources.
                await Promise.all([
                  instance.addDefaultAssetSources(),
                  instance.addDemoAssetSources({ sceneMode: "Design" }),
                  addPlugins(instance)
                ]);
                await instance.createDesignScene();
              });
          } else if (cesdk.current != null) {
            cesdk.current.dispose();
          }
        }}
      ></div>
    </>
  );
}

export default App;
