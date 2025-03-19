import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { type RecraftV3Input } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';
import recraftV3Schema from './schemas/recraft-v3.json';
import { getImageDimensions, isCustomImageSize } from '../utils';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import StyleAssetSource from './StyleAssetSource';
import { STYLES_IMAGE, STYLES_VECTOR } from './styles';
import createImageProvider from '../createImageProvider';

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
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
): Provider<'image', RecraftV3Input, RecraftV3Output> {
  const modelKey = 'fal-ai/recraft-v3';
  const styleImageAssetSourceId = `${modelKey}/styles/image`;
  const styleVectorAssetSourceId = `${modelKey}/styles/vector`;

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
    `${modelKey}.styleSelection`,
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
      'panel.fal-ai/recraft-v3.styleSelection': 'Style Selection',
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
      schema: recraftV3Schema,
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
                    imageStyleAssetSource.setActive(asset.id);
                    styleImageState.setValue(newValue);
                  } else if (typeState.value === 'vector') {
                    vectorStyleAssetSource.setActive(asset.id);
                    styleVectorState.setValue(newValue);
                  }

                  cesdk.ui.closePanel(`${modelKey}.styleSelection`);
                }
              };

              cesdk.ui.openPanel(`${modelKey}.styleSelection`, {
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
          input.image_size ?? 'square_hd'
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
