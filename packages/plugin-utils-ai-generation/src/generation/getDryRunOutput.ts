import {
  type GetInput,
  type OutputKind,
  ImageOutput,
  InputByKind,
  Output
} from './provider';

function getDryRunOutput<K extends OutputKind, I>(
  kind: K,
  input: ReturnType<GetInput<K, I>>
): Output {
  switch (kind) {
    case 'image': {
      return getImageDryRunOutput(input[kind] as InputByKind['image']);
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating dry run output: ${kind}`
      );
    }
  }
}

function getImageDryRunOutput(input: InputByKind['image']): ImageOutput {
  const width = input.width;
  const height = input.width;

  const prompt: string =
    input != null &&
    typeof input === 'object' &&
    'prompt' in input &&
    typeof input.prompt === 'string'
      ? input.prompt
      : 'AI Generated Image';

  const url = `https://placehold.co/${width}x${height}/000000/FFF?text=${prompt
    .replace(' ', '+')
    .replace('\n', '+')}`;

  return {
    kind: 'image',
    url
  };
}

export default getDryRunOutput;
