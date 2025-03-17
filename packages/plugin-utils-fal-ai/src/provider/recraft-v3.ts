import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { fal } from '@fal-ai/client';
import { type RecraftV3Input } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';

import recraftV3Schema from './schemas/recraft-v3.json';
import { getImageDimensions, isCustomImageSize } from '../utils';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import StyleAssetSource from './StyleAssetSource';
import { STYLES_IMAGE, STYLES_VECTOR } from './styles';

type RecraftV3Output = {
  kind: 'image';
  url: string;
};

export type StyleId = Extract<RecraftV3Input['style'], string>;

type GenerationType = 'image' | 'vector';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

let imageStyleAssetSource: StyleAssetSource;
let vectorStyleAssetSource: StyleAssetSource;

function getProvider(
  config: PluginConfiguration,
  cesdk: CreativeEditorSDK
): Provider<'image', RecraftV3Input, RecraftV3Output> {
  const providerId = 'fal-ai/recraft-v3';
  const styleImageAssetSourceId = `${providerId}/styles/image`;
  const styleVectorAssetSourceId = `${providerId}/styles/vector`;

  imageStyleAssetSource = new StyleAssetSource(
    styleImageAssetSourceId,
    STYLES_IMAGE
  );
  vectorStyleAssetSource = new StyleAssetSource(
    styleVectorAssetSourceId,
    STYLES_VECTOR
  );

  cesdk.engine.asset.addSource(imageStyleAssetSource);
  cesdk.engine.asset.addSource(vectorStyleAssetSource);

  cesdk.ui.addAssetLibraryEntry({
    id: styleImageAssetSourceId,
    sourceIds: [styleImageAssetSourceId],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });

  cesdk.ui.addAssetLibraryEntry({
    id: styleVectorAssetSourceId,
    sourceIds: [styleVectorAssetSourceId],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });

  cesdk.ui.registerPanel<StyleSelectionPayload>(
    `${providerId}.styleSelection`,
    ({ builder, payload }) => {
      if (payload == null) return null;

      const entries =
        payload.generationType === 'image'
          ? [styleImageAssetSourceId]
          : [styleVectorAssetSourceId];

      builder.Library(`${providerId}.library.style`, {
        entries,
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.i18n.setTranslations({
    en: {
      'panel.fal-ai/recraft-v3.styleSelection': 'Style Selection',
      [`${providerId}.style`]: 'Style',
      [`${providerId}.style.type`]: 'Type',
      [`${providerId}.style.type.image`]: 'Image',
      [`${providerId}.style.type.vector`]: 'Vector',

    }
  });

  const provider: Provider<'image', RecraftV3Input, RecraftV3Output> = {
    id: providerId,
    kind: 'image',

    initialize: async () => {
      fal.config({
        proxyUrl: config.proxyUrl
      });
    },

    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: recraftV3Schema,
        inputReference: '#/components/schemas/RecraftV3Input',
        renderCustomProperty: {
          style: ({ builder, state }, property) => {
            const typeState = state<GenerationType>('type', 'image');

            const styleImageState = state<{
              id: RecraftV3Input['style'];
              label: string;
            }>('style/image', {
              id: 'realistic_image',
              label: 'Realistic Image'
            });
            const styleVectorState = state<{
              id: RecraftV3Input['style'];
              label: string;
            }>('style/vector', {
              id: 'vector_illustration',
              label: 'Vector Illustration'
            });

            const styleState =
              typeState.value === 'image' ? styleImageState : styleVectorState;

            builder.ButtonGroup(`${property.id}.type`, {
              inputLabel: `${providerId}.${property.id}.type`,
              children: () => {
                builder.Button(`${property.id}.type.image`, {
                  label: `${providerId}.${property.id}.type.image`,
                  isActive: typeState.value === 'image',
                  onClick: () => typeState.setValue('image')
                });
                builder.Button(`${property.id}.type.vector`, {
                  label: `${providerId}.${property.id}.type.vector`,
                  isActive: typeState.value === 'vector',
                  onClick: () => typeState.setValue('vector')
                });
              }
            });

            // Show the style library for the selected type.
            builder.Button(`${property.id}`, {
              inputLabel: `${providerId}.${property.id}`,
              icon: '@imgly/Appearance',
              trailingIcon: '@imgly/ChevronRight',
              label: styleState.value.label,
              labelAlignment: 'left',
              onClick: () => {
                const payload: StyleSelectionPayload = {
                  generationType: typeState.value,
                  onSelect: async (asset) => {
                    if (asset.id === 'back') {
                      return;
                    }

                    const newValue: { id: StyleId; label: string } = {
                      id: asset.id as StyleId,
                      label: asset.label ?? asset.id
                    };

                    if (typeState.value === 'image') {
                      imageStyleAssetSource.setActive(asset.id);
                      styleImageState.setValue(newValue);
                    } else if (typeState.value === 'vector') {
                      vectorStyleAssetSource.setActive(asset.id);
                      styleVectorState.setValue(newValue);
                    }

                    cesdk.ui.closePanel(`${providerId}.styleSelection`);
                  }
                };

                cesdk.ui.openPanel(`${providerId}.styleSelection`, {
                  payload
                });
              }
            });

            return () => {
              return {
                id: property.id,
                type: 'string',
                value: styleState.value.id ?? 'square_hd'
              };
            };
          }
        },
        createInputByKind: (input) => {
          if (isCustomImageSize(input.image_size)) {
            return {
              image: {
                width: input.image_size.width ?? 512,
                height: input.image_size.height ?? 512
              }
            };
          }

          const imageDimension = getImageDimensions(
            input.image_size ?? 'square_hd'
          );

          return {
            image: imageDimension
          };
        },
        includeHistoryLibrary: true,
        userFlow: 'placeholder',
        orderExtensionKeyword: 'x-fal-order-properties'
      }
    },

    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      generate: async (input, { abortSignal }) => {
        const response = await fal.subscribe('fal-ai/recraft-v3', {
          abortSignal,
          input,
          logs: true
        });
        const images = response?.data?.images;
        if (images != null && Array.isArray(images)) {
          const image = images[0];
          const url = image?.url;
          if (url != null)
            return {
              kind: 'image',
              url
            };
        }

        throw new Error('No image generated');
      }
    }
  };

  return provider;
}

const ImageSizeEnumToSize: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 1024, height: 1365 },
  portrait_16_9: { width: 1024, height: 1820 },
  landscape_4_3: { width: 1365, height: 1024 },
  landscape_16_9: { width: 1820, height: 1024 }
};

export default getProvider;
