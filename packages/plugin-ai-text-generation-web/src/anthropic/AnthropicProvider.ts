import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Provider, QuickAction } from '@imgly/plugin-utils-ai-generation';
import Anthropic from '@anthropic-ai/sdk';
import sendPrompt from './sendPrompt';
import { LANGUAGES, LOCALES, Locale } from './prompts/translate';
import improve from './prompts/improve';
import shorter from './prompts/shorter';
import longer from './prompts/longer';
import fix from './prompts/fix';
import generateTextForSpeech from './prompts/generateTextForSpeech';
import translate from './prompts/translate';
import changeTone from './prompts/changeTone';
import changeTextTo from './prompts/changeTextTo';

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

type AnthropicInput = {
  prompt: string;
  temperature?: number;
  maxTokens?: number;

  blockId?: number;
  initialText?: string;
};

type AnthropicOutput = {
  kind: 'text';
  text: string;
};

export function AnthropicProvider(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'text', AnthropicInput, AnthropicOutput>> {
  return (context: { cesdk: CreativeEditorSDK }) => {
    context.cesdk.i18n.setTranslations({
      en: {
        ...Object.entries(LANGUAGES).reduce(
          (acc: Record<string, string>, [locale, langauge]) => {
            acc[`ly.img.ai.inference.translate.type.${locale}`] = langauge;
            return acc;
          },
          {}
        )
      }
    });

    let anthropic: Anthropic | null = null;
    const provider: Provider<'text', AnthropicInput, AnthropicOutput> = {
      kind: 'text',
      id: 'anthropic',
      initialize: async () => {
        anthropic = new Anthropic({
          dangerouslyAllowBrowser: true,
          baseURL: config.proxyUrl,
          // Will be injected by the proxy
          apiKey: null,
          authToken: null
        });
      },
      input: {
        quickActions: {
          actions: [
            ImproveQuickAction(),
            FixQuickAction(),
            ShorterQuickAction(),
            LongerQuickAction(),
            SpeechQuickAction(),
            ChangeToneQuickAction(),
            TranslateQuickAction(),
            ChangeTextToQuickAction()
          ]
        }
      },
      output: {
        generate: async function (
          { prompt, blockId },
          { engine, abortSignal }
        ): Promise<AsyncGenerator<AnthropicOutput, AnthropicOutput>> {
          if (anthropic == null)
            throw new Error('Anthropic SDK is not initialized');

          if (
            blockId != null &&
            engine.block.getType(blockId) !== '//ly.img.ubq/text'
          ) {
            throw new Error(
              'If a block is provided to this generation, it most be a text block'
            );
          }

          if (config.debug)
            console.log(
              'Sending prompt to Anthropic:',
              JSON.stringify(prompt, undefined, 2)
            );

          const stream = await sendPrompt(
            anthropic,
            {
              id: 'anthropic',
              proxyUrl: config.proxyUrl
            },
            prompt,
            abortSignal
          );

          // Create a new AsyncGenerator that yields AnthropicOutput objects
          async function* outputGenerator(): AsyncGenerator<
            AnthropicOutput,
            AnthropicOutput
          > {
            let inferredText: string = '';
            for await (const chunk of stream) {
              if (abortSignal.aborted) {
                break;
              }
              inferredText += chunk;
              yield {
                kind: 'text',
                text: inferredText
              };
            }
            // Return the final result
            return {
              kind: 'text',
              text: inferredText
            };
          }

          return outputGenerator();
        }
      }
    };

    return Promise.resolve(provider);
  };
}

type QuickActionOptions = {
  id: string;
  label: string;
  icon: string;
  promptFn: (text: string) => string;
};

/**
 * Creates a Quick Action for text operations that take a single text input
 */
function createTextQuickAction(
  options: QuickActionOptions
): QuickAction<AnthropicInput, AnthropicOutput> {
  const { id, label, icon, promptFn } = options;

  return {
    id,
    version: '1',
    confirmation: true,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;

      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },
    render: ({ builder, engine }, { generate, closeMenu }) => {
      builder.Button(id, {
        label,
        icon,
        labelAlignment: 'left',
        variant: 'plain',
        onClick: () => {
          closeMenu();
          const [blockId] = engine.block.findAllSelected();
          const initialText = engine.block.getString(blockId, 'text/text');

          generate({
            prompt: promptFn(initialText),
            blockId,
            initialText
          });
        }
      });
    }
  };
}

function ImproveQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'improve',
    label: 'Improve',
    icon: '@imgly/MagicWand',
    promptFn: improve
  });
}

function ShorterQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'shorter',
    label: 'Make Shorter',
    icon: '@imgly/TextShorter',
    promptFn: shorter
  });
}

function LongerQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'longer',
    label: 'Make Longer',
    icon: '@imgly/TextLonger',
    promptFn: longer
  });
}

function FixQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'fix',
    label: 'Fix Spelling & Grammar',
    icon: '@imgly/CheckmarkAll',
    promptFn: fix
  });
}

function SpeechQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'speech',
    label: 'Generate Speech Text',
    icon: '@imgly/Microphone',
    promptFn: generateTextForSpeech
  });
}

const TONE_TYPES = [
  'professional',
  'casual',
  'friendly',
  'serious',
  'humorous',
  'optimistic'
];

function ChangeToneQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return {
    id: 'changeTone',
    version: '1',
    confirmation: true,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;

      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },
    render: ({ builder, engine, experimental }, { generate, closeMenu }) => {
      experimental.builder.Popover('changeTone.popover', {
        label: 'Change Tone',
        icon: '@imgly/Microphone',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section('changeTone.popover.section', {
            children: () => {
              experimental.builder.Menu('changeTone.popover.menu', {
                children: () => {
                  TONE_TYPES.forEach((toneType) => {
                    builder.Button(`changeTone.popover.menu.${toneType}`, {
                      label:
                        toneType.charAt(0).toUpperCase() + toneType.slice(1),
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: () => {
                        closeMenu();
                        const [blockId] = engine.block.findAllSelected();
                        const initialText = engine.block.getString(
                          blockId,
                          'text/text'
                        );

                        generate({
                          prompt: changeTone(initialText, toneType),
                          blockId,
                          initialText
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  };
}

function TranslateQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return {
    id: 'translate',
    version: '1',
    confirmation: true,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;

      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },
    render: ({ builder, engine, experimental }, { generate, closeMenu }) => {
      experimental.builder.Popover('translate.popover', {
        label: 'Translate',
        icon: '@imgly/Language',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section('translate.popover.section', {
            children: () => {
              experimental.builder.Menu('translate.popover.menu', {
                children: () => {
                  LOCALES.forEach((locale) => {
                    builder.Button(`translate.popover.menu.${locale}`, {
                      label: LANGUAGES[locale],
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: () => {
                        closeMenu();
                        const [blockId] = engine.block.findAllSelected();
                        const initialText = engine.block.getString(
                          blockId,
                          'text/text'
                        );

                        generate({
                          prompt: translate(initialText, locale),
                          blockId,
                          initialText
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  };
}

function ChangeTextToQuickAction(): QuickAction<
  AnthropicInput,
  AnthropicOutput
> {
  return {
    id: 'changeTextTo',
    version: '1',
    confirmation: true,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;

      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },
    render: ({ builder }, { toggleExpand }) => {
      builder.Button('changeTextTo.button', {
        label: 'Change Text to...',
        icon: '@imgly/Rename',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: toggleExpand
      });
    },
    renderExpanded: (
      { builder, engine, experimental, state },
      { generate, toggleExpand }
    ) => {
      const customPromptState = state('changeTextTo.prompt', '');

      builder.TextArea('changeTextTo.textarea', {
        inputLabel: 'Change text to...',
        ...customPromptState
      });

      builder.Separator('changeTextTo.separator');

      experimental.builder.ButtonRow('changeTextTo.footer', {
        justifyContent: 'space-between',
        children: () => {
          builder.Button('changeTextTo.footer.cancel', {
            label: 'Back',
            icon: '@imgly/ChevronLeft',
            onClick: toggleExpand
          });

          builder.Button('changeTextTo.footer.apply', {
            label: 'Rewrite',
            icon: '@imgly/MagicWand',
            color: 'accent',
            onClick: () => {
              const customPrompt = customPromptState.value;
              if (!customPrompt) return;

              const [blockId] = engine.block.findAllSelected();
              const initialText = engine.block.getString(blockId, 'text/text');

              generate({
                prompt: changeTextTo(initialText, customPrompt),
                blockId,
                initialText
              });

              toggleExpand();
            }
          });
        }
      });
    }
  };
}
