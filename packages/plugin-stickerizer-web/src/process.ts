import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';

import {
  BGREMOVE_RESOLUTION_THRESHOLD,
  PLUGIN_ID,
  VECTORIZER_TIMEOUT
} from './constants';


import { fillProcessing, FillProcessingMetadata } from '@imgly/plugin-utils';

import { throttle, uniqueId } from 'lodash-es';

import { convertBufferURI, findOptimalSource, uploadBlob } from './utils';

// providers
import * as vectorizer from '@imgly/vectorizer';
import * as bg_remover from '@imgly/background-removal';

export type ProviderConfig = {
  bg_remover?: bg_remover.Config;
  vectorizer?: vectorizer.Config;
};

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
    options: {
      drop_transparent: false,
      ...(configuration.vectorizer?.options ?? {}),
      hierarchical: 'stacked', // FIXME should be cutout but out renderer does not account for smoothing
      // filter_speckle: 1,
      color_precision: 0,
    },
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
  return fillProcessing<void>(blockId, cesdk, metadata, {
    async processFill(metadataState) {
      const sourceSet = metadataState.initialSourceSet;
      const inputSource = findOptimalSource(
        sourceSet,
        BGREMOVE_RESOLUTION_THRESHOLD
      );

      if (inputSource == null) throw new Error('No source found');

      // console.log("Exporting block")
      // await cesdk.engine.block.export(bId)
      // console.log("Creating cutout")

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

      const filename = uniqueId(PLUGIN_ID);
      const uploaded = await uploadBlob(blob, filename, cesdk);
      svg_converter.dispose();
      const source: Source = {
        uri: uploaded,
        width: 0,
        height: 0
      };
      const sources = [source]
      const fId = metadataState.fillId;
      // const bId = metadataState.blockId
      // cesdk.engine.block.setString(fillId, 'fill/image/imageFileURI', "");
      cesdk.engine.block.setSourceSet(fId, 'fill/image/sourceSet', sources);
      cesdk.engine.block.setString(fId, 'fill/image/previewFileURI', uploaded);

      // Hack to ensure everything is updates
      console.log("Exporting block")
      await cesdk.engine.block.export(blockId)
      console.log("Creating cutout")
      // FIXME It would be better to just directly create an outlone via boolean operations from the vector fill
      // cesdk.engine.block.createCutoutFromBlocks([bId]);

      // Set a cutout's properties
      // cesdk.engine.block.setFloat(bId, 'cutout/offset', 2.0);
      // engine.block.setEnum(bId, 'cutout/offset', 'Dashed');
      
      
    },

    
    commitProcessing(sources: void, metadataState) {
      console.log("Commit")
      // const fId = metadataState.fillId;
      // const bId = metadataState.blockId
      // // cesdk.engine.block.setString(fillId, 'fill/image/imageFileURI', "");
      // cesdk.engine.block.setSourceSet(fId, 'fill/image/sourceSet', sources);
      // cesdk.engine.block.setString(fId, 'fill/image/previewFileURI', '');

      // // Hack to ensure everything is updates
      // await cesdk.engine.block.export(bId)
      // // FIXME It would be better to just directly create an outlone via boolean operations from the vector fill
      // cesdk.engine.block.createCutoutFromBlocks([bId]);

      // // Set a cutout's properties
      // cesdk.engine.block.setFloat(bId, 'cutout/offset', 2.0);
      // // engine.block.setEnum(bId, 'cutout/offset', 'Dashed');
    }
  });
}
