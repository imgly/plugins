import {
  type OutputKind,
  type GetBlockInputResult,
  type ImageOutput,
  type InputByKind,
  type Output,
  VideoOutput
} from './provider';

function getDryRunOutput<K extends OutputKind>(
  kind: K,
  input: GetBlockInputResult<K>
): Output {
  switch (kind) {
    case 'image': {
      return getImageDryRunOutput(input[kind] as InputByKind['image']);
    }
    case 'video': {
      return getVideoDryRunOutput(input[kind] as InputByKind['video']);
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
  const height = input.height;

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

// eslint-disable-next-line 
function getVideoDryRunOutput(_input: InputByKind['video']): VideoOutput {
  return {
    kind: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  };
}


export default getDryRunOutput;
