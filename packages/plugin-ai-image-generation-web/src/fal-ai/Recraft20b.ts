import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import {
  type Provider,
  getPanelId,
  createTranslationCallback,
  normalizeBaseURL,
  setDefaultTranslations
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
import type { Recraft20bConfiguration } from './recraftTypes';
import {
  initializeStyleAssetSourceRecraft20b,
  resolveStyleDefaultRecraft20b
} from './recraftUtils';

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
  style?: string; // Use string to match schema
  colors?: Array<{ r: number; g: number; b: number }>;
};

type GenerationType = 'image' | 'vector' | 'icon';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

// Using Recraft20bConfiguration from recraftTypes which extends CommonProviderConfiguration
// with property configuration support and extended context for style property

let imageStyleAssetSource: CustomAssetSource;
let vectorStyleAssetSource: CustomAssetSource;
let iconStyleAssetSource: CustomAssetSource;

export function Recraft20b(
  config: Recraft20bConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Recraft20bInput, Recraft20bOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: Recraft20bConfiguration
): Provider<'image', Recraft20bInput, Recraft20bOutput> {
  const modelKey = 'fal-ai/recraft/v2/text-to-image';
  const styleImageAssetSourceId = `${modelKey}/styles/image`;
  const styleVectorAssetSourceId = `${modelKey}/styles/vector`;
  const styleIconAssetSourceId = `${modelKey}/styles/icon`;
  // Normalize baseURL to ensure exactly one trailing slash
  const baseURL = normalizeBaseURL(
    config.baseURL ??
      'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/recraft-v3/'
  );

  // Initialize feature flags for style groups
  cesdk.feature.enable(
    `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
    true
  );
  cesdk.feature.enable(
    `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
    true
  );
  cesdk.feature.enable(
    `ly.img.plugin-ai-image-generation-web.${modelKey}.style.icon`,
    true
  );

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  // Initialize style asset sources with property configuration support
  imageStyleAssetSource = initializeStyleAssetSourceRecraft20b(
    cesdk,
    config,
    'image',
    STYLES_IMAGE,
    styleImageAssetSourceId,
    (id) => getStyleThumbnail(id as StyleId, baseURL) ?? '',
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );

  vectorStyleAssetSource = initializeStyleAssetSourceRecraft20b(
    cesdk,
    config,
    'vector',
    STYLES_VECTOR,
    styleVectorAssetSourceId,
    (id) => getStyleThumbnail(id as StyleId, baseURL) ?? '',
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );

  iconStyleAssetSource = initializeStyleAssetSourceRecraft20b(
    cesdk,
    config,
    'icon',
    STYLES_ICON,
    styleIconAssetSourceId,
    (id) => getStyleThumbnail(id as StyleId, baseURL) ?? '',
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );

  // Assets are automatically set as active (first asset) in CustomAssetSource constructor
  // Get initial values from asset sources with proper translation
  const initialImageStyle = imageStyleAssetSource.getActiveSelectValue();
  const initialVectorStyle = vectorStyleAssetSource.getActiveSelectValue();
  const initialIconStyle = iconStyleAssetSource.getActiveSelectValue();

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

  setDefaultTranslations(cesdk, {
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
        style: ({ builder, state, engine }, property) => {
          // Check which style groups are enabled
          const isImageStyleEnabled = cesdk.feature.isEnabled(
            `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
            { engine }
          );
          const isVectorStyleEnabled = cesdk.feature.isEnabled(
            `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
            { engine }
          );
          const isIconStyleEnabled = cesdk.feature.isEnabled(
            `ly.img.plugin-ai-image-generation-web.${modelKey}.style.icon`,
            { engine }
          );

          // If no style groups are enabled, return 'any'
          if (
            !isImageStyleEnabled &&
            !isVectorStyleEnabled &&
            !isIconStyleEnabled
          ) {
            return () => ({
              id: property.id,
              type: 'string',
              value: 'any'
            });
          }

          // Resolve default styles from provider configuration
          const resolvedImageDefault = resolveStyleDefaultRecraft20b(
            config,
            cesdk,
            'image'
          );
          const resolvedVectorDefault = resolveStyleDefaultRecraft20b(
            config,
            cesdk,
            'vector'
          );
          const resolvedIconDefault = resolveStyleDefaultRecraft20b(
            config,
            cesdk,
            'icon'
          );

          // Determine default type based on resolved defaults
          let defaultType: GenerationType = 'image';
          if (resolvedVectorDefault) {
            defaultType = 'vector';
          } else if (resolvedIconDefault) {
            defaultType = 'icon';
          } else if (!resolvedImageDefault) {
            // No specific default, use first enabled type
            defaultType = isImageStyleEnabled
              ? 'image'
              : isVectorStyleEnabled
              ? 'vector'
              : 'icon';
          }

          const typeState = state<GenerationType>('type', defaultType);

          // Use resolved defaults or fall back to initial values from asset sources
          const styleImageState = state<Recraft20bInput['style']>(
            'style/image',
            resolvedImageDefault ||
              (initialImageStyle
                ? (initialImageStyle.id as Recraft20bInput['style'])
                : 'realistic_image')
          );
          const styleVectorState = state<Recraft20bInput['style']>(
            'style/vector',
            resolvedVectorDefault ||
              (initialVectorStyle
                ? (initialVectorStyle.id as Recraft20bInput['style'])
                : 'vector_illustration')
          );
          const styleIconState = state<Recraft20bInput['style']>(
            'style/icon',
            resolvedIconDefault ||
              (initialIconStyle
                ? (initialIconStyle.id as Recraft20bInput['style'])
                : 'icon/broken_line')
          );

          const styleState =
            typeState.value === 'image'
              ? styleImageState
              : typeState.value === 'vector'
              ? styleVectorState
              : styleIconState;

          // Count how many style groups are enabled
          const enabledCount = [
            isImageStyleEnabled,
            isVectorStyleEnabled,
            isIconStyleEnabled
          ].filter(Boolean).length;

          // Only show button group if more than one style type is enabled
          if (enabledCount > 1) {
            builder.ButtonGroup(`${property.id}.type`, {
              inputLabel: [
                `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${property.id}.type`,
                `ly.img.plugin-ai-generation-web.property.${property.id}.type`,
                `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${property.id}.type`,
                `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.type`
              ],
              children: () => {
                if (isImageStyleEnabled) {
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
                }
                if (isVectorStyleEnabled) {
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
                }
                if (isIconStyleEnabled) {
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
              }
            });
          }

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
            label: (() => {
              const currentStyleId = styleState.value || 'realistic_image';
              const assetSource =
                typeState.value === 'image'
                  ? imageStyleAssetSource
                  : typeState.value === 'vector'
                  ? vectorStyleAssetSource
                  : iconStyleAssetSource;
              return (
                assetSource.getTranslatedLabel(currentStyleId) || currentStyleId
              );
            })(),
            labelAlignment: 'left',
            onClick: () => {
              // Only allow selection for enabled style types
              let effectiveType = typeState.value;
              if (typeState.value === 'image' && !isImageStyleEnabled) {
                effectiveType = isVectorStyleEnabled ? 'vector' : 'icon';
              } else if (
                typeState.value === 'vector' &&
                !isVectorStyleEnabled
              ) {
                effectiveType = isImageStyleEnabled ? 'image' : 'icon';
              } else if (typeState.value === 'icon' && !isIconStyleEnabled) {
                effectiveType = isImageStyleEnabled ? 'image' : 'vector';
              }

              const payload: StyleSelectionPayload = {
                generationType: effectiveType,
                onSelect: async (asset) => {
                  if (asset.id === 'back') {
                    return;
                  }

                  const styleId = asset.id as StyleId;

                  if (effectiveType === 'image') {
                    imageStyleAssetSource.clearActiveAssets();
                    imageStyleAssetSource.setAssetActive(asset.id);
                    styleImageState.setValue(styleId);
                  } else if (effectiveType === 'vector') {
                    vectorStyleAssetSource.clearActiveAssets();
                    vectorStyleAssetSource.setAssetActive(asset.id);
                    styleVectorState.setValue(styleId);
                  } else if (effectiveType === 'icon') {
                    iconStyleAssetSource.clearActiveAssets();
                    iconStyleAssetSource.setAssetActive(asset.id);
                    styleIconState.setValue(styleId);
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
              value: styleState.value ?? 'realistic_image'
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
