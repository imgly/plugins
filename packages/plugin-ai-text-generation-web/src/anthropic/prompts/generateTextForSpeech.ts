function generateTextForSpeech(text: string): string {
  return `
    Your task is to create a new text based on a given prompt. The text should be short enough that it can be read aloud in no more than 5 seconds.

Follow these guidelines when generating the text:
1. Keep the text concise and to the point.
2. Use simple words and sentence structures.
3. Aim for approximately 20-25 words.
4. Ensure the text is coherent and meaningful.
5. Stay relevant to the given prompt.

Here is the prompt to base your text on:
<prompt>
${text}
</prompt>

Generate a short text based on this prompt. Output only the generated text, without any additional explanation or commentary. Do not include any XML tags in your response.
`;
}

export default generateTextForSpeech;
