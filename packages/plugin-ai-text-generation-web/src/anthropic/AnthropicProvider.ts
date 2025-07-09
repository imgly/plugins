import CreativeEditorSDK from '@cesdk/cesdk-js';
import { type CommonProviderConfiguration } from '@imgly/plugin-ai-generation-web';
import { TextProvider } from '../types';
import Anthropic from '@anthropic-ai/sdk';
import sendPrompt from './sendPrompt';
import { LANGUAGES } from '../prompts/translate';

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

export interface AnthropicProviderConfig
  extends CommonProviderConfiguration<AnthropicInput, AnthropicOutput> {
  model?: string;
}

export function AnthropicProvider(
  config: AnthropicProviderConfig
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<TextProvider<AnthropicInput>> {
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
    const provider: TextProvider<AnthropicInput> = {
      kind: 'text',
      id: 'anthropic',
      name: 'Anthropic',
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
          supported: {
            'ly.img.improve': true,
            'ly.img.fix': {}, // Test new empty object syntax
            'ly.img.shorter': true,
            'ly.img.longer': {}, // Test new empty object syntax
            'ly.img.changeTone': true,
            'ly.img.translate': true,
            'ly.img.changeTextTo': {} // Test new empty object syntax
          }
        }
      },
      output: {
        middleware: config.middlewares ?? config.middleware ?? [],
        generate: async (
          { prompt, blockId },
          { engine, abortSignal }
        ): Promise<AsyncGenerator<AnthropicOutput, AnthropicOutput>> => {
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
            // eslint-disable-next-line no-console
            console.log(
              'Sending prompt to Anthropic:',
              JSON.stringify(prompt, undefined, 2)
            );

          const stream = await sendPrompt(
            anthropic,
            {
              proxyUrl: config.proxyUrl,
              headers: config.headers,
              model: config.model || 'claude-3-7-sonnet-20250219' // Default
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
              if (abortSignal?.aborted) {
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
