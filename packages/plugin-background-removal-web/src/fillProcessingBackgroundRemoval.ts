import CreativeEditorSDK, { Source } from '@cesdk/cesdk-js';
import {
  applySegmentationMask,
  removeBackground,
  segmentForeground,
  type Config
} from '@imgly/background-removal';

import { fillProcessing, FillProcessingMetadata } from '@imgly/plugin-utils';
import {
  PluginStatusProcessed,
  PluginStatusProcessing
} from '@imgly/plugin-utils/dist/metadata/types';
import findOptimalSource from './findOptiomalSource';
import uploadBlob from './uploadBlob';

export async function fillProcessingFromSourceSet(
  blockId: number,
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  bgRemovalConfiguration?: Config,
  customProcessFill?: (
    metadataState: PluginStatusProcessing
  ) => Promise<Source[]>
) {
  return fillProcessing<Source[]>(blockId, cesdk, metadata, {
    processFill:
      customProcessFill ??
      // Default implementation from IMG.LY background removal library
      (async (metadataState) => {
        const sourceSet = metadataState.initialSourceSet;
        const inputSource = findOptimalSource(sourceSet);

        if (inputSource == null) throw new Error('No source found');

        const mask = await segmentForeground(
          inputSource.uri,
          bgRemovalConfiguration
        );
        const result = await Promise.all(
          sourceSet.map(async (source): Promise<Source> => {
            // Applying the mask to the original image
            const blob = await applySegmentationMask(
              source.uri,
              mask,
              bgRemovalConfiguration
            );
            const uploaded = await uploadBlob(blob, source.uri, cesdk);
            return {
              ...source,
              uri: uploaded
            };
          })
        );

        return result;
      }),

    commitProcessing: (
      sourceSet: Source[],
      metadataState: PluginStatusProcessed
    ) => {
      const fillId = metadataState.fillId;
      cesdk.engine.block.setSourceSet(
        fillId,
        'fill/image/sourceSet',
        sourceSet
      );
      const smallestSource = [...sourceSet].sort(
        (a, b) => a.width * a.height - b.width * b.height
      )[0];

      if (smallestSource != null) {
        cesdk.engine.block.setString(
          fillId,
          'fill/image/previewFileURI',
          smallestSource.uri
        );
      }
    }
  });
}

export async function fillProcessingFromImageFileURI(
  blockId: number,
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  bgRemovalConfiguration?: Config,
  customProcessFill?: (metadataState: PluginStatusProcessing) => Promise<string>
) {
  return fillProcessing<string>(blockId, cesdk, metadata, {
    processFill:
      customProcessFill ??
      // Default implementation from IMG.LY background removal library
      (async (metadataState) => {
        const imageFileURI = metadataState.initialImageFileURI;
        const blob = await removeBackground(
          imageFileURI,
          bgRemovalConfiguration
        );
        const uploaded = await uploadBlob(blob, imageFileURI, cesdk);
        return uploaded;
      }),

    commitProcessing: (
      uploadedUri: string,
      metadataState: PluginStatusProcessed
    ) => {
      const fillId = metadataState.fillId;
      cesdk.engine.block.setString(
        fillId,
        'fill/image/imageFileURI',
        uploadedUri
      );
      // TODO: Generate a thumb/preview uri
      cesdk.engine.block.setString(fillId, 'fill/image/previewFileURI', '');
    }
  });
}
