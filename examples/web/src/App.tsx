import { useRef } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin, { Manifest as VectorizerManifest } from '@imgly/plugin-vectorizer-web';

import { CommandPalette } from "./CommandPalette"
import 'share-api-polyfill';

const plugins = [VectorizerPlugin(), BackgroundRemovalPlugin()]
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const downloadBlocks = (cesdk: CreativeEditorSDK, blobs: Blob[], options: { mimeType: string, pages?: number[] }) => {
  const postfix = options.mimeType.split("/")[1]
  const pageIds = options.pages ?? []

  blobs.forEach((blob, index) => {
    const pageId = pageIds[index]
    let pageName = `page-${index}`
    if (pageId) {
      const name = cesdk.engine.block.getName(pageId)
      pageName = name?.length ? name : pageName
    }
    const filename = `${pageName}.${postfix}`;
    downloadBlob(blob, filename);
  })
  return Promise.resolve();
}


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
      <CommandPalette cesdkRef={cesdk} actions={[...VectorizerManifest?.contributes?.commands]} />
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
