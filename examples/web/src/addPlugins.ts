import CreativeEditorSDK from '@cesdk/cesdk-js';

import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

const plugins = [VectorizerPlugin(), BackgroundRemovalPlugin()]


async function addPlugins(cesdk: CreativeEditorSDK) {
  try {
    plugins.map(cesdk.unstable_addPlugin.bind(cesdk))



  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

export default addPlugins;
