import CreativeEditorSDK, {
  BuilderRenderFunction,
  BuilderRenderFunctionContext,
  SelectValue
} from '@cesdk/cesdk-js';
import Provider, { Output, OutputKind } from '../core/provider';
import initializeProvider, {
  ProviderInitializationResult
} from './initializeProvider';
import { isGeneratingStateKey } from '../ui/components/renderGenerationComponents';
import { CommonPluginConfiguration } from '../types';
import initializeHistoryCompositeAssetSource from '../assets/initializeHistoryCompositeAssetSource';
import { isDefined } from '@imgly/plugin-utils';

function createLabelArray<K extends OutputKind>(
  kind: K,
  key: string
): string[] {
  return [
    `ly.img.plugin-ai-${kind}-generation-web.${key}`,
    `ly.img.plugin-ai-generation-web.${key}`,
    `ly.img.plugin-ai-generation-web.defaults.${key}`
  ];
}

export type ProvidersInitializationResult<
  K extends OutputKind,
  I,
  O extends Output
> = {
  /**
   * Combined panel render function for all providers.
   */
  panel: {
    builderRenderFunction?: BuilderRenderFunction;
  };

  /**
   * Combined history asset source and library entry IDs for the providers.
   */
  history?: {
    assetSourceId?: string;
    assetLibraryEntryId?: string;
  };

  /**
   * All individual initialization results of the providers, i.e.
   * the result of `initializeProvider` for every provider.
   */
  providerInitializationResults: ProviderInitializationResult<K, I, O>[];
};

/**
 * Initializes the given providers for the specified output kind.
 *
 * - It will create a combined render function for all providers
 *   that can be used in a panel
 *
 */
async function initializeProviders<K extends OutputKind, I, O extends Output>(
  kind: K,
  providers:
    | {
        fromText: Provider<K, I, O>[];
        fromImage: Provider<K, I, O>[];
      }
    | Provider<K, I, O>[],
  options: {
    cesdk: CreativeEditorSDK;
  },
  config: CommonPluginConfiguration<K, I, O>
): Promise<ProvidersInitializationResult<K, I, O>> {
  // Set default translations
  const { cesdk } = options;
  cesdk.setTranslations({
    en: {
      'ly.img.plugin-ai-generation-web.defaults.fromType.label': 'Input',
      'ly.img.plugin-ai-generation-web.defaults.providerSelect.label':
        'Provider',
      'ly.img.plugin-ai-generation-web.defaults.fromText.label': 'Text',
      'ly.img.plugin-ai-generation-web.defaults.fromImage.label': 'Image'
    }
  });

  let builderRenderFunction: BuilderRenderFunction | undefined;

  const providerResults: ProviderInitializationResult<K, I, O>[] = [];
  if (!Array.isArray(providers)) {
    const initializedFromTextProviders = await Promise.all(
      providers.fromText.map((provider) => {
        return initializeProvider(kind, provider, options, config);
      })
    );
    providerResults.push(...initializedFromTextProviders);

    const initializedFromImageProviders = await Promise.all(
      providers.fromImage.map((provider) => {
        return initializeProvider(kind, provider, options, config);
      })
    );
    providerResults.push(...initializedFromImageProviders);

    builderRenderFunction = getBuilderRenderFunctionByFromType({
      kind,
      prefix: `ly.img.ai.${kind}-generation`,
      initializedFromTextProviders,
      initializedFromImageProviders
    });
  } else {
    const results = await Promise.all(
      providers.map((provider) => {
        return initializeProvider(kind, provider, options, config);
      })
    );
    providerResults.push(...results);

    builderRenderFunction = getBuilderRenderFunctionByProvider({
      kind,
      prefix: kind,
      providerInitializationResults: providerResults
    });
  }

  const compositeHistoryAssetSourceId = initializeHistoryCompositeAssetSource({
    kind,
    cesdk: options.cesdk,
    historAssetSourceIds: providerResults
      .map((result) => result.history?.assetSourceId)
      .filter(isDefined)
  });

  let compositeHistoryAssetLibraryEntryId: string | undefined;

  if (compositeHistoryAssetSourceId != null) {
    compositeHistoryAssetLibraryEntryId = compositeHistoryAssetSourceId;
    options.cesdk.ui.addAssetLibraryEntry({
      id: compositeHistoryAssetLibraryEntryId,
      sourceIds: [compositeHistoryAssetSourceId],
      sortBy: {
        sortKey: 'insertedAt',
        sortingOrder: 'Descending'
      },
      canRemove: true,
      gridItemHeight: 'square',
      gridBackgroundType: 'cover'
    });
  }

  return {
    panel: {
      builderRenderFunction
    },
    history: {
      assetSourceId: compositeHistoryAssetSourceId,
      assetLibraryEntryId: compositeHistoryAssetLibraryEntryId
    },
    providerInitializationResults: providerResults
  };
}

/**
 * Combines the render functions of the initialized providers into a single
 * render function that can be used in a panel. Will add select components
 * to switch between the different providers and input types.
 */
function getBuilderRenderFunctionByFromType<
  K extends OutputKind,
  I,
  O extends Output
>({
  kind,
  prefix,
  initializedFromTextProviders,
  initializedFromImageProviders
}: {
  kind: K;
  prefix: string;
  initializedFromTextProviders: ProviderInitializationResult<K, I, O>[];
  initializedFromImageProviders: ProviderInitializationResult<K, I, O>[];
}): BuilderRenderFunction<{}> {
  const includeFromSwitch =
    initializedFromTextProviders.length > 0 &&
    initializedFromImageProviders.length > 0;

  const builderRenderFunction: BuilderRenderFunction = (context) => {
    const { builder, experimental } = context;
    const inputTypeState = experimental.global<
      'fromText' | 'fromImage' | undefined
    >(`${prefix}.fromType`, includeFromSwitch ? 'fromText' : undefined);

    const providerInitializationResults: ProviderInitializationResult<
      K,
      I,
      O
    >[] = [];
    if (inputTypeState.value === 'fromText') {
      providerInitializationResults.push(...initializedFromTextProviders);
    } else if (inputTypeState.value === 'fromImage') {
      providerInitializationResults.push(...initializedFromImageProviders);
    } else {
      providerInitializationResults.push(
        ...initializedFromTextProviders,
        ...initializedFromImageProviders
      );
    }

    const providerValuesFromText: (SelectValue & {
      builderRenderFunction?: BuilderRenderFunction;
    })[] = initializedFromTextProviders.map(({ provider, panel }) => ({
      id: provider.id,
      label: provider.name ?? provider.id,
      builderRenderFunction: panel?.builderRenderFunction
    }));

    const providerValuesFromImage: (SelectValue & {
      builderRenderFunction?: BuilderRenderFunction;
    })[] = initializedFromImageProviders.map(({ provider, panel }) => ({
      id: provider.id,
      label: provider.name ?? provider.id,
      builderRenderFunction: panel?.builderRenderFunction
    }));

    const providerStateFromText = context.experimental.global(
      `${prefix}.selectedProvider.fromText`,
      providerValuesFromText[0]
    );
    const providerStateFromImage = context.experimental.global(
      `${prefix}.selectedProvider.fromImage`,
      providerValuesFromImage[0]
    );

    const providerState =
      inputTypeState.value === 'fromText'
        ? providerStateFromText
        : inputTypeState.value === 'fromImage'
        ? providerStateFromImage
        : undefined;

    if (includeFromSwitch || providerInitializationResults.length > 1) {
      builder.Section(`${prefix}.providerSelection.section`, {
        children: () => {
          // RENDER FROM SELECTION
          if (includeFromSwitch) {
            builder.ButtonGroup(`${prefix}.fromType.buttonGroup`, {
              inputLabel: createLabelArray(kind, 'fromType.label'),
              children: () => {
                builder.Button(`${prefix}.fromType.buttonGroup.fromText`, {
                  label: createLabelArray(kind, 'fromText.label'),
                  icon:
                    inputTypeState.value !== 'fromText' &&
                    isSomeProviderGenerating(
                      initializedFromTextProviders,
                      context
                    )
                      ? '@imgly/LoadingSpinner'
                      : undefined,
                  isActive: inputTypeState.value === 'fromText',
                  onClick: () => {
                    inputTypeState.setValue('fromText');
                  }
                });
                builder.Button(`${prefix}.fromType.buttonGroup.fromImage`, {
                  label: createLabelArray(kind, 'fromImage.label'),
                  icon:
                    inputTypeState.value !== 'fromImage' &&
                    isSomeProviderGenerating(
                      initializedFromImageProviders,
                      context
                    )
                      ? '@imgly/LoadingSpinner'
                      : undefined,
                  isActive: inputTypeState.value === 'fromImage',
                  onClick: () => {
                    inputTypeState.setValue('fromImage');
                  }
                });
              }
            });
          }

          // RENDER PROVIDER SELECT
          if (providerInitializationResults.length > 1) {
            const providerValues =
              inputTypeState.value === 'fromText'
                ? providerValuesFromText
                : inputTypeState.value === 'fromImage'
                ? providerValuesFromImage
                : [...providerValuesFromText, ...providerValuesFromImage];

            if (providerState != null) {
              builder.Select(`${prefix}.providerSelect.select`, {
                inputLabel: createLabelArray(kind, 'providerSelect.label'),
                values: providerValues,
                ...providerState
              });
            }
          }
        }
      });
    }

    // Render the provider content
    if (providerInitializationResults.length > 1) {
      providerState?.value.builderRenderFunction?.(context);
    } else {
      const providerInitializationResult = providerInitializationResults[0];
      if (providerInitializationResult) {
        providerInitializationResult.panel?.builderRenderFunction?.(context);
      }
    }
  };

  return builderRenderFunction;
}

/**
 * Combines the render functions of the initialized providers into a single
 * render function that can be used in a panel. Will add select components
 * to switch between the different providers and input types.
 */
function getBuilderRenderFunctionByProvider<
  K extends OutputKind,
  I,
  O extends Output
>({
  kind,
  prefix,
  providerInitializationResults
}: {
  kind: K;
  prefix: string;
  providerInitializationResults: ProviderInitializationResult<K, I, O>[];
}): BuilderRenderFunction<{}> {
  const builderRenderFunction: BuilderRenderFunction = (context) => {
    const { builder } = context;
    if (providerInitializationResults.length === 0) return;

    const providerValues: (SelectValue & {
      builderRenderFunction?: BuilderRenderFunction;
    })[] = providerInitializationResults.map(({ provider, panel }) => ({
      id: provider.id,
      label: provider.name ?? provider.id,
      builderRenderFunction: panel?.builderRenderFunction
    }));

    const providerState = context.state(
      `${prefix}.selectedProvider`,
      providerValues[0]
    );

    if (providerInitializationResults.length > 1) {
      if (providerState != null) {
        builder.Section(`${prefix}.providerSelection.section`, {
          children: () => {
            builder.Select(`${prefix}.providerSelect.select`, {
              inputLabel: createLabelArray(kind, 'providerSelect.label'),
              values: providerValues,
              ...providerState
            });
          }
        });
      }
    }

    // Render the provider content
    providerState.value.builderRenderFunction?.(context);
  };

  return builderRenderFunction;
}

/**
 * Queries the global state to check if any provider from the given
 * list is currently generating.
 */
function isSomeProviderGenerating<K extends OutputKind, I, O extends Output>(
  providerInitializationResults: ProviderInitializationResult<K, I, O>[],
  context: BuilderRenderFunctionContext<any>
): boolean {
  if (providerInitializationResults.length === 0) return false;
  return providerInitializationResults.some(({ provider }) => {
    if (provider.id == null) return false;
    return context.experimental.global(isGeneratingStateKey(provider.id), false)
      .value;
  });
}

export default initializeProviders;
