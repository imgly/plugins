import CreativeEditorSDK from '@cesdk/cesdk-js';
import PolyfillCommandsPlugin from "@imgly/plugin-commands-polyfill"
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

const plugins = [
  PolyfillCommandsPlugin(), 
  VectorizerPlugin(), 
  // BackgroundRemovalPlugin()
]

async function addPlugins(cesdk: CreativeEditorSDK) {
  try {
    // @ts-ignore
    plugins.map(cesdk.unstable_addPlugin.bind(cesdk))
    
    

    
  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

export default addPlugins;
