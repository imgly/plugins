import CreativeEditorSDK, { Source } from '@cesdk/cesdk-js';

import { fillProcessing, FillProcessingMetadata } from '@imgly/plugin-utils';
import {
  PluginStatusProcessed,
  PluginStatusProcessing
} from '@imgly/plugin-utils/dist/metadata/types';

export async function fillProcessingFromSourceSet(
  blockId: number,
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  processFill: (metadataState: PluginStatusProcessing) => Promise<Source[]>
) {
  return fillProcessing<Source[]>(blockId, cesdk, metadata, {
    processFill,

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
  processFill: (metadataState: PluginStatusProcessing) => Promise<string>
) {
  return fillProcessing<string>(blockId, cesdk, metadata, {
    processFill,
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
