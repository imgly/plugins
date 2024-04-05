import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { CreativeEngine, type EditorPlugin } from '@cesdk/cesdk-js';
import {
  DEFAULT_PLUGIN_CONFIGURATION,
  PluginConfiguration,
  getPluginConfiguration
} from '.';
import { registerComponents } from './components';
import { ASSET_SOURCE_ID, ENTRY_ID } from './constants';
import loadAssetSourceFromContentJSON from './loadAssetSourceFromContentJSON';

export function CutoutPlugin({
  assetBaseUri,
  addCanvasMenuButton
}: PluginConfiguration): EditorPlugin {
  return {
    initializeUserInterface: ({ cesdk }) => {
      addCutoutAssetSource(cesdk, { assetBaseUri });
      if (addCanvasMenuButton) registerComponents(cesdk);
      cesdk.setTranslations({
        en: {
          [`libraries.${ENTRY_ID}.label`]: 'Cutouts'
        }
      });
    }
  };
}

export function GetCutoutLibraryInsertEntry(
  config: Partial<PluginConfiguration> = DEFAULT_PLUGIN_CONFIGURATION
) {
  const { assetBaseUri } = getPluginConfiguration(config);
  return {
    id: ENTRY_ID,
    sourceIds: [ASSET_SOURCE_ID],
    icon: ({ theme }: { theme: string }) => `${assetBaseUri}/dock-${theme}.svg`,
    gridColumns: 2,
    gridItemHeight: 'square' as const,
    cardLabel: (asset: any) => asset.label,
    cardLabelPosition: () => 'below' as const
  };
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
        return generateCutoutFromSelection(cesdk);
      }
      if (!asset.meta || !asset.meta.vectorPath2) {
        return;
      }
      // Workaround to enable proper thumbnails for predefined cutouts
      // @ts-ignore
      asset.meta.vectorPath = asset.meta.vectorPath2;
      const blockId = await cesdk.engine.asset.defaultApplyAsset(asset);
      return blockId;
    }
  );
}

export function generateCutoutFromSelection(cesdk: CreativeEditorSDK) {
  const selectedBlockIds = cesdk.engine.block.findAllSelected();

  if (selectedBlockIds.length === 0) {
    cesdk.ui.showNotification({
      message: 'Please Select',
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
      message: 'Cutout blocks cannot be cutout from selection',
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
      message:
        'Selected Blocks are from different pages. Please select blocks from the same page.',
      type: 'error'
    });
    return undefined;
  }
  const pageId = uniqueParentPageBlockIds[0];

  const blockId = cesdk.engine.block.createCutoutFromBlocks(selectedBlockIds);
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

export default CutoutPlugin;
