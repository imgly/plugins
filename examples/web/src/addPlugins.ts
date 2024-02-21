import type CreativeEditorSDK from '@cesdk/cesdk-js';

import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';

async function addPlugins(cesdk: CreativeEditorSDK) {
  try {
    cesdk.unstable_addPlugin(
      BackgroundRemovalPlugin({ ui: { locations: 'canvasMenu' } })
    );
  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

export default addPlugins;
