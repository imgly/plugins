import CreativeEditorSDK from '@cesdk/cesdk-js';
import { useRef } from 'react';

import addPlugins, { prepareAssetEntries } from './addPlugins';

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            callbacks: { onUpload: 'local' },
            ui: {
              elements: {
                libraries: {
                  insert: {
                    entries: (d) => {
                      if (!cesdk.current) return;
                      return prepareAssetEntries(d, cesdk.current!.engine);
                    }
                  },
                  replace: {
                    entries: (d) => {
                      if (!cesdk.current) return;
                      return prepareAssetEntries(d, cesdk.current!.engine);
                    }
                  }
                },
                panels: { settings: true }
              }
            }
          }).then(async (instance) => {
            // @ts-ignore
            window.cesdk = instance;
            cesdk.current = instance;

            // Do something with the instance of CreativeEditor SDK, for example:
            // Populate the asset library with default / demo asset sources.
            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Design' })
            ]);
            await addPlugins(instance);
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
