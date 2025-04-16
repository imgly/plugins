import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import { type Provider, getPanelId } from '@imgly/plugin-ai-generation-web';
import { type RecraftV3Input } from '@fal-ai/client/endpoints';
import RecraftV3Schema from './RecraftV3.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import {
  STYLES_IMAGE,
  STYLES_VECTOR,
  getImageDimensions,
  getStyleThumbnail
} from './RecraftV3.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

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

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

let imageStyleAssetSource: CustomAssetSource;
let vectorStyleAssetSource: CustomAssetSource;

export function RecraftV3(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', RecraftV3Input, RecraftV3Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', RecraftV3Input, RecraftV3Output> {
  const modelKey = 'fal-ai/recraft-v3';
  const styleImageAssetSourceId = `${modelKey}/styles/image`;
  const styleVectorAssetSourceId = `${modelKey}/styles/vector`;

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  imageStyleAssetSource = new CustomAssetSource(
    styleImageAssetSourceId,
    STYLES_IMAGE.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id)
    }))
  );
  vectorStyleAssetSource = new CustomAssetSource(
    styleVectorAssetSourceId,
    STYLES_VECTOR.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id)
    }))
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
    `${getPanelId(modelKey)}.styleSelection`,
    ({ builder, payload }) => {
      if (payload == null) return null;

      const entries =
        payload.generationType === 'image'
          ? [styleImageAssetSourceId]
          : [styleVectorAssetSourceId];

      builder.Library(`${modelKey}.library.style`, {
        entries,
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${getPanelId('fal-ai/recraft-v3')}.styleSelection`]:
        'Style Selection',
      [`${modelKey}.style`]: 'Style',
      [`${modelKey}.style.type`]: 'Type',
      [`${modelKey}.style.type.image`]: 'Image',
      [`${modelKey}.style.type.vector`]: 'Vector'
    }
  });

  return createImageProvider(
    {
      modelKey,
      // @ts-ignore
      schema: RecraftV3Schema,
      inputReference: '#/components/schemas/RecraftV3Input',
      userFlow: 'placeholder',
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
            inputLabel: `${modelKey}.${property.id}.type`,
            children: () => {
              builder.Button(`${property.id}.type.image`, {
                label: `${modelKey}.${property.id}.type.image`,
                isActive: typeState.value === 'image',
                onClick: () => typeState.setValue('image')
              });
              builder.Button(`${property.id}.type.vector`, {
                label: `${modelKey}.${property.id}.type.vector`,
                isActive: typeState.value === 'vector',
                onClick: () => typeState.setValue('vector')
              });
            }
          });

          // Show the style library for the selected type.
          builder.Button(`${property.id}`, {
            inputLabel: `${modelKey}.${property.id}`,
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
                    imageStyleAssetSource.clearActiveAssets();
                    imageStyleAssetSource.setAssetActive(asset.id);
                    styleImageState.setValue(newValue);
                  } else if (typeState.value === 'vector') {
                    vectorStyleAssetSource.clearActiveAssets();
                    vectorStyleAssetSource.setAssetActive(asset.id);
                    styleVectorState.setValue(newValue);
                  }

                  cesdk.ui.closePanel(`${getPanelId(modelKey)}.styleSelection`);
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
              value: styleState.value.id ?? 'realistic_image'
            };
          };
        }
      },
      getBlockInput: (input) => {
        if (isCustomImageSize(input.image_size)) {
          return Promise.resolve({
            image: {
              width: input.image_size.width ?? 512,
              height: input.image_size.height ?? 512
            }
          });
        }

        const imageDimension = getImageDimensions(
          (input.image_size as string) ?? 'square_hd'
        );

        return Promise.resolve({
          image: imageDimension
        });
      }
    },
    config
  );
}

export default getProvider;
