import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { useRef } from 'react';

import addPlugins, { Apps, prepareAssetEntries } from './addPlugins';

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  console.log('import.meta.env.VITE_CESDK_LICENSE_KEY');
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            callbacks: { onUpload: 'local' },
            // We need to load assets from the same domain to enable custom dom panels (like e.g created in the layer list panel).
            // Otherwise, the panel only shows an error message.
            // This might be a bug.
            baseURL: '/assets',
            ui: {
              elements: {
                libraries: {
                  insert: {
                    entries: (d) => {
                      if (!cesdk.current) return;
                      return [
                        ...prepareAssetEntries(d, cesdk.current!.engine),
                        {
                          id: 'ly.img.apps',
                          sourceIds: ['ly.img.apps'],
                          cardLabel: (assetResult: AssetResult) =>
                            assetResult.label,
                          cardLabelPosition: () => 'bottom',
                          gridItemHeight: 'square',
                          icon: ({ theme }) =>
                            `https://staticimgly.com/imgly%2Fcesdk-icons%2F0.0.1%2Foutput%2Fapps-${theme}.svg`
                        }
                      ];
                    }
                  },
                  replace: {
                    entries: (d) => {
                      if (!cesdk.current) return;
                      return prepareAssetEntries(d, cesdk.current!.engine);
                    }
                  }
                },
                panels: { settings: true },
                dock: {
                  groups: [
                    {
                      id: 'ly.img.apps',
                      entryIds: ['ly.img.apps']
                    },
                    {
                      id: 'ly.img.template',
                      entryIds: ['ly.img.template']
                    },
                    {
                      id: 'ly.img.defaultGroup',
                      showOverview: true
                    }
                  ]
                }
              }
            },
            i18n: {
              en: {
                'libraries.ly.img.apps.label': 'Apps'
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
            const engine = instance.engine;
            engine.asset.addLocalSource(
              'ly.img.apps',
              undefined,
              async (asset: AssetResult) => {
                const appHandler = Apps.find(
                  (app) => app.asset.id === asset.id
                );
                if (!appHandler) {
                  console.error('No app handler found for asset:', asset.id);
                  return;
                }
                // @ts-ignore
                appHandler.handler(instance);
                return undefined;
              }
            );

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
