import { fal } from '@fal-ai/client';
import { PluginConfiguration, Provider } from '../../types';
import { RecraftV3Input } from '@fal-ai/client/endpoints';
import { DEFAULT_PROMPT } from '../../constants';
import {
  STYLE_IMAGE_DEFAULT,
  STYLE_VECTOR_DEFAULT,
  StyleId,
  STYLES_IMAGE,
  STYLES_VECTOR
} from './styles';
import {
  IMAGE_SIZE_VALUES,
  ImageSize,
  getImageDimensions,
  getImageSizeIcon
} from './imageSize';
import { AssetResult } from '@cesdk/cesdk-js';
import StyleAssetSource from './StyleAssetSource';

type Model = 'fal-ai/recraft-v3';

type GenerationType = 'image' | 'vector';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

export interface FalAiProviderConfiguration {
  type: 'fal.ai';
  /**
   * The URL of the proxy server that forwards requests to the AI model.
   */
  proxyUrl?: string;
  /**
   * The model to use for image generation.
   */
  model: Model;
}

let imageStyleAssetSource: StyleAssetSource;
let vectorStyleAssetSource: StyleAssetSource;

const provider: Provider<RecraftV3Input> = {
  id: ({ config }) => {
    return getProviderId(config);
  },

  initialize: async ({ config, cesdk, engine }) => {
    if (config?.provider?.type !== 'fal.ai') {
      throw new Error(
        `Invalid provider type: Should be 'fal.ai', but is '${config?.provider?.type}'`
      );
    }
    const providerId = getProviderId(config);
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

    engine.asset.addSource(imageStyleAssetSource);
    engine.asset.addSource(vectorStyleAssetSource);
    if (cesdk != null) {
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
        `${getProviderId(config)}.styleSelection`,
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
    }

    imageStyleAssetSource.setActive(STYLE_IMAGE_DEFAULT.id);
    vectorStyleAssetSource.setActive(STYLE_VECTOR_DEFAULT.id);

    fal.config({
      proxyUrl: config.provider.proxyUrl
    });
  },

  generate: async (input, { config }): Promise<string> => {
    if (config?.provider?.type !== 'fal.ai') {
      throw new Error(
        `Invalid provider type: Should be 'fal.ai', but is '${config?.provider?.type}'`
      );
    }

    return generate(config.provider.model, input);
  },

  renderPanel: ({ builder, state }, { config, cesdk }) => {
    const providerId = getProviderId(config);
    const panelId = `panel.${providerId}`;

    const promptState = state('prompt', config.defaultPrompt ?? DEFAULT_PROMPT);
    const typeState = state<GenerationType>('type', 'image');

    const styleImageState = state<{
      id: RecraftV3Input['style'];
      label: string;
    }>('style/image', STYLE_IMAGE_DEFAULT);
    const styleVectorState = state<{
      id: RecraftV3Input['style'];
      label: string;
    }>('style/vector', STYLE_VECTOR_DEFAULT);
    const imageSizeState = state<{
      id: ImageSize;
      label: string | string[];
      icon?: string;
    }>('image_size', IMAGE_SIZE_VALUES[0]);
    const customWidthState = state<number>('width', 1024);
    const customHeightState = state<number>('height', 1024);

    const styleState =
      typeState.value === 'image' ? styleImageState : styleVectorState;

    builder.Section(`${providerId}.input.section`, {
      children: () => {
        builder.TextArea(`${providerId}.prompt`, {
          inputLabel: `${panelId}.prompt`,
          ...promptState
        });

        builder.ButtonGroup(`${providerId}.type`, {
          inputLabel: `${panelId}.type`,
          children: () => {
            builder.Button(`${providerId}.type.image`, {
              label: `${panelId}.type.image`,
              isActive: typeState.value === 'image',
              onClick: () => typeState.setValue('image')
            });
            builder.Button(`${providerId}.type.vector`, {
              label: `${panelId}.type.vector`,
              isActive: typeState.value === 'vector',
              onClick: () => typeState.setValue('vector')
            });
          }
        });

        // Show the style library for the selected type.
        builder.Button(`${providerId}.style`, {
          inputLabel: `${panelId}.style`,
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

        builder.Select(`${providerId}.image_size`, {
          inputLabel: `${panelId}.format`,
          value: {
            ...imageSizeState.value,
            icon: getImageSizeIcon(imageSizeState.value.id)
          },
          setValue: ({ id, label }) => {
            const imageSize = id as ImageSize;
            imageSizeState.setValue({ id: imageSize, label });
          },
          values: Array.from(IMAGE_SIZE_VALUES).map(({ id, label }) => ({
            id,
            label,
            icon: getImageSizeIcon(id)
          }))
        });

        if (imageSizeState.value.id === 'custom') {
          builder.NumberInput(`${providerId}.image_size.custom.width`, {
            inputLabel: 'Width',
            ...customWidthState
          });

          builder.NumberInput(`${providerId}.image_size.custom.height`, {
            inputLabel: 'Height',
            ...customHeightState
          });
        }
      }
    });

    const recraftInput: () => {
      input: RecraftV3Input;
      imageSize: { width: number; height: number };
    } = () => {
      const image_size =
        imageSizeState.value.id === 'custom'
          ? {
              width: customWidthState.value,
              height: customHeightState.value
            }
          : imageSizeState.value.id;

      return {
        input: {
          prompt: promptState.value,
          style: styleState.value.id,
          image_size
        },
        // Transform the image size to a width and height object
        // for the plugin
        imageSize:
          image_size != null && typeof image_size === 'string'
            ? getImageDimensions(image_size)
            : image_size
      };
    };

    return recraftInput;
  }
};

async function generate(
  modelPath: 'fal-ai/recraft-v3',
  input: RecraftV3Input
): Promise<string> {
  const response = await fal.subscribe(modelPath, {
    input,
    logs: true
  });
  const images = response?.data?.images;
  if (images != null && Array.isArray(images)) {
    const image = images[0];
    const url = image?.url;
    if (url != null) return url;
  }

  throw new Error('No image generated');
}

function getProviderId<I>(config: PluginConfiguration<I>): string {
  if (config?.provider?.type === 'fal.ai') {
    return config.provider.model;
  }
  return 'fal.ai';
}

export default provider;
