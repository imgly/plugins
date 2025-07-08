import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initializeProviders,
  Output,
  registerDockComponent,
  ActionRegistry,
  initializeQuickActionComponents,
  AI_EDIT_MODE
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { toArray } from '@imgly/plugin-utils';
import { PLUGIN_ID } from './constants';
import EditImage from './quickActions/EditImage';
import SwapBackground from './quickActions/SwapBackground';
import StyleTransfer from './quickActions/StyleTransfer';
import ArtistTransfer from './quickActions/ArtistTransfer';
import CreateVariant from './quickActions/CreateVariant';
import CombineImages from './quickActions/CombineImages';
import RemixPage from './quickActions/RemixPage';
import RemixPageWithPrompt from './quickActions/RemixPageWithPrompt';
// import quickActions from './quickActions';

export { PLUGIN_ID } from './constants';

const IMAGE_GENERATION_PANEL_ID = 'ly.img.ai/image-generation';

export function ImageGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;
      const registry = ActionRegistry.get();

      const disposeApp = registry.register({
        type: 'plugin',

        id: PLUGIN_ID,
        pluginId: PLUGIN_ID,

        label: 'Generate Image',
        meta: { panelId: IMAGE_GENERATION_PANEL_ID },

        execute: () => {
          if (cesdk.ui.isPanelOpen(IMAGE_GENERATION_PANEL_ID)) {
            cesdk.ui.closePanel(IMAGE_GENERATION_PANEL_ID);
          } else {
            cesdk.ui.openPanel(IMAGE_GENERATION_PANEL_ID);
          }
        }
      });

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.i18n.setTranslations({
        en: {
          [`panel.${IMAGE_GENERATION_PANEL_ID}`]: 'Image Generation',
          [`${IMAGE_GENERATION_PANEL_ID}.dock.label`]: 'AI Image'
        }
      });

      printConfigWarnings(config);

      registry.register(EditImage({ cesdk }));
      registry.register(SwapBackground({ cesdk }));
      registry.register(StyleTransfer({ cesdk }));
      registry.register(ArtistTransfer({ cesdk }));
      registry.register(CreateVariant({ cesdk }));
      registry.register(CombineImages({ cesdk }));
      registry.register(RemixPage({ cesdk }));
      registry.register(RemixPageWithPrompt({ cesdk }));

      const text2image = config.providers?.text2image ?? config.text2image;
      const image2image = config.providers?.image2image ?? config.image2image;

      const text2imageProviders = await Promise.all(
        toArray(text2image).map((getProvider) => getProvider({ cesdk }))
      );
      const image2imageProviders = await Promise.all(
        toArray(image2image).map((getProvider) => getProvider({ cesdk }))
      );

      const initializedResult = await initializeProviders(
        'image',
        {
          fromText: text2imageProviders,
          fromImage: image2imageProviders
        },
        { cesdk },
        config
      );

      const initializedQuickActions = await initializeQuickActionComponents({
        kind: 'image',
        providerInitializationResults:
          initializedResult.providerInitializationResults,
        cesdk,
        engine: cesdk.engine,
        debug: config.debug,
        dryRun: config.dryRun
      });

      if (initializedResult.history?.assetSourceId != null) {
        // TODO: Add combined asset source for this kind
      }

      if (initializedQuickActions.renderFunction != null) {
        cesdk.ui.registerComponent(
          `ly.img.ai.image.canvasMenu`,
          initializedQuickActions.renderFunction
        );
        cesdk.ui.setCanvasMenuOrder([`ly.img.ai.image.canvasMenu`], {
          editMode: AI_EDIT_MODE
        });
      }

      if (initializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          IMAGE_GENERATION_PANEL_ID,
          initializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: IMAGE_GENERATION_PANEL_ID
        });
      } else {
        disposeApp();
      }
    }
  };
}

function printConfigWarnings<I, O extends Output>(
  config: PluginConfiguration<I, O>
) {
  if (!config.debug) return;

  if (config.providers?.text2image != null && config.text2image != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ImageGeneration]: Both `providers.text2image` and `text2image` configuration is provided. Since `text2image` is deprecated, only `providers.text2image` will be used.'
    );
  }
  if (config.providers?.image2image != null && config.image2image != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ImageGeneration]: Both `providers.image2image` and `image2image` configuration is provided. Since `image2image` is deprecated, only `providers.image2image` will be used.'
    );
  }
}

export default ImageGeneration;
