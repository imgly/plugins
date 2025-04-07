import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  GenerationResult,
  TextOutput,
  type Output,
  type OutputKind
} from '../provider';
import { ApplyCallbacks } from './types';
import { isAsyncGenerator } from '../../utils';

type WithOptions = {
  kind: OutputKind;
  blockIds: number[];
  cesdk: CreativeEditorSDK;
  abortSignal: AbortSignal;
};

type WithReturnValue<O extends Output> = {
  returnValue: O;
  applyCallbacks?: ApplyCallbacks;
};
function withKind<O extends Output>(
  fn: () => Promise<GenerationResult<O>>,
  options: WithOptions
): () => Promise<WithReturnValue<O>> {
  switch (options.kind) {
    case 'text':
      return () => withText(fn, options);
    case 'image':
      return () => withImage(fn, options);
    case 'video':
      return () => withVideo(fn, options);
    case 'audio':
      return () => withAudio(fn, options);
    default:
      throw new Error(
        `Unsupported output kind for quick actions: ${options.kind}`
      );
  }
}

async function withText<O extends Output>(
  fn: () => Promise<GenerationResult<O>>,
  options: WithOptions
): Promise<WithReturnValue<O>> {
  const { cesdk, blockIds, abortSignal } = options;

  const beforeTexts = blockIds.map((blockId) => {
    return cesdk.engine.block.getString(blockId, 'text/text');
  });

  let output: O | undefined = undefined;
  const generationResult = await fn();
  if (isAsyncGenerator(generationResult)) {
    let inferredText = '';
    for await (const chunk of generationResult) {
      if (abortSignal.aborted) {
        break;
      }
      if (typeof chunk === 'string') {
        inferredText = chunk;
      } else if (chunk.kind === 'text') {
        inferredText = chunk.text;
      }

      blockIds.forEach((blockId) => {
        cesdk.engine.block.setString(blockId, 'text/text', inferredText);
      });

      const textOutput: TextOutput = {
        kind: 'text',
        text: inferredText
      };
      output = textOutput as O;
    }
  } else {
    output = generationResult;
  }

  if (output == null || output.kind !== 'text') {
    throw new Error('Output kind from generation is not text');
  }

  const onAfter = () => {
    options.blockIds.forEach((blockId) => {
      options.cesdk.engine.block.setString(blockId, 'text/text', output.text);
    });
  };
  const onBefore = () => {
    options.blockIds.forEach((blockId, i) => {
      options.cesdk.engine.block.setString(
        blockId,
        'text/text',
        beforeTexts[i]
      );
    });
  };
  const onCancel = onBefore;
  const onApply = onAfter;

  return {
    returnValue: output,
    applyCallbacks: {
      onBefore,
      onAfter,
      onCancel,
      onApply
    }
  };
}

async function withImage<O extends Output>(
  _fn: () => Promise<GenerationResult<O>>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  // TODO: Implement withImage
  throw new Error('Function not implemented.');
}

async function withVideo<O extends Output>(
  _fn: () => Promise<GenerationResult<O>>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  throw new Error('Function not implemented.');
}

async function withAudio<O extends Output>(
  _fn: () => Promise<GenerationResult<O>>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  throw new Error('Function not implemented.');
}

export default withKind;
