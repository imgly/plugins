import { useRef } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin, { Manifest as VectorizerManifest } from '@imgly/plugin-vectorizer-web';

import { ActionsMenu } from "./CommandPalette"

const plugins = [VectorizerPlugin(), BackgroundRemovalPlugin()]



function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  const config: Configuration = {
    license: import.meta.env.VITE_CESDK_LICENSE_KEY,
    callbacks: { 
      onUpload: "local",
      onDownload: "download",
      onSave: (s) => {
        console.log("Save", s);
        return Promise.resolve();
      }, 
      onExport: (blobs, options) => {
        // why does this only export 1 page
        console.log("Export", blobs, options);
        return Promise.resolve();
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
            share: true,
          }
        }
      }
    }
  }


  return (
    <>
      <ActionsMenu cesdkRef={cesdk} actions={[...VectorizerManifest?.contributes?.actions]} />
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
                  plugins.map(plugin => cesdk?.current?.unstable_addPlugin(plugin))
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
