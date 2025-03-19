import type Anthropic from '@anthropic-ai/sdk';
import { sendPrompt } from './utils';
import { AnthropicProvider } from '../types';

async function improve(
  anthropic: Anthropic,
  provider: AnthropicProvider,
  text: string,
  signal: AbortSignal
) {
  return sendPrompt(
    anthropic,
    provider,
    `
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

Once you have made the improvements, only return the improved text and nothing else.
`,
    signal
  );
}

export default improve;
