import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  HISTORY_ASSET_SOURCE_ID,
  STYLE_IMAGE_ASSET_SOURCE_ID,
  STYLE_VECTOR_ASSET_SOURCE_ID
} from './constants';
import { STYLES_IMAGE, STYLES_VECTOR, getStyleThumbnail } from './styles';

/**
 * Add all asset sources, library entries and assets necessary for the
 * image generation plugin.
 */
function addAssets(cesdk: CreativeEditorSDK) {
  const assetSourceIds = cesdk.engine.asset.findAllSources();

  addHistory(cesdk, assetSourceIds);
  addStyleAssets(cesdk, assetSourceIds);
}

/**
 * Add all asset sources, library entries and assets to show
 * all available style for the image generation.
 */
function addStyleAssets(cesdk: CreativeEditorSDK, assetSourceIds: string[]) {
  function applyAssetNoop(): Promise<number | undefined> {
    return Promise.resolve(undefined);
  }

  if (!assetSourceIds.includes(STYLE_IMAGE_ASSET_SOURCE_ID)) {
    cesdk.engine.asset.addLocalSource(
      STYLE_IMAGE_ASSET_SOURCE_ID,
      undefined,
      applyAssetNoop
    );
  }
  if (!assetSourceIds.includes(STYLE_VECTOR_ASSET_SOURCE_ID)) {
    cesdk.engine.asset.addLocalSource(
      STYLE_VECTOR_ASSET_SOURCE_ID,
      undefined,
      applyAssetNoop
    );
  }

  cesdk.ui.addAssetLibraryEntry({
    id: STYLE_IMAGE_ASSET_SOURCE_ID,
    sourceIds: [STYLE_IMAGE_ASSET_SOURCE_ID],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });

  cesdk.ui.addAssetLibraryEntry({
    id: STYLE_VECTOR_ASSET_SOURCE_ID,
    sourceIds: [STYLE_VECTOR_ASSET_SOURCE_ID],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });

  const backAsset = {
    id: 'back',
    label: {
      en: 'Back'
    },
    meta: {
      thumbUri: 'https://ubique.img.ly/static/image-generation/back.png'
    }
  } as const;
  cesdk.engine.asset.addAssetToSource(STYLE_IMAGE_ASSET_SOURCE_ID, backAsset);
  cesdk.engine.asset.addAssetToSource(STYLE_VECTOR_ASSET_SOURCE_ID, backAsset);

  STYLES_IMAGE.forEach(({ id, label }) => {
    cesdk.engine.asset.addAssetToSource(STYLE_IMAGE_ASSET_SOURCE_ID, {
      id,
      label: { en: label },
      meta: { thumbUri: getStyleThumbnail(id) }
    });
  });

  STYLES_VECTOR.forEach(({ id, label }) => {
    cesdk.engine.asset.addAssetToSource(STYLE_VECTOR_ASSET_SOURCE_ID, {
      id,
      label: { en: label },
      meta: { thumbUri: getStyleThumbnail(id) }
    });
  });
}

/**
 * Add the history asset source and library entry where all generated
 * assets will be added.
 */
function addHistory(cesdk: CreativeEditorSDK, assetSourceIds: string[]) {
  if (!assetSourceIds.includes(HISTORY_ASSET_SOURCE_ID)) {
    cesdk.engine.asset.addLocalSource(HISTORY_ASSET_SOURCE_ID);
  }
  cesdk.ui.addAssetLibraryEntry({
    id: HISTORY_ASSET_SOURCE_ID,
    sourceIds: [HISTORY_ASSET_SOURCE_ID],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
  });
}

export default addAssets;
