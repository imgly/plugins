import { type AssetResult } from '@cesdk/cesdk-js';
import { type OutputKind, GetBlockInputResult, InputByKind } from './provider';
import previewUri from './previewUri';

function getAssetResultForPlaceholder<K extends OutputKind>(
  id: string,
  kind: K,
  blockInput: GetBlockInputResult<K>
): AssetResult {
  switch (kind) {
    case 'image': {
      return getImageAssetResultForPlaceholder(
        id,
        blockInput[kind] as InputByKind['image']
      );
    }
    case 'video': {
      return getVideoAssetResultForPlaceholder(
        id,
        blockInput[kind] as InputByKind['video']
      );
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating placeholder block: ${kind}`
      );
    }
  }
}

function getImageAssetResultForPlaceholder(
  id: string,
  input: InputByKind['image']
): AssetResult {
  const width = input.width;
  const height = input.height;
  return {
    id,
    meta: {
      previewUri,
      fillType: '//ly.img.ubq/fill/image',
      kind: 'image',

      width,
      height
    }
  };
}

function getVideoAssetResultForPlaceholder(
  id: string,
  input: InputByKind['video']
): AssetResult {
  const width = input.width;
  const height = input.height;
  return {
    id,
    label: input.label,
    meta: {
      previewUri,
      mimeType: 'video/mp4',
      kind: 'video',
      fillType: '//ly.img.ubq/fill/video',

      duration: input.duration.toString(),

      width,
      height
    }
  };
}

export default getAssetResultForPlaceholder;
