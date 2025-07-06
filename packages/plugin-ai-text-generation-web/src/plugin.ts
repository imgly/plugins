import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import {
  initializeProviders,
  Output,
  ActionRegistry,
  initializeQuickActionComponents,
  AI_EDIT_MODE
} from '@imgly/plugin-ai-generation-web';
import { toArray } from '@imgly/plugin-utils';
import ImproveQuickAction from './quickActions/Improve';
import FixQuickAction from './quickActions/Fix';
import ShorterQuickAction from './quickActions/Shorter';
import LongerQuickAction from './quickActions/Longer';
import ChangeToneQuickAction from './quickActions/ChangeTone';
import TranslateQuickAction from './quickActions/Translate';
import ChangeTextToQuickAction from './quickActions/ChangeTextTo';

export { PLUGIN_ID } from './constants';

export function TextGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.i18n.setTranslations({
        en: {
          'common.apply': 'Apply',
          'common.back': 'Back'
        }
      });

      printConfigWarnings(config);

      const registry = ActionRegistry.get();
      registry.register(ImproveQuickAction({ cesdk }));
      registry.register(FixQuickAction({ cesdk }));
      registry.register(ShorterQuickAction({ cesdk }));
      registry.register(LongerQuickAction({ cesdk }));
      registry.register(ChangeToneQuickAction({ cesdk }));
      registry.register(TranslateQuickAction({ cesdk }));
      registry.register(ChangeTextToQuickAction({ cesdk }));

      const text2text = config.providers?.text2text ?? config.provider;

      const text2textProviders = await Promise.all(
        toArray(text2text).map((getProvider) => getProvider({ cesdk }))
      );

      const initializedResult = await initializeProviders(
        'text',
        {
          fromText: text2textProviders,
          fromImage: []
        },
        { cesdk },
        config
      );

      const initializedQuickActions = await initializeQuickActionComponents({
        kind: 'text',
        providerInitializationResults:
          initializedResult.providerInitializationResults,
        cesdk,
        engine: cesdk.engine
      });

      if (initializedQuickActions.renderFunction != null) {
        cesdk.ui.registerComponent(
          `ly.img.ai.text.canvasMenu`,
          initializedQuickActions.renderFunction
        );
        cesdk.ui.setCanvasMenuOrder([`ly.img.ai.text.canvasMenu`], {
          editMode: AI_EDIT_MODE
        });
      }
    }
  };
}

function printConfigWarnings<I, O extends Output>(
  config: PluginConfiguration<I, O>
) {
  if (!config.debug) return;

  if (config.providers?.text2text != null && config.provider != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[TextGeneration]: Both `providers.text2text` and `provider` configuration is provided. Since `provider` is deprecated, only `providers.text2text` will be used.'
    );
  }
}

export default TextGeneration;
