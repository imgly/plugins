import { EditorPlugin } from '@cesdk/cesdk-js';
import { type OpenAPIV3 } from 'openapi-types';
import iconSprite from './iconSprite';
import initializeFromSchema from './initializeFromSchema';
import { PluginConfiguration } from './types';

// The default schemas provided by the plugin.
import Initializer from './initializer';
import recraft3Schema from './recraft3-complete.json';
import recraft3RasterSchema from './recraft3-raster.json';
import recraft3VectorSchema from './recraft3-vector.json';

export const PLUGIN_ID = '@imgly/plugin-fal-ai-web';

export default (
  config: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { schemas } = config;
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.ui.addIconSet('@imgly/plugin/fal-ai', iconSprite);

      const initializer = new Initializer(config);

      [
        recraft3Schema as OpenAPIV3.Document,
        recraft3RasterSchema as OpenAPIV3.Document,
        recraft3VectorSchema as OpenAPIV3.Document,
        ...(schemas ?? [])
      ].forEach((schema) => {
        initializeFromSchema(cesdk, initializer, schema);
      });
    }
  };
};
