function fix(text: string): string {
  return `
You are tasked with fixing spelling and grammar errors in a given text. Your goal is to improve the text while maintaining its original meaning and style. Here is the text you need to correct:

<original_text>
${text}
</original_text>

Please follow these steps to complete the task:

1. Carefully read through the text and identify any spelling or grammatical errors.

2. Correct all spelling mistakes, including typos and incorrectly spelled words.

3. Fix grammatical errors, including:
   - Incorrect verb tenses
   - Subject-verb agreement issues
   - Improper use of articles (a, an, the)
   - Incorrect word usage
   - Run-on sentences or sentence fragments
   - Punctuation errors

4. Ensure proper capitalization, especially at the beginning of sentences and for proper nouns.

5. Maintain the original meaning and tone of the text. Do not add or remove information, or change the author's intended message.

6. Make sure the corrected text flows naturally and is easy to read.

After making the necessary corrections, please provide only the improved output and nothing else.

Remember to preserve the original structure and formatting of the text as much as possible while making your corrections.
`;
}

export default fix;
