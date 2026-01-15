import { Icons } from '@imgly/plugin-utils';
import {
  CommonProviderConfiguration,
  getPanelId,
  type Provider,
  setDefaultTranslations} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.text2image.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { b64JsonToBlob } from './utils';
import {
  addStyleAssetSource,
  createStyleAssetSource,
  STYLES
} from './GptImage1.styles';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
};

type GptImage1Input = {
  prompt: string;
  style?: string;
  size: 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
  background: 'transparent' | 'opaque' | 'auto';
};

type GptImage1Output = {
  kind: 'image';
  url: string;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<GptImage1Input, GptImage1Output> {}

export function GptImage1(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Input, GptImage1Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GptImage1Input, GptImage1Output> {
  const modelKey = 'open-ai/gpt-image-1/text2image';
  const baseURL =
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/';
  const styleAssetSourceId = `${modelKey}/styles`;
  const styleAssetSource = createStyleAssetSource(styleAssetSourceId, {
    baseURL,
    includeNone: true
  });
  addStyleAssetSource(styleAssetSource, { cesdk });

  cesdk.ui.registerPanel<StyleSelectionPayload>(
    `${getPanelId(modelKey)}.styleSelection`,
    ({ builder, payload }) => {
      if (payload == null) return null;

      builder.Library(`${modelKey}.library.style`, {
        entries: [styleAssetSourceId],
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);
  setDefaultTranslations(cesdk, {
    en: {
      [`panel.${getPanelId(modelKey)}.styleSelection`]: 'Style Selection',
      [`panel.gpt-image-1.imageSelection`]: 'Select Image To Change'
    }
  });

  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: 'open-ai/gpt-image-1/text2image',
    kind: 'image',
    name: 'GPT Image 1',
    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: GptImage1Schema,
        inputReference: '#/components/schemas/GptImage1Input',
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-order-properties',
        renderCustomProperty: {
          style: ({ builder, state }, property) => {
            const styleState = state<{
              id: string;
              label: string;
            }>(
              'style',
              styleAssetSource.getAssetSelectValue(
                styleAssetSource.getActiveAssetIds()[0]
              ) ?? STYLES[0]
            );

            // Show the style library for the selected type.
            builder.Button(`${property.id}`, {
              inputLabel: [
                `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}`,
                `ly.img.plugin-ai-generation-web.property.${property.id}`,
                `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}`,
                `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
              ],
              icon: '@imgly/Appearance',
              trailingIcon: '@imgly/ChevronRight',
              label: styleState.value.label,
              labelAlignment: 'left',
              onClick: () => {
                const payload: StyleSelectionPayload = {
                  onSelect: async (asset) => {
                    const newValue = {
                      id: asset.id,
                      label: asset.label ?? asset.id
                    };

                    styleAssetSource.clearActiveAssets();
                    styleAssetSource.setAssetActive(asset.id);
                    styleState.setValue(newValue);

                    cesdk.ui.closePanel(
                      `${getPanelId(modelKey)}.styleSelection`
                    );
                  }
                };

                cesdk.ui.openPanel(`${getPanelId(modelKey)}.styleSelection`, {
                  payload
                });
              }
            });

            return () => {
              return {
                id: property.id,
                type: 'string',
                value:
                  styleState.value.id ?? styleAssetSource.getActiveAssetIds()[0]
              };
            };
          }
        },
        getBlockInput: (input) => {
          switch (input.size) {
            case 'auto':
              return Promise.resolve({ image: { width: 512, height: 512 } });
            case '1024x1024':
              return Promise.resolve({ image: { width: 1024, height: 1024 } });
            case '1536x1024':
              return Promise.resolve({ image: { width: 1536, height: 1024 } });
            case '1024x1536':
              return Promise.resolve({ image: { width: 1024, height: 1536 } });
            default: {
              throw new Error('Invalid image size');
            }
          }
        },
        userFlow: 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware: config.middlewares ?? config.middleware ?? [],
      generate: async (
        input: GptImage1Input,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const stylePrompt = STYLES.find((style) => style.id === input.style);
        let prompt = input.prompt;

        if (
          stylePrompt != null &&
          stylePrompt.id !== 'none' &&
          stylePrompt.prompt
        ) {
          prompt = `${prompt}, ${stylePrompt.prompt}`;
        }
        const hasGlobalAPIKey =
          cesdk.ui.experimental.hasGlobalStateValue('OPENAI_API_KEY');

        const baseUrl = hasGlobalAPIKey
          ? 'https://api.openai.com/v1'
          : config.proxyUrl;

        const response = await fetch(`${baseUrl}/images/generations`, {
          signal: abortSignal,
          method: 'POST',
          headers: hasGlobalAPIKey
            ? {
                Authorization: `Bearer ${cesdk.ui.experimental.getGlobalStateValue(
                  'OPENAI_API_KEY'
                )}`,
                'Content-Type': 'application/json',
                ...(config.headers ?? {})
              }
            : {
                'Content-Type': 'application/json',
                ...(config.headers ?? {})
              },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            n: 1,
            size: input.size,
            background: input.background
          })
        });
        const img = await response.json();

        const b64_json = img.data?.[0].b64_json;
        if (b64_json == null) {
          throw new Error('No image data returned');
        }

        const blob = b64JsonToBlob(b64_json, 'image/png');
        const imageUrl = URL.createObjectURL(blob);

        return {
          kind: 'image',
          url: imageUrl
        };
      }
    }
  };

  return provider;
}

export default getProvider;
