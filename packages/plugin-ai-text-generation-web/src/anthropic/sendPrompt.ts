import type Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_ANTHROPIC_PARAMS = {
  // model: 'claude-3-5-sonnet-20241022',
  model: 'claude-3-7-sonnet-20250219',
  max_tokens: 8192,
  temperature: 0.1
};

export const DEFAULT_ANTHROPIC_OPTIONS = {
  headers: {
    'x-api-key': null, // Ensuring headers are omitted
    authorization: null
  }
};

async function sendPrompt(
  anthropic: Anthropic,
  config: {
    proxyUrl: string;

    model?: string;
    maxTokens?: number;
    temperature?: number;
  },
  prompt: string,
  signal: AbortSignal
): Promise<AsyncGenerator<string, void, unknown>> {
  const customOptions: Partial<typeof DEFAULT_ANTHROPIC_PARAMS> = {};
  if (config.model) customOptions.model = config.model;
  if (config.maxTokens) customOptions.max_tokens = config.maxTokens;
  if (config.temperature) customOptions.temperature = config.temperature;

  const msg = await anthropic.messages.create(
    {
      ...DEFAULT_ANTHROPIC_PARAMS,
      ...customOptions,
      stream: true,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    },
    {
      signal,
      ...DEFAULT_ANTHROPIC_OPTIONS
    }
  );

  // Return an async generator that yields only the text chunks
  async function* textStreamGenerator() {
    try {
      for await (const chunk of msg) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Stream error:', error);
      throw error; // Re-throw to allow consumer to handle
    }
  }

  return textStreamGenerator();
}

export default sendPrompt;
