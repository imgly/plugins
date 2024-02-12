import CreativeEditorSDK from '@cesdk/cesdk-js';
// import PolyfillCommandsPlugin from "@imgly/plugin-polyfill-commands"
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

const plugins = [
  // PolyfillCommandsPlugin(), 
  VectorizerPlugin(), 
  BackgroundRemovalPlugin()]

async function addPlugins(cesdk: CreativeEditorSDK) {
  try {
    plugins.map(cesdk.unstable_addPlugin.bind(cesdk))



  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

export default addPlugins;
