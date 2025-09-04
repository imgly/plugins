import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import {
  CommonProviderConfiguration,
  type Provider,
  getPanelId,
  createTranslationCallback
} from '@imgly/plugin-ai-generation-web';
import Recraft20bSchema from './Recraft20b.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import {
  STYLES_IMAGE,
  STYLES_VECTOR,
  STYLES_ICON,
  getImageDimensions,
  getStyleThumbnail,
  type StyleId
} from './Recraft20b.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

type Recraft20bOutput = {
  kind: 'image';
  url: string;
};

type Recraft20bInput = {
  prompt: string;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9'
    | { width: number; height: number };
  style?: StyleId;
  colors?: Array<{ r: number; g: number; b: number }>;
};

type GenerationType = 'image' | 'vector' | 'icon';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<Recraft20bInput, Recraft20bOutput> {
  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}

let imageStyleAssetSource: CustomAssetSource;
let vectorStyleAssetSource: CustomAssetSource;
let iconStyleAssetSource: CustomAssetSource;

export function Recraft20b(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Recraft20bInput, Recraft20bOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', Recraft20bInput, Recraft20bOutput> {
  const modelKey = 'fal-ai/recraft/v2/text-to-image';
  const styleImageAssetSourceId = `${modelKey}/styles/image`;
  const styleVectorAssetSourceId = `${modelKey}/styles/vector`;
  const styleIconAssetSourceId = `${modelKey}/styles/icon`;
  const baseURL =
    config.baseURL ??
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/recraft-v3/';

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  imageStyleAssetSource = new CustomAssetSource(
    styleImageAssetSourceId,
    STYLES_IMAGE.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id, baseURL)
    })),
    {
      translateLabel: createTranslationCallback(
        cesdk,
        modelKey,
        'style',
        'image'
      )
    }
  );
  vectorStyleAssetSource = new CustomAssetSource(
    styleVectorAssetSourceId,
    STYLES_VECTOR.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id, baseURL)
    })),
    {
      translateLabel: createTranslationCallback(
        cesdk,
        modelKey,
        'style',
        'image'
      )
    }
  );
  iconStyleAssetSource = new CustomAssetSource(
    styleIconAssetSourceId,
    STYLES_ICON.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id, baseURL)
    })),
    {
      translateLabel: createTranslationCallback(
        cesdk,
        modelKey,
        'style',
        'image'
      )
    }
  );

  imageStyleAssetSource.setAssetActive('realistic_image');
  vectorStyleAssetSource.setAssetActive('vector_illustration');
  iconStyleAssetSource.setAssetActive('icon/broken_line');

  cesdk.engine.asset.addSource(imageStyleAssetSource);
  cesdk.engine.asset.addSource(vectorStyleAssetSource);
  cesdk.engine.asset.addSource(iconStyleAssetSource);

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

  cesdk.ui.addAssetLibraryEntry({
    id: styleIconAssetSourceId,
    sourceIds: [styleIconAssetSourceId],
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
          : payload.generationType === 'vector'
          ? [styleVectorAssetSourceId]
          : [styleIconAssetSourceId];

      builder.Library(`${modelKey}.library.style`, {
        entries,
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  // Build default translations from constants
  const styleTranslations: Record<string, string> = {};

  // Add all image style translations
  STYLES_IMAGE.forEach(({ id, label }) => {
    styleTranslations[
      `ly.img.plugin-ai-image-generation-web.${modelKey}.property.style.${id}`
    ] = label;
  });

  // Add all vector style translations
  STYLES_VECTOR.forEach(({ id, label }) => {
    styleTranslations[
      `ly.img.plugin-ai-image-generation-web.${modelKey}.property.style.${id}`
    ] = label;
  });

  // Add all icon style translations
  STYLES_ICON.forEach(({ id, label }) => {
    styleTranslations[
      `ly.img.plugin-ai-image-generation-web.${modelKey}.property.style.${id}`
    ] = label;
  });

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${getPanelId('fal-ai/recraft/v2/text-to-image')}.styleSelection`]:
        'Style Selection',
      ...styleTranslations
    }
  });

  return createImageProvider(
    {
      modelKey,
      name: 'Recraft 20b',
      // @ts-ignore
      schema: Recraft20bSchema,
      inputReference: '#/components/schemas/Recraft20bInput',
      middleware: config.middlewares ?? config.middleware ?? [],
      headers: config.headers,
      userFlow: 'placeholder',
      renderCustomProperty: {
        style: ({ builder, state }, property) => {
          const typeState = state<GenerationType>('type', 'image');

          const styleImageState = state<{
            id: Recraft20bInput['style'];
            label: string;
          }>('style/image', {
            id: 'realistic_image',
            label: 'Realistic Image'
          });
          const styleVectorState = state<{
            id: Recraft20bInput['style'];
            label: string;
          }>('style/vector', {
            id: 'vector_illustration',
            label: 'Vector Illustration'
          });
          const styleIconState = state<{
            id: Recraft20bInput['style'];
            label: string;
          }>('style/icon', {
            id: 'icon/broken_line',
            label: 'Broken Line'
          });

          const styleState =
            typeState.value === 'image'
              ? styleImageState
              : typeState.value === 'vector'
              ? styleVectorState
              : styleIconState;

          builder.ButtonGroup(`${property.id}.type`, {
            inputLabel: [
              `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}.type`,
              `ly.img.plugin-ai-generation-web.property.${property.id}.type`,
              `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}.type`,
              `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.type`
            ],
            children: () => {
              builder.Button(`${property.id}.type.image`, {
                label: [
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}.type.image`,
                  `ly.img.plugin-ai-generation-web.property.${property.id}.type.image`,
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}.type.image`,
                  `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.type.image`
                ],
                isActive: typeState.value === 'image',
                onClick: () => typeState.setValue('image')
              });
              builder.Button(`${property.id}.type.vector`, {
                label: [
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}.type.vector`,
                  `ly.img.plugin-ai-generation-web.property.${property.id}.type.vector`,
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}.type.vector`,
                  `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.type.vector`
                ],
                isActive: typeState.value === 'vector',
                onClick: () => typeState.setValue('vector')
              });
              builder.Button(`${property.id}.type.icon`, {
                label: [
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}.type.icon`,
                  `ly.img.plugin-ai-generation-web.property.${property.id}.type.icon`,
                  `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}.type.icon`,
                  `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.type.icon`
                ],
                isActive: typeState.value === 'icon',
                onClick: () => typeState.setValue('icon')
              });
            }
          });

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
                  } else if (typeState.value === 'icon') {
                    iconStyleAssetSource.clearActiveAssets();
                    iconStyleAssetSource.setAssetActive(asset.id);
                    styleIconState.setValue(newValue);
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
