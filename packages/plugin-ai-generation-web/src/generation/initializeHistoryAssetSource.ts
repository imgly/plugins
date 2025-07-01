import { IndexedDBAssetSource } from '@imgly/plugin-utils';
import { OutputKind, Output } from './provider';
import { InitializationContext } from './types';

/**
 * Initializes the history asset source for the given provider.
 */
function initializeHistoryAssetSource<
  K extends OutputKind,
  I,
  O extends Output
>(context: InitializationContext<K, I, O>): string | undefined {
  const {
    provider,
    options: { engine }
  } = context;

  const history = provider.output.history ?? '@imgly/local';
  if (history == null || history === false) return undefined;

  const currentAssetSourceIds = engine.asset.findAllSources();

  function getUniqueHistoryId(): string {
    let id = `${provider.id}.history`;
    while (currentAssetSourceIds.includes(id)) {
      id += `-${Math.random().toString(36).substring(2, 6)}`;
    }
    return id;
  }

  if (history === '@imgly/local') {
    const historyId = getUniqueHistoryId();
    engine.asset.addLocalSource(historyId);
    return historyId;
  }
  if (history === '@imgly/indexedDB') {
    const historyId = getUniqueHistoryId();
    engine.asset.addSource(new IndexedDBAssetSource(historyId, engine));
    return historyId;
  }

  return history;
}

export default initializeHistoryAssetSource;
