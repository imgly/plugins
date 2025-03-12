import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { PluginConfiguration } from './types';

/**
 * Adds the history asset source and library entry for the plugin.
 */
export function registerHistoryAssetSource<I>(options: {
  config: PluginConfiguration<I>;
  providerId: string;
  cesdk: CreativeEditorSDK;
}) {
  const { config, cesdk, providerId } = options;
  const historyAssetSourceId = getHistoryAssetSourceId(options);
  if (historyAssetSourceId == null) return;

  if (config.debug)
    // eslint-disable-next-line no-console
    console.log(`Registering history asset source ${historyAssetSourceId}`);

  const historyAssetLibraryEntryId = `${providerId}.history.entry`;

  if (!cesdk.engine.asset.findAllSources().includes(historyAssetSourceId)) {
    cesdk.engine.asset.addLocalSource(historyAssetSourceId);
  }
  cesdk.ui.addAssetLibraryEntry({
    id: historyAssetLibraryEntryId,
    sourceIds: [historyAssetSourceId],
    sortBy: {
      sortingOrder: 'Descending'
    },
    canRemove: true,
    gridItemHeight: 'square',
    gridBackgroundType: 'cover'
  });
}

/**
 * Returns the configured history asset source ID.
 */
export function getHistoryAssetSourceId<I>(options: {
  config: PluginConfiguration<I>;
  providerId: string;
}): string | undefined {
  const { config, providerId } = options;

  let historyAssetSourceId: string | undefined;

  if (
    config.historyAssetSourceId == null ||
    config.historyAssetSourceId === true
  ) {
    historyAssetSourceId = `${providerId}.history`;
  } else if (config.historyAssetSourceId === false) {
    historyAssetSourceId = undefined;
  } else if (typeof config.historyAssetSourceId === 'string') {
    historyAssetSourceId = config.historyAssetSourceId;
  }

  return historyAssetSourceId;
}
