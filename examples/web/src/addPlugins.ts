import type CreativeEditorSDK from '@cesdk/cesdk-js';

import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

async function addPlugins(cesdk: CreativeEditorSDK) {
  try {
    cesdk.unstable_addPlugin(VectorizerPlugin());
    cesdk.unstable_addPlugin(BackgroundRemovalPlugin());
  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

export default addPlugins;
