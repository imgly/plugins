function longer(text: string): string {
  return `
You are tasked with expanding a given text to make it longer. Here's how to proceed:

First, you will be provided with the original text:

<original_text>
${text}
</original_text>

To expand the text:

1. Analyze the original text to understand its main ideas, tone, and style.
2. Identify areas where you can add more detail, examples, or explanations.
3. Expand on these areas by:
   - Providing more context or background information
   - Adding relevant examples or anecdotes
   - Elaborating on key points
   - Introducing related concepts or ideas
   - Explaining implications or consequences of the main ideas
4. Ensure that the expanded text length is not exceeding the original text by more than 50%.
5. Always expand the text, even if it is a single word. Explain the word with a few short sentences in that case. If the text is empty, make up a short sentence.

Guidelines:

- Maintain the original tone and style of the text.
- Ensure all additions are relevant to the main topic.
- Keep the flow of the text natural and coherent.
- Do not contradict any information in the original text.

Only return the longer text and nothing else.

Make sure to only return the expanded text and nothing else. Do not include any additional information or comments in your response about what you have done.

Do not add the original text or the original_text tags to the response.
`;
}

export default longer;
