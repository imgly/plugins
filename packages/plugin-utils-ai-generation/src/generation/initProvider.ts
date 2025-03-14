import type Provider from './provider';
import { OutputKind, PanelInput, type Output } from './provider';
import registerPanelInputSchema from './registerPanelInputSchema';
import registerPanelInputCustom from './registerPanelInputCustom';
import { InitProviderConfiguration, Options, UIOptions } from './types';
import { type CreativeEngine } from '@cesdk/cesdk-js';
import { IndexedDBAssetSource } from '../IndexedDBAssetSource';

async function initProvider<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  options: Options,
  config: InitProviderConfiguration
) {
  await provider.initialize(options);
  const historyAssetSourceId = await initHistory(
    options.engine,
    provider.id,
    provider.output.history ?? '@imgly/local'
  );

  if (options.cesdk != null) {
    const historyAssetLibraryEntryId = historyAssetSourceId
      ? `${provider.id}.history.entry`
      : undefined;
    const uiOptions: UIOptions = {
      ...options,
      cesdk: options.cesdk,
      historyAssetSourceId,
      historyAssetLibraryEntryId
    };

    if (historyAssetLibraryEntryId != null && historyAssetSourceId != null) {
      options.cesdk.ui.addAssetLibraryEntry({
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

    await initInputs(provider, uiOptions, config);
  }
}

/**
 * Initialize the history for the provider.
 */
async function initHistory(
  engine: CreativeEngine,
  providerId: string,
  history: undefined | false | '@imgly/local' | '@imgly/indexedDB' | string
): Promise<string | undefined> {
  if (history == null || history === false) return undefined;

  if (history === '@imgly/local') {
    const historyId = `${providerId}.history`;
    engine.asset.addLocalSource(historyId);
    return historyId;
  }

  if (history === '@imgly/indexedDB') {
    const historyId = `${providerId}.history`;
    engine.asset.addSource(new IndexedDBAssetSource(historyId));
    return historyId;
  }

  return history;
}

async function initInputs<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  options: UIOptions,
  config: InitProviderConfiguration
) {
  if (provider.input?.panel != null) {
    await initPanel(provider, provider.input.panel, options, config);
  }
  // TODO: Initialize other inputs like the "magic menu"
}

async function initPanel<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  panelInput: PanelInput<K, I>,
  options: UIOptions,
  config: InitProviderConfiguration
) {
  switch (panelInput.type) {
    case 'custom': {
      await registerPanelInputCustom(provider, panelInput, options, config);
      break;
    }

    case 'schema': {
      await registerPanelInputSchema(provider, panelInput, options, config);
      break;
    }

    default: {
      if (config.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          // @ts-ignore
          `Invalid panel input type '${panelInput.type}' - skipping`
        );
      }
    }
  }
}

export default initProvider;
