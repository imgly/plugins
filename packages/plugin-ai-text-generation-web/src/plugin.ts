import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import Anthropic from '@anthropic-ai/sdk';
import translate, { LANGUAGES, LOCALES } from './prompts/translate';
import improve from './prompts/improve';
import createMagicEntryForText from './createMagicEntryForText';
import {
  registerQuickActionMenuComponent,
  getQuickActionMenu
} from '@imgly/plugin-utils-ai-generation';
import fix from './prompts/fix';
import shorter from './prompts/shorter';
import longer from './prompts/longer';
import changeTone from './prompts/changeTone';
import changeTextTo from './prompts/changeTextTo';

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

      const provider = config.provider;

      const anthropic = new Anthropic({
        dangerouslyAllowBrowser: true,
        baseURL: provider.proxyUrl,
        // Will be injected by the proxy
        apiKey: null,
        authToken: null
      });

      const quickActionMenu = getQuickActionMenu(cesdk, 'text');

      quickActionMenu.setQuickActionMenuOrder(['improve']);
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'improve',
      //     icon: '@imgly/MagicWand',
      //     infer: improve.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'fix',
      //     icon: '@imgly/CheckmarkAll',
      //     infer: fix.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'shorter',
      //     icon: '@imgly/TextShorter',

      //     infer: shorter.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'longer',
      //     icon: '@imgly/TextLonger',

      //     infer: longer.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'changeTone',
      //     icon: '@imgly/Microphone',

      //     parameter: [
      //       { id: 'professional' },
      //       { id: 'casual' },
      //       { id: 'friendly' },
      //       { id: 'serious' },
      //       { id: 'humorous' },
      //       { id: 'optimistic' }
      //     ],

      //     infer: changeTone.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'translate',
      //     icon: '@imgly/Language',

      //     parameter: LOCALES.map((locale) => ({
      //       id: locale
      //     })),

      //     infer: translate.bind(null, anthropic, provider)
      //   })
      // );
      // magicMenu.registerMagicEntry(
      //   createMagicEntryForText({
      //     cesdk,
      //     id: 'changeTextTo',
      //     icon: '@imgly/Rename',

      //     renderEditState: async (
      //       { builder, state, experimental },
      //       { applyInference, toggleEditState }
      //     ) => {
      //       const changeTextPrompt = state(
      //         'ly.img.ai.inference.changeTextMode.changeText.prompt',
      //         ''
      //       );
      //       builder.TextArea('ly.img.ai.inference.changeText.textArea', {
      //         inputLabel: 'Change text to...',
      //         ...changeTextPrompt
      //       });
      //       builder.Separator('ly.img.ai.inference.changeTextMode.separator.1');
      //       experimental.builder.ButtonRow(
      //         'ly.img.ai.inference.changeTextMode.footer',
      //         {
      //           justifyContent: 'space-between',
      //           children: () => {
      //             builder.Button(
      //               'ly.img.ai.inference.changeTextMode.footer.cancel',
      //               {
      //                 label: 'common.back',
      //                 icon: '@imgly/ChevronLeft',
      //                 onClick: toggleEditState
      //               }
      //             );
      //             builder.Button(
      //               'ly.img.ai.inference.changeTextMode.footer.apply',
      //               {
      //                 label: 'Rewrite',
      //                 icon: '@imgly/MagicWand',
      //                 color: 'accent',
      //                 onClick: async () => {
      //                   const additionalPrompt = changeTextPrompt.value;
      //                   applyInference(additionalPrompt);
      //                   toggleEditState();
      //                 }
      //               }
      //             );
      //           }
      //         }
      //       );
      //     },

      //     infer: changeTextTo.bind(null, anthropic, provider)
      //   })
      // );

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
          'ly.img.ai.inference.changeTextTo.processing': 'Changing text...',
          ...Object.entries(LANGUAGES).reduce(
            (acc: Record<string, string>, [locale, langauge]) => {
              acc[`ly.img.ai.inference.translate.type.${locale}`] = langauge;
              return acc;
            },
            {}
          )
        }
      });
    }
  };
};
