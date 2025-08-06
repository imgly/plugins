import CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  type CommonProviderConfiguration,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { TextProvider } from '../types';
import OpenAI from 'openai';
import sendPrompt from './sendPrompt';

type OpenAIInput = {
  prompt: string;
  temperature?: number;
  maxTokens?: number;

  blockId?: number;
  initialText?: string;
};

type OpenAIOutput = {
  kind: 'text';
  text: string;
};

export interface OpenAIProviderConfig
  extends CommonProviderConfiguration<OpenAIInput, OpenAIOutput> {
  model?: string;
}

export function OpenAIProvider(
  config: OpenAIProviderConfig
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<TextProvider<OpenAIInput>> {
  return () => {
    let openai: OpenAI | null = null;

    // Process quick actions configuration
    const defaultQuickActions: any = {
      'ly.img.improve': true,
      'ly.img.fix': true,
      'ly.img.shorter': true,
      'ly.img.longer': true,
      'ly.img.changeTone': true,
      'ly.img.translate': true,
      'ly.img.changeTextTo': true
    };

    const supportedQuickActions = mergeQuickActionsConfig(
      defaultQuickActions,
      config.supportedQuickActions
    );

    const provider: TextProvider<OpenAIInput> = {
      kind: 'text',
      id: 'openai',
      name: 'OpenAI',
      initialize: async () => {
        openai = new OpenAI({
          dangerouslyAllowBrowser: true,
          baseURL: config.proxyUrl,
          // Will be injected by the proxy
          apiKey: 'dummy-key'
        });
      },
      input: {
        quickActions: {
          supported: supportedQuickActions
        }
      },
      output: {
        middleware: config.middlewares,
        generate: async (
          input: OpenAIInput,
          { engine, abortSignal }: { engine: any; abortSignal?: AbortSignal }
        ): Promise<AsyncGenerator<OpenAIOutput, OpenAIOutput>> => {
          if (openai == null) throw new Error('OpenAI SDK is not initialized');

          if (
            input.blockId != null &&
            engine.block.getType(input.blockId) !== '//ly.img.ubq/text'
          ) {
            throw new Error(
              'If a block is provided to this generation, it must be a text block'
            );
          }

          if (config.debug)
            // eslint-disable-next-line no-console
            console.log(
              'Sending prompt to OpenAI:',
              JSON.stringify(input.prompt, undefined, 2)
            );

          const stream = await sendPrompt(
            openai,
            {
              proxyUrl: config.proxyUrl,
              headers: config.headers,
              model: config.model ?? 'gpt-4o-mini' // Default
            },
            input.prompt,
            abortSignal
          );

          // Create a new AsyncGenerator that yields OpenAIOutput objects
          async function* outputGenerator(): AsyncGenerator<
            OpenAIOutput,
            OpenAIOutput
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
