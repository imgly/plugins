import type OpenAI from 'openai';

export const DEFAULT_OPENAI_PARAMS = {
  model: 'gpt-4o-mini',
  max_tokens: 8192,
  temperature: 0.1,
  stream: true as const
};

const DEFAULT_OPENAI_OPTIONS = {
  headers: {}
};

async function sendPrompt(
  openai: OpenAI,
  config: {
    proxyUrl: string;
    headers?: Record<string, string | null | undefined>;

    model?: string;
    maxTokens?: number;
    temperature?: number;
  },
  prompt: string,
  signal?: AbortSignal
): Promise<AsyncGenerator<string, void, unknown>> {
  const customOptions: Partial<typeof DEFAULT_OPENAI_PARAMS> = {};
  if (config.model) customOptions.model = config.model;
  if (config.maxTokens) customOptions.max_tokens = config.maxTokens;
  if (config.temperature) customOptions.temperature = config.temperature;

  const stream = await openai.chat.completions.create(
    {
      ...DEFAULT_OPENAI_PARAMS,
      ...customOptions,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      signal,
      ...DEFAULT_OPENAI_OPTIONS,
      headers: {
        ...(DEFAULT_OPENAI_OPTIONS.headers ?? {}),
        ...config.headers
      }
    }
  );

  // Return an async generator that yields only the text chunks
  async function* textStreamGenerator() {
    try {
      for await (const chunk of stream as any) {
        if (chunk.choices && chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
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
