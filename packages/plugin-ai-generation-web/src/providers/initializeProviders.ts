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
      'ly.img.plugin-ai-generation-web.generate': 'Generate',
      'ly.img.plugin-ai-generation-web.defaults.fromType.label': 'Input',
      'ly.img.plugin-ai-generation-web.defaults.providerSelect.label':
        'Provider',
      'ly.img.plugin-ai-generation-web.defaults.fromText.label': 'Text',
      'ly.img.plugin-ai-generation-web.defaults.fromImage.label': 'Image'
    },
    de: {
      'ly.img.plugin-ai-generation-web.generate': 'Generieren',
      'ly.img.plugin-ai-generation-web.defaults.fromType.label': 'Eingabe',
      'ly.img.plugin-ai-generation-web.defaults.providerSelect.label':
        'Anbieter',
      'ly.img.plugin-ai-generation-web.defaults.fromText.label': 'Text',
      'ly.img.plugin-ai-generation-web.defaults.fromImage.label': 'Bild'
    }
  });

  let builderRenderFunction: BuilderRenderFunction | undefined;

  const providerResults: ProviderInitializationResult<K, I, O>[] = [];

  // Group provider initialization logs for cleaner console output
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`Initializing ${kind} generation providers`);
  }

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
      initializedFromImageProviders,
      cesdk
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
      providerInitializationResults: providerResults,
      cesdk
    });
  }

  // Close the console group
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.groupEnd();
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
  initializedFromImageProviders,
  cesdk
}: {
  kind: K;
  prefix: string;
  initializedFromTextProviders: ProviderInitializationResult<K, I, O>[];
  initializedFromImageProviders: ProviderInitializationResult<K, I, O>[];
  cesdk: CreativeEditorSDK;
}): BuilderRenderFunction<{}> {
  const includeFromSwitch =
    initializedFromTextProviders.length > 0 &&
    initializedFromImageProviders.length > 0;

  const builderRenderFunction: BuilderRenderFunction = (context) => {
    const { builder, experimental, engine } = context;

    // Check if text and image input are enabled via Feature API
    const textInputFeatureId = `ly.img.plugin-ai-${kind}-generation-web.fromText`;
    const isTextInputEnabled = cesdk.feature.isEnabled(textInputFeatureId, {
      engine
    });
    const imageInputFeatureId = `ly.img.plugin-ai-${kind}-generation-web.fromImage`;
    const isImageInputEnabled = cesdk.feature.isEnabled(imageInputFeatureId, {
      engine
    });

    // Determine default input type based on what's enabled
    let defaultInputType: 'fromText' | 'fromImage' | undefined;
    if (
      isTextInputEnabled &&
      initializedFromTextProviders.length > 0 &&
      (!isImageInputEnabled || initializedFromImageProviders.length === 0)
    ) {
      defaultInputType = 'fromText';
    } else if (
      isImageInputEnabled &&
      initializedFromImageProviders.length > 0 &&
      (!isTextInputEnabled || initializedFromTextProviders.length === 0)
    ) {
      defaultInputType = 'fromImage';
    } else if (isTextInputEnabled && isImageInputEnabled && includeFromSwitch) {
      defaultInputType = 'fromText';
    }

    const inputTypeState = experimental.global<
      'fromText' | 'fromImage' | undefined
    >(`${prefix}.fromType`, defaultInputType);

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

    // Store only the provider ID in global state (not the full object with label and render function)
    // This allows external code to change the selected provider by just setting the ID
    const providerIdStateFromText = context.experimental.global(
      `${prefix}.selectedProvider.fromText`,
      providerValuesFromText[0]?.id
    );
    const providerIdStateFromImage = context.experimental.global(
      `${prefix}.selectedProvider.fromImage`,
      providerValuesFromImage[0]?.id
    );

    // Derive the full provider value by looking up the ID in the values array
    const providerFromText =
      providerValuesFromText.find(
        (p) => p.id === providerIdStateFromText.value
      ) ?? providerValuesFromText[0];

    const providerFromImage =
      providerValuesFromImage.find(
        (p) => p.id === providerIdStateFromImage.value
      ) ?? providerValuesFromImage[0];

    const providerIdState =
      inputTypeState.value === 'fromText'
        ? providerIdStateFromText
        : inputTypeState.value === 'fromImage'
        ? providerIdStateFromImage
        : undefined;

    const providerValue =
      inputTypeState.value === 'fromText'
        ? providerFromText
        : inputTypeState.value === 'fromImage'
        ? providerFromImage
        : undefined;

    // Check if provider selector is enabled via Feature API
    const providerFeatureId = `ly.img.plugin-ai-${kind}-generation-web.providerSelect`;
    const isProviderSelectorEnabled = cesdk.feature.isEnabled(
      providerFeatureId,
      { engine }
    );

    // Check if neither text nor image input is enabled
    if (!isTextInputEnabled && !isImageInputEnabled) {
      builder.Section(`${prefix}.noInputWarning.section`, {
        children: () => {
          builder.Text(`${prefix}.noInputWarning.text`, {
            content:
              'No input types are enabled. Please enable at least one input type (text or image) via the Feature API.'
          });
        }
      });
      return; // Exit early, don't render anything else
    }

    // Determine if we need to show the input selector
    // Only show if both types are enabled AND both have providers
    const bothInputsEnabled =
      isTextInputEnabled &&
      isImageInputEnabled &&
      initializedFromTextProviders.length > 0 &&
      initializedFromImageProviders.length > 0;
    const shouldShowInputSelector = includeFromSwitch && bothInputsEnabled;
    const shouldShowProviderSelector =
      providerInitializationResults.length > 1 && isProviderSelectorEnabled;

    if (shouldShowInputSelector || shouldShowProviderSelector) {
      builder.Section(`${prefix}.providerSelection.section`, {
        children: () => {
          // RENDER FROM SELECTION - only if both input types are enabled
          if (shouldShowInputSelector) {
            builder.ButtonGroup(`${prefix}.fromType.buttonGroup`, {
              inputLabel: createLabelArray(kind, 'fromType.label'),
              children: () => {
                if (
                  isTextInputEnabled &&
                  initializedFromTextProviders.length > 0
                ) {
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
                }

                if (
                  isImageInputEnabled &&
                  initializedFromImageProviders.length > 0
                ) {
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
              }
            });
          }

          // RENDER PROVIDER SELECT
          if (shouldShowProviderSelector) {
            const providerValues =
              inputTypeState.value === 'fromText'
                ? providerValuesFromText
                : inputTypeState.value === 'fromImage'
                ? providerValuesFromImage
                : [...providerValuesFromText, ...providerValuesFromImage];

            if (providerIdState != null && providerValue != null) {
              builder.Select(`${prefix}.providerSelect.select`, {
                inputLabel: createLabelArray(kind, 'providerSelect.label'),
                values: providerValues,
                value: providerValue,
                setValue: (newValue: SelectValue) => {
                  providerIdState.setValue(newValue.id);
                }
              });
            }
          }
        }
      });
    }

    // Render the provider content
    if (providerInitializationResults.length > 1) {
      providerValue?.builderRenderFunction?.(context);
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
  providerInitializationResults,
  cesdk
}: {
  kind: K;
  prefix: string;
  providerInitializationResults: ProviderInitializationResult<K, I, O>[];
  cesdk: CreativeEditorSDK;
}): BuilderRenderFunction<{}> {
  const builderRenderFunction: BuilderRenderFunction = (context) => {
    const { builder, engine } = context;
    if (providerInitializationResults.length === 0) return;

    // Check if provider selector is enabled via Feature API
    // Audio plugin has special cases for speech and sound providers
    let providerFeatureId = `ly.img.plugin-ai-${kind}-generation-web.providerSelect`;
    // For audio, we check prefix to determine if it's speech or sound
    if (kind === 'audio' && prefix) {
      if (prefix.includes('speech')) {
        providerFeatureId = `ly.img.plugin-ai-audio-generation-web.speech.providerSelect`;
      } else if (prefix.includes('sound')) {
        providerFeatureId = `ly.img.plugin-ai-audio-generation-web.sound.providerSelect`;
      }
    }
    const isProviderSelectorEnabled = cesdk.feature.isEnabled(
      providerFeatureId,
      { engine }
    );

    const providerValues: (SelectValue & {
      builderRenderFunction?: BuilderRenderFunction;
    })[] = providerInitializationResults.map(({ provider, panel }) => ({
      id: provider.id,
      label: provider.name ?? provider.id,
      builderRenderFunction: panel?.builderRenderFunction
    }));

    // Store only the provider ID in state (not the full object with label and render function)
    // This allows external code to change the selected provider by just setting the ID
    const providerIdState = context.state(
      `${prefix}.selectedProvider`,
      providerValues[0]?.id
    );

    // Derive the full provider value by looking up the ID in the values array
    const providerValue =
      providerValues.find((p) => p.id === providerIdState.value) ??
      providerValues[0];

    if (providerInitializationResults.length > 1 && isProviderSelectorEnabled) {
      if (providerIdState != null && providerValue != null) {
        builder.Section(`${prefix}.providerSelection.section`, {
          children: () => {
            builder.Select(`${prefix}.providerSelect.select`, {
              inputLabel: createLabelArray(kind, 'providerSelect.label'),
              values: providerValues,
              value: providerValue,
              setValue: (newValue: SelectValue) => {
                providerIdState.setValue(newValue.id);
              }
            });
          }
        });
      }
    }

    // Render the provider content
    providerValue?.builderRenderFunction?.(context);
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
