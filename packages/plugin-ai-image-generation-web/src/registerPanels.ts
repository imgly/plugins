import type CreativeEditorSDK from '@cesdk/cesdk-js';
import StyleAssetSource from './StyleAssetSource';
import {
  HISTORY_ASSET_LIBRARY_ENTRY_ID,
  PANEL_ID,
  PREFIX,
  STYLE_IMAGE_ASSET_SOURCE_ID,
  STYLE_VECTOR_ASSET_SOURCE_ID
} from './constants';
import { type Input } from './generate';
import { IMAGE_SIZE_VALUES, getImageSizeIcon } from './imageSize';
import { STYLE_IMAGE_DEFAULT, STYLE_VECTOR_DEFAULT } from './styles';
import { PluginConfiguration } from './types';
import { type AssetResult } from '@cesdk/cesdk-js';

type GenerationType = 'image' | 'vector';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
  generationType: GenerationType;
};

const DEFAULT_PROMPT = 'A blue alien with black hair in a tiny ufo';

/**
 * Register the main panel for the image generation plugin.
 */
function registerPanels(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration,
  options: {
    onGenerate: (input: Input) => Promise<void>;

    styleAssetSource: {
      image: StyleAssetSource;
      vector: StyleAssetSource;
    };
  }
) {
  const { onGenerate, styleAssetSource } = options;

  styleAssetSource.image.setActive(STYLE_IMAGE_DEFAULT.id);
  styleAssetSource.vector.setActive(STYLE_VECTOR_DEFAULT.id);

  cesdk.ui.registerPanel<StyleSelectionPayload>(
    `${PANEL_ID}.styleSelection`,
    ({ builder, payload }) => {
      if (payload == null) return null;

      const entries =
        payload.generationType === 'image'
          ? [STYLE_IMAGE_ASSET_SOURCE_ID]
          : [STYLE_VECTOR_ASSET_SOURCE_ID];

      builder.Library(`${PREFIX}.library.style`, {
        entries,
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.ui.registerPanel(PANEL_ID, ({ builder, state }) => {
    const promptState = state('prompt', config.defaultPrompt ?? DEFAULT_PROMPT);
    const typeState = state<GenerationType>('type', 'image');

    const styleImageState = state<{ id: string; label: string }>(
      'style/image',
      STYLE_IMAGE_DEFAULT
    );
    const styleVectorState = state<{ id: string; label: string }>(
      'style/vector',
      STYLE_VECTOR_DEFAULT
    );
    const imageSizeState = state('image_size', IMAGE_SIZE_VALUES[0]);
    const customWidthState = state<number>('width', 1024);
    const customHeightState = state<number>('height', 1024);

    const styleState =
      typeState.value === 'image' ? styleImageState : styleVectorState;

    builder.Section(`${PREFIX}.input.section`, {
      children: () => {
        builder.TextArea(`${PREFIX}.prompt`, {
          inputLabel: `panel.${PANEL_ID}.prompt`,
          ...promptState
        });

        builder.ButtonGroup(`${PREFIX}.type`, {
          inputLabel: `panel.${PANEL_ID}.type`,
          children: () => {
            builder.Button(`${PREFIX}.type.image`, {
              label: `panel.${PANEL_ID}.type.image`,
              isActive: typeState.value === 'image',
              onClick: () => typeState.setValue('image')
            });
            builder.Button(`${PREFIX}.type.vector`, {
              label: `panel.${PANEL_ID}.type.vector`,
              isActive: typeState.value === 'vector',
              onClick: () => typeState.setValue('vector')
            });
          }
        });

        // Show the style library for the selected type.
        builder.Button(`${PREFIX}.style`, {
          inputLabel: `panel.${PANEL_ID}.style`,
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

                const newValue = {
                  id: asset.id,
                  label: asset.label ?? asset.id
                };

                if (typeState.value === 'image') {
                  styleAssetSource.image.setActive(asset.id);
                  styleImageState.setValue(newValue);
                } else if (typeState.value === 'vector') {
                  styleAssetSource.vector.setActive(asset.id);
                  styleVectorState.setValue(newValue);
                }

                cesdk.ui.closePanel(`${PANEL_ID}.style`);
              }
            };

            cesdk.ui.openPanel(`${PANEL_ID}.style`, {
              payload
            });
          }
        });

        builder.Select(`${PREFIX}.image_size`, {
          inputLabel: `panel.${PANEL_ID}.format`,
          value: {
            ...imageSizeState.value,
            icon: getImageSizeIcon(imageSizeState.value.id)
          },
          setValue: imageSizeState.setValue,
          values: Array.from(IMAGE_SIZE_VALUES).map(({ id, label }) => ({
            id,
            label,
            icon: getImageSizeIcon(id)
          }))
        });

        if (imageSizeState.value.id === 'custom') {
          builder.NumberInput(`${PREFIX}.image_size.custom.width`, {
            inputLabel: 'Width',
            ...customWidthState
          });

          builder.NumberInput(`${PREFIX}.image_size.custom.height`, {
            inputLabel: 'Height',
            ...customHeightState
          });
        }
      }
    });
    builder.Section(`${PREFIX}.generate.section`, {
      children: () => {
        const generating = state('generating', false);

        builder.Button(`${PREFIX}.generate`, {
          label: `panel.${PANEL_ID}.generate`,
          isLoading: generating.value,
          color: 'accent',
          onClick: async () => {
            try {
              generating.setValue(true);
              await onGenerate({
                prompt: promptState.value,
                style: styleState.value.id,
                image_size:
                  imageSizeState.value.id === 'custom'
                    ? {
                        width: customWidthState.value,
                        height: customHeightState.value
                      }
                    : imageSizeState.value.id
              });
            } finally {
              generating.setValue(false);
            }
          }
        });
      }
    });
    builder.Library(`${PREFIX}.history.library`, {
      entries: [HISTORY_ASSET_LIBRARY_ENTRY_ID]
    });
  });
}

export default registerPanels;
