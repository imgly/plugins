import type Anthropic from '@anthropic-ai/sdk';
import { sendPrompt } from './utils';
import { AnthropicProvider } from '../types';

async function changeTextTo(
  anthropic: Anthropic,
  provider: AnthropicProvider,
  text: string,
  signal: AbortSignal,
  customPrompt: string
) {
  return sendPrompt(
    anthropic,
    provider,
    `
You will be given an original text and a custom prompt addition that specifies how to change the text. Your task is to modify the original text according to the prompt and return only the new, modified text.

Here is the original text:
<original_text>
${text}
</original_text>

The custom prompt addition is:
<change_text_to>
${customPrompt}
</change_text_to>

Please modify the original text according to the "Change Text to..." prompt. Only return the new, modified text without any additional commentary or explanation. Your entire response should be the modified text itself, with no other content.
`,
    signal
  );
}

export default changeTextTo;
