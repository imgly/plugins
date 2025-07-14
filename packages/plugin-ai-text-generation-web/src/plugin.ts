import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import {
  initializeProviders,
  Output,
  ActionRegistry,
  initializeQuickActionComponents,
  AI_EDIT_MODE,
  checkAiPluginVersion
} from '@imgly/plugin-ai-generation-web';
import { toArray } from '@imgly/plugin-utils';
import Improve from './quickActions/Improve';
import Fix from './quickActions/Fix';
import Shorter from './quickActions/Shorter';
import Longer from './quickActions/Longer';
import ChangeTone from './quickActions/ChangeTone';
import Translate from './quickActions/Translate';
import ChangeTextTo from './quickActions/ChangeTextTo';
import { PLUGIN_ID, DEFAULT_TEXT_QUICK_ACTION_ORDER } from './constants';

export { PLUGIN_ID, DEFAULT_TEXT_QUICK_ACTION_ORDER } from './constants';

export function TextGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      // Check AI plugin version consistency
      checkAiPluginVersion(cesdk, PLUGIN_ID, PLUGIN_VERSION);

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.i18n.setTranslations({
        en: {
          'common.apply': 'Apply',
          'common.back': 'Back'
        }
      });

      printConfigWarnings(config);

      const registry = ActionRegistry.get();
      registry.register(Improve({ cesdk }));
      registry.register(Fix({ cesdk }));
      registry.register(Shorter({ cesdk }));
      registry.register(Longer({ cesdk }));
      registry.register(ChangeTone({ cesdk }));
      registry.register(Translate({ cesdk }));
      registry.register(ChangeTextTo({ cesdk }));

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
        engine: cesdk.engine,
        debug: config.debug,
        dryRun: config.dryRun,
        defaultOrder: DEFAULT_TEXT_QUICK_ACTION_ORDER
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
