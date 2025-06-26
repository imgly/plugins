import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import {
  getQuickActionMenu,
  initProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

export { PLUGIN_ID } from './constants';

export function TextGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      printConfigWarnings(config);

      const text2text = config.providers?.text2text ?? config.provider;
      const provider = await text2text?.({ cesdk });

      if (provider == null) {
        if (config.debug) {
          // eslint-disable-next-line no-console
          console.warn(
            '[AudioGeneration]: No provider found. Please provide a valid `text2text` provider or remove the text generation plugin.'
          );
        }
        return;
      }

      initProvider(provider, { cesdk, engine: cesdk.engine }, config);

      const quickActionMenu = getQuickActionMenu(cesdk, 'text');

      quickActionMenu.setQuickActionMenuOrder([
        'improve',
        'fix',
        'shorter',
        'longer',
        'ly.img.separator',
        'changeTone',
        'translate',
        'ly.img.separator',
        'changeTextTo',
        ...quickActionMenu.getQuickActionMenuOrder()
      ]);

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.setTranslations({
        en: {
          'ly.img.ai.inference.apply': 'Apply',
          'ly.img.ai.inference.cancel': 'Cancel',
          'ly.img.ai.inference.improve': 'Improve Writing',
          'ly.img.ai.inference.improve.processing': 'Improving Writing...',
          'ly.img.ai.inference.fix': 'Fix Spelling & Grammar',
          'ly.img.ai.inference.fix.processing': 'Fixing spelling & grammar...',
          'ly.img.ai.inference.longer': 'Make Longer',
          'ly.img.ai.inference.longer.processing': 'Making longer...',
          'ly.img.ai.inference.shorter': 'Make Shorter',
          'ly.img.ai.inference.shorter.processing': 'Making shorter...',
          'ly.img.ai.inference.changeTone': 'Change Tone',
          'ly.img.ai.inference.changeTone.processing': 'Changing tone...',

          'ly.img.ai.inference.changeTone.type.professional': 'Professional',
          'ly.img.ai.inference.changeTone.type.casual': 'Casual',
          'ly.img.ai.inference.changeTone.type.friendly': 'Friendly',
          'ly.img.ai.inference.changeTone.type.serious': 'Serious',
          'ly.img.ai.inference.changeTone.type.humorous': 'Humorous',
          'ly.img.ai.inference.changeTone.type.optimistic': 'Optimistic',

          'ly.img.ai.inference.translate': 'Translate',
          'ly.img.ai.inference.translate.processing': 'Translating...',

          'ly.img.ai.inference.changeTextTo': 'Change Text to...',
          'ly.img.ai.inference.changeTextTo.processing': 'Changing text...'
        }
      });
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
      '[VideoGeneration]: Both `providers.text2text` and `provider` configuration is provided. Since `provider` is deprecated, only `providers.text2text` will be used.'
    );
  }
}

export default TextGeneration;
