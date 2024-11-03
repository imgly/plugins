import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  HISTORY_ASSET_SOURCE_ID,
  PANEL_ID,
  PREFIX,
  STYLE_IMAGE_ASSET_SOURCE_ID,
  STYLE_VECTOR_ASSET_SOURCE_ID
} from './constants';
import { IMAGE_SIZE_VALUES, getImageSizeIcon } from './imageSize';
import { STYLES_IMAGE, STYLES_VECTOR } from './styles';
import { PluginConfiguration } from './types';

type GenerationType = 'image' | 'vector';

const DEFAULT_PROMPT = 'A blue alien with black hair in a tiny ufo';

/**
 * Register the main panel for the image generation plugin.
 */
function registerPanels(cesdk: CreativeEditorSDK, config: PluginConfiguration) {
  cesdk.ui.registerPanel(PANEL_ID, ({ builder, state }) => {
    const promptState = state('prompt', config.defaultPrompt ?? DEFAULT_PROMPT);
    const typeState = state<GenerationType>('type', 'image');

    const styleImageState = state<{ id: string; label: string }>(
      'style/image',
      STYLES_IMAGE[0]
    );
    const styleVectorState = state<{ id: string; label: string }>(
      'style/vector',
      STYLES_VECTOR[0]
    );
    const imageSizeState = state('image_size', IMAGE_SIZE_VALUES[0]);
    const customWidthState = state<number>('width', 1024);
    const customHeightState = state<number>('height', 1024);

    const styleState =
      typeState.value === 'image' ? styleImageState : styleVectorState;

    // We show the style library inline with this state. We do this
    // inline because right now there is not an easy way to exchange
    // information between panels, so the regular pattern we have in
    // the editor "open new asset library panel" -> "select asset"
    // does not work here.
    // Not optimal, but can be replaced once we have a way to share
    // states between panels, e.g. global state.
    const showStyleLibraryState = state<undefined | 'image' | 'vector'>(
      'selectStyleActive',
      undefined
    );

    if (showStyleLibraryState.value === 'image') {
      builder.Library(`${PREFIX}.library.style.image`, {
        entries: [STYLE_IMAGE_ASSET_SOURCE_ID],
        onSelect: (asset) => {
          if (asset.id !== 'back') {
            styleImageState.setValue({
              id: asset.id,
              label: asset.label ?? asset.id
            });
          }

          showStyleLibraryState.setValue(undefined);
          return Promise.resolve();
        }
      });
      return;
    }

    if (showStyleLibraryState.value === 'vector') {
      builder.Library(`${PREFIX}.library.style.vector`, {
        entries: [STYLE_VECTOR_ASSET_SOURCE_ID],
        onSelect: (asset) => {
          if (asset.id !== 'back') {
            styleVectorState.setValue({
              id: asset.id,
              label: asset.label ?? asset.id
            });
          }
          showStyleLibraryState.setValue(undefined);
          return Promise.resolve();
        }
      });
      return;
    }

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
          label: styleState.value.label,
          labelAlignment: 'left',
          onClick: () => {
            showStyleLibraryState.setValue(typeState.value);
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
        builder.Button(`${PREFIX}.generate`, {
          label: `panel.${PANEL_ID}.generate`,
          color: 'accent'
        });
      }
    });
    builder.Library(`${PREFIX}.history.library`, {
      entries: [HISTORY_ASSET_SOURCE_ID],
      onSelect: () => Promise.resolve()
    });
  });
}

export default registerPanels;
