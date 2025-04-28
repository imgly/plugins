/* eslint-disable no-console */
import { getImageDimensionsFromURL, getImageUri } from '@imgly/plugin-utils';
import {
  type Output,
  type OutputKind,
  type GetBlockInputResult,
  VideoOutput,
  ImageOutput,
  GenerationOptions
} from '../provider';
import { Middleware } from './middleware';

interface DryRunOptions<K extends OutputKind> {
  kind: K;

  // Is only defined with generation from a panel where we create a complete new block
  blockInputs?: GetBlockInputResult<K>;

  // Is only defined with quick action generation on a given block(s).
  blockIds?: number[];
}

function dryRunMiddleware<I, K extends OutputKind, O extends Output>(
  options: DryRunOptions<K>
) {
  const middleware: Middleware<I, O> = async (
    generationInput,
    generationOptions
  ) => {
    console.log(
      `[DRY RUN]: Requesting dummy AI generation for kind '${options.kind}' with inputs: `,
      JSON.stringify(generationInput, undefined, 2)
    );
    await wait(2000);
    const output = await getDryRunOutput(
      generationInput,
      options,
      generationOptions
    );
    return output as O;
  };

  return middleware;
}

async function getDryRunOutput<K extends OutputKind, I>(
  generationInput: I,
  options: DryRunOptions<K>,
  generationOptions: GenerationOptions
): Promise<Output> {
  switch (options.kind) {
    case 'image': {
      return getImageDryRunOutput(
        generationInput,
        options as DryRunOptions<'image'>,
        generationOptions
      );
    }
    case 'video': {
      return getVideoDryRunOutput(
        generationInput,
        options as DryRunOptions<'video'>,
        generationOptions
      );
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating dry run output: ${options.kind}`
      );
    }
  }
}

async function getImageDryRunOutput<I>(
  generationInput: I,
  options: DryRunOptions<'image'>,
  { engine }: GenerationOptions
): Promise<ImageOutput> {
  let width;
  let height;

  const prompt: string =
    generationInput != null &&
    typeof generationInput === 'object' &&
    'prompt' in generationInput &&
    typeof generationInput.prompt === 'string'
      ? generationInput.prompt
      : 'AI Generated Image';

  // If prompt includes something that looks like a dimension
  // e.g. 512x512, 1024x768, etc. than we will use this as the
  // output image size for testing purposes.
  const promptDimension = prompt.match(/(\d+)x(\d+)/);
  if (promptDimension != null) {
    width = parseInt(promptDimension[1], 10);
    height = parseInt(promptDimension[2], 10);
  } else {
    if (options.blockInputs != null) {
      width = options.blockInputs.image.width;
      height = options.blockInputs.image.height;
    }
    if (
      options.blockIds != null &&
      Array.isArray(options.blockIds) &&
      options.blockIds.length > 0
    ) {
      const [blockId] = options.blockIds;
      const url = await getImageUri(blockId, engine);
      const dimension = await getImageDimensionsFromURL(url, engine);
      width = dimension.width;
      height = dimension.height;
    } else {
      width = 512;
      height = 512;
    }
  }

  const url = `https://placehold.co/${width}x${height}/000000/FFF?text=${prompt
    .replace(' ', '+')
    .replace('\n', '+')}`;

  return {
    kind: 'image',
    url
  };
}

async function getVideoDryRunOutput<I>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _generationInput: I,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: DryRunOptions<'video'>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _generationOptions: GenerationOptions
): Promise<VideoOutput> {
  return Promise.resolve({
    kind: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  });
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default dryRunMiddleware;
