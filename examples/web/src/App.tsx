import { useRef } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";

import addPlugins from "./addPlugins";

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  const config: Configuration = {
    license: import.meta.env.VITE_CESDK_LICENSE_KEY,
    callbacks: { onUpload: "local" },
    // devMode: true,
    theme: "dark",
    role: 'Creator',
    ui:{ 
      elements: {
        view: "default"
      }
    }
  }

  return (
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
                addPlugins(instance),
              ]);
              await instance.createDesignScene();
            });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
