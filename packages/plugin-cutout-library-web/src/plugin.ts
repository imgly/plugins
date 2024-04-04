import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type EditorPlugin } from '@cesdk/cesdk-js';
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
  const pageId = cesdk.engine.scene.getCurrentPage();
  if (pageId == null) {
    cesdk.ui.showNotification({
      message: 'No page block available to add the cutout from selection',
      type: 'error'
    });
    return undefined;
  }
  const pageChildren = cesdk.engine.block.getChildren(pageId);

  const selectedBlockIds = cesdk.engine.block
    .findAllSelected()
    .filter((selectedBlockId) => {
      return pageChildren.includes(selectedBlockId);
    });

  if (selectedBlockIds.length > 0) {
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
    const blockId = cesdk.engine.block.createCutoutFromBlocks(selectedBlockIds);
    cesdk.engine.block.appendChild(pageId, blockId);
    cesdk.engine.block.setAlwaysOnTop(blockId, true);
    cesdk.engine.block.select(blockId);
    cesdk.engine.editor.addUndoStep();
    return blockId;
  } else {
    cesdk.ui.showNotification({
      message: 'No selected blocks available to cutout from selection',
      type: 'error'
    });
    return undefined;
  }
}

export default CutoutPlugin;
