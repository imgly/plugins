import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { CreativeEngine, type EditorPlugin } from '@cesdk/cesdk-js';
import {
  DEFAULT_PLUGIN_CONFIGURATION,
  PluginConfiguration,
  getPluginConfiguration
} from '.';
import { registerComponents } from './components';
import {
  ASSET_SOURCE_ID,
  CANVAS_MENU_COMPONENT_ID,
  ENTRY_ID,
  I18N,
  NOTIFICATION_CUTOUT_BLOCK_SELECTED_ID,
  NOTIFICATION_DIFFERENT_PAGES_ID,
  NOTIFICATION_SELECT_CUTOUT_BLOCK_ID
} from './constants';
import loadAssetSourceFromContentJSON from './loadAssetSourceFromContentJSON';

export type UILocations = 'canvasMenu';

export interface UserInterfaceConfiguration {
  locations?: UILocations[];
}

export function CutoutPlugin({
  assetBaseUri,
  ui
}: PluginConfiguration): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    initialize: ({ cesdk }) => {
      if (cesdk == null) return;

      addCutoutAssetSource(cesdk, { assetBaseUri });
      addCutoutAssetLibraryEntry(cesdk, { assetBaseUri });

      registerComponents(cesdk);
      if (ui?.locations.includes('canvasMenu')) {
        cesdk.ui.setCanvasMenuOrder([
          CANVAS_MENU_COMPONENT_ID,
          ...cesdk.ui.getCanvasMenuOrder()
        ]);
      }
      cesdk.setTranslations(I18N);
    }
  };
}

function addCutoutAssetLibraryEntry(
  cesdk: CreativeEditorSDK,
  config: Partial<PluginConfiguration> = DEFAULT_PLUGIN_CONFIGURATION
) {
  const { assetBaseUri } = getPluginConfiguration(config);
  cesdk.ui.addAssetLibraryEntry({
    id: ENTRY_ID,
    sourceIds: [ASSET_SOURCE_ID],
    icon: ({ theme }: { theme: string }) => `${assetBaseUri}/dock-${theme}.svg`,
    gridColumns: 2,
    gridItemHeight: 'square' as const,
    cardLabel: (asset: any) => asset.label,
    cardLabelPosition: () => 'below' as const,
    cardBackgroundPreferences: [{ path: 'meta.thumbUri', type: 'image' }]
  });
}

async function addCutoutAssetSource(
  cesdk: CreativeEditorSDK,
  {
    assetBaseUri
  }: {
    assetBaseUri: string;
  }
) {
  const contentJSON = await fetch(
    `${assetBaseUri}/${ASSET_SOURCE_ID}/content.json`
  ).then((res) => res.json());

  loadAssetSourceFromContentJSON(
    cesdk.engine,
    contentJSON,
    `${assetBaseUri}/${ASSET_SOURCE_ID}/assets`,
    async (asset) => {
      if (asset.id === 'cutout-selection') {
        const block = await generateCutoutFromSelection(cesdk);
        return block;
      }
      const blockId = await cesdk.engine.asset.defaultApplyAsset(asset);
      return blockId;
    }
  );
}

export async function generateCutoutFromSelection(cesdk: CreativeEditorSDK) {
  const selectedBlockIds = cesdk.engine.block.findAllSelected();

  if (selectedBlockIds.length === 0) {
    cesdk.ui.showNotification({
      message: NOTIFICATION_SELECT_CUTOUT_BLOCK_ID,
      type: 'error'
    });
    return undefined;
  }
  const hasCutoutsSelected = selectedBlockIds.some((selectedBlockId) => {
    return (
      cesdk.engine.block.getType(selectedBlockId) === '//ly.img.ubq/cutout'
    );
  });
  if (hasCutoutsSelected) {
    cesdk.ui.showNotification({
      message: NOTIFICATION_CUTOUT_BLOCK_SELECTED_ID,
      type: 'error'
    });
    return undefined;
  }

  const parentPageBlockIds = selectedBlockIds.map((block) =>
    getParentPageId(cesdk.engine, block)
  );
  const uniqueParentPageBlockIds = Array.from(new Set(parentPageBlockIds));
  // throw error if blocks are from different pages
  if (uniqueParentPageBlockIds.length > 1) {
    cesdk.ui.showNotification({
      message: NOTIFICATION_DIFFERENT_PAGES_ID,
      type: 'error'
    });
    return undefined;
  }
  const pageId = uniqueParentPageBlockIds[0];

  let simplifyDistanceThreshold = 4; // Default value

  const mimeTypes = await getSelectedMimeTypes(cesdk.engine, selectedBlockIds);
  // if mime types contain any png, set simplifyDistanceThreshold to 0.
  // This ensures that the cutout is created using the exact shape of the selected blocks.
  const transparencyMimeTypes = ['image/png', 'image/gif', 'image/webp'];
  if (mimeTypes.some((mimeType) => transparencyMimeTypes.includes(mimeType))) {
    simplifyDistanceThreshold = 0;
  }

  const blockId = cesdk.engine.block.createCutoutFromBlocks(
    selectedBlockIds,
    undefined,
    simplifyDistanceThreshold
  );
  cesdk.engine.block.appendChild(pageId, blockId);
  cesdk.engine.block.setAlwaysOnTop(blockId, true);
  cesdk.engine.block.select(blockId);
  cesdk.engine.editor.addUndoStep();
  return blockId;
}

function getParentPageId(engine: CreativeEngine, block: number) {
  // traverse up the block tree to find the page
  let currentBlock = block;
  while (
    currentBlock &&
    engine.block.getType(currentBlock) !== '//ly.img.ubq/page'
  ) {
    const parentBlock = engine.block.getParent(currentBlock);
    if (!parentBlock || parentBlock === currentBlock) {
      return currentBlock;
    }
    currentBlock = parentBlock;
  }
  return currentBlock;
}

async function getSelectedMimeTypes(
  engine: CreativeEngine,
  blockIds: number[]
) {
  const mimeTypes = await Promise.all(
    blockIds.map((blockId) => {
      if (engine.block.getType(blockId) !== '//ly.img.ubq/graphic') {
        return null;
      }
      const fillBlockId = engine.block.getFill(blockId);
      const isImageFill =
        fillBlockId != null &&
        engine.block.isValid(blockId) &&
        engine.block.getType(fillBlockId) === '//ly.img.ubq/fill/image';
      if (!isImageFill) {
        return null;
      }
      const sourceSet = engine.block.getSourceSet(
        fillBlockId,
        'fill/image/sourceSet'
      );
      const imageFileUri = engine.block.getString(
        fillBlockId,
        'fill/image/imageFileURI'
      );
      if (!sourceSet && !imageFileUri) {
        return null;
      }
      const uri = sourceSet[0]?.uri ?? imageFileUri;
      if (!uri) {
        return null;
      }
      return engine.editor.getMimeType(uri);
    })
  );
  return mimeTypes.filter((mimeType) => mimeType !== null) as string[];
}

export default CutoutPlugin;
