import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Provider } from '@imgly/plugin-utils-ai-generation';
import Anthropic from '@anthropic-ai/sdk';
import { sendPrompt } from '../prompts/utils';

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
            {
              id: 'improve',
              version: '1',
              confirmation: true,
              enable: ({ engine }) => {
                const blockIds = engine.block.findAllSelected();
                if (blockIds == null || blockIds.length !== 1) return false;

                const [blockId] = blockIds;
                return engine.block.getType(blockId) === '//ly.img.ubq/text';
              },
              render: ({ builder, engine }, { generate, closeMenu }) => {
                builder.Button('improve', {
                  label: 'Improve',
                  icon: '@imgly/MagicWand',
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
                      prompt: improve(initialText),
                      blockId,
                      initialText
                    });
                  }
                });
              }
            }
          ]
        }
      },
      output: {
        generate: async ({ prompt, blockId }, { engine, abortSignal }) => {
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

          const stream = await sendPrompt(
            anthropic,
            {
              id: 'anthropic',
              proxyUrl: config.proxyUrl
            },
            prompt,
            abortSignal
          );

          let inferredText = '';
          for await (const chunk of stream) {
            if (abortSignal.aborted) {
              break;
            }
            inferredText += chunk;

            if (blockId != null) {
              context.cesdk.engine.block.setString(
                blockId,
                'text/text',
                inferredText
              );
            }
          }

          return Promise.resolve({
            kind: 'text',
            text: inferredText
          });
        }
      }
    };

    return Promise.resolve(provider);
  };
}

function improve(text: string): string {
  return `
You are an AI writing assistant tasked with improving a given text based on a specific type of improvement requested. Your goal is to enhance the text while maintaining its original meaning and intent.

Here is the original text you will be working with:

<original_text>
${text}
</original_text>

Please follow these steps to improve the text:

1. Carefully read and analyze the original text.
2. Consider the specific improvement type requested and how it applies to the given text.
3. Make the necessary changes to improve the text according to the requested improvement type. This may include:
   - Rephrasing sentences
   - Adjusting vocabulary
   - Restructuring paragraphs
   - Adding or removing content as appropriate
4. Ensure that the improved version maintains the original meaning and intent of the text.
5. Return the improved text without any additional commentary or explanation.
6. If there is nothing to improve, simply return the original text without any changes.
7. If you cannot make any meaningful improvements, return the original text as is.

Once you have made the improvements, only return the improved text and nothing else.
`;
}
