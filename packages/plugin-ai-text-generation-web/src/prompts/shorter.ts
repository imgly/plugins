import type Anthropic from '@anthropic-ai/sdk';
import { sendPrompt } from './utils';
import { AnthropicProvider } from '../types';

async function shorter(
  anthropic: Anthropic,
  provider: AnthropicProvider,
  text: string,
  signal: AbortSignal
) {
  return sendPrompt(
    anthropic,
    provider,
    `
You will be given a text to shorten. Your task is to reduce the length of the text by 30% to 50% while maintaining its original voice, perspective, and key information. This is not a summary - you should preserve the style and tone of the original text.

Here is the original text:

<original_text>
${text}
</original_text>

To complete this task, follow these steps:

1. Carefully read and analyze the text, paying attention to its style, tone, and main points.

2. Identify areas where the text can be condensed without losing essential information or altering the author's voice.

3. Begin shortening the text by:
   - Removing redundant or repetitive information
   - Simplifying complex sentences
   - Eliminating unnecessary examples or elaborations
   - Combining related ideas into more concise statements

4. As you shorten, continuously check that you are:
   - Maintaining the original voice and perspective
   - Keeping all crucial information
   - Preserving the flow and coherence of the text

5. Aim to reduce the length by 30% to 50% of the original. If you find yourself shortening less than 30%, look for additional opportunities to condense. If you're reducing more than 50%, ensure you haven't cut too much important content.

6. Once you've finished shortening, review the text to ensure it still reads smoothly and retains the essence of the original.

Provide only the shortened version of the text in your response, without any additional comments, tags or explanations.
`,
    signal
  );
}

export default shorter;
