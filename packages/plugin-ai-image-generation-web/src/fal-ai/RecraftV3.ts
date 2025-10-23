import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import {
  type Provider,
  getPanelId,
  createTranslationCallback
} from '@imgly/plugin-ai-generation-web';
import { type RecraftV3TextToImageInput } from '@fal-ai/client/endpoints';
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
import type { RecraftV3Configuration } from './recraftTypes';
import { initializeStyleAssetSourceV3 } from './recraftUtils';

type RecraftV3Output = {
  kind: 'image';
  url: string;
};

export type StyleId = Extract<RecraftV3TextToImageInput['style'], string>;

type GenerationType = 'image' | 'vector';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

// Using RecraftV3Configuration from recraftTypes which extends CommonProviderConfiguration
// with property configuration support and extended context for style property

let imageStyleAssetSource: CustomAssetSource;
let vectorStyleAssetSource: CustomAssetSource;

export function RecraftV3(
  config: RecraftV3Configuration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', RecraftV3TextToImageInput, RecraftV3Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: RecraftV3Configuration
): Provider<'image', RecraftV3TextToImageInput, RecraftV3Output> {
  const modelKey = 'fal-ai/recraft-v3';
  const styleImageAssetSourceId = `${modelKey}/styles/image`;
  const styleVectorAssetSourceId = `${modelKey}/styles/vector`;
  const baseURL =
    config.baseURL ??
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/recraft-v3/';

  // Initialize feature flags for style groups
  cesdk.feature.enable(
    `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
    true
  );
  cesdk.feature.enable(
    `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
    true
  );

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  // Initialize style asset sources with property configuration support
  imageStyleAssetSource = initializeStyleAssetSourceV3(
    cesdk,
    config,
    'image',
    STYLES_IMAGE,
    styleImageAssetSourceId,
    (id) => getStyleThumbnail(id as StyleId, baseURL) ?? '',
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );

  vectorStyleAssetSource = initializeStyleAssetSourceV3(
    cesdk,
    config,
    'vector',
    STYLES_VECTOR,
    styleVectorAssetSourceId,
    (id) => getStyleThumbnail(id as StyleId, baseURL) ?? '',
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );

  // Assets are automatically set as active (first asset) in CustomAssetSource constructor
  // Get initial values from asset sources with proper translation
  const initialImageStyle = imageStyleAssetSource.getActiveSelectValue();
  const initialVectorStyle = vectorStyleAssetSource.getActiveSelectValue();

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

  // All translations (panel, library, and property) are now loaded from translations.json
  // No runtime translation code needed here!

  return createImageProvider(
    {
      modelKey,
      name: 'Recraft V3',
      // @ts-ignore
      schema: RecraftV3Schema,
      inputReference: '#/components/schemas/RecraftV3Input',
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

          // If no style groups are enabled, return 'any'
          if (!isImageStyleEnabled && !isVectorStyleEnabled) {
            return () => ({
              id: property.id,
              type: 'string',
              value: 'any'
            });
          }

          // Get all available styles to determine type from configured default
          const allImageStyles = STYLES_IMAGE.map((s) => s.id);
          const allVectorStyles = STYLES_VECTOR.map((s) => s.id);

          // Check if there's a configured default style
          const configuredStyleDefault = config.properties?.style?.default;
          let inferredTypeFromDefault: GenerationType | null = null;

          if (configuredStyleDefault) {
            const resolvedDefault =
              typeof configuredStyleDefault === 'string'
                ? configuredStyleDefault
                : null; // For now, just handle static defaults for type inference

            if (resolvedDefault) {
              if (allImageStyles.includes(resolvedDefault)) {
                inferredTypeFromDefault = 'image';
              } else if (allVectorStyles.includes(resolvedDefault)) {
                inferredTypeFromDefault = 'vector';
              }
            }
          }

          // Determine default type based on configured default or what's enabled
          const defaultType =
            inferredTypeFromDefault ??
            (isImageStyleEnabled ? 'image' : 'vector');
          const typeState = state<GenerationType>('type', defaultType);

          const styleImageState = state<RecraftV3TextToImageInput['style']>(
            'style/image',
            initialImageStyle
              ? (initialImageStyle.id as RecraftV3TextToImageInput['style'])
              : 'realistic_image'
          );
          const styleVectorState = state<RecraftV3TextToImageInput['style']>(
            'style/vector',
            initialVectorStyle
              ? (initialVectorStyle.id as RecraftV3TextToImageInput['style'])
              : 'vector_illustration'
          );

          const styleState =
            typeState.value === 'image' ? styleImageState : styleVectorState;

          // Only show button group if both style types are enabled
          if (isImageStyleEnabled && isVectorStyleEnabled) {
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
                  : vectorStyleAssetSource;
              return (
                assetSource.getTranslatedLabel(currentStyleId) || currentStyleId
              );
            })(),
            labelAlignment: 'left',
            onClick: () => {
              // Only allow selection for enabled style types
              let effectiveType = typeState.value;
              if (typeState.value === 'image' && !isImageStyleEnabled) {
                effectiveType = 'vector';
              } else if (
                typeState.value === 'vector' &&
                !isVectorStyleEnabled
              ) {
                effectiveType = 'image';
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
