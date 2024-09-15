import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';

import * as bg_remover from '@imgly/background-removal';

import * as vectorizer from '@imgly/vectorizer';

import { fillProcessing, FillProcessingMetadata } from '@imgly/plugin-utils';

import { throttle } from 'lodash-es';

import { convertBufferURI, findOptimalSource, uploadBlob } from './utils';

export type ProviderConfig = {
  bg_remover?: bg_remover.Config;
  vectorizer?: vectorizer.Config;
};

// const VECTORIZER_THRESHOLD = 5;
const VECTORIZER_TIMEOUT = 30000;
const BGREMOVE_SIZE_THRESHOLD = 1024;

/**
 * Triggers the background removal process.
 */
export async function processFill(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  config?: ProviderConfig
) {
  
  const configuration = config ?? {};

  const blockApi = cesdk.engine.block;
  if (!blockApi.supportsFill(blockId))
    throw new Error('Block does not support fill');

  const fillId = blockApi.getFill(blockId);
  // Ensure we are using sourcesets, if not convert it to sourceset
  const sourceSet = blockApi.getSourceSet(fillId, 'fill/image/sourceSet');
  if (sourceSet.length === 0) {
    // convert to sourceSet
    const imageFileURI = blockApi.getString(fillId, 'fill/image/imageFileURI');
    if (imageFileURI === '') {
      throw new Error('No source or image file URI found');
    }

    blockApi.setSourceSet(fillId, 'fill/image/sourceSet', [
      { uri: imageFileURI, width: 0, height: 0 }
    ]);
    blockApi.setString(fillId, 'fill/image/imageFileURI', '');
  }

  // Set default configurations for workflow components
  configuration.bg_remover = {
    device: 'gpu',
    ...configuration.bg_remover,
    progress: throttle((key, current, total) => {
      const currentMetadataInProgress = metadata.get(blockId);
      if (
        currentMetadataInProgress.status !== 'PROCESSING' ||
        !metadata.isConsistent(blockId)
      )
        return;

        configuration.bg_remover?.progress?.(key, current, total);
      metadata.set(blockId, {
        ...currentMetadataInProgress,
        progress: { key, current, total }
      });
    }, 100)
  };

  configuration.vectorizer = {
    signal: AbortSignal.timeout(VECTORIZER_TIMEOUT),
    ...configuration.vectorizer,
    callbacks: {
      ...(configuration.vectorizer?.callbacks ?? {}),
      progress: throttle((key, current, total) => {
        const currentMetadataInProgress = metadata.get(blockId);
        if (
          currentMetadataInProgress.status !== 'PROCESSING' ||
          !metadata.isConsistent(blockId)
        )
          return;

          configuration.vectorizer?.callbacks?.progress?.(key, current, total);
        metadata.set(blockId, {
          ...currentMetadataInProgress,
          progress: { key, current, total }
        });
      }, 100)
    },
    options: {
      drop_transparent: false,
      ...(configuration.vectorizer?.options ?? {})
    }
  };

  fillProcessingFromSourceSet(blockId, cesdk, metadata, configuration);
}

export async function fillProcessingFromSourceSet(
  blockId: number,
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  config?: ProviderConfig
) {
  return fillProcessing<Source[]>(blockId, cesdk, metadata, {
    async processFill(metadataState) {
      const sourceSet = metadataState.initialSourceSet;
      const inputSource = findOptimalSource(sourceSet, BGREMOVE_SIZE_THRESHOLD);

      if (inputSource == null) throw new Error('No source found');

      const input = await convertBufferURI(inputSource.uri, cesdk);

      // start of workflow
      const cutout = await bg_remover.removeBackground(
        input,
        config?.bg_remover
      );

      const svg_converter = new vectorizer.SvgConverter(config?.vectorizer);
      await svg_converter.convert(cutout);
      const svg = svg_converter.to_svg();
      const blob = new Blob([svg], { type: 'image/svg+xml' });

      const pathname = new URL(inputSource.uri).pathname;
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];
      const uploaded = await uploadBlob(blob, filename, cesdk);
      svg_converter.dispose();

      const source: Source = {
        uri: uploaded,
        width: 0,
        height: 0
      };
      return [source];
    },

    commitProcessing(sources: Source[], metadataState) {
      const fillId = metadataState.fillId;
      // cesdk.engine.block.setString(fillId, 'fill/image/imageFileURI', "");
      cesdk.engine.block.setSourceSet(fillId, 'fill/image/sourceSet', sources);
      cesdk.engine.block.setString(fillId, 'fill/image/previewFileURI', '');
    }
  });
}
