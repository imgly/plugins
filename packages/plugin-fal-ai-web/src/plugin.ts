import { EditorPlugin } from '@cesdk/cesdk-js';
import { fal } from '@fal-ai/client';
import StyleAssetSource from './StyleAssetSource';
import {
  HISTORY_ASSET_LIBRARY_ENTRY_ID,
  LOCAL_HISTORY_ASSET_SOURCE_ID,
  PANEL_ID,
  PLUGIN_ICON_SET,
  STYLE_IMAGE_ASSET_SOURCE_ID,
  STYLE_VECTOR_ASSET_SOURCE_ID
} from './constants';
import generate from './generate';
import iconSprite from './iconSprite';
import registerComponents from './registerComponents';
import registerPanels from './registerPanels';
import { STYLES_IMAGE, STYLES_VECTOR } from './styles';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

export default (
  config: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      fal.config({
        // @ts-ignore
        proxyUrl: config.proxyUrl
      });

      const imageStyleAssetSource = new StyleAssetSource(
        STYLE_IMAGE_ASSET_SOURCE_ID,
        STYLES_IMAGE
      );
      const vectorStyleAssetSource = new StyleAssetSource(
        STYLE_VECTOR_ASSET_SOURCE_ID,
        STYLES_VECTOR
      );

      cesdk.engine.asset.addSource(imageStyleAssetSource);
      cesdk.engine.asset.addSource(vectorStyleAssetSource);
      let historyAssetSourceId = LOCAL_HISTORY_ASSET_SOURCE_ID;
      if (config.historyAssetSourceId != null) {
        historyAssetSourceId = config.historyAssetSourceId;
      } else {
        cesdk.engine.asset.addLocalSource(LOCAL_HISTORY_ASSET_SOURCE_ID);
      }

      cesdk.ui.addAssetLibraryEntry({
        id: STYLE_IMAGE_ASSET_SOURCE_ID,
        sourceIds: [STYLE_IMAGE_ASSET_SOURCE_ID],
        gridItemHeight: 'square',
        gridBackgroundType: 'cover',
        cardLabel: ({ label }) => label,
        cardLabelPosition: () => 'below'
      });

      cesdk.ui.addAssetLibraryEntry({
        id: STYLE_VECTOR_ASSET_SOURCE_ID,
        sourceIds: [STYLE_VECTOR_ASSET_SOURCE_ID],
        gridItemHeight: 'square',
        gridBackgroundType: 'cover',
        cardLabel: ({ label }) => label,
        cardLabelPosition: () => 'below'
      });

      cesdk.ui.addAssetLibraryEntry({
        id: HISTORY_ASSET_LIBRARY_ENTRY_ID,
        sourceIds: [historyAssetSourceId],
        gridItemHeight: 'square',
        gridBackgroundType: 'cover'
      });

      registerComponents(cesdk);
      registerPanels(cesdk, config, {
        onGenerate: (input) =>
          generate(cesdk, config, input, historyAssetSourceId),
        styleAssetSource: {
          image: imageStyleAssetSource,
          vector: vectorStyleAssetSource
        }
      });

      cesdk.ui.addIconSet(PLUGIN_ICON_SET, iconSprite);

      cesdk.setTranslations({
        en: {
          [`panel.${PANEL_ID}`]: 'AI Image Generator',
          [`panel.${PANEL_ID}.prompt`]: 'Prompt',
          [`panel.${PANEL_ID}.type`]: 'Type',
          [`panel.${PANEL_ID}.type.image`]: 'Image',
          [`panel.${PANEL_ID}.type.vector`]: 'Vector',
          [`panel.${PANEL_ID}.style`]: 'Style',
          [`panel.${PANEL_ID}.format`]: 'Format',
          [`panel.${PANEL_ID}.format.custom.width`]: 'Width',
          [`panel.${PANEL_ID}.format.custom.height`]: 'Height',
          [`panel.${PANEL_ID}.generate`]: 'Generate'
        }
      });
    }
  };
};
