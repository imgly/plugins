import CreativeEditorSDK from '@cesdk/cesdk-js';
import { useRef } from 'react';
import addPlugins from './addPlugins';

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            userId: 'plugins-vercel',
            callbacks: { onUpload: 'local' }
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
            const cutoutAssetEntry = instance.ui.getAssetLibraryEntry(
              'ly.img.cutout.entry'
            );
            instance.ui.setDockOrder([
              ...instance.ui.getDockOrder(),
              {
                id: 'ly.img.assetLibrary.dock',
                label: 'Cutout',
                key: 'ly.img.assetLibrary.dock',
                icon: cutoutAssetEntry?.icon,
                entries: ['ly.img.cutout.entry']
              }
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
