function changeTone(text: string, type: string): string {
  const prompt = `
You will be given a piece of text and a desired tone. Your task is to rewrite the text to match the desired tone while preserving the original meaning and key information. Here's how to proceed:

First, you will be provided with the original text:
<original_text>
${text}
</original_text>

The desired tone for the rewritten text is:
<desired_tone>
${type}
</desired_tone>

To change the tone of the text:
1. Analyze the current tone and style of the original text.
2. Identify the key information and main ideas in the original text.
3. Consider the characteristics of the desired tone (e.g., formal, casual, humorous, professional, etc.).
4. Rewrite the text, adapting the language, vocabulary, and sentence structure to match the desired tone while maintaining the original meaning and key information.
5. Ensure that the rewritten text flows naturally and coherently.
6. Only return the rewritten text without any additional commentary, tags or explanation.

Now, rewrite the text to match the desired tone. Your response should contain only the rewritten text, without any additional explanations or comments. Do not use any tags in your response.
`;

  return prompt;
}

export default changeTone;
