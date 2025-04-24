import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  GenerationResult,
  ImageOutput,
  TextOutput,
  type Output,
  type OutputKind
} from '../provider';
import { ApplyCallbacks } from './types';
import { isAsyncGenerator } from '../../utils';

type ConsumeGeneratedResultOptions = {
  kind: OutputKind;
  blockIds: number[];
  cesdk: CreativeEditorSDK;
  abortSignal: AbortSignal;
};

type ReturnValue<O extends Output> = {
  consumedGenerationResult: O;
  applyCallbacks: ApplyCallbacks;
};

/**
 * This method is used in the quick action menu to handle the result of the generation
 * and providing methods for the comparision of the result.
 *
 * Different output kinds require different handling. E.g. the text generation
 * is streamed to the text block, while the image generation is applied to the fill
 * block with a source set and the same crop applied.
 */
function consumeGeneratedResult<O extends Output>(
  result: GenerationResult<O>,
  options: ConsumeGeneratedResultOptions
): Promise<ReturnValue<O>> {
  switch (options.kind) {
    case 'text':
      return getApplyCallbacksForText(result, options);
    case 'image':
      return getApplyCallbacksForImage(result, options);
    case 'video':
      return getApplyCallbacksForVideo(result, options);
    case 'audio':
      return getApplyCallbacksForAudio(result, options);
    default:
      throw new Error(
        `Unsupported output kind for quick actions: ${options.kind}`
      );
  }
}

async function getApplyCallbacksForText<O extends Output>(
  generationResult: GenerationResult<O>,
  options: ConsumeGeneratedResultOptions
): Promise<ReturnValue<O>> {
  const { cesdk, blockIds, abortSignal } = options;

  const beforeTexts = blockIds.map((blockId) => {
    return cesdk.engine.block.getString(blockId, 'text/text');
  });

  let output: O | undefined;
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

      // eslint-disable-next-line @typescript-eslint/no-loop-func
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
    consumedGenerationResult: output,
    applyCallbacks: {
      onBefore,
      onAfter,
      onCancel,
      onApply
    }
  };
}

async function getApplyCallbacksForImage<O extends Output>(
  generationResult: GenerationResult<O>,
  options: ConsumeGeneratedResultOptions
): Promise<ReturnValue<O>> {
  const { cesdk, blockIds, abortSignal } = options;
  if (blockIds.length !== 1) {
    throw new Error('Only one block is supported for image generation');
  }

  const [block] = blockIds;
  const fillBlock = cesdk.engine.block.getFill(block);
  const sourceSetBefore = cesdk.engine.block.getSourceSet(
    fillBlock,
    'fill/image/sourceSet'
  );
  const [sourceBefore] = sourceSetBefore;
  let uriBefore: string | undefined;
  if (sourceBefore == null) {
    uriBefore = cesdk.engine.block.getString(
      fillBlock,
      'fill/image/imageFileURI'
    );
  }

  const mimeType = await cesdk.engine.editor.getMimeType(
    sourceBefore?.uri ?? uriBefore
  );
  abortSignal.throwIfAborted();

  if (mimeType === 'image/svg+xml') {
    throw new Error('SVG images are not supported');
  }

  const cropScaleX = cesdk.engine.block.getCropScaleX(block);
  const cropScaleY = cesdk.engine.block.getCropScaleY(block);
  const cropTranslationX = cesdk.engine.block.getCropTranslationX(block);
  const cropTranslationY = cesdk.engine.block.getCropTranslationY(block);
  const cropRotation = cesdk.engine.block.getCropRotation(block);

  const applyCrop = () => {
    cesdk.engine.block.setCropScaleX(block, cropScaleX);
    cesdk.engine.block.setCropScaleY(block, cropScaleY);
    cesdk.engine.block.setCropTranslationX(block, cropTranslationX);
    cesdk.engine.block.setCropTranslationY(block, cropTranslationY);
    cesdk.engine.block.setCropRotation(block, cropRotation);
  };

  if (isAsyncGenerator(generationResult)) {
    throw new Error('Streaming generation is not supported yet from a panel');
  }

  if (
    generationResult.kind !== 'image' ||
    typeof generationResult.url !== 'string'
  ) {
    throw new Error('Output kind from generation is not an image');
  }

  const url = (generationResult as ImageOutput).url;
  const generatedMimeType = await cesdk.engine.editor.getMimeType(url);

  const uri = await reuploadImage(cesdk, url, generatedMimeType);

  const sourceSetAfter = sourceBefore
    ? [
        {
          uri,
          width: sourceBefore.width,
          height: sourceBefore.height
        }
      ]
    : undefined;
  const uriAfter = uri;

  if (sourceSetAfter == null) {
    cesdk.engine.block.setString(
      fillBlock,
      'fill/image/imageFileURI',
      uriAfter
    );
  } else {
    cesdk.engine.block.setSourceSet(
      fillBlock,
      'fill/image/sourceSet',
      sourceSetAfter
    );
  }
  applyCrop();

  const onBefore = () => {
    if (sourceSetBefore == null) {
      if (uriBefore == null) {
        throw new Error('No image URI found');
      }
      cesdk.engine.block.setString(
        fillBlock,
        'fill/image/imageFileURI',
        uriBefore
      );
    } else {
      cesdk.engine.block.setSourceSet(
        fillBlock,
        'fill/image/sourceSet',
        sourceSetBefore
      );
    }
    applyCrop();
  };
  const onAfter = () => {
    if (sourceSetAfter == null) {
      if (uriAfter == null) {
        throw new Error('No image URI found');
      }
      cesdk.engine.block.setString(
        fillBlock,
        'fill/image/imageFileURI',
        uriAfter
      );
    } else {
      cesdk.engine.block.setSourceSet(
        fillBlock,
        'fill/image/sourceSet',
        sourceSetAfter
      );
    }
    applyCrop();
  };
  const onCancel = () => {
    onBefore();
  };
  const onApply = () => {
    onAfter();
  };

  return {
    consumedGenerationResult: generationResult,
    applyCallbacks: {
      onBefore,
      onAfter,
      onCancel,
      onApply
    }
  };
}

async function getApplyCallbacksForVideo<O extends Output>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _result: GenerationResult<O>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: ConsumeGeneratedResultOptions
): Promise<ReturnValue<O>> {
  throw new Error('Function not implemented.');
}

async function getApplyCallbacksForAudio<O extends Output>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _result: GenerationResult<O>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: ConsumeGeneratedResultOptions
): Promise<ReturnValue<O>> {
  throw new Error('Function not implemented.');
}

async function reuploadImage(
  cesdk: CreativeEditorSDK,
  url: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], `image.${getFileExtension(mimeType)}`, {
    type: mimeType
  });
  const assetDefinition = await cesdk.unstable_upload(file, () => {});
  const uploadedUri = assetDefinition?.meta?.uri;
  if (uploadedUri != null) return uploadedUri;
  // eslint-disable-next-line no-console
  console.warn('Failed to upload image:', assetDefinition);
  return url;
}

function getFileExtension(mimeType: string): string {
  const mimeTypeToExtension: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };
  return mimeTypeToExtension[mimeType] ?? 'png';
}

export default consumeGeneratedResult;
