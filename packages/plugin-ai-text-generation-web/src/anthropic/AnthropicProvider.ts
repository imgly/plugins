import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Provider, QuickAction } from '@imgly/plugin-utils-ai-generation';
import Anthropic from '@anthropic-ai/sdk';
import sendPrompt from './sendPrompt';
import { LANGUAGES, LOCALES } from './prompts/translate';
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

type Parameter = {
  id: string;
  label: string;
  icon?: string;
};

// Define a type that can handle different prompt function signatures
type PromptFunction =
  | ((text: string) => string)
  | ((text: string, param: string) => string)
  | ((text: string, param: any) => string);

type QuickActionOptions = {
  id: string;
  label: string;
  icon: string;
  promptFn: PromptFunction;
  parameters?: Parameter[];
};

/**
 * Creates a Quick Action for text operations
 * Supports both simple actions and ones with parameter selection via popover menus
 */
function createTextQuickAction(
  options: QuickActionOptions
): QuickAction<AnthropicInput, AnthropicOutput> {
  const { id, label, icon, promptFn, parameters } = options;

  // Common enable function for all quick actions
  const enableFn = ({ engine }: { engine: any }) => {
    const blockIds = engine.block.findAllSelected();
    if (blockIds == null || blockIds.length !== 1) return false;

    const [blockId] = blockIds;
    return engine.block.getType(blockId) === '//ly.img.ubq/text';
  };

  // For simple actions without parameters
  if (!parameters || parameters.length === 0) {
    return {
      id,
      version: '1',
      confirmation: true,
      enable: enableFn,
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

            // Type assertion to handle the simpler function signature
            const simpleFn = promptFn as (text: string) => string;
            generate({
              prompt: simpleFn(initialText),
              blockId,
              initialText
            });
          }
        });
      }
    };
  }

  // For actions with parameters displayed in a popover menu
  return {
    id,
    version: '1',
    confirmation: true,
    enable: enableFn,
    render: ({ builder, engine, experimental }, { generate, closeMenu }) => {
      experimental.builder.Popover(`${id}.popover`, {
        label,
        icon,
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section(`${id}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${id}.popover.menu`, {
                children: () => {
                  parameters.forEach((param) => {
                    builder.Button(`${id}.popover.menu.${param.id}`, {
                      label: param.label,
                      icon: param.icon,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: () => {
                        closeMenu();
                        const [blockId] = engine.block.findAllSelected();
                        const initialText = engine.block.getString(
                          blockId,
                          'text/text'
                        );

                        // Type assertion to handle the parameterized function signature
                        const paramFn = promptFn as (
                          text: string,
                          param: any
                        ) => string;
                        generate({
                          prompt: paramFn(initialText, param.id),
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
  return createTextQuickAction({
    id: 'changeTone',
    label: 'Change Tone',
    icon: '@imgly/Microphone',
    promptFn: changeTone,
    parameters: TONE_TYPES.map((tone) => ({
      id: tone,
      label: tone.charAt(0).toUpperCase() + tone.slice(1)
    }))
  });
}

function TranslateQuickAction(): QuickAction<AnthropicInput, AnthropicOutput> {
  return createTextQuickAction({
    id: 'translate',
    label: 'Translate',
    icon: '@imgly/Language',
    promptFn: translate,
    parameters: LOCALES.map((locale) => ({
      id: locale,
      label: LANGUAGES[locale]
    }))
  });
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
