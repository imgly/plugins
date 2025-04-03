import type Anthropic from '@anthropic-ai/sdk';
import { sendPrompt } from './utils';
import { AnthropicProvider } from '../types';

export const LANGUAGES = {
  en_US: 'English (US)',
  en_UK: 'English (UK)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  ru: 'Russian',
  zh: 'Mandarin Chinese',
  ja: 'Japanese'
} as const;

export const LOCALES = Object.keys(LANGUAGES) as Locale[];

export type Locale = keyof typeof LANGUAGES;

async function translate(
  anthropic: Anthropic,
  provider: AnthropicProvider,
  text: string,
  signal: AbortSignal,
  locale: Locale
) {
  const language = LANGUAGES[locale] || locale;

  return sendPrompt(
    anthropic,
    provider,
    `
You are a translation AI. Your task is to translate the given text into the specified target language. Follow these steps:

1. Here is the source text to be translated:
<source_text>
${text}
</source_text>

2. The target language for translation is:
<target_language>
${language}
</target_language>

3. Translate the source text into the target language. Ensure that you maintain the original meaning, tone, and style as closely as possible while adapting to the linguistic and cultural norms of the target language.

4. Return only the translated text, without any additional comments, explanations, or metadata. Do not include the original text or any other information in your response.
`,
    signal
  );
}

export default translate;
