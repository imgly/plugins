import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  fillProcessing,
  type FillProcessingMetadata
} from '@imgly/plugin-utils';
import * as vectorizer from '@imgly/vectorizer';
import { throttle } from 'lodash-es';
import addAsVectorGroup from './addAsVectorGroup';
import { VectorPath } from './types';

// Threshold for the number of paths in the vectorized image before it is considered too complex.
// Since the CE.SDK does not work well with a large number of grouped paths, we use a very low threshold.
// Some really simple images might still be grouped, but this is a trade-off to avoid performance issues and useability problems.
const THRESHOLD = 5;
const TIMEOUT = 30000;

/**
 * Triggers the vectorizer process.
 */
export async function processVectorization(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  vectorizerConfiguration?: vectorizer.Config,
  customThreshold?: number,
  customTimeout?: number
) {
  fillProcessing(blockId, cesdk, metadata, {
    async processFill(metadataState) {
      const sourceSet = metadataState.initialSourceSet;
      const imageFileURI = metadataState.initialImageFileURI;

      const input = sourceSet.length > 0 ? sourceSet[0].uri : imageFileURI;

      const config: vectorizer.Config = {
        signal: AbortSignal.timeout(customTimeout ?? TIMEOUT),
        ...vectorizerConfiguration,
        callbacks: {
          ...(vectorizerConfiguration?.callbacks ?? {}),
          progress: throttle((key, current, total) => {
            const currentMetadataInProgress = metadata.get(blockId);
            if (
              currentMetadataInProgress.status !== 'PROCESSING' ||
              !metadata.isConsistent(blockId)
            )
              return;

            vectorizerConfiguration?.callbacks?.progress?.(key, current, total);
            metadata.set(blockId, {
              ...currentMetadataInProgress,
              progress: { key, current, total }
            });
          }, 100)
        },
        options: {
          drop_transparent: false,
          ...(vectorizerConfiguration?.options ?? {})
        }
      };

      let inputBlob;
      if (input.startsWith('buffer:')) {
        const mimeType = await cesdk.engine.editor.getMimeType(input);
        const length = cesdk.engine.editor.getBufferLength(input);
        const data = cesdk.engine.editor.getBufferData(input, 0, length);
        inputBlob = new Blob([data], { type: mimeType });
      } else {
        inputBlob = await fetchImageBlob(input);
      }

      const converter = new vectorizer.SvgConverter(config);
      await converter.convert(inputBlob);

      const blocks = JSON.parse(converter.to_json());
      if (blocks.length < (customThreshold ?? THRESHOLD)) {
        converter.dispose();
        return blocks as VectorPath[];
      } else {
        const svg = converter.to_svg();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const uploaded = await uploadBlob(blob, input, cesdk);

        converter.dispose();
        return uploaded;
      }
    },

    commitProcessing(data, metadataState) {
      if (typeof data === 'string') {
        const fillId = metadataState.fillId;
        cesdk.engine.block.setString(fillId, 'fill/image/imageFileURI', data);
        cesdk.engine.block.setSourceSet(fillId, 'fill/image/sourceSet', []);
        // TODO: Generate a thumb/preview uri
        cesdk.engine.block.setString(fillId, 'fill/image/previewFileURI', '');
      } else {
        return addAsVectorGroup(blockId, data, cesdk);
      }
    }
  });
}

async function uploadBlob(
  blob: Blob,
  initialUri: string,
  cesdk: CreativeEditorSDK
) {
  const pathname = new URL(initialUri).pathname;
  const parts = pathname.split('/');
  const extension = mimeTypeToExtension(blob.type);
  const filename =
    parts[parts.length - 1]?.split('.')?.[0] ?? 'vectorized-image';
  const filenameWithExtension = `${filename}.${extension}`;

  const uploadedAssets = await cesdk.unstable_upload(
    new File([blob], filenameWithExtension, { type: blob.type }),
    () => {
      // TODO Delegate process to UI component
    }
  );

  const url = uploadedAssets.meta?.uri;
  if (url == null) {
    throw new Error('Could not upload processed fill');
  }
  return url;
}

function mimeTypeToExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'jpg';
  }
}

async function fetchImageBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((response) => response.blob());
}
