import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import Anthropic from '@anthropic-ai/sdk';
import { getQuickActionMenu } from '@imgly/plugin-utils-ai-generation';

export { PLUGIN_ID } from './constants';

export default (
  config: PluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      if (config.provider.id !== 'anthropic') {
        throw new Error('Only the "anthropic" provider is supported for now');
      }

      if (config.provider.proxyUrl == null) {
        throw new Error(
          'The "proxyUrl" is required as the provider configuration.'
        );
      }

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
};
